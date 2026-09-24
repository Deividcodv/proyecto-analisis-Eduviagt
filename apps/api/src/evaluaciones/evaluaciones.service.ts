import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import {
  AsignarEvaluadoresDto,
  RegistrarPuntajeDto,
} from './evaluaciones.dto';

@Injectable()
export class EvaluacionesService {
  constructor(private readonly prisma: PrismaService) {}

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
      } else {
        porSolicitud.set(key, {
          solicitudId: key,
          solicitud: ev.solicitud,
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
    this.esAdminOrThrow(usuario);

    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
      include: {
        convocatoria: { include: { beca: { include: { criteriosEvaluacion: true } } } },
      },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${solicitudId} no encontrada`);
    }

    if (solicitud.estado !== 'EN_REVISION') {
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

    for (const evaluadorId of dto.evaluadorIds) {
      const evaluador = await this.prisma.usuario.findUnique({
        where: { id: evaluadorId },
        include: { rol: true },
      });
      if (!evaluador) {
        throw new NotFoundException(`Evaluador con id ${evaluadorId} no existe`);
      }
      if (evaluador.rol.nombre !== 'EVALUADOR') {
        throw new BadRequestException(
          `El usuario ${evaluador.nombres} no tiene rol EVALUADOR`,
        );
      }

      for (const criterio of criterios) {
        const existente = await this.prisma.evaluacion.findFirst({
          where: {
            solicitudId,
            criterioEvaluacionId: criterio.id,
            evaluadorId,
          },
        });
        if (!existente) {
          await this.prisma.evaluacion.create({
            data: {
              solicitudId,
              criterioEvaluacionId: criterio.id,
              evaluadorId,
            },
          });
        }
      }
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

    if (solicitud.estado !== 'EN_REVISION') {
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

  private esAdminOrThrow(usuario: AuthenticatedUser) {
    if (usuario.rol?.nombre !== 'ADMIN') {
      throw new ForbiddenException('Solo los administradores pueden asignar evaluadores');
    }
  }

  async scoreSolicitud(solicitudId: string) {
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
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

    const porEvaluador = new Map<string, any>();
    for (const ev of evaluaciones) {
      const key = ev.evaluadorId;
      const grupo = porEvaluador.get(key) ?? {
        evaluador: { id: key, nombres: ev.evaluador.nombres },
        criterios: [] as any[],
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

    const evaluadores = Array.from(porEvaluador.values()).map((g) => {
      const sumPesos = g.criterios.reduce(
        (acc: number, c: { peso: number }) => acc + c.peso,
        0,
      );
      const sumPonderado = g.criterios.reduce(
        (acc: number, c: { peso: number; puntaje: number }) =>
          acc + c.peso * c.puntaje,
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

    return {
      solicitudId,
      score: scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : null,
      completo,
      evaluadores,
    };
  }
}