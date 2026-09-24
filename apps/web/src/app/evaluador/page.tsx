'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { fetchConToken } from '@/lib/api-auth';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { InternalPageHeader } from '@/components/ui/InternalPageHeader';

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
    convocatoria: { nombre: string; beca: { nombre: string } };
    usuario: { nombres: string; cui: string };
  };
  criterios: Criterio[];
  totalCriterios: number;
  completados: number;
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
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
        )}
        {exito && (
          <p className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{exito}</p>
        )}

        {!evaluaciones ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : evaluaciones.length === 0 ? (
          <Card className="text-center">
            <p className="text-lg font-semibold text-sigeb-blue-dark">
              No tienes evaluaciones asignadas
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Cuando te asignen solicitudes para evaluar aparecerán aquí.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {evaluaciones.map((ev) => (
              <Card key={ev.solicitudId}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-bold text-sigeb-blue-dark">
                        {ev.solicitud.convocatoria.beca.nombre}
                      </h2>
                      <Badge estado={ev.solicitud.estado} />
                    </div>
                    <p className="text-sm text-gray-600">
                      {ev.solicitud.convocatoria.nombre}
                    </p>
                    <p className="text-sm text-gray-500">
                      Postulante: {ev.solicitud.usuario.nombres} (CUI{' '}
                      {ev.solicitud.usuario.cui})
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-sigeb-blue-dark">
                    {ev.completados}/{ev.totalCriterios} completados
                  </span>
                </div>

                <div className="space-y-3">
                  {ev.criterios.map((criterio) => {
                    const marca = marcas[criterio.id];
                    return (
                      <div
                        key={criterio.id}
                        className="rounded-lg border border-gray-200 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sigeb-blue-dark">
                              {criterio.nombre}
                            </p>
                            <p className="text-xs text-gray-500">
                              Peso {(criterio.peso * 100).toFixed(0)}%
                            </p>
                          </div>
                          {criterio.completada && (
                            <span className="text-sm font-semibold text-green-700">
                              ✓ Puntuado ({criterio.puntaje})
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
                            disabled={guardando}
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
