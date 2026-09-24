import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateConvocatoriaDto,
  UpdateConvocatoriaDto,
  TransicionDto,
  DocumentosRequeridosDto,
} from './dto';
import {
  ConvocatoriaStateMachine,
  ConvocatoriaEstado,
} from './convocatoria-state-machine';

@Injectable()
export class ConvocatoriasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateConvocatoriaDto) {
    await this.assertBecaExists(dto.becaId);
    return this.prisma.convocatoria.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        becaId: dto.becaId,
        estado: 'BORRADOR',
        fechaApertura: dto.fechaApertura ? new Date(dto.fechaApertura) : null,
        fechaCierre: dto.fechaCierre ? new Date(dto.fechaCierre) : null,
      },
      include: { beca: true },
    });
  }

  async findAllPublic() {
    return this.prisma.convocatoria.findMany({
      where: { estado: 'ABIERTA' },
      orderBy: { createdAt: 'desc' },
      include: { beca: true },
    });
  }

  async findAll() {
    return this.prisma.convocatoria.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        beca: true,
        _count: { select: { solicitudes: true } },
      },
    });
  }

  async findById(id: string, withDocs = false) {
    const convocatoria = await this.prisma.convocatoria.findUnique({
      where: { id },
      include: {
        beca: { include: { criteriosEvaluacion: true } },
        ...(withDocs
          ? {
              documentosRequeridos: {
                include: { documentoTipo: true },
              },
            }
          : {}),
      },
    });

    if (!convocatoria) {
      throw new NotFoundException(`Convocatoria con id ${id} no encontrada`);
    }

    return convocatoria;
  }

  async update(id: string, dto: UpdateConvocatoriaDto) {
    await this.findById(id);

    if (dto.becaId) {
      await this.assertBecaExists(dto.becaId);
    }

    return this.prisma.convocatoria.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
        ...(dto.descripcion !== undefined ? { descripcion: dto.descripcion } : {}),
        ...(dto.becaId !== undefined ? { becaId: dto.becaId } : {}),
        ...(dto.fechaApertura !== undefined
          ? { fechaApertura: dto.fechaApertura ? new Date(dto.fechaApertura) : null }
          : {}),
        ...(dto.fechaCierre !== undefined
          ? { fechaCierre: dto.fechaCierre ? new Date(dto.fechaCierre) : null }
          : {}),
      },
      include: { beca: true },
    });
  }

  async transicion(id: string, dto: TransicionDto) {
    const convocatoria = await this.findById(id);

    const siguienteEstado = ConvocatoriaStateMachine.next(
      convocatoria.estado as ConvocatoriaEstado,
      dto.accion,
    );

    return this.prisma.convocatoria.update({
      where: { id },
      data: { estado: siguienteEstado },
      include: { beca: true },
    });
  }

  async reemplazarDocumentosRequeridos(id: string, dto: DocumentosRequeridosDto) {
    const convocatoria = await this.findById(id);

    if (convocatoria.estado !== 'BORRADOR') {
      throw new BadRequestException(
        'Solo se pueden configurar documentos en estado BORRADOR',
      );
    }

    const documentoTipoIds = dto.items.map((i) => i.documentoTipoId);
    const existentes = await this.prisma.documentoTipo.findMany({
      where: { id: { in: documentoTipoIds } },
    });

    if (existentes.length !== documentoTipoIds.length) {
      throw new BadRequestException(
        'Uno o más tipos de documento no existen',
      );
    }

    await this.prisma.convocatoriaDocRequerido.deleteMany({ where: { convocatoriaId: id } });

    await this.prisma.convocatoriaDocRequerido.createMany({
      data: dto.items.map((i) => ({
        convocatoriaId: id,
        documentoTipoId: i.documentoTipoId,
        obligatorio: i.obligatorio,
      })),
    });

    return this.findById(id, true);
  }

  private async assertBecaExists(becaId: string) {
    const beca = await this.prisma.beca.findUnique({ where: { id: becaId } });
    if (!beca) {
      throw new NotFoundException(`Beca con id ${becaId} no encontrada`);
    }
  }
}