'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { GraficaBarras } from '@/components/reportes/GraficaBarras';
import { COLORS_BRUTAL } from '@/components/reportes/paleta';

interface EstadoCount {
  estado: string;
  cantidad: number;
}

interface FilaSolicitudesPorConvocatoria {
  id: string;
  nombre: string;
  beca: string;
  total: number;
  porEstado: EstadoCount[];
}

interface SolicitudesPorEstado {
  total: number;
  porEstado: EstadoCount[];
  porConvocatoria: FilaSolicitudesPorConvocatoria[];
}

interface FilaEvaluacionesPorConvocatoria {
  id: string;
  nombre: string;
  beca: string;
  solicitudesEvaluadas: number;
  conScore: number;
  scorePromedio: number | null;
  aprobadas: number;
  rechazadas: number;
  totalDecisiones: number;
  tiempoPromedioResolucionDias: number | null;
  pendientes: number;
}

interface Evaluaciones {
  totalConvocatorias: number;
  totalSolicitudesEvaluadas: number;
  porConvocatoria: FilaEvaluacionesPorConvocatoria[];
}

interface FilaComparativa {
  id: string;
  nombre: string;
  beca: string;
  total: number;
  borradores: number;
  completitud: number | null;
  aprobadas: number;
  rechazadas: number;
  totalDecisiones: number;
  tasaAprobacion: number | null;
  tiempoPromedioResolucionDias: number | null;
}

function porcentaje(numerador: number, denominador: number): number | null {
  if (!denominador || denominador <= 0) return null;
  return Math.round((numerador / denominador) * 1000) / 10;
}

function formatDias(dias: number | null): string {
  if (dias == null) return '—';
  if (dias >= 30) {
    const meses = Math.round(dias / 30);
    return `${meses} mese${meses === 1 ? '' : 's'}`;
  }
  return `${dias} días`;
}

export function ComparativaConvocatorias() {
  const [filas, setFilas] = useState<FilaComparativa[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [porEstado, evaluaciones] = await Promise.all([
        fetchConToken<SolicitudesPorEstado>('/reportes/solicitudes-por-estado'),
        fetchConToken<Evaluaciones>('/reportes/evaluaciones'),
      ]);

      const evPorId = new Map(
        evaluaciones.porConvocatoria.map((e) => [e.id, e]),
      );

      const filasCalculadas: FilaComparativa[] = porEstado.porConvocatoria.map(
        (c) => {
          const ev = evPorId.get(c.id);
          const borradores =
            c.porEstado.find((e) => e.estado === 'BORRADOR')?.cantidad ?? 0;
          const enviadas = c.total - borradores;
          const aprobadas = ev?.aprobadas ?? 0;
          const rechazadas = ev?.rechazadas ?? 0;

          return {
            id: c.id,
            nombre: c.nombre,
            beca: c.beca,
            total: c.total,
            borradores,
            completitud: porcentaje(enviadas, c.total),
            aprobadas,
            rechazadas,
            totalDecisiones: ev?.totalDecisiones ?? 0,
            tasaAprobacion: porcentaje(
              aprobadas,
              aprobadas + rechazadas,
            ),
            tiempoPromedioResolucionDias:
              ev?.tiempoPromedioResolucionDias ?? null,
          };
        },
      );

      setFilas(filasCalculadas);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la comparativa');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (error) {
    return (
      <p className="rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">
        {error}
      </p>
    );
  }

  if (!filas) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const labels = filas.map((f) =>
    f.nombre.length > 18 ? `${f.nombre.slice(0, 18)}…` : f.nombre,
  );

  return (
    <div className="space-y-6">
      {filas.length === 0 ? (
        <Card>
          <p className="font-mono text-sm text-brutal-tinta/70">
            Aún no hay convocatorias registradas para comparar.
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {filas.map((f) => {
              const completitudFila = f.completitud ?? 0;
              const aprobacionFila = f.tasaAprobacion ?? 0;
              return (
                <Card key={f.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-brut text-sm font-black uppercase tracking-wide text-brutal-tinta">
                        {f.nombre}
                      </p>
                      <p className="font-mono text-xs text-brutal-tinta/70">
                        {f.beca} · {f.total} solicitudes ·{' '}
                        {f.borradores} en borrador
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 font-mono text-xs">
                      <span className="rounded-brutal border-2 border-brutal-tinta bg-brutal-cyan px-2 py-1 font-bold text-brutal-tinta">
                        Envío {f.completitud ?? 0}%
                      </span>
                      <span className="rounded-brutal border-2 border-brutal-tinta bg-brutal-lima px-2 py-1 font-bold text-brutal-tinta">
                        Aprobación {f.tasaAprobacion ?? '—'}%
                      </span>
                      <span className="rounded-brutal border-2 border-brutal-tinta bg-brutal-gold px-2 py-1 font-bold text-brutal-tinta">
                        Resolución {formatDias(f.tiempoPromedioResolucionDias)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="brut-label mb-1 text-[10px] font-bold uppercase text-brutal-tinta/60">
                        Completitud (eliminando BORRADOR)
                      </p>
                      <div className="h-2 w-full border-2 border-brutal-tinta bg-brutal-papel">
                        <div
                          className="h-full bg-brutal-cyan"
                          style={{ width: `${completitudFila}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="brut-label mb-1 text-[10px] font-bold uppercase text-brutal-tinta/60">
                        Tasa de aprobación ({f.aprobadas} A / {f.rechazadas} R)
                      </p>
                      <div className="h-2 w-full border-2 border-brutal-tinta bg-brutal-papel">
                        <div
                          className="h-full bg-brutal-lima"
                          style={{ width: `${aprobacionFila}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="overflow-x-auto">
            <Card className="p-5">
              <p className="brut-label mb-4 text-xs font-bold uppercase tracking-wide text-brutal-gold">
                // Comparativa por convocatoria
              </p>
              <div className="h-72 min-w-[560px]">
                <GraficaBarras
                  labels={labels}
                  datasets={[
                    {
                      label: 'Completitud %',
                      data: filas.map((f) => f.completitud ?? 0),
                      color: COLORS_BRUTAL[0],
                    },
                    {
                      label: 'Aprobación %',
                      data: filas.map((f) => f.tasaAprobacion ?? 0),
                      color: '#D4A72C',
                    },
                  ]}
                />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}