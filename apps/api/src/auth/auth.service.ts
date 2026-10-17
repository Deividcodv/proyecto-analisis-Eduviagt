import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  HttpException,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import {
  LoginAttemptService,
} from './login-attempt.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private audit: AuditService,
    @Optional()
    private readonly intentosLogin: LoginAttemptService = new LoginAttemptService(),
  ) {}

  async register(dto: RegisterDto) {
    // Los correos no distinguen mayúsculas: se guardan y se buscan en
    // minúsculas para que "Juan@Test.com" y "juan@test.com" sean lo mismo.
    const email = dto.email.trim().toLowerCase();

    const existingCui = await this.prisma.usuario.findUnique({
      where: { cui: dto.cui },
    });

    if (existingCui) {
      throw new ConflictException('El CUI ya está registrado');
    }

    const existingEmail = await this.prisma.usuario.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (existingEmail) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const postulanteRole = await this.prisma.rol.findUnique({
      where: { nombre: 'POSTULANTE' },
    });

    if (!postulanteRole) {
      throw new NotFoundException('Rol POSTULANTE no encontrado');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    let user;
    try {
      user = await this.prisma.usuario.create({
        data: {
          cui: dto.cui,
          nombres: dto.nombres,
          email,
          passwordHash,
          rolId: postulanteRole.id,
        },
        include: { rol: true },
      });
    } catch (error) {
      // Dos registros a la vez pasan las comprobaciones previas y uno choca
      // con el índice único; antes eso salía como 500.
      if ((error as { code?: string })?.code === 'P2002') {
        throw new ConflictException(
          'El CUI o el correo electrónico ya están registrados',
        );
      }
      throw error;
    }

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      id: userWithoutPassword.id,
      cui: userWithoutPassword.cui,
      nombres: userWithoutPassword.nombres,
      email: userWithoutPassword.email,
      rol: userWithoutPassword.rol.nombre,
      createdAt: userWithoutPassword.createdAt,
    };
  }

  async login(dto: LoginDto, ip?: string) {
    // S-002: la clave combina la IP y el correo para limitar los intentos.
    const clave = `${ip ?? 'sin-ip'}:${dto.email.trim().toLowerCase()}`;

    const bloqueo = this.intentosLogin.estado(clave);
    if (bloqueo.bloqueado) {
      throw new HttpException(
        `Demasiados intentos fallidos. Intenta de nuevo en ${bloqueo.reintentarEnSegundos} segundos.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.prisma.usuario.findFirst({
      where: {
        email: { equals: dto.email.trim().toLowerCase(), mode: 'insensitive' },
      },
      include: { rol: true },
    });

    if (!user) {
      this.intentosLogin.registrarFallo(clave);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.estado !== 'ACTIVO') {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      this.intentosLogin.registrarFallo(clave);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    this.intentosLogin.registrarExito(clave);

    const tokens = await this.generateTokens(user.id, user.email);

    await this.audit.log({
      usuarioId: user.id,
      accion: 'login',
      entidad: 'usuario',
      entidadId: user.id,
      ip,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        cui: user.cui,
        nombres: user.nombres,
        email: user.email,
        rol: user.rol.nombre,
      },
    };
  }

  async refreshToken(refreshToken: string, ip?: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.usuario.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.estado !== 'ACTIVO') {
        throw new UnauthorizedException('Usuario no autorizado');
      }

      const accessToken = this.jwtService.sign(
        { sub: user.id, email: user.email },
        {
          expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m',
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        },
      );

      await this.audit.log({
        usuarioId: user.id,
        accion: 'refresh',
        entidad: 'usuario',
        entidadId: user.id,
        ip,
      });

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        rol: true,
        genero: true,
        departamento: true,
        municipio: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.aplanarPerfil(user);
  }

  async updatePerfil(userId: string, dto: UpdatePerfilDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.generoId) {
      const genero = await this.prisma.genero.findUnique({
        where: { id: dto.generoId },
      });
      if (!genero) {
        throw new NotFoundException('Género no encontrado');
      }
    }

    if (dto.departamentoId) {
      const departamento = await this.prisma.departamento.findUnique({
        where: { id: dto.departamentoId },
      });
      if (!departamento) {
        throw new NotFoundException('Departamento no encontrado');
      }
    }

    if (dto.municipioId) {
      const municipio = await this.prisma.municipio.findUnique({
        where: { id: dto.municipioId },
      });
      if (!municipio) {
        throw new NotFoundException('Municipio no encontrado');
      }
    }

    const updated = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        nombres: dto.nombres ?? undefined,
        telefono: dto.telefono ?? undefined,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
        direccion: dto.direccion ?? undefined,
        generoId: dto.generoId ?? undefined,
        departamentoId: dto.departamentoId ?? undefined,
        municipioId: dto.municipioId ?? undefined,
      },
      include: {
        rol: true,
        genero: true,
        departamento: true,
        municipio: true,
      },
    });

    await this.audit.log({
      usuarioId: userId,
      accion: 'update_perfil',
      entidad: 'usuario',
      entidadId: userId,
    });

    return this.aplanarPerfil(updated);
  }

  private aplanarPerfil(user: {
    id: string;
    cui: string;
    nombres: string;
    email: string;
    telefono: string | null;
    fechaNacimiento: Date | null;
    direccion: string | null;
    rol: { id: string; nombre: string };
    genero?: { id: string; nombre: string } | null;
    departamento?: { id: string; nombre: string } | null;
    municipio?: { id: string; nombre: string } | null;
  }) {
    return {
      id: user.id,
      cui: user.cui,
      nombres: user.nombres,
      email: user.email,
      telefono: user.telefono,
      fechaNacimiento: user.fechaNacimiento,
      direccion: user.direccion,
      genero: user.genero
        ? { id: user.genero.id, nombre: user.genero.nombre }
        : null,
      departamento: user.departamento
        ? { id: user.departamento.id, nombre: user.departamento.nombre }
        : null,
      municipio: user.municipio
        ? { id: user.municipio.id, nombre: user.municipio.nombre }
        : null,
      rol: {
        id: user.rol.id,
        nombre: user.rol.nombre,
      },
    };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m',
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
