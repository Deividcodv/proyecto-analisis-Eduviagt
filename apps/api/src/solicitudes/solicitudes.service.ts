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
import { CreateSolicitudDto, TransicionSolicitudDto, SolicitarCorreccionDto, OverrideMontoDto } from './dto';
import { PerfilAcademicoDto, PerfilFinancieroDto, GuardarRespuestasDto } from './dto';
import { SolicitudStateMachine, SolicitudEstado } from './solicitud-state-machine';
import { AuthzService } from '../common/services/authz.service';
import { SolicitudPerfilService } from './solicitud-perfil.service';
import { SolicitudDocumentoService } from './solicitud-documento.service';
import { SolicitudChecklistService } from './solicitud-checklist.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { MontosService } from './montos.service';
import { BitacoraService } from '../bitacora/bitacora.service';
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
    private readonly montos: MontosService,
    private readonly bitacora: BitacoraService,
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

    // El estado por sí solo no basta: una convocatoria ABIERTA puede tener la
    // fecha de cierre ya vencida y seguía aceptando postulaciones.
    const ahora = new Date();
    if (convocatoria.fechaApertura && ahora < convocatoria.fechaApertura) {
      throw new BadRequestException(
        'La convocatoria todavía no está abierta para postulaciones',
      );
    }
    if (convocatoria.fechaCierre && ahora > convocatoria.fechaCierre) {
      throw new BadRequestException(
        'La convocatoria ya cerró. No se aceptan nuevas postulaciones.',
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
      include: {
        convocatoria: { include: { beca: true } },
        perfilFinanciero: true,
        aprobaciones: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    const esAccionPostulante =
      dto.accion === 'enviar' || dto.accion === 'corregir';
    const esSegundaInstancia =
      dto.accion === 'aprobar_segunda' || dto.accion === 'devolver_a_revision';

    if (esAccionPostulante) {
      if (solicitud.usuarioId !== usuario.id) {
        throw new ForbiddenException('No tienes acceso a esta solicitud');
      }
    } else if (esSegundaInstancia) {
      // La segunda firma nunca puede ser la misma persona de la primera.
      const primerAprobador = solicitud.aprobaciones.find(
        (a) => a.nivel === 1,
      );
      this.authz.assertSegundaAprobacion(usuario, primerAprobador?.usuarioId);
    } else if (!this.authz.esPersonal(usuario)) {
      throw new ForbiddenException(
        'No tienes permisos para esta transición',
      );
    }

    // Rechazar o devolver a revisión exige dejar el motivo escrito: es la
    // información que el postulante recibe para saber qué corregir.
    if (
      (dto.accion === 'rechazar' || dto.accion === 'devolver_a_revision') &&
      !dto.comentario?.trim()
    ) {
      throw new BadRequestException(
        'Escribe el motivo de la decisión: el postulante lo necesita para saber qué hacer',
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

    if (dto.accion === 'solicitar_correccion') {
      this.assertCorreccionesDisponibles(
        solicitud.correccionesCount,
        solicitud.convocatoria?.maxCorrecciones,
      );
    }

    // El monto se calcula al evaluar, que es cuando la solicitud ya tiene
    // perfil financiero y se puede decidir cuánto se otorgará.
    if (dto.accion === 'evaluar') {
      await this.calcularMonto(id, solicitud, usuario);
    }

    // Segunda aprobación: si el monto supera el umbral, la primera firma
    // deja la solicitud pendiente de una segunda, feita por otra persona.
    let accion = dto.accion;
    if (dto.accion === 'aprobar') {
      const monto = solicitud.montoOtorgable;
      if (this.montos.requiereSegundaAprobacion(monto)) {
        accion = 'solicitar_segunda_aprobacion';
      }
    }

    const siguienteEstado = SolicitudStateMachine.next(
      solicitud.estado as SolicitudEstado,
      accion,
    );

    // Nivel de aprobación: la segunda instancia es la que se ejecuta desde
    // PENDIENTE_SEGUNDA_APROBACION.
    const nivelAprobacion = esSegundaInstancia ? 2 : 1;

    const actualizada = await this.prisma.$transaction(async (tx) => {
      const upd = await tx.solicitud.update({
        where: { id },
        data: {
          estado: siguienteEstado,
          ...(siguienteEstado === SOLICITUD_ESTADO.BORRADOR
            ? { correccionesCount: { increment: 1 } }
            : {}),
          ...(siguienteEstado === SOLICITUD_ESTADO.APROBADA &&
          solicitud.montoOtorgable !== null
            ? { montoAprobado: solicitud.montoOtorgable }
            : {}),
        },
      });

      await tx.historialEstado.create({
        data: {
          solicitudId: id,
          estado: siguienteEstado,
          comentario: dto.comentario ?? null,
          usuarioId: usuario.id,
          accion: dto.accion,
          resultado: 'EXITOSO',
        },
      });

      // Trazabilidad de las dos instancias de aprobación (Sprint 8).
      if (this.esAccionDeAprobacion(dto.accion)) {
        await tx.solicitudAprobacion.create({
          data: {
            solicitudId: id,
            usuarioId: usuario.id,
            rolNombre: usuario.rol?.nombre ?? 'SIN_ROL',
            nivel: nivelAprobacion,
            accion: dto.accion,
            resultado: this.resultadoDeAprobacion(siguienteEstado),
            comentario: dto.comentario ?? null,
          },
        });
      }

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

      await this.bitacora.registrar(
        {
          actor: {
            id: usuario.id,
            nombre: usuario.nombres,
            rol: usuario.rol?.nombre ?? 'SIN_ROL',
            correo: usuario.email,
          },
          modulo: 'solicitud',
          entidad: 'solicitud',
          entidadId: id,
          accionClave: `solicitud.${dto.accion}`,
          accionHumana: this.accionHumana(dto.accion, solicitud.convocatoria),
          descripcionHumana:
            dto.comentario?.trim() ||
            `La solicitud pasó de ${solicitud.estado} a ${siguienteEstado}.`,
          camposClave: { estadoAnterior: solicitud.estado, estadoNuevo: siguienteEstado },
          datosRelevantes: {
            montoOtorgable: solicitud.montoOtorgable?.toString() ?? null,
            montoAprobado:
              siguienteEstado === SOLICITUD_ESTADO.APROBADA
                ? (solicitud.montoOtorgable?.toString() ?? null)
                : null,
          },
          resultado: 'EXITOSO',
          origen: 'WEB',
        },
        tx,
      );

      return upd;
    });

    await this.notificarTransicion(dto, {
      id,
      usuarioId: solicitud.usuarioId,
      convocatoria: solicitud.convocatoria,
    });

    return actualizada;
  }

  /** ¿La transición es una de las dos instancias de aprobación? */
  private esAccionDeAprobacion(accion: string): boolean {
    return [
      'aprobar',
      'solicitar_segunda_aprobacion',
      'aprobar_segunda',
      'rechazar',
      'devolver_a_revision',
    ].includes(accion);
  }

  private resultadoDeAprobacion(estado: string): string {
    switch (estado) {
      case 'APROBADA':
        return 'APROBADA';
      case 'RECHAZADA':
        return 'RECHAZADA';
      case 'EN_REVISION':
        return 'DEVUELTA_A_REVISION';
      case 'PENDIENTE_SEGUNDA_APROBACION':
        return 'PENDIENTE_SEGUNDA_APROBACION';
      default:
        return 'EXITOSO';
    }
  }

  private accionHumana(
    accion: string,
    convocatoria?: { beca: { nombre: string } } | null,
  ): string {
    const beca = convocatoria?.beca?.nombre ?? 'la beca';
    switch (accion) {
      case 'enviar':
        return `Envió su solicitud a "${beca}"`;
      case 'corregir':
        return `Reenvió su solicitud corregida a "${beca}"`;
      case 'iniciar_revision':
        return `Inició la revisión de la solicitud de "${beca}"`;
      case 'solicitar_correccion':
        return `Solicitó correcciones en la solicitud de "${beca}"`;
      case 'evaluar':
        return `Marcó como evaluada la solicitud de "${beca}"`;
      case 'aprobar':
        return `Aprobó en primera instancia la solicitud de "${beca}"`;
      case 'solicitar_segunda_aprobacion':
        return `Envió la solicitud de "${beca}" a segunda aprobación`;
      case 'aprobar_segunda':
        return `Aprobó en segunda instancia la solicitud de "${beca}"`;
      case 'rechazar':
        return `Rechazó la solicitud de "${beca}"`;
      case 'devolver_a_revision':
        return `Devolvió a revisión la solicitud de "${beca}"`;
      default:
        return `Realizó "${accion}" sobre la solicitud de "${beca}"`;
    }
  }

  /**
   * Calcula y guarda el monto otorgable de la solicitud (Sprint 8 - US-801).
   */
  private async calcularMonto(
    id: string,
    solicitud: {
      id: string;
      convocatoriaId: string;
      perfilFinanciero?: { ingresoFamiliar?: number | null } | null;
    },
    usuario: AuthenticatedUser,
  ): Promise<void> {
    const resultado = await this.montos.calcular(
      solicitud.convocatoriaId,
      solicitud.perfilFinanciero?.ingresoFamiliar,
    );

    await this.prisma.solicitud.update({
      where: { id },
      data: {
        montoOtorgable: resultado.monto,
        montoOrigenCalculo: resultado.origen,
        montoCalculadoAt: new Date(),
        montoCalculadoPor: usuario.id,
      },
    });
  }

  /**
   * Ajuste manual del monto (Sprint 8 - US-801). Exige el permiso
   * `solicitud:montos-override` y deja la justificación en la bitácora.
   */
  async overrideMonto(
    id: string,
    dto: OverrideMontoDto,
    usuario: AuthenticatedUser,
  ) {
    if (!this.authz.esAdmin(usuario) && usuario.rol?.nombre !== ROL.JEFE_BECAS) {
      throw new ForbiddenException(
        'No tienes autorización para ajustar el monto de una beca',
      );
    }

    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id },
      include: { convocatoria: { include: { beca: true } } },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    if (
      solicitud.estado !== SOLICITUD_ESTADO.EVALUADA &&
      solicitud.estado !== 'PENDIENTE_SEGUNDA_APROBACION'
    ) {
      throw new BadRequestException(
        'El monto solo puede ajustarse cuando la solicitud está evaluada o pendiente de segunda aprobación',
      );
    }

    const monto = await this.montos.registrarOverride({
      solicitudId: id,
      monto: new Prisma.Decimal(dto.monto).toDecimalPlaces(2),
      justificacion: dto.justificacion.trim(),
      usuarioId: usuario.id,
    });

    // Si el ajuste deja el monto por debajo del umbral, la solicitud ya no
    // necesita segunda firma: vuelve a estar lista para aprobarse.
    const vuelveAEvaluada =
      solicitud.estado === 'PENDIENTE_SEGUNDA_APROBACION' &&
      !this.montos.requiereSegundaAprobacion(monto);

    if (vuelveAEvaluada) {
      await this.prisma.solicitud.update({
        where: { id },
        data: { estado: SOLICITUD_ESTADO.EVALUADA },
      });
      await this.prisma.historialEstado.create({
        data: {
          solicitudId: id,
          estado: SOLICITUD_ESTADO.EVALUADA,
          comentario: `Monto ajustado: ${dto.justificacion.trim()}`,
          usuarioId: usuario.id,
          accion: 'override_monto',
          resultado: 'EXITOSO',
        },
      });
    }

    await this.bitacora.registrar({
      actor: {
        id: usuario.id,
        nombre: usuario.nombres,
        rol: usuario.rol?.nombre ?? 'SIN_ROL',
        correo: usuario.email,
      },
      modulo: 'solicitud',
      entidad: 'solicitud',
      entidadId: id,
      accionClave: 'solicitud.override_monto',
      accionHumana: 'Ajustó el monto de la beca',
      descripcionHumana: dto.justificacion.trim(),
      camposClave: { montoAnterior: solicitud.montoOtorgable?.toString() ?? null },
      datosRelevantes: { montoNuevo: monto.toString() },
      resultado: 'EXITOSO',
      origen: 'WEB',
    });

    await this.notificaciones.notificarUsuario(solicitud.usuarioId, {
      tipo: 'SOLICITUD_MONTO_AJUSTADO',
      titulo: 'Se ajustó el monto de tu beca',
      cuerpo: `El monto de tu postulación a "${solicitud.convocatoria?.beca?.nombre ?? 'la beca'}" fue ajustado a Q${monto.toString()}.`,
    });

    return { solicitudId: id, monto: monto.toString(), requiereSegundaAprobacion: this.montos.requiereSegundaAprobacion(monto) };
  }

  private async notificarTransicion(
    dto: TransicionSolicitudDto,
    solicitud: {
      id: string;
      usuarioId: string;
      convocatoria: { beca: { nombre: string } };
    },
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
        // El postulante también recibe su confirmación, con el código con el
        // que puede rastrear la postulación.
        await this.notificaciones.notificarUsuario(solicitud.usuarioId, {
          tipo: 'SOLICITUD_ENVIADA_CONFIRMACION',
          titulo: 'Postulación enviada correctamente',
          cuerpo: `Tu postulación a "${beca}" fue enviada correctamente. Código de confirmación: ${solicitud.id}. Te avisaremos cuando haya novedades.`,
        });
        break;
      case 'iniciar_revision':
        await this.notificaciones.notificarUsuario(solicitud.usuarioId, {
          tipo: 'SOLICITUD_EN_REVISION',
          titulo: 'Tu solicitud está en revisión',
          cuerpo: `Ya estamos revisando tu postulación a "${beca}". Te avisaremos cuando haya una decisión.`,
        });
        break;
      case 'corregir':
        await this.notificaciones.notificarRoles(staff, {
          tipo: 'SOLICITUD_REENVIADA',
          titulo: 'Solicitud corregida y reenviada',
          cuerpo: `El postulante reenvió su solicitud de "${beca}".`,
        });
        await this.notificaciones.notificarUsuario(solicitud.usuarioId, {
          tipo: 'SOLICITUD_REENVIADA_CONFIRMACION',
          titulo: 'Correcciones enviadas',
          cuerpo: `Enviamos las correcciones de tu postulación a "${beca}". Código de confirmación: ${solicitud.id}.`,
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
      case 'evaluar':
        await this.notificaciones.notificarUsuario(solicitud.usuarioId, {
          tipo: 'SOLICITUD_EVALUADA',
          titulo: 'Tu solicitud fue evaluada',
          cuerpo: `Tu postulación a "${beca}" ya fue calificada y está pendiente de decisión.`,
        });
        break;
      case 'aprobar':
        await this.notificaciones.notificarUsuario(solicitud.usuarioId, {
          tipo: 'SOLICITUD_APROBADA',
          titulo: '¡Tu solicitud fue aprobada!',
          cuerpo: `La solicitud de "${beca}" fue aprobada.`,
        });
        break;
      case 'solicitar_segunda_aprobacion':
        await this.notificaciones.notificarUsuario(solicitud.usuarioId, {
          tipo: 'SOLICITUD_SEGUNDA_APROBACION',
          titulo: 'Tu solicitud requiere una segunda aprobación',
          cuerpo: `Por el monto de tu beca, tu postulación a "${beca}" está pendiente de una segunda revisión. Te avisaremos cuando se resuelva.`,
        });
        await this.notificaciones.notificarRoles(
          [ROL.ADMIN, ROL.JEFE_BECAS],
          {
            tipo: 'SOLICITUD_SEGUNDA_APROBACION_REQUERIDA',
            titulo: 'Hay una segunda aprobación pendiente',
            cuerpo: `Una postulación a "${beca}" supera el monto de control y necesita una segunda firma.`,
          },
        );
        break;
      case 'aprobar_segunda':
        await this.notificaciones.notificarUsuario(solicitud.usuarioId, {
          tipo: 'SOLICITUD_APROBADA',
          titulo: '¡Tu solicitud fue aprobada!',
          cuerpo: `La solicitud de "${beca}" fue aprobada en segunda instancia.`,
        });
        break;
      case 'devolver_a_revision':
        await this.notificaciones.notificarUsuario(solicitud.usuarioId, {
          tipo: 'SOLICITUD_DEVUELTA_A_REVISION',
          titulo: 'Tu solicitud volvió a revisión',
          cuerpo:
            dto.comentario ??
            `Tu postulación a "${beca}" volvió a revisión para que puedas corregirla.`,
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

    const esStaff = this.authz.esPersonal(usuario);

    if (!esStaff) {
      throw new ForbiddenException(
        'No tienes permisos para solicitar correcciones',
      );
    }

    if (solicitud.estado !== SOLICITUD_ESTADO.EN_REVISION) {
      throw new BadRequestException(
        'Solo se puede solicitar corrección de solicitudes en EN_REVISION',
      );
    }

    this.assertCorreccionesDisponibles(
      solicitud.correccionesCount,
      solicitud.convocatoria?.maxCorrecciones,
    );

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
          detalle: {
            correccionesCount: solicitud.correccionesCount,
            maximo: solicitud.convocatoria?.maxCorrecciones ?? 3,
          },
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

  private assertCorreccionesDisponibles(
    correccionesCount: number,
    maxCorrecciones?: number | null,
  ) {
    const maximo = maxCorrecciones ?? 3;
    if (correccionesCount >= maximo) {
      throw new BadRequestException(
        `La solicitud agotó el máximo de ${maximo} subsanaciones permitidas`,
      );
    }
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