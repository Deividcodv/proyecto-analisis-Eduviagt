import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BecaCobertura, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
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
import {
  CONVOCATORIA_ESTADO,
} from '../common/constants/estados';

@Injectable()
export class ConvocatoriasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateConvocatoriaDto) {
    await this.assertBecaExists(dto.becaId);
    if (dto.nivelAcademicoId) {
      await this.assertNivelAcademicoExists(dto.nivelAcademicoId);
    }
    return this.prisma.convocatoria.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        becaId: dto.becaId,
        estado: CONVOCATORIA_ESTADO.BORRADOR,
        ...(dto.nivelAcademicoId !== undefined
          ? { nivelAcademicoId: dto.nivelAcademicoId }
          : {}),
        ...(dto.cobertura !== undefined ? { cobertura: dto.cobertura } : {}),
        ...(dto.formulario !== undefined
          ? { formulario: dto.formulario as unknown as Prisma.InputJsonValue }
          : {}),
        fechaApertura: dto.fechaApertura ? new Date(dto.fechaApertura) : null,
        fechaCierre: dto.fechaCierre ? new Date(dto.fechaCierre) : null,
        ...(dto.evaluadoresMinimos !== undefined
          ? { evaluadoresMinimos: dto.evaluadoresMinimos }
          : {}),
        ...(dto.maxCorrecciones !== undefined
          ? { maxCorrecciones: dto.maxCorrecciones }
          : {}),
      },
      include: { beca: true, nivelAcademico: true },
    });
  }

  async findAllPublic(filtros?: {
    busqueda?: string;
    nivelAcademicoId?: string;
    cobertura?: BecaCobertura;
  }) {
    const where: Prisma.ConvocatoriaWhereInput = { estado: CONVOCATORIA_ESTADO.ABIERTA };

    if (filtros?.busqueda) {
      where.OR = [
        { nombre: { contains: filtros.busqueda, mode: 'insensitive' } },
        { descripcion: { contains: filtros.busqueda, mode: 'insensitive' } },
        { beca: { nombre: { contains: filtros.busqueda, mode: 'insensitive' } } },
      ];
    }
    if (filtros?.nivelAcademicoId) {
      where.nivelAcademicoId = filtros.nivelAcademicoId;
    }
    if (filtros?.cobertura) {
      where.cobertura = filtros.cobertura;
    }

    return this.prisma.convocatoria.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { beca: true, nivelAcademico: true },
    });
  }

  async findAll() {
    return this.prisma.convocatoria.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        beca: true,
        nivelAcademico: true,
        _count: { select: { solicitudes: true } },
      },
    });
  }

  async findById(id: string, withDocs = false) {
    const convocatoria = await this.prisma.convocatoria.findUnique({
      where: { id },
      include: {
        beca: { include: { criteriosEvaluacion: true } },
        nivelAcademico: true,
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
    if (dto.nivelAcademicoId) {
      await this.assertNivelAcademicoExists(dto.nivelAcademicoId);
    }

    return this.prisma.convocatoria.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
        ...(dto.descripcion !== undefined ? { descripcion: dto.descripcion } : {}),
        ...(dto.becaId !== undefined ? { becaId: dto.becaId } : {}),
        ...(dto.nivelAcademicoId !== undefined
          ? { nivelAcademicoId: dto.nivelAcademicoId }
          : {}),
        ...(dto.cobertura !== undefined ? { cobertura: dto.cobertura } : {}),
        ...(dto.formulario !== undefined
          ? {
              formulario:
                dto.formulario === null
                  ? Prisma.DbNull
                  : (dto.formulario as unknown as Prisma.InputJsonValue),
            }
          : {}),
        ...(dto.fechaApertura !== undefined
          ? { fechaApertura: dto.fechaApertura ? new Date(dto.fechaApertura) : null }
          : {}),
        ...(dto.fechaCierre !== undefined
          ? { fechaCierre: dto.fechaCierre ? new Date(dto.fechaCierre) : null }
          : {}),
        ...(dto.evaluadoresMinimos !== undefined
          ? { evaluadoresMinimos: dto.evaluadoresMinimos }
          : {}),
        ...(dto.maxCorrecciones !== undefined
          ? { maxCorrecciones: dto.maxCorrecciones }
          : {}),
      },
      include: { beca: true, nivelAcademico: true },
    });
  }

  async transicion(
    id: string,
    dto: TransicionDto,
    usuario: AuthenticatedUser,
  ) {
    const convocatoria = await this.findById(id);

    const siguienteEstado = ConvocatoriaStateMachine.next(
      convocatoria.estado as ConvocatoriaEstado,
      dto.accion,
    );

    const actualizada = await this.prisma.convocatoria.update({
      where: { id },
      data: { estado: siguienteEstado },
      include: { beca: true },
    });

    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'transicion',
      entidad: 'convocatoria',
      entidadId: id,
      detalle: { accion: dto.accion, estado: siguienteEstado },
    });

    return actualizada;
  }

  async reemplazarDocumentosRequeridos(
    id: string,
    dto: DocumentosRequeridosDto,
    usuario: AuthenticatedUser,
  ) {
    const convocatoria = await this.findById(id);

    if (convocatoria.estado !== CONVOCATORIA_ESTADO.BORRADOR) {
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

    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'configurar-documentos',
      entidad: 'convocatoria',
      entidadId: id,
      detalle: { items: dto.items },
    });

    return this.findById(id, true);
  }

  async miSolicitud(id: string, usuario: AuthenticatedUser) {
    await this.findById(id);

    return this.prisma.solicitud.findFirst({
      where: { convocatoriaId: id, usuarioId: usuario.id },
      orderBy: { createdAt: 'desc' },
      include: {
        perfilAcademico: true,
        perfilFinanciero: true,
        documentos: { include: { documentoTipo: true } },
      },
    });
  }

  private async assertBecaExists(becaId: string) {
    const beca = await this.prisma.beca.findUnique({ where: { id: becaId } });
    if (!beca) {
      throw new NotFoundException(`Beca con id ${becaId} no encontrada`);
    }
  }

  private async assertNivelAcademicoExists(nivelAcademicoId: string) {
    const nivel = await this.prisma.nivelAcademico.findUnique({
      where: { id: nivelAcademicoId },
    });
    if (!nivel) {
      throw new NotFoundException(
        `Nivel académico con id ${nivelAcademicoId} no encontrado`,
      );
    }
  }
}