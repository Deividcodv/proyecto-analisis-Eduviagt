import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CrearComiteDto,
  ActualizarComiteDto,
  AgregarMiembroDto,
} from './comites.dto';

@Injectable()
export class ComitesService {
  constructor(private readonly prisma: PrismaService) {}

  async crearComite(dto: CrearComiteDto) {
    return this.prisma.comite.create({ data: dto });
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

  async actualizarComite(id: string, dto: ActualizarComiteDto) {
    const existente = await this.prisma.comite.findUnique({ where: { id } });
    if (!existente) {
      throw new NotFoundException(`Comité con id ${id} no encontrado`);
    }
    return this.prisma.comite.update({ where: { id }, data: dto });
  }

  async eliminarComite(id: string) {
    const existente = await this.prisma.comite.findUnique({ where: { id } });
    if (!existente) {
      throw new NotFoundException(`Comité con id ${id} no encontrado`);
    }
    await this.prisma.comite.delete({ where: { id } });
    return { eliminado: true };
  }

  async agregarMiembro(comiteId: string, dto: AgregarMiembroDto) {
    const comite = await this.prisma.comite.findUnique({
      where: { id: comiteId },
    });
    if (!comite) {
      throw new NotFoundException(`Comité con id ${comiteId} no encontrado`);
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
    });
    if (!usuario) {
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

    return this.prisma.comiteMiembro.create({
      data: {
        comiteId,
        usuarioId: dto.usuarioId,
        rol: dto.rol,
      },
      include: { usuario: { select: { id: true, nombres: true, email: true } } },
    });
  }

  async eliminarMiembro(comiteId: string, usuarioId: string) {
    const miembro = await this.prisma.comiteMiembro.findFirst({
      where: { comiteId, usuarioId, activo: true },
    });
    if (!miembro) {
      throw new NotFoundException(
        `El usuario ${usuarioId} no es miembro activo del comité ${comiteId}`,
      );
    }
    await this.prisma.comiteMiembro.delete({ where: { id: miembro.id } });
    return { eliminado: true };
  }
}