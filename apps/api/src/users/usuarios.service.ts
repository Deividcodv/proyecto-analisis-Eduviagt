import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { AssignUsuarioPermisosDto } from './dto/assign-usuario-permisos.dto';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(rol?: string) {
    return this.prisma.usuario.findMany({
      where: rol ? { rol: { nombre: rol } } : undefined,
      select: {
        id: true,
        cui: true,
        nombres: true,
        email: true,
        estado: true,
        rol: { select: { nombre: true } },
      },
      orderBy: { nombres: 'asc' },
    });
  }

  async findById(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        rol: { select: { id: true, nombre: true } },
        usuarioPermisos: {
          include: { permiso: { select: { id: true, modulo: true, accion: true } } },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    const { passwordHash: _, ...sinPassword } = usuario;
    return sinPassword;
  }

  async create(dto: CreateUsuarioDto, actor: AuthenticatedUser) {
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

    const rol = await this.prisma.rol.findUnique({ where: { id: dto.rolId } });

    if (!rol) {
      throw new NotFoundException(`Rol con id ${dto.rolId} no encontrado`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const usuario = await this.prisma.usuario.create({
      data: {
        cui: dto.cui,
        nombres: dto.nombres,
        email: dto.email,
        passwordHash,
        rolId: rol.id,
      },
      include: { rol: { select: { id: true, nombre: true } } },
    });

    await this.audit.log({
      usuarioId: actor.id,
      accion: 'crear',
      entidad: 'usuario',
      entidadId: usuario.id,
      detalle: { cui: dto.cui, email: dto.email, rolId: rol.id },
    });

    const { passwordHash: _, ...sinPassword } = usuario;
    return sinPassword;
  }

  async update(id: string, dto: UpdateUsuarioDto, actor: AuthenticatedUser) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    if (id === actor.id && dto.estado === 'INACTIVO') {
      throw new BadRequestException(
        'No puedes inactivar tu propio usuario; perderías el acceso',
      );
    }

    if (dto.rolId) {
      const rol = await this.prisma.rol.findUnique({ where: { id: dto.rolId } });

      if (!rol) {
        throw new NotFoundException(`Rol con id ${dto.rolId} no encontrado`);
      }
    }

    const { rolId, estado } = dto;

    if (rolId === undefined && estado === undefined) {
      return this.findById(id);
    }

    const actualizado = await this.prisma.usuario.update({
      where: { id },
      data: {
        ...(rolId !== undefined ? { rolId } : {}),
        ...(estado !== undefined ? { estado } : {}),
      },
      include: { rol: { select: { id: true, nombre: true } } },
    });

    await this.audit.log({
      usuarioId: actor.id,
      accion: 'editar',
      entidad: 'usuario',
      entidadId: id,
      detalle: { ...dto },
    });

    const { passwordHash: _, ...sinPassword } = actualizado;
    return sinPassword;
  }

  async assignPermisos(
    id: string,
    dto: AssignUsuarioPermisosDto,
    actor: AuthenticatedUser,
  ) {
    await this.findById(id);

    await this.prisma.usuarioPermiso.deleteMany({
      where: { usuarioId: id },
    });

    if (dto.permisos.length > 0) {
      await this.prisma.usuarioPermiso.createMany({
        data: dto.permisos.map((p) => ({
          usuarioId: id,
          permisoId: p.permisoId,
          efecto: p.efecto,
        })),
      });
    }

    await this.audit.log({
      usuarioId: actor.id,
      accion: 'asignar-permisos',
      entidad: 'usuario',
      entidadId: id,
      detalle: { permisos: dto.permisos },
    });

    return this.findById(id);
  }
}
