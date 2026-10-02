import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private audit: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const existingCui = await this.prisma.usuario.findUnique({
      where: { cui: dto.cui },
    });

    if (existingCui) {
      throw new ConflictException('El CUI ya está registrado');
    }

    const existingEmail = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
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

    const user = await this.prisma.usuario.create({
      data: {
        cui: dto.cui,
        nombres: dto.nombres,
        email: dto.email,
        passwordHash,
        rolId: postulanteRole.id,
      },
      include: { rol: true },
    });

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
    const user = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      include: { rol: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.estado !== 'ACTIVO') {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

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
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'sigeb-jwt-refresh-secret-dev',
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
          secret: this.configService.get<string>('JWT_SECRET') || 'sigeb-jwt-secret-dev',
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
      include: { rol: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      id: user.id,
      cui: user.cui,
      nombres: user.nombres,
      email: user.email,
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
        secret: this.configService.get<string>('JWT_SECRET') || 'sigeb-jwt-secret-dev',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'sigeb-jwt-refresh-secret-dev',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}