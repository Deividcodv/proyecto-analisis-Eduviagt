'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { fetchConToken } from '@/lib/api-auth';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { InternalPageHeader } from '@/components/ui/InternalPageHeader';
import { nombreRol } from '@/lib/rol';
import { MarcoBrutal } from '@/components/reportes/MarcoBrutal';
import { GraficaDona } from '@/components/reportes/GraficaDona';
import { GraficaBarras } from '@/components/reportes/GraficaBarras';
import { GraficaTendencia, TendenciaData } from '@/components/reportes/GraficaTendencia';
import { ComparativaConvocatorias } from '@/components/reportes/ComparativaConvocatorias';
import { EmbudoConversion } from '@/components/reportes/EmbudoConversion';
import { TablaDetalle } from '@/components/reportes/TablaDetalle';
import { ExportarReporte } from '@/components/reportes/ExportarReporte';

const ROLES_EMPLEADOS = ['ADMIN', 'EVALUADOR', 'COORDINADOR_COMITE', 'MIEMBRO_COMITE'];

interface ReporteGeneral {
  solicitudes: { total: number; porEstado: { estado: string; cantidad: number }[] };
  convocatorias: { total: number; porEstado: { estado: string; cantidad: number }[] };
  evaluaciones: { completadas: number; scorePromedio: number | null };
}

interface ReporteMisEvaluaciones {
  total: number;
  completadas: number;
  pendientes: number;
  scorePromedio: number | null;
}

interface ReporteMisComites {
  totalComites: number;
  totalSesiones: number;
  sesionesResueltas: number;
}

interface ReporteMisSesiones {
  totalSesiones: number;
  sesionesConVoto: number;
  totalVotos: number;
}

interface ConvocatoriasDetalle {
  detalle: { id: string; nombre: string; solicitudes: number }[];
}

export default function ReportesPage() {
  return (
    <ProtectedRoute roles={ROLES_EMPLEADOS}>
      <ReportesContent />
    </ProtectedRoute>
  );
}

function ReportesContent() {
  const { usuario } = useAuth();
  const [general, setGeneral] = useState<ReporteGeneral | null>(null);
  const [tendencia, setTendencia] = useState<TendenciaData | null>(null);
  const [convDetalle, setConvDetalle] = useState<ConvocatoriasDetalle | null>(null);
  const [misEvaluaciones, setMisEvaluaciones] = useState<ReporteMisEvaluaciones | null>(null);
  const [misComites, setMisComites] = useState<ReporteMisComites | null>(null);
  const [misSesiones, setMisSesiones] = useState<ReporteMisSesiones | null>(null);
  const [meses, setMeses] = useState(12);
  const [error, setError] = useState<string | null>(null);

  const rol = (usuario?.rol ?? '').toUpperCase();

  const cargar = useCallback(async () => {
    try {
      const [g, tr, cv] = await Promise.all([
        fetchConToken<ReporteGeneral>('/reportes/general'),
        fetchConToken<TendenciaData>(`/reportes/tendencia?meses=${meses}`),
        fetchConToken<ConvocatoriasDetalle>('/reportes/convocatorias'),
      ]);
      setGeneral(g);
      setTendencia(tr);
      setConvDetalle(cv);

      if (rol === 'EVALUADOR') {
        const ev = await fetchConToken<ReporteMisEvaluaciones>('/reportes/mis-evaluaciones');
        setMisEvaluaciones(ev);
      }
      if (rol === 'COORDINADOR_COMITE') {
        const co = await fetchConToken<ReporteMisComites>('/reportes/mis-comites');
        setMisComites(co);
      }
      if (rol === 'MIEMBRO_COMITE') {
        const se = await fetchConToken<ReporteMisSesiones>('/reportes/mis-sesiones');
        setMisSesiones(se);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando reportes');
    }
  }, [rol, meses]);

  useEffect(() => { cargar(); }, [cargar]);

  const descargarCsv = async (tipo: string) => {
    try {
      const res = await fetch(`/api/reportes/${tipo}/csv`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sigeb_access_token') ?? ''}` },
      });
      if (!res.ok) throw new Error('Error al descargar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${tipo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error descargando CSV');
    }
  };

  return (
    <>
      <InternalPageHeader
        title="Reportes"
        subtitle={`Panel de métricas para ${nombreRol(rol)}`}
      />

      <Container className="py-10">
        {error && (
          <p className="mb-6 rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">{error}</p>
        )}

        {!general || !tendencia ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : (
          <div className="space-y-10">
            {/* KPIs por rol */}
            {rol === 'EVALUADOR' && misEvaluaciones && (
              <section>
                <p className="brut-label mb-4 text-xs font-bold text-brutal-gold">// Mis evaluaciones</p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <KpiCard label="Asignadas" value={misEvaluaciones.total} acento="bg-brutal-cyan" />
                  <KpiCard label="Completadas" value={misEvaluaciones.completadas} acento="bg-brutal-lima" />
                  <KpiCard label="Pendientes" value={misEvaluaciones.pendientes} acento="bg-brutal-naranja" />
                  <KpiCard label="Score promedio" value={misEvaluaciones.scorePromedio ?? '—'} acento="bg-brutal-gold" />
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <MarcoBrutal titulo="Progreso de evaluaciones">
                    <GraficaBarras
                      labels={['Asignadas', 'Completadas', 'Pendientes']}
                      datasets={[{ label: 'Cantidad', data: [misEvaluaciones.total, misEvaluaciones.completadas, misEvaluaciones.pendientes] }]}
                    />
                  </MarcoBrutal>
                </div>
              </section>
            )}

            {rol === 'COORDINADOR_COMITE' && misComites && (
              <section>
                <p className="brut-label mb-4 text-xs font-bold text-brutal-gold">// Mis comités</p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <KpiCard label="Comités" value={misComites.totalComites} acento="bg-brutal-cyan" />
                  <KpiCard label="Sesiones totales" value={misComites.totalSesiones} acento="bg-brutal-gold" />
                  <KpiCard label="Resueltas" value={misComites.sesionesResueltas} acento="bg-brutal-lima" />
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <MarcoBrutal titulo="Actividad de comités">
                    <GraficaBarras
                      labels={['Comités', 'Sesiones', 'Resueltas']}
                      datasets={[{ label: 'Cantidad', data: [misComites.totalComites, misComites.totalSesiones, misComites.sesionesResueltas] }]}
                    />
                  </MarcoBrutal>
                </div>
              </section>
            )}

            {rol === 'MIEMBRO_COMITE' && misSesiones && (
              <section>
                <p className="brut-label mb-4 text-xs font-bold text-brutal-gold">// Mis sesiones</p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <KpiCard label="Sesiones" value={misSesiones.totalSesiones} acento="bg-brutal-cyan" />
                  <KpiCard label="Con mi voto" value={misSesiones.sesionesConVoto} acento="bg-brutal-lima" />
                  <KpiCard label="Total votos" value={misSesiones.totalVotos} acento="bg-brutal-gold" />
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <MarcoBrutal titulo="Participación en sesiones">
                    <GraficaBarras
                      labels={['Sesiones', 'Con mi voto', 'Votos']}
                      datasets={[{ label: 'Cantidad', data: [misSesiones.totalSesiones, misSesiones.sesionesConVoto, misSesiones.totalVotos] }]}
                    />
                  </MarcoBrutal>
                </div>
              </section>
            )}

            {/* Resumen general */}
            <section>
              <p className="brut-label mb-4 text-xs font-bold text-brutal-gold">// Resumen general</p>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <KpiCard label="Solicitudes" value={general.solicitudes.total} acento="bg-brutal-cyan" />
                <KpiCard label="Convocatorias" value={general.convocatorias.total} acento="bg-brutal-gold" />
                <KpiCard label="Evals completadas" value={general.evaluaciones.completadas} acento="bg-brutal-lima" />
                <KpiCard label="Score global" value={general.evaluaciones.scorePromedio ?? '—'} acento="bg-brutal-rosa" />
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <MarcoBrutal titulo="Solicitudes por estado">
                  <GraficaDona data={general.solicitudes.porEstado} />
                </MarcoBrutal>

                <MarcoBrutal titulo="Convocatorias por estado">
                  <GraficaBarras
                    labels={general.convocatorias.porEstado.map((e) => e.estado)}
                    datasets={[{
                      label: 'Convocatorias',
                      data: general.convocatorias.porEstado.map((e) => e.cantidad),
                    }]}
                    horizontal
                  />
                </MarcoBrutal>
              </div>

              {convDetalle && convDetalle.detalle.length > 0 && (
                <div className="mt-6">
                  <MarcoBrutal titulo="Solicitudes por convocatoria">
                    <GraficaBarras
                      labels={convDetalle.detalle.map((c) => c.nombre.length > 22 ? `${c.nombre.slice(0, 22)}…` : c.nombre)}
                      datasets={[{
                        label: 'Solicitudes',
                        data: convDetalle.detalle.map((c) => c.solicitudes),
                      }]}
                    />
                  </MarcoBrutal>
                </div>
              )}

              <div className="mt-6">
                <MarcoBrutal titulo="Tendencia mensual (solicitudes vs evaluaciones)">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="brut-label text-[10px] font-bold uppercase text-brutal-tinta/60">
                      Rango:
                    </span>
                    {[6, 12, 24].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setMeses(n)}
                        className={`rounded-brutal border-2 border-brutal-tinta px-2 py-1 font-mono text-[11px] font-bold transition-colors ${
                          meses === n
                            ? 'bg-brutal-tinta text-brutal-papel'
                            : 'bg-brutal-papel text-brutal-tinta hover:bg-brutal-cyan/30'
                        }`}
                      >
                        {n} meses
                      </button>
                    ))}
                  </div>
                  <div className="h-72">
                    <GraficaTendencia data={tendencia} />
                  </div>
                </MarcoBrutal>
              </div>

              <div className="mt-6">
                <MarcoBrutal titulo="Embudo de conversión">
                  <EmbudoConversion />
                </MarcoBrutal>
              </div>

              <div className="mt-6">
                <MarcoBrutal titulo="Detalle por convocatoria y totales">
                  <TablaDetalle />
                </MarcoBrutal>
              </div>
            </section>

            <section>
              <p className="brut-label mb-4 text-xs font-bold text-brutal-gold">// Comparativa de convocatorias</p>
              <ComparativaConvocatorias />
            </section>

            {rol === 'ADMIN' && (
              <section className="space-y-4">
                <p className="brut-label mb-1 text-xs font-bold text-brutal-gold">// Exportar datos</p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => descargarCsv('solicitudes-por-estado')} variant="ghost">
                    ↓ CSV Solicitudes
                  </Button>
                  <Button onClick={() => descargarCsv('convocatorias')} variant="ghost">
                    ↓ CSV Convocatorias
                  </Button>
                  <Button onClick={() => descargarCsv('evaluaciones')} variant="ghost">
                    ↓ CSV Evaluaciones
                  </Button>
                </div>
                <ExportarReporte />
              </section>
            )}
          </div>
        )}
      </Container>
    </>
  );
}

function KpiCard({ label, value, acento }: { label: string; value: number | string; acento: string }) {
  return (
    <Card className="p-4">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-brutal border-2 border-brutal-tinta text-brutal-tinta ${acento}`}>
        <Icon name="grafica" className="h-4 w-4" />
      </div>
      <p className="text-mega text-3xl font-black text-brutal-tinta">{value}</p>
      <p className="brut-label mt-1 text-[10px] font-bold uppercase text-brutal-tinta/60">{label}</p>
    </Card>
  );
}
