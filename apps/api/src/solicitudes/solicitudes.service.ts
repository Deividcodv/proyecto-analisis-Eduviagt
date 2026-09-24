import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import {
  DOCUMENT_STORAGE,
  DocumentStorage,
} from '../storage/storage.interface';
import { CreateSolicitudDto, TransicionSolicitudDto } from './dto';
import { PerfilAcademicoDto, PerfilFinancieroDto } from './dto';
import {
  SolicitudStateMachine,
  SolicitudEstado,
} from './solicitud-state-machine';

@Injectable()
export class SolicitudesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorage,
  ) {}

  async create(usuarioId: string, dto: CreateSolicitudDto) {
    const convocatoria = await this.prisma.convocatoria.findUnique({
      where: { id: dto.convocatoriaId },
    });

    if (!convocatoria) {
      throw new NotFoundException(
        `Convocatoria con id ${dto.convocatoriaId} no encontrada`,
      );
    }

    if (convocatoria.estado !== 'ABIERTA') {
      throw new BadRequestException(
        'La convocatoria no está abierta para postulaciones',
      );
    }

    const existente = await this.prisma.solicitud.findFirst({
      where: {
        usuarioId,
        convocatoriaId: dto.convocatoriaId,
      },
    });

    if (existente) {
      throw new BadRequestException(
        'Ya tienes una solicitud para esta convocatoria',
      );
    }

    const solicitud = await this.prisma.solicitud.create({
      data: {
        convocatoriaId: dto.convocatoriaId,
        usuarioId,
        estado: 'BORRADOR',
      },
      include: { convocatoria: { include: { beca: true } } },
    });

    await this.prisma.historialEstado.create({
      data: {
        solicitudId: solicitud.id,
        estado: 'BORRADOR',
        comentario: 'Solicitud creada',
        usuarioId,
      },
    });

    return solicitud;
  }

  async findAll(usuario: AuthenticatedUser) {
    const where = this.esAdmin(usuario) ? {} : { usuarioId: usuario.id };

    return this.prisma.solicitud.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        convocatoria: { include: { beca: true } },
        _count: { select: { documentos: true } },
      },
    });
  }

  async findById(id: string, usuario: AuthenticatedUser) {
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id },
      include: {
        convocatoria: { include: { beca: true } },
        perfilAcademico: true,
        perfilFinanciero: true,
        documentos: { include: { documentoTipo: true } },
        historial: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    this.assertAcceso(solicitud, usuario);
    return solicitud;
  }

  async transicion(
    id: string,
    dto: TransicionSolicitudDto,
    usuario: AuthenticatedUser,
  ) {
    const solicitud = await this.prisma.solicitud.findUnique({ where: { id } });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    const esAccionPostulante =
      dto.accion === 'enviar' || dto.accion === 'corregir';

    if (esAccionPostulante) {
      if (solicitud.usuarioId !== usuario.id) {
        throw new ForbiddenException('No tienes acceso a esta solicitud');
      }
    } else if (!this.esAdmin(usuario)) {
      throw new ForbiddenException(
        'No tienes permisos para esta transición',
      );
    }

    if (dto.accion === 'enviar') {
      const checklist = await this.obtenerChecklist(id, usuario);
      if (!checklist.completo) {
        throw new BadRequestException(
          `La solicitud no está completa: ${checklist.pendientes.join('; ')}`,
        );
      }
    }

    const siguienteEstado = SolicitudStateMachine.next(
      solicitud.estado as SolicitudEstado,
      dto.accion,
    );

    const actualizada = await this.prisma.solicitud.update({
      where: { id },
      data: {
        estado: siguienteEstado,
        ...(siguienteEstado === 'BORRADOR'
          ? { correccionesCount: { increment: 1 } }
          : {}),
      },
    });

    await this.prisma.historialEstado.create({
      data: {
        solicitudId: id,
        estado: siguienteEstado,
        comentario: dto.comentario ?? null,
        usuarioId: usuario.id,
      },
    });

    return actualizada;
  }

  async guardarPerfilAcademico(
    id: string,
    dto: PerfilAcademicoDto,
    usuario: AuthenticatedUser,
  ) {
    await this.obtainEditable(id, usuario);

    const campos = {
      ...this.resolverCatalogoCampo(dto, 'generoId', 'generoOtro'),
      ...this.resolverCatalogoCampo(dto, 'nivelAcademicoId', 'nivelAcademicoOtro'),
      ...this.resolverCatalogoCampo(dto, 'departamentoId', 'departamentoOtro'),
      ...this.resolverCatalogoCampo(dto, 'municipioId', 'municipioOtro'),
      ...(dto.institucion !== undefined ? { institucion: dto.institucion } : {}),
      ...(dto.carrera !== undefined ? { carrera: dto.carrera } : {}),
      ...(dto.promedio !== undefined ? { promedio: dto.promedio } : {}),
    };

    await this.assertCatalogosExisten(campos);

    return this.prisma.solicitudPerfilAcademico.upsert({
      where: { solicitudId: id },
      update: campos,
      create: { solicitudId: id, ...campos },
    });
  }

  async guardarPerfilFinanciero(
    id: string,
    dto: PerfilFinancieroDto,
    usuario: AuthenticatedUser,
  ) {
    await this.obtainEditable(id, usuario);

    const campos = {
      ...(dto.ingresoFamiliar !== undefined
        ? { ingresoFamiliar: dto.ingresoFamiliar }
        : {}),
      ...(dto.numeroDependientes !== undefined
        ? { numeroDependientes: dto.numeroDependientes }
        : {}),
      ...(dto.becasAnteriores !== undefined
        ? { becasAnteriores: dto.becasAnteriores }
        : {}),
      ...(dto.descripcionSituacion !== undefined
        ? { descripcionSituacion: dto.descripcionSituacion }
        : {}),
    };

    return this.prisma.solicitudPerfilFinanciero.upsert({
      where: { solicitudId: id },
      update: campos,
      create: { solicitudId: id, ...campos },
    });
  }

  async subirDocumento(
    id: string,
    tipoId: string,
    file: Express.Multer.File,
    usuario: AuthenticatedUser,
  ) {
    const solicitud = await this.obtainEditable(id, usuario);

    const tipo = await this.prisma.documentoTipo.findUnique({
      where: { id: tipoId },
    });
    if (!tipo) {
      throw new NotFoundException(`Tipo de documento con id ${tipoId} no encontrado`);
    }

    const convocatoria = await this.prisma.convocatoria.findUnique({
      where: { id: solicitud.convocatoriaId },
      include: { documentosRequeridos: true },
    });
    if (!convocatoria) {
      throw new NotFoundException(`Convocatoria no encontrada`);
    }

    const aplica = convocatoria.documentosRequeridos.some(
      (dr) => dr.documentoTipoId === tipoId,
    );
    if (!aplica) {
      throw new BadRequestException(
        'El tipo de documento no aplica a esta convocatoria',
      );
    }

    const anterior = await this.prisma.solicitudDocumento.findFirst({
      where: { solicitudId: id, documentoTipoId: tipoId },
      orderBy: { version: 'desc' },
    });

    const stored = await this.storage.save(file.buffer, {
      folder: `solicitudes/${id}`,
      name: file.originalname,
      contentType: file.mimetype,
    });

    const nuevo = await this.prisma.solicitudDocumento.create({
      data: {
        solicitudId: id,
        documentoTipoId: tipoId,
        archivoUrl: stored.url,
        estado: 'CARGADO',
        version: (anterior?.version ?? 0) + 1,
      },
      include: { documentoTipo: true },
    });

    if (anterior) {
      try {
        await this.storage.delete(anterior.archivoUrl.replace('/storage/', ''));
      } catch {
        // El archivo anterior ya no existe; se ignora.
      }
    }

    return nuevo;
  }

  async eliminarDocumento(
    id: string,
    tipoId: string,
    usuario: AuthenticatedUser,
  ) {
    await this.obtainEditable(id, usuario);

    const doc = await this.prisma.solicitudDocumento.findFirst({
      where: { solicitudId: id, documentoTipoId: tipoId },
      orderBy: { version: 'desc' },
    });

    if (!doc) {
      throw new NotFoundException('No hay documento cargado para este tipo');
    }

    await this.prisma.solicitudDocumento.delete({ where: { id: doc.id } });

    try {
      await this.storage.delete(doc.archivoUrl.replace('/storage/', ''));
    } catch {
      // El archivo ya no existe; se ignora.
    }

    return { eliminado: true };
  }

  async marcarEstadoDocumento(
    id: string,
    tipoId: string,
    estado: 'RECHAZADO',
    usuario: AuthenticatedUser,
  ) {
    const esRevisor =
      this.esAdmin(usuario) || usuario.rol?.nombre === 'COORDINADOR_COMITE';
    if (!esRevisor) {
      throw new ForbiddenException(
        'Solo administradores o el coordinador del comité pueden rechazar documentos',
      );
    }

    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id },
    });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    const doc = await this.prisma.solicitudDocumento.findFirst({
      where: { solicitudId: id, documentoTipoId: tipoId },
      orderBy: { version: 'desc' },
    });

    if (!doc) {
      throw new NotFoundException('No hay documento cargado para este tipo');
    }

    return this.prisma.solicitudDocumento.update({
      where: { id: doc.id },
      data: { estado },
      include: { documentoTipo: true },
    });
  }

  async obtenerChecklist(id: string, usuario: AuthenticatedUser) {
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id },
      include: {
        convocatoria: {
          include: {
            documentosRequeridos: { include: { documentoTipo: true } },
          },
        },
        perfilAcademico: true,
        perfilFinanciero: true,
        documentos: { include: { documentoTipo: true } },
      },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    this.assertAcceso(solicitud, usuario);

    const perfilAcademicoOk = this.esPerfilAcademicoCompleto(
      solicitud.perfilAcademico,
    );
    const perfilFinancieroOk = this.esPerfilFinancieroCompleto(
      solicitud.perfilFinanciero,
    );

    const ultimosPorTipo = new Map<string, (typeof solicitud.documentos)[number]>();
    for (const doc of solicitud.documentos) {
      const actual = ultimosPorTipo.get(doc.documentoTipoId);
      if (!actual || doc.version > actual.version) {
        ultimosPorTipo.set(doc.documentoTipoId, doc);
      }
    }

    const documentos = solicitud.convocatoria.documentosRequeridos.map(
      (dr) => {
        const ultimo = ultimosPorTipo.get(dr.documentoTipoId);
        const cargado = Boolean(ultimo && ultimo.estado === 'CARGADO');
        return {
          documentoTipoId: dr.documentoTipoId,
          nombre: dr.documentoTipo.nombre,
          obligatorio: dr.obligatorio,
          cargado,
          archivoUrl: cargado ? ultimo!.archivoUrl : null,
        };
      },
    );

    const pendientes: string[] = [];
    if (!perfilAcademicoOk) {
      pendientes.push('Perfil académico incompleto (género y nivel académico)');
    }
    if (!perfilFinancieroOk) {
      pendientes.push('Perfil financiero incompleto (ingreso familiar requerido)');
    }
    for (const documento of documentos) {
      if (documento.obligatorio && !documento.cargado) {
        pendientes.push(`Documento "${documento.nombre}" pendiente`);
      }
    }

    return {
      solicitudId: id,
      estado: solicitud.estado,
      perfilAcademico: perfilAcademicoOk,
      perfilFinanciero: perfilFinancieroOk,
      documentos,
      pendientes,
      completo: pendientes.length === 0,
    };
  }

  private esPerfilAcademicoCompleto(perfil?: {
    generoId?: string | null;
    generoOtro?: string | null;
    nivelAcademicoId?: string | null;
    nivelAcademicoOtro?: string | null;
  } | null): boolean {
    if (!perfil) {
      return false;
    }
    const generoOk = Boolean(perfil.generoId || perfil.generoOtro);
    const nivelOk = Boolean(
      perfil.nivelAcademicoId || perfil.nivelAcademicoOtro,
    );
    return generoOk && nivelOk;
  }

  private esPerfilFinancieroCompleto(perfil?: {
    ingresoFamiliar?: number | null;
  } | null): boolean {
    return Boolean(perfil && perfil.ingresoFamiliar != null);
  }

  private async obtainEditable(id: string, usuario: AuthenticatedUser) {
    const solicitud = await this.prisma.solicitud.findUnique({ where: { id } });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    if (!this.esAdmin(usuario) && solicitud.usuarioId !== usuario.id) {
      throw new ForbiddenException('No tienes acceso a esta solicitud');
    }

    if (!this.esAdmin(usuario) && solicitud.estado !== 'BORRADOR') {
      throw new BadRequestException(
        'Solo se puede editar la solicitud en estado BORRADOR',
      );
    }

    return solicitud;
  }

  private resolverCatalogoCampo(
    dto: PerfilAcademicoDto,
    idProp: 'generoId' | 'nivelAcademicoId' | 'departamentoId' | 'municipioId',
    otroProp:
      | 'generoOtro'
      | 'nivelAcademicoOtro'
      | 'departamentoOtro'
      | 'municipioOtro',
  ): Record<string, string | null | undefined> {
    const idVal = dto[idProp];
    const otroVal = dto[otroProp];

    if (idVal && otroVal) {
      throw new BadRequestException(`${idProp} y ${otroProp} son mutuamente excluyentes`);
    }

    if (otroVal) {
      return { [idProp]: null, [otroProp]: otroVal };
    }

    if (idVal !== undefined) {
      return { [idProp]: idVal, [otroProp]: null };
    }

    return {};
  }

  private async assertCatalogosExisten(
    campos: Record<string, string | number | null | undefined>,
  ) {
    for (const [prop, valor] of Object.entries(campos)) {
      if (valor == null || typeof valor !== 'string' || !prop.endsWith('Id')) {
        continue;
      }

      let existe = false;
      switch (prop) {
        case 'generoId':
          existe = Boolean(await this.prisma.genero.findUnique({ where: { id: valor } }));
          break;
        case 'nivelAcademicoId':
          existe = Boolean(
            await this.prisma.nivelAcademico.findUnique({ where: { id: valor } }),
          );
          break;
        case 'departamentoId':
          existe = Boolean(
            await this.prisma.departamento.findUnique({ where: { id: valor } }),
          );
          break;
        case 'municipioId':
          existe = Boolean(
            await this.prisma.municipio.findUnique({ where: { id: valor } }),
          );
          break;
      }

      if (!existe) {
        throw new BadRequestException(`Catálogo inexistente para ${prop}`);
      }
    }
  }

  private esAdmin(usuario: AuthenticatedUser): boolean {
    return usuario.rol?.nombre === 'ADMIN';
  }

  private assertAcceso(
    solicitud: { usuarioId: string },
    usuario: AuthenticatedUser,
  ) {
    if (!this.esAdmin(usuario) && solicitud.usuarioId !== usuario.id) {
      throw new ForbiddenException('No tienes acceso a esta solicitud');
    }
  }
}