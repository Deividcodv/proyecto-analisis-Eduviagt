'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { fetchConToken } from '@/lib/api-auth';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { InternalPageHeader } from '@/components/ui/InternalPageHeader';
import { GraficaDona } from '@/components/reportes/GraficaDona';
import type { CampoFormulario } from '@/lib/api';

interface Criterio {
  id: string;
  nombre: string;
  peso: number;
  puntaje: number | null;
  observaciones: string | null;
  completada: boolean;
}

interface Evaluacion {
  solicitudId: string;
  solicitud: {
    id: string;
    estado: string;
    respuestas?: Record<string, Record<string, unknown>> | null;
    formularioSnapshot?: CampoFormulario[] | null;
    convocatoria: { nombre: string; beca: { nombre: string } };
    usuario: { nombres: string; cui: string };
  };
  criterios: Criterio[];
  totalCriterios: number;
  completados: number;
  imparcialidadConfirmada: boolean;
}

function respuestasVisibles(ev: Evaluacion): { etiqueta: string; valor: string }[] {
  const campos = ev.solicitud.formularioSnapshot;
  if (!campos || campos.length === 0) return [];
  const valores: Record<string, unknown> = {};
  for (const seccion of Object.values(ev.solicitud.respuestas ?? {})) {
    if (seccion && typeof seccion === 'object') Object.assign(valores, seccion);
  }
  return campos
    .map((campo) => {
      const valor = valores[campo.id];
      if (valor === undefined || valor === null || valor === '') return null;
      return {
        etiqueta: campo.etiqueta,
        valor: typeof valor === 'boolean' ? (valor ? 'Sí' : 'No') : String(valor),
      };
    })
    .filter((v): v is { etiqueta: string; valor: string } => v !== null);
}

export default function EvaluadorPage() {
  return (
    <ProtectedRoute roles={['EVALUADOR']}>
      <EvaluadorContent />
    </ProtectedRoute>
  );
}

function EvaluadorContent() {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [marcas, setMarcas] = useState<Record<string, { puntaje: string; observaciones: string }>>({});

  const cargar = useCallback(async () => {
    try {
      const data = await fetchConToken<Evaluacion[]>('/evaluaciones/mias');
      setEvaluaciones(data);
      const iniciales: Record<string, { puntaje: string; observaciones: string }> = {};
      data.forEach((ev) =>
        ev.criterios.forEach((c) => {
          iniciales[c.id] = {
            puntaje: c.puntaje != null ? String(c.puntaje) : '',
            observaciones: c.observaciones ?? '',
          };
        }),
      );
      setMarcas(iniciales);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las evaluaciones');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const confirmarImparcialidad = async (solicitudId: string) => {
    setGuardando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/solicitudes/${solicitudId}/imparcialidad`, {
        method: 'PATCH',
        body: { confirma: true },
      });
      await cargar();
      setExito('Declaración de imparcialidad confirmada. Ya puedes puntuar.');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo confirmar la imparcialidad',
      );
    } finally {
      setGuardando(false);
    }
  };

  const puntuar = async (solicitudId: string, criterio: Criterio) => {
    const marca = marcas[criterio.id];
    const puntaje = Number(marca?.puntaje);
    if (Number.isNaN(puntaje)) return;
    if (puntaje < 0 || puntaje > 100) {
      setError('El puntaje debe estar entre 0 y 100');
      return;
    }
    setGuardando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/solicitudes/${solicitudId}/criterios/${criterio.id}`, {
        method: 'PUT',
        body: {
          puntaje,
          observaciones: marca?.observaciones || undefined,
        },
      });
      await cargar();
      setExito(`Puntaje registrado para "${criterio.nombre}"`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar el puntaje');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <InternalPageHeader
        title="Panel del evaluador"
        subtitle="Revisa y puntúa las solicitudes asignadas."
      />

      <Container className="py-8">
        {error && (
          <p className="mb-4 rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">{error}</p>
        )}
        {exito && (
          <p className="mb-4 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-lima/30 p-4 text-sm font-bold text-brutal-tinta">{exito}</p>
        )}

        {!evaluaciones ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : evaluaciones.length === 0 ? (
          <Card className="text-center">
            <p className="text-lg font-bold text-brutal-tinta">
              No tienes evaluaciones asignadas
            </p>
            <p className="mt-1 text-sm text-brutal-tinta/70">
              Cuando te asignen solicitudes para evaluar aparecerán aquí.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {evaluaciones.map((ev) => {
              let sumPonderado = 0;
              let sumPesos = 0;
              let ingresados = 0;
              ev.criterios.forEach((criterio) => {
                const raw = marcas[criterio.id]?.puntaje ?? '';
                if (raw.trim() === '') return;
                const num = Number(raw);
                if (Number.isNaN(num) || num < 0 || num > 100) return;
                sumPonderado += criterio.peso * num;
                sumPesos += criterio.peso;
                ingresados += 1;
              });
              const preview =
                sumPesos > 0 ? Math.round((sumPonderado / sumPesos) * 100) / 100 : null;
              const pctProgreso =
                ev.totalCriterios > 0
                  ? Math.round((ingresados / ev.totalCriterios) * 100)
                  : 0;

              return (
              <Card key={ev.solicitudId}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-black text-brutal-tinta">
                        {ev.solicitud.convocatoria.beca.nombre}
                      </h2>
                      <Badge estado={ev.solicitud.estado} />
                    </div>
                    <p className="text-sm text-brutal-tinta/70">
                      {ev.solicitud.convocatoria.nombre}
                    </p>
                    <p className="text-sm text-brutal-tinta/70">
                      Postulante: {ev.solicitud.usuario.nombres} (CUI{' '}
                      {ev.solicitud.usuario.cui})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-brutal-tinta">
                      {ev.completados}/{ev.totalCriterios} completados
                    </span>
                    {preview !== null && (
                      <p className="mt-1 font-mono text-sm font-bold text-brutal-tinta">
                        Puntaje ponderado:{' '}
                        <span className="rounded-brutal border-2 border-brutal-tinta bg-brutal-gold px-2 py-0.5 text-brutal-tinta">
                          {preview}/100
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {(() => {
                  const extra = respuestasVisibles(ev);
                  if (extra.length === 0) return null;
                  return (
                    <div className="mb-4 rounded-brutal border-2 border-brutal-tinta/30 bg-brutal-papel/40 p-3">
                      <p className="mb-2 font-brut text-xs font-bold uppercase tracking-wide text-brutal-tinta/70">
                        Información adicional del postulante
                      </p>
                      <dl className="grid gap-1 font-mono text-xs text-brutal-tinta/80 sm:grid-cols-2">
                        {extra.map((item) => (
                          <div key={item.etiqueta} className="flex justify-between gap-2">
                            <dt className="text-brutal-tinta/60">{item.etiqueta}</dt>
                            <dd className="font-bold text-brutal-tinta">{item.valor}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  );
                })()}

                <div className="mb-4 grid gap-4 md:grid-cols-[1fr_220px]">
                  <div>
                    <div className="mb-1 flex justify-between font-mono text-xs font-bold text-brutal-tinta">
                      <span>Avance de evaluación</span>
                      <span>{pctProgreso}%</span>
                    </div>
                    <div className="h-3 w-full rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel">
                      <div
                        className={`h-full rounded-brutal ${pctProgreso === 100 ? 'bg-brutal-lima' : 'bg-sigeb-blue'} transition-all`}
                        style={{ width: `${pctProgreso}%` }}
                      />
                    </div>
                  </div>
                  <div className="h-[220px]">
                    <GraficaDona
                      data={[
                        { estado: 'Completados', cantidad: ingresados },
                        { estado: 'Pendientes', cantidad: Math.max(0, ev.totalCriterios - ingresados) },
                      ]}
                    />
                  </div>
                </div>

                {!ev.imparcialidadConfirmada ? (
                  <div className="mb-4 rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-3">
                    <p className="mb-2 font-mono text-sm font-bold text-brutal-rojo">
                      Antes de puntuar debes declarar que no tienes conflicto de
                      interés con esta solicitud.
                    </p>
                    <Button
                      onClick={() => confirmarImparcialidad(ev.solicitudId)}
                      disabled={guardando}
                    >
                      Confirmar imparcialidad
                    </Button>
                  </div>
                ) : (
                  <p className="mb-4 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-lima/30 px-3 py-2 font-mono text-sm font-bold text-brutal-tinta">
                    Declaración de imparcialidad confirmada.
                  </p>
                )}

                <div className="space-y-3">
                  {ev.criterios.map((criterio) => {
                    const marca = marcas[criterio.id];
                    return (
                      <div
                        key={criterio.id}
                        className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">
                              {criterio.nombre}
                            </p>
                            <p className="font-mono text-xs text-brutal-tinta/75">
                              Peso {(criterio.peso * 100).toFixed(0)}%
                            </p>
                          </div>
                          {criterio.completada && (
                            <span className="inline-flex items-center gap-1 rounded-brutal border-2 border-brutal-tinta bg-brutal-lima px-2 py-0.5 font-brut text-xs font-bold text-brutal-tinta">
                              <Icon name="check" className="h-3.5 w-3.5" />
                              Puntuado ({criterio.puntaje})
                            </span>
                          )}
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_0.5fr_auto]">
                          <Input
                            placeholder="Observaciones"
                            value={marca?.observaciones ?? ''}
                            onChange={(e) =>
                              setMarcas((m) => ({
                                ...m,
                                [criterio.id]: {
                                  ...(m[criterio.id] ?? { puntaje: '' }),
                                  observaciones: e.target.value,
                                },
                              }))
                            }
                          />
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="Puntaje (0-100)"
                            value={marca?.puntaje ?? ''}
                            onChange={(e) =>
                              setMarcas((m) => ({
                                ...m,
                                [criterio.id]: {
                                  ...(m[criterio.id] ?? { observaciones: '' }),
                                  puntaje: e.target.value,
                                },
                              }))
                            }
                          />
                          <Button
                            onClick={() => puntuar(ev.solicitudId, criterio)}
                            disabled={guardando || !ev.imparcialidadConfirmada}
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
              );
            })}
          </div>
        )}
      </Container>
    </>
  );
}
