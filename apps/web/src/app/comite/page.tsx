'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { fetchConToken } from '@/lib/api-auth';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Select } from '@/components/ui/Select';
import { InternalPageHeader } from '@/components/ui/InternalPageHeader';
import { formatearFecha, type Sesion, type SesionDetalle } from '@/lib/api';
import { AvisoDialog } from '@/components/ui/AvisoDialog';

const VOTO_OPCIONES = ['APROBAR', 'RECHAZAR', 'ABSTENCION'] as const;
type OpcionVoto = (typeof VOTO_OPCIONES)[number];

const estiloVoto: Record<OpcionVoto, string> = {
  APROBAR: 'border-brutal-tinta bg-brutal-lima text-brutal-tinta',
  RECHAZAR: 'border-brutal-tinta bg-brutal-rojo text-brutal-papel',
  ABSTENCION: 'border-brutal-tinta bg-gray-300 text-brutal-tinta',
};

const VOTO_LABEL: Record<OpcionVoto, string> = {
  APROBAR: 'Aprobar',
  RECHAZAR: 'Rechazar',
  ABSTENCION: 'Abstención',
};

export default function ComitePage() {
  return (
    <ProtectedRoute roles={['MIEMBRO_COMITE']}>
      <ComiteContent />
    </ProtectedRoute>
  );
}

/**
 * Panel del comité.
 *
 * El miembro ve las sesiones de sus propios comités, con su quórum y el
 * estado de cada una. En una sesión abierta puede emitir su voto; en una
 * cerrada ve el resultado, pero no puede volver a votar.
 */
function ComiteContent() {
  const { usuario } = useAuth();
  const miId = usuario?.id ?? '';
  const [sesiones, setSesiones] = useState<Sesion[] | null>(null);
  const [detalle, setDetalle] = useState<SesionDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [marcas, setMarcas] = useState<
    Record<string, { voto: string; observaciones: string }>
  >({});

  const cargar = useCallback(async () => {
    try {
      const lista = await fetchConToken<Sesion[]>('/sesiones/mias');
      setSesiones(lista);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las sesiones');
      setSesiones([]);
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
      await abrirDetalle(sesionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar el voto');
    } finally {
      setEnviando(false);
    }
  };

  const visibles = (sesiones ?? []).filter(
    (s) => filtroEstado === '' || s.estado === filtroEstado,
  );
  const hayAbiertas = visibles.some((s) => s.estado === 'PROGRAMADA');
  const cerrada = detalle?.estado === 'FINALIZADA';

  /** ¿Este usuario ya votó esta solicitud? (no el conteo de los demás) */
  const yaVoto = (solicitudId: string): boolean =>
    !!detalle?.votos.some(
      (v) => v.usuario?.id === miId && v.solicitud?.id === solicitudId,
    );

  /** El voto propio, no el de otra persona. */
  const miVoto = (solicitudId: string): string | undefined =>
    detalle?.votos.find(
      (v) => v.usuario?.id === miId && v.solicitud?.id === solicitudId,
    )?.voto;

  const votantesUnicos = detalle
    ? new Set(detalle.votos.map((v) => v.usuario?.id)).size
    : 0;
  const quorumMin = detalle?.quorumMinimo ?? 1;
  const quorumPct = Math.min(
    100,
    Math.round((votantesUnicos / quorumMin) * 100),
  );
  const quorumOk = votantesUnicos >= quorumMin;

  /**
   * Conteo de votos de los demás. Mientras la sesión está abierta no se
   * muestra: nadie debe saber cómo va la votación antes de emitir su voto.
   */
  const conteoVotos = (solicitudId: string): Record<OpcionVoto, number> => {
    const base: Record<OpcionVoto, number> = {
      APROBAR: 0,
      RECHAZAR: 0,
      ABSTENCION: 0,
    };
    if (!detalle || !cerrada) return base;
    for (const v of detalle.votos) {
      if (v.solicitud?.id !== solicitudId) continue;
      const opcion = VOTO_OPCIONES.find((o) => v.voto === o);
      if (opcion) base[opcion] += 1;
    }
    return base;
  };

  const decisionDe = (solicitudId: string) =>
    detalle?.decisiones?.find((d) => d.solicitudId === solicitudId);

  return (
    <>
      <InternalPageHeader
        title="Votación del comité"
        subtitle="Participa en las sesiones de tus comités y registra tu voto."
      />

      <Container className="py-8">
        <AvisoDialog
        open={!!error || !!exito}
        titulo={error ? 'No se pudo completar la acción' : 'Listo'}
        tono={error ? 'error' : 'exito'}
        mensaje={error ?? exito ?? ''}
        onCerrar={() => {
          setError(null);
          setExito(null);
        }}
      />
        

        {!sesiones ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : (
          <>
            {detalle && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Detalle de la sesión"
                className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brutal-tinta/60 p-4"
              >
                <button
                  type="button"
                  aria-label="Cerrar sesión"
                  onClick={() => setDetalle(null)}
                  className="absolute inset-0 h-full w-full cursor-default"
                  tabIndex={-1}
                />
                <Card className="relative my-8 w-full max-w-3xl">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
                        {detalle.comite?.nombre}
                      </h3>
                      <p className="font-mono text-sm text-brutal-tinta/80">
                        {formatearFecha(detalle.fecha)} · {detalle.lugar ?? 'Sin lugar'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge estado={detalle.estado} />
                      <Button variant="ghost" onClick={() => setDetalle(null)}>
                        Cerrar
                      </Button>
                    </div>
                  </div>

                  <div className="mb-5 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-4">
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <p className="font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">
                        Quórum de la sesión
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brutal-tinta">
                          {votantesUnicos}/{quorumMin}{' '}
                          {votantesUnicos === 1 ? 'votante' : 'votantes'}
                          {detalle.miembros != null &&
                            ` de ${detalle.miembros} ${detalle.miembros === 1 ? 'miembro' : 'miembros'}`}
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
                      <p className="mt-2 font-mono text-xs font-bold text-brutal-gold-dark">
                        Faltan {quorumMin - votantesUnicos}{' '}
                        {quorumMin - votantesUnicos === 1 ? 'voto' : 'votos'} para alcanzar
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
                        const decision = decisionDe(item.solicitud.id);
                        return (
                          <div key={item.id} className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">
                                  {item.solicitud.usuario.nombres}
                                </p>
                                <p className="font-mono text-xs text-brutal-tinta/75">
                                  CUI {item.solicitud.usuario.cui} · Solicitud{' '}
                                  {item.solicitud.id.slice(0, 8)}
                                </p>
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

                            {decision && (
                              <p className="mt-2 font-mono text-xs font-bold text-brutal-tinta">
                                Decisión del comité: {decision.resultado}
                              </p>
                            )}

                            {!cerrada && (
                              <>
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
                                      {VOTO_LABEL[opcion]}
                                      {cerrada && (
                                        <span className="font-mono text-xs">
                                          ({conteo[opcion]})
                                        </span>
                                      )}
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
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {!detalle && (
              <>
                <div className="mb-6">
                  <Select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    aria-label="Filtrar sesiones por estado"
                    placeholder="Todas"
                    options={[
                      { value: 'PROGRAMADA', label: 'Programadas' },
                      { value: 'FINALIZADA', label: 'Finalizadas' },
                    ]}
                    className="w-56"
                  />
                </div>

                {visibles.length === 0 ? (
                  <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-6 text-center shadow-brutal">
                    <p className="text-lg font-bold text-brutal-tinta">
                      {hayAbiertas
                        ? 'No hay sesiones activas'
                        : 'No tienes sesiones en este estado'}
                    </p>
                    <p className="mt-1 text-sm text-brutal-tinta/70">
                      Cuando te asignen a una sesión aparecerá aquí.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visibles.map((sesion) => {
                      const quorum = sesion.quorumMinimo ?? 1;
                      const votantes = sesion.votantes ?? 0;
                      const pct = Math.min(100, Math.round((votantes / quorum) * 100));
                      const ok = votantes >= quorum;
                      const abierta = sesion.estado === 'PROGRAMADA';
                      return (
                        <Card key={sesion.id} data-sesion-id={sesion.id} className="flex flex-col gap-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-bold text-brutal-tinta">
                                  {sesion.comite?.nombre}
                                </h3>
                                <Badge estado={sesion.estado} />
                              </div>
                              <p className="font-mono text-xs text-brutal-tinta/75">
                                {formatearFecha(sesion.fecha)} · {sesion.lugar ?? 'Sin lugar'} ·{' '}
                                {sesion._count?.agenda ?? 0} en agenda
                              </p>
                            </div>
                            <div className="w-full max-w-[220px]">
                              <div className="mb-1 flex justify-between font-mono text-xs font-bold text-brutal-tinta">
                                <span>Quórum</span>
                                <span>
                                  {votantes}/{quorum}
                                </span>
                              </div>
                              <div className="h-3 w-full rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco">
                                <div
                                  className={`h-full rounded-brutal ${ok ? 'bg-brutal-lima' : 'bg-brutal-naranja'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            <Button onClick={() => abrirDetalle(sesion.id)}>
                              {abierta ? 'Votar' : 'Ver resultado'}
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Container>
    </>
  );
}
