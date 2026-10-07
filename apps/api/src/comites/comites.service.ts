import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import {
  CrearComiteDto,
  ActualizarComiteDto,
  AgregarMiembroDto,
} from './comites.dto';

@Injectable()
export class ComitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async crearComite(dto: CrearComiteDto, usuario: AuthenticatedUser) {
    const comite = await this.prisma.comite.create({ data: dto });
    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'crear',
      entidad: 'comite',
      entidadId: comite.id,
      detalle: { nombre: dto.nombre },
    });
    return comite;
  }

  async listarComites() {
    return this.prisma.comite.findMany({
      include: { _count: { select: { miembros: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async obtenerComite(id: string) {
    const comite = await this.prisma.comite.findUnique({
      where: { id },
      include: {
        miembros: {
          where: { activo: true },
          include: {
            usuario: {
              select: { id: true, nombres: true, email: true, cui: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!comite) {
      throw new NotFoundException(`Comité con id ${id} no encontrado`);
    }

    return comite;
  }

  async actualizarComite(
    id: string,
    dto: ActualizarComiteDto,
    usuario: AuthenticatedUser,
  ) {
    const existente = await this.prisma.comite.findUnique({ where: { id } });
    if (!existente) {
      throw new NotFoundException(`Comité con id ${id} no encontrado`);
    }
    const actualizado = await this.prisma.comite.update({ where: { id }, data: dto });
    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'editar',
      entidad: 'comite',
      entidadId: id,
      detalle: { ...dto },
    });
    return actualizado;
  }

  async eliminarComite(id: string, usuario: AuthenticatedUser) {
    const existente = await this.prisma.comite.findUnique({ where: { id } });
    if (!existente) {
      throw new NotFoundException(`Comité con id ${id} no encontrado`);
    }
    await this.prisma.comite.delete({ where: { id } });
    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'eliminar',
      entidad: 'comite',
      entidadId: id,
    });
    return { eliminado: true };
  }

  async agregarMiembro(
    comiteId: string,
    dto: AgregarMiembroDto,
    usuario: AuthenticatedUser,
  ) {
    const comite = await this.prisma.comite.findUnique({
      where: { id: comiteId },
    });
    if (!comite) {
      throw new NotFoundException(`Comité con id ${comiteId} no encontrado`);
    }

    const usuarioDb = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
    });
    if (!usuarioDb) {
      throw new NotFoundException(
        `Usuario con id ${dto.usuarioId} no encontrado`,
      );
    }

    const yaExiste = await this.prisma.comiteMiembro.findFirst({
      where: {
        comiteId,
        usuarioId: dto.usuarioId,
        activo: true,
      },
    });
    if (yaExiste) {
      throw new BadRequestException('El usuario ya es miembro del comité');
    }

    const miembro = await this.prisma.comiteMiembro.create({
      data: {
        comiteId,
        usuarioId: dto.usuarioId,
        rol: dto.rol,
      },
      include: { usuario: { select: { id: true, nombres: true, email: true } } },
    });

    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'agregar-miembro',
      entidad: 'comite',
      entidadId: comiteId,
      detalle: { usuarioId: dto.usuarioId, rol: dto.rol },
    });

    return miembro;
  }

  async eliminarMiembro(
    comiteId: string,
    usuarioId: string,
    usuario: AuthenticatedUser,
  ) {
    const miembro = await this.prisma.comiteMiembro.findFirst({
      where: { comiteId, usuarioId, activo: true },
    });
    if (!miembro) {
      throw new NotFoundException(
        `El usuario ${usuarioId} no es miembro activo del comité ${comiteId}`,
      );
    }
    await this.prisma.comiteMiembro.delete({ where: { id: miembro.id } });
    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'eliminar-miembro',
      entidad: 'comite',
      entidadId: comiteId,
      detalle: { usuarioId },
    });
    return { eliminado: true };
  }
}