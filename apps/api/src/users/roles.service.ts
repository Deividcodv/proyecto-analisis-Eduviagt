import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { AssignPermisoDto } from './dto/assign-permiso.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll() {
    return this.prisma.rol.findMany({
      include: {
        rolPermisos: {
          include: { permiso: true },
        },
      },
    });
  }

  async findById(id: string) {
    const rol = await this.prisma.rol.findUnique({
      where: { id },
      include: {
        rolPermisos: {
          include: { permiso: true },
        },
      },
    });

    if (!rol) {
      throw new NotFoundException(`Rol con id ${id} no encontrado`);
    }

    return rol;
  }

  async create(dto: CreateRolDto, usuario: AuthenticatedUser) {
    const existing = await this.prisma.rol.findUnique({
      where: { nombre: dto.nombre },
    });

    if (existing) {
      throw new ConflictException(`El rol "${dto.nombre}" ya existe`);
    }

    const rol = await this.prisma.rol.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
      },
    });

    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'crear',
      entidad: 'rol',
      entidadId: rol.id,
      detalle: { nombre: dto.nombre },
    });

    return rol;
  }

  async update(id: string, dto: UpdateRolDto, usuario: AuthenticatedUser) {
    await this.findById(id);

    if (dto.nombre) {
      const existing = await this.prisma.rol.findFirst({
        where: { nombre: dto.nombre, id: { not: id } },
      });

      if (existing) {
        throw new ConflictException(`El rol "${dto.nombre}" ya existe`);
      }
    }

    const rol = await this.prisma.rol.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'editar',
      entidad: 'rol',
      entidadId: id,
      detalle: { ...dto },
    });

    return rol;
  }

  async remove(id: string, usuario: AuthenticatedUser) {
    await this.findById(id);

    const usersWithRole = await this.prisma.usuario.count({
      where: { rolId: id },
    });

    if (usersWithRole > 0) {
      throw new ConflictException(
        `No se puede eliminar el rol: ${usersWithRole} usuario(s) lo tienen asignado`,
      );
    }

    const rol = await this.prisma.rol.delete({ where: { id } });

    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'eliminar',
      entidad: 'rol',
      entidadId: id,
    });

    return rol;
  }

  async assignPermisos(
    rolId: string,
    dto: AssignPermisoDto,
    usuario: AuthenticatedUser,
  ) {
    await this.findById(rolId);

    // La tabla RolPermiso tiene @@unique([rolId, permisoId]). Sin deduplicar,
    // un ID repetido provocaba un error P2002 que llegaba al cliente como 500.
    const permisoIds = [...new Set(dto.permisoIds)];

    try {
      // Transacción: antes se borraba y se recreaba fuera de ella, así que si
      // createMany() fallaba el rol se quedaba con CERO permisos.
      await this.prisma.$transaction(async (tx) => {
        await tx.rolPermiso.deleteMany({ where: { rolId } });

        if (permisoIds.length > 0) {
          await tx.rolPermiso.createMany({
            data: permisoIds.map((permisoId) => ({ rolId, permisoId })),
          });
        }
      });
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === 'P2002' || code === 'P2003') {
        throw new BadRequestException(
          'No se pudieron guardar los permisos. Revisa que todos existan e inténtalo de nuevo.',
        );
      }
      throw error;
    }

    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'asignar-permisos',
      entidad: 'rol',
      entidadId: rolId,
      detalle: { permisoIds },
    });

    return this.findById(rolId);
  }
}
