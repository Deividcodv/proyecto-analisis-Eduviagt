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
  ReglaMontoDto,
  ReglasMontoDto,
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
    this.assertFechasCoherentes(dto.fechaApertura, dto.fechaCierre);
    this.assertReglasMonto(dto.montoBase, dto.reglasMonto);

    const creada = await this.prisma.convocatoria.create({
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
        // Montos (Sprint 8 - US-801)
        ...(dto.moneda !== undefined ? { moneda: dto.moneda } : {}),
        ...(dto.montoBase !== undefined && dto.montoBase !== null
          ? { montoBase: new Prisma.Decimal(dto.montoBase).toDecimalPlaces(2) }
          : {}),
        ...(dto.permiteParcial !== undefined
          ? { permiteParcial: dto.permiteParcial }
          : {}),
        ...(dto.usarReglasMonto !== undefined
          ? { usarReglasMonto: dto.usarReglasMonto }
          : {}),
        ...(dto.reglasMonto?.length
          ? { reglasMonto: { create: this.mapearReglas(dto.reglasMonto) } }
          : {}),
      },
      include: { beca: true, nivelAcademico: true, reglasMonto: true },
    });

    return creada;
  }

  /** Traduce las reglas del DTO al modelo de Prisma (Sprint 8 - US-801). */
  private mapearReglas(reglas: ReglaMontoDto[]) {
    return reglas.map((r, indice) => ({
      nombre: r.nombre,
      ingresoMin:
        r.ingresoMin != null
          ? new Prisma.Decimal(r.ingresoMin).toDecimalPlaces(2)
          : null,
      ingresoMax:
        r.ingresoMax != null
          ? new Prisma.Decimal(r.ingresoMax).toDecimalPlaces(2)
          : null,
      tipo: r.tipo,
      montoFijo:
        r.montoFijo != null
          ? new Prisma.Decimal(r.montoFijo).toDecimalPlaces(2)
          : null,
      porcentaje: r.porcentaje ?? null,
      prioridad: r.prioridad ?? indice,
      activo: true,
    }));
  }

  /**
   * Valida que las reglas de monto sean coherentes (Sprint 8 - US-801):
   * una regla FIJO necesita monto, una PORCENTAJE necesita porcentaje y una
   * COMPLETO necesita monto base en la convocatoria.
   */
  private assertReglasMonto(
    montoBase: number | null | undefined,
    reglas: ReglaMontoDto[] | undefined,
  ): void {
    if (!reglas?.length) return;

    for (const [indice, regla] of reglas.entries()) {
      if (regla.tipo === 'FIJO' && (regla.montoFijo == null || regla.montoFijo < 0)) {
        throw new BadRequestException(
          `La regla #${indice + 1} es de tipo FIJO: indica el monto que se otorgará.`,
        );
      }
      if (
        regla.tipo === 'PORCENTAJE' &&
        (regla.porcentaje == null || regla.porcentaje < 0)
      ) {
        throw new BadRequestException(
          `La regla #${indice + 1} es de tipo PORCENTAJE: indica el porcentaje del monto base (0.4 = 40%).`,
        );
      }
      if (regla.tipo === 'COMPLETO' && (montoBase == null || montoBase < 0)) {
        throw new BadRequestException(
          `La regla #${indice + 1} es de tipo COMPLETO: define primero el monto base de la convocatoria.`,
        );
      }
      if (
        regla.ingresoMin != null &&
        regla.ingresoMax != null &&
        regla.ingresoMin > regla.ingresoMax
      ) {
        throw new BadRequestException(
          `La regla #${indice + 1} tiene el ingreso mínimo mayor que el máximo.`,
        );
      }
    }
  }

  async findAllPublic(filtros?: {
    busqueda?: string;
    nivelAcademicoId?: string;
    cobertura?: BecaCobertura;
    estado?: 'ABIERTA' | 'CERRADA';
  }) {
    // El estado ABIERTA no caducaba solo: una convocatoria seguía apareciendo
    // en el portal (y aceptando postulaciones) después de su fecha de cierre.
    const ahora = new Date();

    const abierta: Prisma.ConvocatoriaWhereInput = {
      estado: CONVOCATORIA_ESTADO.ABIERTA,
      AND: [
        { OR: [{ fechaApertura: null }, { fechaApertura: { lte: ahora } }] },
        { OR: [{ fechaCierre: null }, { fechaCierre: { gte: ahora } }] },
      ],
    };

    // El portal público también muestra el histórico. Una convocatoria ABIERTA
    // cuya fecha de cierre ya pasó se considera cerrada aunque nadie haya
    // ejecutado la transición de estado.
    const cerrada: Prisma.ConvocatoriaWhereInput = {
      OR: [
        {
          estado: {
            in: [
              CONVOCATORIA_ESTADO.CERRADA,
              CONVOCATORIA_ESTADO.EN_EVALUACION,
              CONVOCATORIA_ESTADO.RESUELTA,
              CONVOCATORIA_ESTADO.ARCHIVADA,
            ],
          },
        },
        { estado: CONVOCATORIA_ESTADO.ABIERTA, fechaCierre: { lt: ahora } },
      ],
    };

    const where: Prisma.ConvocatoriaWhereInput = {};
    if (filtros?.estado === 'ABIERTA') {
      Object.assign(where, abierta);
    } else if (filtros?.estado === 'CERRADA') {
      where.AND = [cerrada];
    } else {
      // Sin filtro: todo lo público (abiertas + cerradas). Los BORRADOR y las
      // convocatorias que todavía no abren quedan fuera.
      where.AND = [{ OR: [abierta, cerrada] }];
    }

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

    const convocatorias = await this.prisma.convocatoria.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { beca: true, nivelAcademico: true },
    });

    const estaAbierta = (c: (typeof convocatorias)[number]) =>
      c.estado === CONVOCATORIA_ESTADO.ABIERTA &&
      (!c.fechaApertura || c.fechaApertura <= ahora) &&
      (!c.fechaCierre || c.fechaCierre >= ahora);

    // Las abiertas primero; dentro de cada grupo se conserva el orden de la
    // consulta (más recientes primero).
    return convocatorias.sort(
      (a, b) => Number(estaAbierta(b)) - Number(estaAbierta(a)),
    );
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
    const actual = await this.findById(id);

    if (dto.becaId) {
      await this.assertBecaExists(dto.becaId);
    }
    if (dto.nivelAcademicoId) {
      await this.assertNivelAcademicoExists(dto.nivelAcademicoId);
    }

    // Al cambiar solo una de las dos fechas hay que comparar contra la otra ya
    // guardada; antes no se validaba nada y se podía dejar cierre < apertura.
    this.assertFechasCoherentes(
      dto.fechaApertura !== undefined ? dto.fechaApertura : actual.fechaApertura,
      dto.fechaCierre !== undefined ? dto.fechaCierre : actual.fechaCierre,
    );

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
        // Montos (Sprint 8 - US-801)
        ...(dto.moneda !== undefined ? { moneda: dto.moneda } : {}),
        ...(dto.montoBase !== undefined
          ? {
              montoBase:
                dto.montoBase === null
                  ? null
                  : new Prisma.Decimal(dto.montoBase).toDecimalPlaces(2),
            }
          : {}),
        ...(dto.permiteParcial !== undefined
          ? { permiteParcial: dto.permiteParcial }
          : {}),
        ...(dto.usarReglasMonto !== undefined
          ? { usarReglasMonto: dto.usarReglasMonto }
          : {}),
      },
      include: { beca: true, nivelAcademico: true, reglasMonto: true },
    });
  }

  /**
   * Reemplaza las reglas de monto por tramo de la convocatoria
   * (Sprint 8 - US-801). Es una operación aparte porque las reglas se
   * editan como colección, no campo a campo.
   */
  async reemplazarReglasMonto(
    id: string,
    dto: ReglasMontoDto,
    usuario: AuthenticatedUser,
  ) {
    const convocatoria = await this.findById(id);

    this.assertReglasMonto(
      dto.montoBase !== undefined
        ? dto.montoBase
        : (convocatoria.montoBase?.toNumber() ?? null),
      dto.reglas,
    );

    await this.prisma.convocatoriaReglaMonto.deleteMany({
      where: { convocatoriaId: id },
    });

    if (dto.reglas.length > 0) {
      await this.prisma.convocatoriaReglaMonto.createMany({
        data: this.mapearReglas(dto.reglas).map((r) => ({ ...r, convocatoriaId: id })),
      });
    }

    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'configurar-montos',
      entidad: 'convocatoria',
      entidadId: id,
      detalle: { reglas: dto.reglas.length },
    });

    return this.findById(id, true);
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

    if (new Set(documentoTipoIds).size !== documentoTipoIds.length) {
      throw new BadRequestException(
        'Hay tipos de documento repetidos. Quita los que se repiten e inténtalo de nuevo.',
      );
    }

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

  private assertFechasCoherentes(
    fechaApertura?: string | Date | null,
    fechaCierre?: string | Date | null,
  ) {
    if (!fechaApertura || !fechaCierre) return;
    if (new Date(fechaApertura) >= new Date(fechaCierre)) {
      throw new BadRequestException(
        'La fecha de cierre debe ser posterior a la fecha de apertura.',
      );
    }
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