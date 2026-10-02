import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EvaluacionesService } from '../evaluaciones/evaluaciones.service';

export type TipoReporte =
  | 'solicitudes-por-estado'
  | 'convocatorias'
  | 'evaluaciones';

const TIPOS_VALIDOS: TipoReporte[] = [
  'solicitudes-por-estado',
  'convocatorias',
  'evaluaciones',
];

@Injectable()
export class ReportesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluacionesService: EvaluacionesService,
  ) {}

  async solicitudesPorEstado(convocatoriaId?: string) {
    const where = convocatoriaId ? { convocatoriaId } : {};

    const porEstado = await this.prisma.solicitud.groupBy({
      by: ['estado'],
      where,
      _count: { _all: true },
    });

    const detalle = await this.prisma.solicitud.groupBy({
      by: ['convocatoriaId', 'estado'],
      where,
      _count: { _all: true },
    });

    let convocatorias = await this.prisma.convocatoria.findMany({
      where: convocatoriaId ? { id: convocatoriaId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        beca: { select: { nombre: true } },
        _count: { select: { solicitudes: true } },
      },
    });

    if (convocatoriaId) {
      convocatorias = convocatorias.filter((c) => c.id === convocatoriaId);
    }

    return {
      total: porEstado.reduce((acc, f) => acc + f._count._all, 0),
      porEstado: porEstado
        .map((f) => ({ estado: f.estado, cantidad: f._count._all }))
        .sort((a, b) => b.cantidad - a.cantidad),
      porConvocatoria: convocatorias.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        beca: c.beca.nombre,
        total: c._count.solicitudes,
        porEstado: detalle
          .filter((f) => f.convocatoriaId === c.id)
          .map((f) => ({ estado: f.estado, cantidad: f._count._all })),
      })),
    };
  }

  async convocatorias() {
    const porEstado = await this.prisma.convocatoria.groupBy({
      by: ['estado'],
      _count: { _all: true },
    });

    const convocatorias = await this.prisma.convocatoria.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        beca: { select: { nombre: true } },
        _count: { select: { solicitudes: true } },
      },
    });

    const total = convocatorias.length;
    const activas = convocatorias.filter((c) => c.estado === 'ABIERTA').length;

    return {
      total,
      activas,
      resueltas: convocatorias.filter((c) => c.estado === 'RESUELTA').length,
      porEstado: porEstado.map((f) => ({
        estado: f.estado,
        cantidad: f._count._all,
      })),
      detalle: convocatorias.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        beca: c.beca.nombre,
        estado: c.estado,
        solicitudes: c._count.solicitudes,
        creadaEl: c.createdAt,
      })),
    };
  }

  async evaluaciones() {
    const convocatorias = await this.prisma.convocatoria.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        beca: { select: { nombre: true } },
      },
    });

    const resultados = await Promise.all(
      convocatorias.map(async (c) => {
        const solicitades = await this.prisma.solicitud.findMany({
          where: { convocatoriaId: c.id, estado: 'EVALUADA' },
          select: { id: true },
        });

        const scores: number[] = [];
        let conScore = 0;
        let pendientes = 0;
        for (const s of solicitades) {
          const score = await this.evaluacionesService.scoreSolicitud(s.id);
          if (score && score.completo && score.score !== null) {
            scores.push(score.score);
            conScore += 1;
          } else {
            pendientes += 1;
          }
        }

        const enRevision = await this.prisma.solicitud.count({
          where: { convocatoriaId: c.id, estado: 'EN_REVISION' },
        });

        const decisiones = await this.prisma.decision.groupBy({
          by: ['resultado'],
          where: { solicitud: { convocatoriaId: c.id } },
          _count: { _all: true },
        });

        const scorePromedio =
          scores.length > 0
            ? Math.round(
                (scores.reduce((a, b) => a + b, 0) / scores.length) * 100,
              ) / 100
            : null;

        return {
          id: c.id,
          nombre: c.nombre,
          beca: c.beca.nombre,
          solicitudesEvaluadas: solicitades.length,
          conScore,
          scorePromedio,
          aprobadas:
            decisiones.find((d) => d.resultado === 'APROBADA')?._count._all ??
            0,
          rechazadas:
            decisiones.find((d) => d.resultado === 'RECHAZADA')?._count._all ??
            0,
          pendientes: pendientes + enRevision,
        };
      }),
    );

    return {
      totalConvocatorias: convocatorias.length,
      totalSolicitudesEvaluadas: resultados.reduce(
        (acc, r) => acc + r.solicitudesEvaluadas,
        0,
      ),
      porConvocatoria: resultados,
    };
  }

  async generarCsv(tipo: TipoReporte): Promise<string> {
    if (!TIPOS_VALIDOS.includes(tipo)) {
      throw new BadRequestException(
        `Tipo de reporte inválido. Válidos: ${TIPOS_VALIDOS.join(', ')}`,
      );
    }

    if (tipo === 'solicitudes-por-estado') {
      const data = await this.solicitudesPorEstado();
      const filas: Record<string, unknown>[] = data.porConvocatoria.flatMap((c) =>
        c.porEstado.map((e) => ({
          convocatoria: c.nombre,
          beca: c.beca,
          estado: e.estado,
          cantidad: e.cantidad,
        })),
      );
      if (filas.length === 0) {
        filas.push({
          convocatoria: '(total)',
          beca: '',
          estado: 'TODOS',
          cantidad: data.total,
        });
      }
      return this.aCsv(filas);
    }

    if (tipo === 'convocatorias') {
      const data = await this.convocatorias();
      return this.aCsv(
        data.detalle.map((c) => ({
          convocatoria: c.nombre,
          beca: c.beca,
          estado: c.estado,
          solicitudes: c.solicitudes,
          creadaEl: c.creadaEl?.toISOString() ?? '',
        })),
      );
    }

    const data = await this.evaluaciones();
    return this.aCsv(
      data.porConvocatoria.map((c) => ({
        convocatoria: c.nombre,
        beca: c.beca,
        solicitudesEvaluadas: c.solicitudesEvaluadas,
        conScore: c.conScore,
        scorePromedio: c.scorePromedio ?? '',
        aprobadas: c.aprobadas,
        rechazadas: c.rechazadas,
        pendientes: c.pendientes,
      })),
    );
  }

  private aCsv(filas: Record<string, unknown>[]): string {
    if (filas.length === 0) {
      return '\ufeff';
    }
    const encabezados = Object.keys(filas[0]);
    const escapar = (v: unknown) => {
      const s = String(v ?? '');
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lineas = [
      encabezados.map(escapar).join(','),
      ...filas.map((fila) =>
        encabezados.map((h) => escapar(fila[h])).join(','),
      ),
    ];
    return `\ufeff${lineas.join('\n')}`;
  }
}