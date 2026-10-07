import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateSolicitudDto, TransicionSolicitudDto, SolicitarCorreccionDto } from './dto';
import { PerfilAcademicoDto, PerfilFinancieroDto, GuardarRespuestasDto } from './dto';
import { SolicitudStateMachine, SolicitudEstado } from './solicitud-state-machine';
import { AuthzService } from '../common/services/authz.service';
import { SolicitudPerfilService } from './solicitud-perfil.service';
import { SolicitudDocumentoService } from './solicitud-documento.service';
import { SolicitudChecklistService } from './solicitud-checklist.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import {
  SOLICITUD_ESTADO,
  CONVOCATORIA_ESTADO,
} from '../common/constants/estados';
import { ROL } from '../common/constants/roles';

@Injectable()
export class SolicitudesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly authz: AuthzService,
    private readonly perfiles: SolicitudPerfilService,
    private readonly documentos: SolicitudDocumentoService,
    private readonly checklist: SolicitudChecklistService,
    private readonly notificaciones: NotificacionesService,
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

    if (convocatoria.estado !== CONVOCATORIA_ESTADO.ABIERTA) {
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

    const solicitud = await this.prisma.$transaction(async (tx) => {
      const creada = await tx.solicitud.create({
        data: {
          convocatoriaId: dto.convocatoriaId,
          usuarioId,
          estado: SOLICITUD_ESTADO.BORRADOR,
          ...(convocatoria.formulario !== null &&
          convocatoria.formulario !== undefined
            ? {
                formularioSnapshot:
                  convocatoria.formulario as Prisma.InputJsonValue,
              }
            : {}),
        },
        include: { convocatoria: { include: { beca: true } } },
      });

      await tx.historialEstado.create({
        data: {
          solicitudId: creada.id,
          estado: SOLICITUD_ESTADO.BORRADOR,
          comentario: 'Solicitud creada',
          usuarioId,
        },
      });

      return creada;
    });

    return solicitud;
  }

  async findAll(usuario: AuthenticatedUser) {
    const where = this.authz.esAdmin(usuario) ? {} : { usuarioId: usuario.id };

    return this.prisma.solicitud.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        convocatoria: {
          include: {
            beca: true,
            _count: { select: { documentosRequeridos: true } },
          },
        },
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

    this.authz.assertAcceso(solicitud, usuario);
    return solicitud;
  }

  async consultaPublica(codigo: string) {
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: codigo },
      include: {
        convocatoria: { include: { beca: true } },
        historial: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!solicitud) {
      throw new NotFoundException(
        'No se encontró ninguna solicitud con ese código',
      );
    }

    const convocatoria = solicitud.convocatoria;
    return {
      codigo: solicitud.id,
      estado: solicitud.estado,
      beca: convocatoria?.beca?.nombre ?? null,
      convocatoria: convocatoria?.nombre ?? null,
      fechaCreacion: solicitud.createdAt,
      fechaActualizacion: solicitud.updatedAt,
      historial: solicitud.historial.map((h) => ({
        estado: h.estado,
        comentario: h.comentario,
        fecha: h.createdAt,
      })),
    };
  }

  async transicion(
    id: string,
    dto: TransicionSolicitudDto,
    usuario: AuthenticatedUser,
  ) {
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id },
      include: { convocatoria: { include: { beca: true } } },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    const esAccionPostulante =
      dto.accion === 'enviar' || dto.accion === 'corregir';

    if (esAccionPostulante) {
      if (solicitud.usuarioId !== usuario.id) {
        throw new ForbiddenException('No tienes acceso a esta solicitud');
      }
    } else if (!this.authz.esAdmin(usuario)) {
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

    if (dto.accion === 'evaluar') {
      await this.assertEvaluadoresMinimos(id);
    }

    const siguienteEstado = SolicitudStateMachine.next(
      solicitud.estado as SolicitudEstado,
      dto.accion,
    );

    const actualizada = await this.prisma.$transaction(async (tx) => {
      const upd = await tx.solicitud.update({
        where: { id },
        data: {
          estado: siguienteEstado,
          ...(siguienteEstado === SOLICITUD_ESTADO.BORRADOR
            ? { correccionesCount: { increment: 1 } }
            : {}),
        },
      });

      await tx.historialEstado.create({
        data: {
          solicitudId: id,
          estado: siguienteEstado,
          comentario: dto.comentario ?? null,
          usuarioId: usuario.id,
        },
      });

      await this.audit.log(
        {
          usuarioId: usuario.id,
          accion: 'transicion',
          entidad: 'solicitud',
          entidadId: id,
          detalle: { accion: dto.accion, estado: siguienteEstado },
        },
        tx,
      );

      return upd;
    });

    await this.notificarTransicion(dto, solicitud);

    return actualizada;
  }

  private async notificarTransicion(
    dto: TransicionSolicitudDto,
    solicitud: { usuarioId: string; convocatoria: { beca: { nombre: string } } },
  ) {
    const beca = solicitud.convocatoria?.beca?.nombre ?? 'la beca';
    const staff = [ROL.ADMIN, ROL.COORDINADOR_COMITE];

    switch (dto.accion) {
      case 'enviar':
        await this.notificaciones.notificarRoles(staff, {
          tipo: 'SOLICITUD_ENVIADA',
          titulo: 'Nueva solicitud enviada',
          cuerpo: `Se envió una solicitud a "${beca}" y está pendiente de revisión.`,
        });
        break;
      case 'corregir':
        await this.notificaciones.notificarRoles(staff, {
          tipo: 'SOLICITUD_REENVIADA',
          titulo: 'Solicitud corregida y reenviada',
          cuerpo: `El postulante reenvió su solicitud de "${beca}".`,
        });
        break;
      case 'solicitar_correccion':
        await this.notificaciones.notificarUsuario(solicitud.usuarioId, {
          tipo: 'CORRECCION_SOLICITADA',
          titulo: 'Se solicitó una corrección',
          cuerpo:
            dto.comentario ??
            `Revisa y corrige tu solicitud de "${beca}".`,
        });
        break;
      case 'aprobar':
        await this.notificaciones.notificarUsuario(solicitud.usuarioId, {
          tipo: 'SOLICITUD_APROBADA',
          titulo: '¡Tu solicitud fue aprobada!',
          cuerpo: `La solicitud de "${beca}" fue aprobada.`,
        });
        break;
      case 'rechazar':
        await this.notificaciones.notificarUsuario(solicitud.usuarioId, {
          tipo: 'SOLICITUD_RECHAZADA',
          titulo: 'Tu solicitud no fue aprobada',
          cuerpo: dto.comentario ?? `La solicitud de "${beca}" fue rechazada.`,
        });
        break;
      default:
        break;
    }
  }

  async solicitarCorreccion(
    id: string,
    dto: SolicitarCorreccionDto,
    usuario: AuthenticatedUser,
  ) {
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id },
      include: { convocatoria: true },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    const esStaff =
      this.authz.esAdmin(usuario) ||
      usuario.rol?.nombre === ROL.COORDINADOR_COMITE;

    if (!esStaff) {
      throw new ForbiddenException(
        'Solo el comité puede solicitar correcciones',
      );
    }

    if (solicitud.estado !== SOLICITUD_ESTADO.EN_REVISION) {
      throw new BadRequestException(
        'Solo se puede solicitar corrección de solicitudes en EN_REVISION',
      );
    }

    const maximo = solicitud.convocatoria?.maxCorrecciones ?? 3;
    if (solicitud.correccionesCount >= maximo) {
      throw new BadRequestException(
        `La solicitud agotó el máximo de ${maximo} subsanaciones permitidas`,
      );
    }

    const siguienteEstado = SolicitudStateMachine.next(
      solicitud.estado as SolicitudEstado,
      'solicitar_correccion',
    );

    const actualizada = await this.prisma.$transaction(async (tx) => {
      const upd = await tx.solicitud.update({
        where: { id },
        data: { estado: siguienteEstado },
      });

      await tx.historialEstado.create({
        data: {
          solicitudId: id,
          estado: siguienteEstado,
          comentario: dto.comentario ?? null,
          usuarioId: usuario.id,
        },
      });

      await this.audit.log(
        {
          usuarioId: usuario.id,
          accion: 'solicitar-correccion',
          entidad: 'solicitud',
          entidadId: id,
          detalle: { correccionesCount: solicitud.correccionesCount, maximo },
        },
        tx,
      );

      return upd;
    });

    await this.notificaciones.notificarUsuario(solicitud.usuarioId, {
      tipo: 'CORRECCION_SOLICITADA',
      titulo: 'Se solicitó una corrección',
      cuerpo:
        dto.comentario ??
        'Revisa y corrige tu solicitud para continuar con el proceso.',
    });

    return actualizada;
  }

  private async assertEvaluadoresMinimos(solicitudId: string) {
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
      include: {
        convocatoria: {
          include: { beca: { include: { criteriosEvaluacion: true } } },
        },
        evaluaciones: {
          select: { evaluadorId: true, completada: true },
        },
      },
    });

    if (!solicitud) {
      throw new NotFoundException(
        `Solicitud con id ${solicitudId} no encontrada`,
      );
    }

    const criteriosActivos =
      solicitud.convocatoria.beca.criteriosEvaluacion.filter(
        (c) => c.activo,
      ).length;

    const porEvaluador = new Map<string, { total: number; completados: number }>();
    for (const ev of solicitud.evaluaciones) {
      const grupo = porEvaluador.get(ev.evaluadorId) ?? {
        total: 0,
        completados: 0,
      };
      grupo.total += 1;
      if (ev.completada) {
        grupo.completados += 1;
      }
      porEvaluador.set(ev.evaluadorId, grupo);
    }

    const completos = Array.from(porEvaluador.values()).filter(
      (g) => criteriosActivos > 0 && g.completados >= criteriosActivos,
    ).length;

    const minimo = solicitud.convocatoria.evaluadoresMinimos;
    if (completos < minimo) {
      throw new BadRequestException(
        `Se requieren al menos ${minimo} evaluadores con la evaluación completa (actual: ${completos})`,
      );
    }
  }

  async guardarPerfilAcademico(
    id: string,
    dto: PerfilAcademicoDto,
    usuario: AuthenticatedUser,
  ) {
    return this.perfiles.guardarAcademico(id, dto, usuario);
  }

  async guardarPerfilFinanciero(
    id: string,
    dto: PerfilFinancieroDto,
    usuario: AuthenticatedUser,
  ) {
    return this.perfiles.guardarFinanciero(id, dto, usuario);
  }

  async guardarRespuestas(
    id: string,
    dto: GuardarRespuestasDto,
    usuario: AuthenticatedUser,
  ) {
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    this.authz.assertAcceso(solicitud, usuario);

    if (
      solicitud.estado !== SOLICITUD_ESTADO.BORRADOR &&
      solicitud.estado !== SOLICITUD_ESTADO.CORRECCION
    ) {
      throw new BadRequestException(
        'Solo se pueden editar respuestas en estado BORRADOR o CORRECCION',
      );
    }

    const campos = this.camposSeccion(solicitud.formularioSnapshot, dto.seccion);
    const valores = this.validarRespuestas(campos, dto.valores);

    const respuestasActuales =
      (solicitud.respuestas as Record<string, unknown> | null) ?? {};

    return this.prisma.solicitud.update({
      where: { id },
      data: {
        respuestas: {
          ...respuestasActuales,
          [dto.seccion]: valores,
        } as Prisma.InputJsonValue,
      },
      select: { id: true, respuestas: true },
    });
  }

  private camposSeccion(
    snapshot: Prisma.JsonValue | null,
    seccion: string,
  ): { id: string; etiqueta: string; tipo: string; requerido: boolean }[] {
    if (!Array.isArray(snapshot)) return [];
    const items = snapshot as unknown as Record<string, unknown>[];
    return items
      .filter((c) => c && typeof c === 'object' && c.seccion === seccion)
      .map((c) => ({
        id: String(c.id),
        etiqueta: String(c.etiqueta ?? c.id),
        tipo: String(c.tipo ?? 'texto'),
        requerido: Boolean(c.requerido),
      }));
  }

  private validarRespuestas(
    campos: { id: string; etiqueta: string; tipo: string; requerido: boolean }[],
    valores: Record<string, unknown>,
  ): Record<string, unknown> {
    const resultado: Record<string, unknown> = {};

    for (const campo of campos) {
      const valor = valores[campo.id];
      const vacio =
        valor === undefined ||
        valor === null ||
        (typeof valor === 'string' && valor.trim() === '');

      if (vacio) {
        if (campo.requerido) {
          throw new BadRequestException(
            `El campo "${campo.etiqueta}" es obligatorio`,
          );
        }
        continue;
      }

      switch (campo.tipo) {
        case 'numero': {
          const numero = Number(valor);
          if (Number.isNaN(numero)) {
            throw new BadRequestException(
              `El campo "${campo.etiqueta}" debe ser numérico`,
            );
          }
          resultado[campo.id] = numero;
          break;
        }
        case 'booleano':
          resultado[campo.id] =
            valor === true || valor === 'true' || valor === 'on' || valor === 1;
          break;
        default:
          resultado[campo.id] = valor;
      }
    }

    return resultado;
  }

  async subirDocumento(
    id: string,
    tipoId: string,
    file: Express.Multer.File,
    usuario: AuthenticatedUser,
  ) {
    return this.documentos.subir(id, tipoId, file, usuario);
  }

  async eliminarDocumento(
    id: string,
    tipoId: string,
    usuario: AuthenticatedUser,
  ) {
    return this.documentos.eliminar(id, tipoId, usuario);
  }

  async marcarEstadoDocumento(
    id: string,
    tipoId: string,
    estado: 'RECHAZADO',
    comentario: string | undefined,
    usuario: AuthenticatedUser,
  ) {
    return this.documentos.marcarEstado(id, tipoId, estado, comentario, usuario);
  }

  async obtenerChecklist(id: string, usuario: AuthenticatedUser) {
    return this.checklist.obtener(id, usuario);
  }
}