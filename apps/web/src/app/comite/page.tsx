'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { fetchConToken } from '@/lib/api-auth';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { InternalPageHeader } from '@/components/ui/InternalPageHeader';
import { formatearFecha, type Sesion, type SesionDetalle } from '@/lib/api';

const VOTO_OPCIONES = ['APROBAR', 'RECHAZAR', 'ABSTENCION'] as const;

export default function ComitePage() {
  return (
    <ProtectedRoute roles={['MIEMBRO_COMITE']}>
      <ComiteContent />
    </ProtectedRoute>
  );
}

function ComiteContent() {
  const [sesiones, setSesiones] = useState<Sesion[] | null>(null);
  const [detalle, setDetalle] = useState<SesionDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [marcas, setMarcas] = useState<
    Record<string, { voto: string; observaciones: string }>
  >({});

  const cargar = useCallback(async () => {
    try {
      const lista = await fetchConToken<Sesion[]>('/sesiones');
      setSesiones(lista);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las sesiones');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrirDetalle = async (id: string) => {
    setError(null);
    setExito(null);
    try {
      const det = await fetchConToken<SesionDetalle>(`/sesiones/${id}`);
      setDetalle(det);
      setMarcas({});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la sesión');
    }
  };

  const votar = async (sesionId: string, solicitudId: string) => {
    const marca = marcas[solicitudId];
    if (!marca?.voto) {
      setError('Selecciona una opción de voto');
      return;
    }
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/sesiones/${sesionId}/votos`, {
        method: 'POST',
        body: {
          solicitudId,
          voto: marca.voto,
          observaciones: marca.observaciones || undefined,
        },
      });
      setExito('Voto registrado.');
      abrirDetalle(sesionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar el voto');
    } finally {
      setEnviando(false);
    }
  };

  const programadas = (sesiones ?? []).filter((s) => s.estado === 'PROGRAMADA');

  const yaVoto = (solicitudId: string): boolean =>
    !!detalle?.votos.some((v) => v.solicitud?.id === solicitudId);

  return (
    <>
      <InternalPageHeader
        title="Votación del comité"
        subtitle="Participa en las sesiones activas y registra tu voto."
      />

      <Container className="py-8">
        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
        )}
        {exito && (
          <p className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{exito}</p>
        )}

        {!sesiones ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : (
          <>
            {detalle && (
              <Card className="mb-6 border-2 border-sigeb-blue">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-sigeb-blue-dark">
                      {detalle.comite?.nombre}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatearFecha(detalle.fecha)} · {detalle.lugar ?? 'Sin lugar'}
                    </p>
                  </div>
                  <Button variant="ghost" onClick={() => setDetalle(null)}>
                    Volver
                  </Button>
                </div>

                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Agenda de votación ({detalle.agenda.length})
                </p>
                {detalle.agenda.length === 0 ? (
                  <p className="text-sm text-gray-500">La sesión no tiene solicitudes en agenda.</p>
                ) : (
                  <div className="space-y-3">
                    {detalle.agenda.map((item) => {
                      const votado = yaVoto(item.solicitud.id);
                      const marca = marcas[item.solicitud.id];
                      return (
                        <div key={item.id} className="rounded-lg border border-gray-200 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sigeb-blue-dark">
                                {item.solicitud.usuario.nombres}
                              </p>
                              <p className="text-xs text-gray-500">CUI {item.solicitud.usuario.cui}</p>
                            </div>
                            {votado && (
                              <span className="text-sm font-semibold text-green-700">✓ Votado</span>
                            )}
                          </div>
                          {votado ? (
                            <p className="mt-2 text-sm text-gray-600">
                              Tu voto quedó registrado para esta solicitud.
                            </p>
                          ) : (
                            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_0.4fr_auto]">
                              <Input
                                placeholder="Observaciones (opcional)"
                                value={marca?.observaciones ?? ''}
                                onChange={(e) =>
                                  setMarcas((m) => ({
                                    ...m,
                                    [item.solicitud.id]: {
                                      voto: m[item.solicitud.id]?.voto ?? '',
                                      observaciones: e.target.value,
                                    },
                                  }))
                                }
                              />
                              <Select
                                value={marca?.voto ?? ''}
                                onChange={(e) =>
                                  setMarcas((m) => ({
                                    ...m,
                                    [item.solicitud.id]: {
                                      voto: e.target.value,
                                      observaciones: m[item.solicitud.id]?.observaciones ?? '',
                                    },
                                  }))
                                }
                                options={VOTO_OPCIONES.map((v) => ({
                                  value: v,
                                  label: v,
                                }))}
                                placeholder="Voto"
                              />
                              <Button
                                onClick={() => votar(detalle.id, item.solicitud.id)}
                                disabled={enviando}
                              >
                                Emitir
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}

            {!detalle &&
              (programadas.length === 0 ? (
                <EmptyState
                  title="Sin sesiones activas"
                  description="No hay sesiones en estado programada en las que votar."
                />
              ) : (
                <div className="space-y-4">
                  {programadas.map((sesion) => (
                    <Card
                      key={sesion.id}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-sigeb-blue-dark">
                            {sesion.comite?.nombre}
                          </h3>
                          <Badge estado={sesion.estado} />
                        </div>
                        <p className="text-sm text-gray-600">{formatearFecha(sesion.fecha)}</p>
                        <p className="text-sm text-gray-500">
                          {sesion._count?.agenda ?? 0} solicitudes a votar
                        </p>
                      </div>
                      <Button onClick={() => abrirDetalle(sesion.id)}>
                        Votar
                      </Button>
                    </Card>
                  ))}
                </div>
              ))}
          </>
        )}
      </Container>
    </>
  );
}
