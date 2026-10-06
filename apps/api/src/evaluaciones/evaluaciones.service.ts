import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AuthzService } from '../common/services/authz.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { SOLICITUD_ESTADO } from '../common/constants/estados';
import { ROL } from '../common/constants/roles';
import {
  AsignarEvaluadoresDto,
  ImparcialidadDto,
  RegistrarPuntajeDto,
} from './evaluaciones.dto';

export interface CriterioPuntaje {
  id: string;
  nombre: string;
  peso: number;
  puntaje: number | null;
}

export interface GrupoEvaluador {
  evaluador: { id: string; nombres: string };
  criterios: CriterioPuntaje[];
  completados: number;
  total: number;
}

export interface EvaluadorScoreResult extends GrupoEvaluador {
  completo: boolean;
  score: number | null;
}

export interface ScoreSolicitudResult {
  solicitudId: string;
  score: number | null;
  completo: boolean;
  evaluadoresMinimos: number;
  evaluadoresCompletos: number;
  minimoAlcanzado: boolean;
  evaluadores: EvaluadorScoreResult[];
}

@Injectable()
export class EvaluacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly authz: AuthzService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  async misEvaluaciones(usuario: AuthenticatedUser) {
    const evaluaciones = await this.prisma.evaluacion.findMany({
      where: { evaluadorId: usuario.id },
      include: {
        solicitud: {
          include: {
            convocatoria: { include: { beca: true } },
            usuario: { select: { nombres: true, cui: true, email: true } },
          },
        },
        criterioEvaluacion: {
          select: { id: true, nombre: true, peso: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    type GrupoEvaluacion = {
      solicitudId: string;
      solicitud: (typeof evaluaciones)[number]['solicitud'];
      imparcialidadConfirmada: boolean;
      criterios: {
        id: string;
        nombre: string;
        peso: number;
        puntaje: number | null;
        observaciones: string | null;
        completada: boolean;
      }[];
    };
    const porSolicitud = new Map<string, GrupoEvaluacion>();
    for (const ev of evaluaciones) {
      const key = ev.solicitudId;
      const grupo = porSolicitud.get(key);
      const criterio = {
        id: ev.criterioEvaluacion.id,
        nombre: ev.criterioEvaluacion.nombre,
        peso: ev.criterioEvaluacion.peso,
        puntaje: ev.puntaje,
        observaciones: ev.observaciones,
        completada: ev.completada,
      };
      if (grupo) {
        grupo.criterios.push(criterio);
        grupo.imparcialidadConfirmada =
          grupo.imparcialidadConfirmada || ev.confirmImparcialidad;
      } else {
        porSolicitud.set(key, {
          solicitudId: key,
          solicitud: ev.solicitud,
          imparcialidadConfirmada: ev.confirmImparcialidad,
          criterios: [criterio],
        });
      }
    }

    return Array.from(porSolicitud.values()).map((grupo) => ({
      ...grupo,
      totalCriterios: grupo.criterios.length,
      completados: grupo.criterios.filter(
        (c: { completada: boolean }) => c.completada,
      ).length,
    }));
  }

  async asignarEvaluadores(
    solicitudId: string,
    dto: AsignarEvaluadoresDto,
    usuario: AuthenticatedUser,
  ) {
    this.authz.assertAdmin(
      usuario,
      'Solo los administradores pueden asignar evaluadores',
    );

    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
      include: {
        convocatoria: {
          include: {
            beca: { include: { criteriosEvaluacion: true } },
          },
        },
      },
    });

    if (!solicitud) {
      throw new NotFoundException(
        `Solicitud con id ${solicitudId} no encontrada`,
      );
    }

    if (solicitud.estado !== SOLICITUD_ESTADO.EN_REVISION) {
      throw new BadRequestException(
        'Solo se pueden asignar evaluadores a solicitudes en EN_REVISION',
      );
    }

    const criterios = solicitud.convocatoria.beca.criteriosEvaluacion.filter(
      (c) => c.activo,
    );
    if (criterios.length === 0) {
      throw new BadRequestException(
        'La beca de la convocatoria no tiene criterios de evaluación activos',
      );
    }

    const evaluadores = await this.prisma.usuario.findMany({
      where: { id: { in: dto.evaluadorIds } },
      include: { rol: true },
    });

    if (evaluadores.length !== dto.evaluadorIds.length) {
      const encontrados = new Set(evaluadores.map((e) => e.id));
      const faltantes = dto.evaluadorIds.filter((id) => !encontrados.has(id));
      throw new NotFoundException(
        `Evaluadores no encontrados: ${faltantes.join(', ')}`,
      );
    }

    for (const evaluador of evaluadores) {
      if (evaluador.rol.nombre !== ROL.EVALUADOR) {
        throw new BadRequestException(
          `El usuario ${evaluador.nombres} no tiene rol EVALUADOR`,
        );
      }
    }

    const existentes = dto.evaluadorIds.length > 0
      ? await this.prisma.evaluacion.findMany({
          where: {
            solicitudId,
            evaluadorId: { in: dto.evaluadorIds },
            criterioEvaluacionId: { in: criterios.map((c) => c.id) },
          },
          select: { evaluadorId: true, criterioEvaluacionId: true },
        })
      : [];

    const existentesSet = new Set(
      existentes.map(
        (e) => `${e.evaluadorId}:${e.criterioEvaluacionId}`,
      ),
    );

    const aCrear = dto.evaluadorIds.flatMap((evaluadorId) =>
      criterios
        .filter((c) => !existentesSet.has(`${evaluadorId}:${c.id}`))
        .map((c) => ({
          solicitudId,
          criterioEvaluacionId: c.id,
          evaluadorId,
        })),
    );

    if (aCrear.length > 0) {
      await this.prisma.evaluacion.createMany({ data: aCrear });
    }

    if (dto.evaluadorIds.length > 0) {
      await this.audit.log({
        usuarioId: usuario.id,
        accion: 'asignar-evaluadores',
        entidad: 'solicitud',
        entidadId: solicitudId,
        detalle: { evaluadorIds: dto.evaluadorIds },
      });

      await this.notificaciones.crearParaVarios(dto.evaluadorIds, {
        tipo: 'EVALUACION_ASIGNADA',
        titulo: 'Nueva evaluación asignada',
        cuerpo: `Se te asignó la evaluación de una solicitud de "${
          solicitud.convocatoria?.beca?.nombre ?? 'beca'
        }".`,
      });
    }

    return {
      asignados: dto.evaluadorIds.length,
      criterios: criterios.length,
    };
  }

  async registrarPuntaje(
    solicitudId: string,
    criterioId: string,
    dto: RegistrarPuntajeDto,
    usuario: AuthenticatedUser,
  ) {
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${solicitudId} no encontrada`);
    }

    if (solicitud.estado !== SOLICITUD_ESTADO.EN_REVISION) {
      throw new BadRequestException(
        'La solicitud no está en EN_REVISION para ser evaluada',
      );
    }

    const evaluacion = await this.prisma.evaluacion.findFirst({
      where: {
        solicitudId,
        criterioEvaluacionId: criterioId,
        evaluadorId: usuario.id,
      },
    });

    if (!evaluacion) {
      throw new ForbiddenException(
        'No tienes una evaluación asignada para esta solicitud/criterio',
      );
    }

    if (!evaluacion.confirmImparcialidad) {
      throw new BadRequestException(
        'Debes confirmar la declaración de imparcialidad antes de registrar puntajes',
      );
    }

    return this.prisma.evaluacion.update({
      where: { id: evaluacion.id },
      data: {
        puntaje: dto.puntaje,
        observaciones: dto.observaciones ?? null,
        completada: true,
      },
      include: { criterioEvaluacion: true },
    });
  }

  async confirmarImparcialidad(
    solicitudId: string,
    dto: ImparcialidadDto,
    usuario: AuthenticatedUser,
  ) {
    if (!dto.confirma) {
      throw new BadRequestException(
        'Debes aceptar la declaración de imparcialidad para poder evaluar',
      );
    }

    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
    });

    if (!solicitud) {
      throw new NotFoundException(
        `Solicitud con id ${solicitudId} no encontrada`,
      );
    }

    const evaluaciones = await this.prisma.evaluacion.findMany({
      where: { solicitudId, evaluadorId: usuario.id },
      select: { completada: true },
    });

    if (evaluaciones.length === 0) {
      throw new ForbiddenException(
        'No tienes una evaluación asignada para esta solicitud',
      );
    }

    if (evaluaciones.some((e) => e.completada)) {
      throw new BadRequestException(
        'La declaración de imparcialidad ya no se puede modificar: registraste puntajes',
      );
    }

    await this.prisma.evaluacion.updateMany({
      where: { solicitudId, evaluadorId: usuario.id },
      data: { confirmImparcialidad: true },
    });

    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'confirmar-imparcialidad',
      entidad: 'solicitud',
      entidadId: solicitudId,
    });

    return { solicitudId, confirmada: true };
  }

  async quitarEvaluador(
    solicitudId: string,
    evaluadorId: string,
    usuario: AuthenticatedUser,
  ) {
    this.authz.assertAdmin(
      usuario,
      'Solo los administradores pueden quitar evaluadores',
    );

    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
    });

    if (!solicitud) {
      throw new NotFoundException(
        `Solicitud con id ${solicitudId} no encontrada`,
      );
    }

    if (solicitud.estado !== SOLICITUD_ESTADO.EN_REVISION) {
      throw new BadRequestException(
        'Solo se pueden quitar evaluadores de solicitudes en EN_REVISION',
      );
    }

    const evaluaciones = await this.prisma.evaluacion.findMany({
      where: { solicitudId, evaluadorId },
      select: { id: true, completada: true },
    });

    if (evaluaciones.length === 0) {
      throw new NotFoundException(
        'El evaluador no está asignado a esta solicitud',
      );
    }

    if (evaluaciones.some((e) => e.completada)) {
      throw new BadRequestException(
        'No se puede quitar a un evaluador que ya registró puntajes',
      );
    }

    await this.prisma.evaluacion.deleteMany({
      where: { solicitudId, evaluadorId },
    });

    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'quitar-evaluador',
      entidad: 'solicitud',
      entidadId: solicitudId,
      detalle: { evaluadorId },
    });

    await this.notificaciones.notificarUsuario(evaluadorId, {
      tipo: 'EVALUACION_REMOVIDA',
      titulo: 'Evaluación removida',
      cuerpo: 'Ya no tienes asignada la evaluación de esta solicitud.',
    });

    return { solicitudId, evaluadorId, removido: true };
  }

  async scoreSolicitud(solicitudId: string): Promise<ScoreSolicitudResult> {
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
      include: { convocatoria: { select: { evaluadoresMinimos: true } } },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${solicitudId} no encontrada`);
    }

    const evaluaciones = await this.prisma.evaluacion.findMany({
      where: { solicitudId },
      include: {
        criterioEvaluacion: { select: { id: true, nombre: true, peso: true } },
        evaluador: { select: { id: true, nombres: true } },
      },
    });

    const porEvaluador = new Map<string, GrupoEvaluador>();
    for (const ev of evaluaciones) {
      const key = ev.evaluadorId;
      const grupo = porEvaluador.get(key) ?? {
        evaluador: { id: key, nombres: ev.evaluador.nombres },
        criterios: [] as CriterioPuntaje[],
        completados: 0,
        total: 0,
      };
      grupo.total += 1;
      if (ev.completada) {
        grupo.completados += 1;
        grupo.criterios.push({
          id: ev.criterioEvaluacion.id,
          nombre: ev.criterioEvaluacion.nombre,
          peso: ev.criterioEvaluacion.peso,
          puntaje: ev.puntaje,
        });
      }
      porEvaluador.set(key, grupo);
    }

    const evaluadores = Array.from(porEvaluador.values()).map((g): EvaluadorScoreResult => {
      const sumPesos = g.criterios.reduce(
        (acc: number, c: CriterioPuntaje) => acc + c.peso,
        0,
      );
      const sumPonderado = g.criterios.reduce(
        (acc: number, c: CriterioPuntaje) => acc + c.peso * (c.puntaje ?? 0),
        0,
      );
      const completo = g.completados === g.total && g.total > 0;
      return {
        evaluador: g.evaluador,
        criterios: g.criterios,
        completados: g.completados,
        total: g.total,
        completo,
        score: completo && sumPesos > 0 ? sumPonderado / sumPesos : null,
      };
    });

    const scores = evaluadores
      .filter((e) => e.score !== null)
      .map((e) => e.score as number);
    const completo = evaluadores.length > 0 && evaluadores.every((e) => e.completo);
    const evaluadoresMinimos = solicitud.convocatoria?.evaluadoresMinimos ?? 2;
    const evaluadoresCompletos = evaluadores.filter((e) => e.completo).length;

    return {
      solicitudId,
      score: scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : null,
      completo,
      evaluadoresMinimos,
      evaluadoresCompletos,
      minimoAlcanzado: evaluadoresCompletos >= evaluadoresMinimos,
      evaluadores,
    };
  }
}