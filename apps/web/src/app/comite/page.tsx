'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { fetchConToken } from '@/lib/api-auth';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { InternalPageHeader } from '@/components/ui/InternalPageHeader';
import { formatearFecha, type Sesion, type SesionDetalle } from '@/lib/api';

const VOTO_OPCIONES = ['APROBAR', 'RECHAZAR', 'ABSTENCION'] as const;
type OpcionVoto = (typeof VOTO_OPCIONES)[number];

const estiloVoto: Record<OpcionVoto, string> = {
  APROBAR: 'border-brutal-tinta bg-brutal-lima text-brutal-tinta',
  RECHAZAR: 'border-brutal-tinta bg-brutal-rojo text-brutal-tinta',
  ABSTENCION: 'border-brutal-tinta bg-gray-300 text-brutal-tinta',
};

const VOTO_LABEL: Record<OpcionVoto, string> = {
  APROBAR: 'Aprobar',
  RECHAZAR: 'Rechazar',
  ABSTENCION: 'Abstensión',
};

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

  const miVoto = (solicitudId: string): string | undefined =>
    detalle?.votos.find((v) => v.solicitud?.id === solicitudId)?.voto;

  const votantesUnicos = detalle
    ? new Set(detalle.votos.map((v) => v.usuario?.id)).size
    : 0;
  const quorumMin = detalle?.quorumMinimo ?? 1;
  const quorumPct = Math.min(
    100,
    Math.round((votantesUnicos / quorumMin) * 100),
  );
  const quorumOk = votantesUnicos >= quorumMin;

  const conteoVotos = (solicitudId: string): Record<OpcionVoto, number> => {
    const base: Record<OpcionVoto, number> = {
      APROBAR: 0,
      RECHAZAR: 0,
      ABSTENCION: 0,
    };
    if (!detalle) return base;
    for (const v of detalle.votos) {
      if (v.solicitud?.id !== solicitudId) continue;
      const opcion = VOTO_OPCIONES.find((o) => v.voto === o);
      if (opcion) base[opcion] += 1;
    }
    return base;
  };

  return (
    <>
      <InternalPageHeader
        title="Votación del comité"
        subtitle="Participa en las sesiones activas y registra tu voto."
      />

      <Container className="py-8">
        {error && (
          <p className="mb-4 rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">{error}</p>
        )}
        {exito && (
          <p className="mb-4 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-lima/30 p-4 text-sm font-bold text-brutal-tinta">{exito}</p>
        )}

        {!sesiones ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : (
          <>
            {detalle && (
              <Card className="mb-6 border-[3px] border-brutal-tinta shadow-brutal-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
                      {detalle.comite?.nombre}
                    </h3>
                    <p className="font-mono text-sm text-brutal-tinta/80">
                      {formatearFecha(detalle.fecha)} · {detalle.lugar ?? 'Sin lugar'}
                    </p>
                  </div>
                  <Button variant="ghost" onClick={() => setDetalle(null)}>
                    Volver
                  </Button>
                </div>

                <div className="mb-5 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-4">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">
                      Quórum de la sesión
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brutal-tinta">
                        {votantesUnicos}/{quorumMin} votante(s)
                        {detalle.miembros != null &&
                          ` de ${detalle.miembros} miembro(s)`}
                      </span>
                      <Badge estado={quorumOk ? 'APROBAR' : 'PENDIENTE'} />
                    </div>
                  </div>
                  <div className="h-3 w-full rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco">
                    <div
                      className={`h-full rounded-brutal transition-all ${quorumOk ? 'bg-brutal-lima' : 'bg-brutal-naranja'}`}
                      style={{ width: `${quorumPct}%` }}
                    />
                  </div>
                  {!quorumOk && (
                    <p className="mt-2 font-mono text-xs text-brutal-naranja">
                      Faltan {quorumMin - votantesUnicos} voto(s) para alcanzar
                      el quórum.
                    </p>
                  )}
                </div>

                <p className="mb-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">
                  Agenda de votación ({detalle.agenda.length})
                </p>
                {detalle.agenda.length === 0 ? (
                  <p className="text-sm text-brutal-tinta/75">La sesión no tiene solicitudes en agenda.</p>
                ) : (
                  <div className="space-y-3">
                    {detalle.agenda.map((item) => {
                      const votado = yaVoto(item.solicitud.id);
                      const marca = marcas[item.solicitud.id];
                      const conteo = conteoVotos(item.solicitud.id);
                      return (
                        <div key={item.id} className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">
                                {item.solicitud.usuario.nombres}
                              </p>
                              <p className="font-mono text-xs text-brutal-tinta/75">CUI {item.solicitud.usuario.cui}</p>
                            </div>
                            {votado ? (
                              <span className="inline-flex items-center gap-1 rounded-brutal border-2 border-brutal-tinta bg-brutal-lima px-2 py-0.5 font-brut text-xs font-bold text-brutal-tinta">
                                <Icon name="check" className="h-3.5 w-3.5" />
                                Votado · {VOTO_LABEL[miVoto(item.solicitud.id) as OpcionVoto] ?? miVoto(item.solicitud.id)}
                              </span>
                            ) : (
                              <span className="rounded-brutal border-2 border-brutal-tinta bg-gray-200 px-2 py-0.5 font-brut text-xs font-bold text-brutal-tinta">
                                Sin votar
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {VOTO_OPCIONES.map((opcion) => (
                              <button
                                key={opcion}
                                type="button"
                                disabled={votado || enviando}
                                onClick={() =>
                                  setMarcas((m) => ({
                                    ...m,
                                    [item.solicitud.id]: {
                                      ...(m[item.solicitud.id] ?? { observaciones: '' }),
                                      voto: opcion,
                                    },
                                  }))
                                }
                                className={`rounded-brutal border-[3px] px-4 py-2 font-brut text-sm font-bold uppercase tracking-wide shadow-brutal-sm transition-all disabled:opacity-50 ${
                                  estiloVoto[opcion]
                                } ${
                                  marca?.voto === opcion
                                    ? 'translate-x-[1px] translate-y-[1px] shadow-none ring-2 ring-brutal-tinta'
                                    : 'hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                                }`}
                              >
                                {VOTO_LABEL[opcion]}{' '}
                                <span className="font-mono text-xs">
                                  ({conteo[opcion]})
                                </span>
                              </button>
                            ))}
                          </div>

                          {!votado && (
                            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
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
                              <Button
                                onClick={() => votar(detalle.id, item.solicitud.id)}
                                disabled={enviando || !marca?.voto}
                              >
                                Emitir voto
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
                  {programadas.map((sesion) => {
                    const quorum = sesion.quorumMinimo ?? 1;
                    const votantes = sesion.votantes ?? 0;
                    const pct = Math.min(100, Math.round((votantes / quorum) * 100));
                    const ok = votantes >= quorum;
                    return (
                      <Card
                        key={sesion.id}
                        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-bold text-brutal-tinta">
                              {sesion.comite?.nombre}
                            </h3>
                            <Badge estado={sesion.estado} />
                          </div>
                          <p className="text-sm text-brutal-tinta/70">{formatearFecha(sesion.fecha)}</p>
                          <p className="text-sm text-brutal-tinta/70">
                            {sesion._count?.agenda ?? 0} solicitudes a votar
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <div className="w-40">
                              <div className="mb-0.5 flex justify-between font-mono text-[11px] font-bold text-brutal-tinta">
                                <span>Quórum</span>
                                <span>
                                  {votantes}/{quorum}
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-brutal border-2 border-brutal-tinta bg-brutal-papel">
                                <div
                                  className={`h-full rounded-brutal ${ok ? 'bg-brutal-lima' : 'bg-brutal-naranja'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                            <span className="font-mono text-[11px] font-bold text-brutal-tinta">
                              {ok ? 'Quórum alcanzado' : 'Quórum pendiente'}
                            </span>
                          </div>
                        </div>
                        <Button onClick={() => abrirDetalle(sesion.id)}>
                          Votar
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              ))}
          </>
        )}
      </Container>
    </>
  );
}