import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CrearSesionDto, RegistrarVotoDto } from './sesiones.dto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { SolicitudStateMachine } from '../solicitudes/solicitud-state-machine';
import { ConvocatoriaStateMachine } from '../convocatorias/convocatoria-state-machine';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import {
  SOLICITUD_ESTADO,
  CONVOCATORIA_ESTADO,
  SESION_ESTADO,
  DECISION_RESULTADO,
} from '../common/constants/estados';

@Injectable()
export class SesionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  async crearSesion(dto: CrearSesionDto, usuario: AuthenticatedUser) {
    const comite = await this.prisma.comite.findUnique({
      where: { id: dto.comiteId },
    });
    if (!comite) {
      throw new NotFoundException(`Comité con id ${dto.comiteId} no encontrado`);
    }

    const solicitudes = await this.prisma.solicitud.findMany({
      where: { id: { in: dto.solicitudesIds } },
      select: { id: true, estado: true, convocatoriaId: true },
    });

    const encontradas = new Set(solicitudes.map((s) => s.id));
    const faltantes = dto.solicitudesIds.filter((id) => !encontradas.has(id));
    if (faltantes.length > 0) {
      throw new NotFoundException(
        `Solicitudes no encontradas: ${faltantes.join(', ')}`,
      );
    }

    const noEvaluadas = solicitudes.filter((s) => s.estado !== SOLICITUD_ESTADO.EVALUADA);
    if (noEvaluadas.length > 0) {
      throw new BadRequestException(
        `La agenda solo admite solicitudes EVALUADA: ${noEvaluadas
          .map((s) => s.id)
          .join(', ')}`,
      );
    }

    const convocatorias = new Set(solicitudes.map((s) => s.convocatoriaId));
    if (convocatorias.size > 1) {
      throw new BadRequestException(
        'Todas las solicitudes de la agenda deben pertenecer a la misma convocatoria',
      );
    }

    const sesion = await this.prisma.sesion.create({
      data: {
        comiteId: dto.comiteId,
        fecha: new Date(dto.fecha),
        lugar: dto.lugar,
        quorumMinimo: dto.quorumMinimo,
        agenda: {
          create: dto.solicitudesIds.map((solicitudId) => ({ solicitudId })),
        },
      },
      include: {
        comite: { select: { id: true, nombre: true } },
        agenda: { select: { solicitudId: true } },
      },
    });

    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'crear',
      entidad: 'sesion',
      entidadId: sesion.id,
      detalle: { comiteId: dto.comiteId, solicitudes: dto.solicitudesIds },
    });

    return sesion;
  }

  async listarSesiones() {
    const sesiones = await this.prisma.sesion.findMany({
      include: {
        comite: { select: { id: true, nombre: true } },
        votos: { select: { usuarioId: true } },
        _count: { select: { agenda: true, votos: true } },
      },
      orderBy: { fecha: 'desc' },
    });

    const miembrosPorComite = await this.prisma.comiteMiembro.groupBy({
      by: ['comiteId'],
      where: { activo: true },
      _count: { _all: true },
    });
    const miembrosMap = new Map(
      miembrosPorComite.map((m) => [m.comiteId, m._count._all]),
    );

    return sesiones.map((s) => ({
      id: s.id,
      comiteId: s.comiteId,
      fecha: s.fecha,
      lugar: s.lugar,
      estado: s.estado,
      quorumMinimo: s.quorumMinimo,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      comite: s.comite,
      _count: s._count,
      miembros: miembrosMap.get(s.comiteId) ?? 0,
      votantes: new Set(s.votos.map((v) => v.usuarioId)).size,
    }));
  }

  async obtenerSesion(id: string) {
    const sesion = await this.prisma.sesion.findUnique({
      where: { id },
      include: {
        comite: { select: { id: true, nombre: true } },
        agenda: {
          include: {
            solicitud: {
              select: {
                id: true,
                estado: true,
                usuario: { select: { nombres: true, cui: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        votos: {
          include: {
            usuario: { select: { id: true, nombres: true } },
            solicitud: { select: { id: true } },
          },
        },
        decisiones: true,
      },
    });

    if (!sesion) {
      throw new NotFoundException(`Sesión con id ${id} no encontrada`);
    }

    const miembros = await this.prisma.comiteMiembro.count({
      where: { comiteId: sesion.comiteId, activo: true },
    });

    return {
      ...sesion,
      miembros,
    };
  }

  async registrarVoto(
    sesionId: string,
    dto: RegistrarVotoDto,
    usuario: AuthenticatedUser,
  ) {
    const sesion = await this.prisma.sesion.findUnique({
      where: { id: sesionId },
      include: {
        comite: true,
        agenda: { select: { solicitudId: true } },
      },
    });

    if (!sesion) {
      throw new NotFoundException(`Sesión con id ${sesionId} no encontrada`);
    }

    if (sesion.estado === SESION_ESTADO.FINALIZADA) {
      throw new BadRequestException('La sesión ya fue finalizada');
    }

    const miembro = await this.prisma.comiteMiembro.findFirst({
      where: { comiteId: sesion.comiteId, usuarioId: usuario.id, activo: true },
    });
    if (!miembro) {
      throw new ForbiddenException(
        'Solo los miembros activos del comité pueden votar',
      );
    }

    const enAgenda = sesion.agenda.some((a) => a.solicitudId === dto.solicitudId);
    if (!enAgenda) {
      throw new BadRequestException(
        'La solicitud no está en la agenda de la sesión',
      );
    }

    const yaVotado = await this.prisma.voto.findFirst({
      where: {
        sesionId,
        solicitudId: dto.solicitudId,
        usuarioId: usuario.id,
      },
    });
    if (yaVotado) {
      throw new BadRequestException(
        'Ya registraste tu voto para esta solicitud en la sesión',
      );
    }

    const voto = await this.prisma.voto.create({
      data: {
        sesionId,
        solicitudId: dto.solicitudId,
        usuarioId: usuario.id,
        voto: dto.voto,
        observaciones: dto.observaciones,
      },
    });

    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'votar',
      entidad: 'voto',
      entidadId: voto.id,
      detalle: { sesionId, solicitudId: dto.solicitudId, voto: dto.voto },
    });

    return voto;
  }

  async finalizarSesion(sesionId: string, usuario: AuthenticatedUser) {
    const sesion = await this.prisma.sesion.findUnique({
      where: { id: sesionId },
      include: {
        comite: true,
        agenda: {
          include: {
            solicitud: {
              select: {
                id: true,
                estado: true,
                convocatoriaId: true,
                usuarioId: true,
              },
            },
          },
        },
        votos: {
          select: { solicitudId: true, usuarioId: true, voto: true },
        },
      },
    });

    if (!sesion) {
      throw new NotFoundException(`Sesión con id ${sesionId} no encontrada`);
    }

    if (sesion.estado === SESION_ESTADO.FINALIZADA) {
      throw new BadRequestException('La sesión ya fue finalizada');
    }

    const quorum = sesion.quorumMinimo ?? 1;
    const votantes = new Set(sesion.votos.map((v) => v.usuarioId)).size;
    if (votantes < quorum) {
      throw new BadRequestException(
        `Quórum insuficiente: ${votantes} votante(s) de ${quorum} requeridos`,
      );
    }

    const solicitudes = sesion.agenda.map((a) => a.solicitud);
    const enEvaluada = solicitudes.filter(
      (s) => s.estado !== SOLICITUD_ESTADO.EVALUADA,
    );
    if (enEvaluada.length > 0) {
      throw new BadRequestException(
        `No se puede finalizar: las solicitudes ${enEvaluada
          .map((s) => s.id)
          .join(', ')} no están en EVALUADA`,
      );
    }

    const avisos: { usuarioId: string; resultado: string }[] = [];

    const sesionFinal = await this.prisma.$transaction(async (tx) => {
      const decisiones = [];
      for (const solicitud of solicitudes) {
        const votos = sesion.votos.filter((v) => v.solicitudId === solicitud.id);
        const aprobar = votos.filter((v) => v.voto === 'APROBAR').length;
        const rechazar = votos.filter((v) => v.voto === 'RECHAZAR').length;
        const resultado =
          aprobar > rechazar
            ? DECISION_RESULTADO.APROBADA
            : DECISION_RESULTADO.RECHAZADA;

        const siguiente = SolicitudStateMachine.next(
          solicitud.estado,
          resultado === DECISION_RESULTADO.APROBADA ? 'aprobar' : 'rechazar',
        );

        await tx.solicitud.update({
          where: { id: solicitud.id },
          data: { estado: siguiente },
        });
        await tx.historialEstado.create({
          data: {
            solicitudId: solicitud.id,
            estado: siguiente,
            comentario: `Decisión de sesión ${sesionId}`,
            usuarioId: usuario.id,
          },
        });

        decisiones.push(
          await tx.decision.create({
            data: {
              solicitudId: solicitud.id,
              sesionId,
              resultado,
            },
          }),
        );

        avisos.push({ usuarioId: solicitud.usuarioId, resultado });
      }

      const convocatoriaId = solicitudes[0]?.convocatoriaId;
      if (convocatoriaId) {
        const restantes = await tx.solicitud.count({
          where: { convocatoriaId, estado: SOLICITUD_ESTADO.EVALUADA },
        });
        const convocatoria = await tx.convocatoria.findUnique({
          where: { id: convocatoriaId },
          select: { estado: true },
        });
        if (
          convocatoria &&
          convocatoria.estado === CONVOCATORIA_ESTADO.EN_EVALUACION &&
          restantes === 0
        ) {
          const siguiente = ConvocatoriaStateMachine.next(
            convocatoria.estado,
            'resolver',
          );
          await tx.convocatoria.update({
            where: { id: convocatoriaId },
            data: { estado: siguiente },
          });
        }
      }

      const final = await tx.sesion.update({
        where: { id: sesionId },
        data: { estado: SESION_ESTADO.FINALIZADA },
        include: {
          comite: { select: { id: true, nombre: true } },
          agenda: { select: { solicitudId: true } },
          decisiones: true,
        },
      });

      await this.audit.log(
        {
          usuarioId: usuario.id,
          accion: 'finalizar',
          entidad: 'sesion',
          entidadId: sesionId,
          detalle: {
            decisiones: final.decisiones.map(
              (d: { solicitudId: string; resultado: string }) => ({
                solicitudId: d.solicitudId,
                resultado: d.resultado,
              }),
            ),
          },
        },
        tx,
      );

      return final;
    });

    for (const aviso of avisos) {
      const aprobada = aviso.resultado === DECISION_RESULTADO.APROBADA;
      await this.notificaciones.notificarUsuario(aviso.usuarioId, {
        tipo: aprobada ? 'SOLICITUD_APROBADA' : 'SOLICITUD_RECHAZADA',
        titulo: aprobada
          ? '¡Tu solicitud fue aprobada!'
          : 'Tu solicitud no fue aprobada',
        cuerpo: 'La decisión del comité está disponible.',
      });
    }

    return sesionFinal;
  }
}