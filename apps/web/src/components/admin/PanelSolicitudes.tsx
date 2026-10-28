'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import {
  formatearFecha,
  type Solicitud,
  type UsuarioSimplificado,
  type ScoreSolicitud,
} from '@/lib/api';

export function PanelSolicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[] | null>(null);
  const [evaluadores, setEvaluadores] = useState<UsuarioSimplificado[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('ENVIADA');
  const [asignando, setAsignando] = useState<Solicitud | null>(null);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreSolicitud>>({});
  const [quitarEvaluadorDe, setQuitarEvaluadorDe] = useState<{
    solicitudId: string;
    evaluadorId: string;
    nombre: string;
  } | null>(null);
  const [pidiendoCorreccion, setPidiendoCorreccion] = useState<Solicitud | null>(
    null,
  );
  const [comentarioCorreccion, setComentarioCorreccion] = useState('');
  const [pidiendoRechazo, setPidiendoRechazo] = useState<Solicitud | null>(null);
  const [pidiendoDevolver, setPidiendoDevolver] = useState<Solicitud | null>(null);
  const [ajustandoMonto, setAjustandoMonto] = useState<Solicitud | null>(null);
  const [montoNuevo, setMontoNuevo] = useState('');
  const [justificacionMonto, setJustificacionMonto] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [lista, catEvaluadores] = await Promise.all([
        fetchConToken<Solicitud[]>('/solicitudes'),
        fetchConToken<UsuarioSimplificado[]>('/seguridad/usuarios?rol=EVALUADOR'),
      ]);
      setSolicitudes(lista);
      setEvaluadores(catEvaluadores);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las solicitudes');
      // Sin esto la lista queda en `null` y la vista muestra el spinner para
      // siempre, tragándose el mensaje de error.
      setSolicitudes([]);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const verScore = async (id: string) => {
    try {
      const score = await fetchConToken<ScoreSolicitud>(`/solicitudes/${id}/score`);
      setScores((s) => ({ ...s, [id]: score }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo obtener el puntaje');
    }
  };

  const refrescarScore = async (id: string) => {
    try {
      const score = await fetchConToken<ScoreSolicitud>(`/solicitudes/${id}/score`);
      setScores((s) => ({ ...s, [id]: score }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo obtener el puntaje');
    }
  };

  const abrirAsignacion = (solicitud: Solicitud) => {
    setAsignando(solicitud);
    setSeleccionados([]);
    setError(null);
    setExito(null);
  };

  const asignar = async () => {
    if (!asignando || seleccionados.length === 0) {
      setError('Selecciona al menos un evaluador');
      return;
    }
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/solicitudes/${asignando.id}/evaluadores`, {
        method: 'POST',
        body: { evaluadorIds: seleccionados },
      });
      setExito(`Evaluadores asignados a la solicitud "${asignando.convocatoria?.nombre}".`);
      setAsignando(null);
      cargar();
      if (scores[asignando.id]) {
        const refresh = await fetchConToken<ScoreSolicitud>(
          `/solicitudes/${asignando.id}/score`,
        );
        setScores((s) => ({ ...s, [asignando.id]: refresh }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron asignar los evaluadores');
    } finally {
      setEnviando(false);
    }
  };

  const quitarEvaluador = async (
    solicitudId: string,
    evaluadorId: string,
    nombre: string,
  ) => {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/solicitudes/${solicitudId}/evaluadores/${evaluadorId}`, {
        method: 'DELETE',
      });
      setExito(`Evaluador ${nombre} removido de la solicitud.`);
      await refrescarScore(solicitudId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo quitar al evaluador');
    } finally {
      setEnviando(false);
    }
  };

  const solicitarCorreccion = async (solicitud: Solicitud) => {
    const comentario = comentarioCorreccion.trim() || undefined;
    setPidiendoCorreccion(null);
    setComentarioCorreccion('');
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/solicitudes/${solicitud.id}/solicitar-correccion`, {
        method: 'POST',
        body: { comentario },
      });
      setExito('Corrección solicitada al postulante.');
      cargar();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo solicitar la corrección',
      );
    } finally {
      setEnviando(false);
    }
  };

  /**
   * Aprobación. El API decide si la solicitud pasa directo a APROBADA o
   * queda pendiente de una segunda firma (por monto).
   */
  const aprobar = async (solicitud: Solicitud) => {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/solicitudes/${solicitud.id}/transicion`, {
        method: 'POST',
        body: { accion: 'aprobar' },
      });
      setExito('Solicitud aprobada.');
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo aprobar la solicitud');
    } finally {
      setEnviando(false);
    }
  };

  const aprobarSegunda = async (solicitud: Solicitud) => {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/solicitudes/${solicitud.id}/transicion`, {
        method: 'POST',
        body: { accion: 'aprobar_segunda' },
      });
      setExito('Solicitud aprobada en segunda instancia.');
      cargar();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo aprobar en segunda instancia',
      );
    } finally {
      setEnviando(false);
    }
  };

  const rechazar = async (solicitud: Solicitud, comentario: string) => {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/solicitudes/${solicitud.id}/transicion`, {
        method: 'POST',
        body: { accion: 'rechazar', comentario },
      });
      setExito('Solicitud rechazada.');
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo rechazar la solicitud');
    } finally {
      setEnviando(false);
    }
  };

  const devolverARevision = async (solicitud: Solicitud, comentario: string) => {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/solicitudes/${solicitud.id}/transicion`, {
        method: 'POST',
        body: { accion: 'devolver_a_revision', comentario },
      });
      setExito('Solicitud devuelta a revisión.');
      cargar();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo devolver a revisión',
      );
    } finally {
      setEnviando(false);
    }
  };

  const ajustarMonto = async (solicitud: Solicitud) => {
    const monto = Number(montoNuevo);
    if (!Number.isFinite(monto) || monto < 0) {
      setError('Escribe un monto válido (0 o mayor).');
      return;
    }
    if (justificacionMonto.trim().length < 10) {
      setError('Escribe la justificación del ajuste (mínimo 10 caracteres).');
      return;
    }
    setAjustandoMonto(null);
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/solicitudes/${solicitud.id}/monto`, {
        method: 'POST',
        body: { monto, justificacion: justificacionMonto.trim() },
      });
      setExito('Monto ajustado. Quedó registrado en la bitácora.');
      setMontoNuevo('');
      setJustificacionMonto('');
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo ajustar el monto');
    } finally {
      setEnviando(false);
    }
  };

  const marcarEvaluada = async (solicitud: Solicitud) => {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/solicitudes/${solicitud.id}/transicion`, {
        method: 'POST',
        body: { accion: 'evaluar' },
      });
      setExito('Solicitud marcada como evaluada.');
      cargar();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo marcar la solicitud como evaluada',
      );
    } finally {
      setEnviando(false);
    }
  };

  const iniciarRevision = async (solicitud: Solicitud) => {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/solicitudes/${solicitud.id}/transicion`, {
        method: 'POST',
        body: { accion: 'iniciar_revision' },
      });
      setExito('Revisión iniciada. Ya se le pueden asignar evaluadores.');
      cargar();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo iniciar la revisión',
      );
    } finally {
      setEnviando(false);
    }
  };
  if (!solicitudes) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  const filtradas = solicitudes.filter(
    (s) => filtroEstado === '' || s.estado === filtroEstado,
  );

  const toggleEvaluador = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">{error}</p>
      )}
      {exito && (
        <p className="mb-4 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-lima/30 p-4 text-sm font-bold text-brutal-tinta">{exito}</p>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          // "Todas" se renderiza como <option value=""> por el propio
          // componente Select (Select.tsx:47), por lo que se ofrece como
          // placeholder y no se duplica en `options`.
          placeholder="Todas"
          options={[
            { value: 'ENVIADA', label: 'Enviadas' },
            { value: 'EN_REVISION', label: 'En revisión' },
            { value: 'EVALUADA', label: 'Evaluadas' },
            { value: 'PENDIENTE_SEGUNDA_APROBACION', label: '2ª aprobación' },
            { value: 'APROBADA', label: 'Aprobadas' },
            { value: 'RECHAZADA', label: 'Rechazadas' },
            { value: 'BORRADOR', label: 'Borradores' },
          ]}
          aria-label="Filtrar por estado"
          className="w-56"
        />
      </div>

      {asignando && (
        <Card className="mb-6 border-[3px] border-brutal-tinta shadow-brutal-sm">
          <h3 className="mb-2 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
            Asignar evaluadores a la solicitud
          </h3>
          <p className="mb-4 font-mono text-sm text-brutal-tinta/80">
            {asignando.convocatoria?.nombre} · {asignando.convocatoria?.beca?.nombre}
          </p>
          {evaluadores.length === 0 ? (
            <p className="font-mono text-sm text-brutal-rojo">
              No hay usuarios con rol Evaluador registrados en el sistema.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {evaluadores.map((ev) => (
                <label
                  key={ev.id}
                  className="flex cursor-pointer items-center gap-2 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco px-3 py-2 font-mono text-sm text-brutal-tinta"
                >
                  <input
                    type="checkbox"
                    checked={seleccionados.includes(ev.id)}
                    onChange={() => toggleEvaluador(ev.id)}
                    className="h-4 w-4 accent-brutal-tinta"
                  />
                  <span>
                    {ev.nombres}
                    <span className="block text-xs text-brutal-tinta/75">{ev.email}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <Button onClick={asignar} disabled={enviando || evaluadores.length === 0}>
              {enviando ? 'Asignando…' : 'Asignar'}
            </Button>
            <Button variant="ghost" onClick={() => setAsignando(null)}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {filtradas.length === 0 ? (
        <EmptyState title="Sin solicitudes" description="No hay solicitudes en este estado." />
      ) : (
        <div className="space-y-4">
          {filtradas.map((solicitud) => {
            const score = scores[solicitud.id];
            return (
              <Card key={solicitud.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-brutal-tinta">
                        {solicitud.convocatoria?.beca?.nombre ?? 'Beca'}
                      </h3>
                      <Badge estado={solicitud.estado} />
                    </div>
                    <p className="text-sm text-brutal-tinta/70">{solicitud.convocatoria?.nombre}</p>
                    <p className="text-sm text-brutal-tinta/70">
                      Creada el {formatearFecha(solicitud.createdAt)} ·{' '}
                      {solicitud._count?.documentos ?? 0} documentos
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {score && score.completo && score.score != null && (
                      <span className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-lima px-3 py-1 font-brut text-sm font-bold text-brutal-tinta shadow-brutal-sm">
                        Puntaje: {score.score.toFixed(2)}
                      </span>
                    )}
                    <Button variant="ghost" onClick={() => verScore(solicitud.id)}>
                      {score ? 'Actualizar puntaje' : 'Ver puntaje'}
                    </Button>
                    {solicitud.estado === 'ENVIADA' && (
                      <Button onClick={() => iniciarRevision(solicitud)} disabled={enviando}>
                        Iniciar revisión
                      </Button>
                    )}
                    {solicitud.estado === 'EN_REVISION' && (
                      <Button onClick={() => abrirAsignacion(solicitud)}>
                        Asignar evaluadores
                      </Button>
                    )}
                    {solicitud.estado === 'EN_REVISION' && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setComentarioCorreccion('');
                          setPidiendoCorreccion(solicitud);
                        }}
                        disabled={enviando}
                      >
                        Solicitar corrección
                      </Button>
                    )}
                    {solicitud.estado === 'EN_REVISION' &&
                      score?.minimoAlcanzado && (
                        <Button
                          onClick={() => marcarEvaluada(solicitud)}
                          disabled={enviando}
                        >
                          Marcar evaluada
                        </Button>
                      )}
                    {solicitud.estado === 'EVALUADA' && (
                      <>
                        <Button
                          onClick={() => aprobar(solicitud)}
                          disabled={enviando}
                        >
                          Aprobar
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setComentarioCorreccion('');
                            setPidiendoRechazo(solicitud);
                          }}
                          disabled={enviando}
                        >
                          Rechazar
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setJustificacionMonto('');
                            setMontoNuevo(solicitud.montoOtorgable ?? '');
                            setAjustandoMonto(solicitud);
                          }}
                          disabled={enviando}
                        >
                          Ajustar monto
                        </Button>
                      </>
                    )}
                    {solicitud.estado === 'PENDIENTE_SEGUNDA_APROBACION' && (
                      <>
                        <span className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-gold px-3 py-1 font-brut text-xs font-bold uppercase text-brutal-tinta">
                          Segunda aprobación
                        </span>
                        <Button
                          onClick={() => aprobarSegunda(solicitud)}
                          disabled={enviando}
                        >
                          Aprobar (2ª instancia)
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setComentarioCorreccion('');
                            setPidiendoRechazo(solicitud);
                          }}
                          disabled={enviando}
                        >
                          Rechazar
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setComentarioCorreccion('');
                            setPidiendoDevolver(solicitud);
                          }}
                          disabled={enviando}
                        >
                          Devolver a revisión
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {solicitud.montoOtorgable != null && (
                  <p className="font-mono text-xs font-bold text-brutal-tinta/80">
                    Monto a otorgar: Q{solicitud.montoOtorgable}
                    {solicitud.montoOrigenCalculo
                      ? ` · origen: ${solicitud.montoOrigenCalculo}`
                      : ''}
                  </p>
                )}
                {score && (
                  <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-3">
                    <p className="mb-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">
                      Puntaje por evaluador
                    </p>
                    <p className="mb-3 font-mono text-xs font-bold text-brutal-tinta/80">
                      Evaluadores completos: {score.evaluadoresCompletos}/
                      {score.evaluadoresMinimos}{' '}
                      {score.minimoAlcanzado ? '· mínimo alcanzado' : '· mínimo pendiente'}
                    </p>
                    {score.evaluadores.length === 0 ? (
                      <p className="font-mono text-sm text-brutal-tinta/75">
                        Aún no hay evaluadores asignados.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {score.evaluadores.map((ev) => (
                          <div
                            key={ev.evaluador.id}
                            className="flex flex-wrap items-center justify-between gap-2 font-mono text-sm"
                          >
                            <span className="font-bold text-brutal-tinta">
                              {ev.evaluador.nombres}
                              <span className="text-brutal-tinta/75">
                                {' '}({ev.completados}/{ev.total})
                              </span>
                            </span>
                            <span className="flex items-center gap-2">
                              <span
                                className={
                                  ev.completo
                                    ? 'rounded-brutal border-2 border-brutal-tinta bg-brutal-lima px-2 py-0.5 font-bold text-brutal-tinta'
                                    : 'font-semibold text-brutal-tinta/75'
                                }
                              >
                                {ev.completo ? `${ev.score?.toFixed(2) ?? '—'}` : 'Pendiente'}
                              </span>
                              {solicitud.estado === 'EN_REVISION' && (
                                <Button
                                  variant="ghost"
                                  onClick={() =>
                                    setQuitarEvaluadorDe({
                                      solicitudId: solicitud.id,
                                      evaluadorId: ev.evaluador.id,
                                      nombre: ev.evaluador.nombres,
                                    })
                                  }
                                  disabled={enviando || ev.completados > 0}
                                >
                                  Quitar
                                </Button>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={quitarEvaluadorDe !== null}
        title="Quitar evaluador"
        description={
          quitarEvaluadorDe
            ? `Se quitará a ${quitarEvaluadorDe.nombre} de esta solicitud.`
            : undefined
        }
        confirmLabel="Quitar"
        tone="danger"
        onCancel={() => setQuitarEvaluadorDe(null)}
        onConfirm={() => {
          if (!quitarEvaluadorDe) return;
          const { solicitudId, evaluadorId, nombre } = quitarEvaluadorDe;
          setQuitarEvaluadorDe(null);
          void quitarEvaluador(solicitudId, evaluadorId, nombre);
        }}
      />

      {pidiendoCorreccion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brutal-tinta/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Solicitar corrección"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPidiendoCorreccion(null);
          }}
        >
          <Card className="w-full max-w-md">
            <h3 className="mb-2 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
              Solicitar corrección
            </h3>
            <p className="mb-4 text-sm text-brutal-tinta/75">
              La solicitud volverá al postulante para que corrija lo que indiques.
            </p>
            <Textarea
              label="Motivo de la corrección (opcional)"
              rows={3}
              value={comentarioCorreccion}
              onChange={(e) => setComentarioCorreccion(e.target.value)}
            />
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setPidiendoCorreccion(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => void solicitarCorreccion(pidiendoCorreccion)}
                disabled={enviando}
              >
                {enviando ? <Spinner /> : 'Solicitar corrección'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {(pidiendoRechazo || pidiendoDevolver) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brutal-tinta/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={
            pidiendoRechazo ? 'Rechazar solicitud' : 'Devolver a revisión'
          }
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPidiendoRechazo(null);
              setPidiendoDevolver(null);
            }
          }}
        >
          <Card className="w-full max-w-md">
            <h3 className="mb-2 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
              {pidiendoRechazo ? 'Rechazar solicitud' : 'Devolver a revisión'}
            </h3>
            <p className="mb-4 text-sm text-brutal-tinta/75">
              {pidiendoRechazo
                ? 'El postulante recibirá este motivo. Explica por qué no se aprueba.'
                : 'La solicitud vuelve a revisión para que el postulante la corrija. Explica qué debe corregir.'}
            </p>
            <Textarea
              label="Motivo (obligatorio)"
              rows={3}
              value={comentarioCorreccion}
              onChange={(e) => setComentarioCorreccion(e.target.value)}
            />
            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setPidiendoRechazo(null);
                  setPidiendoDevolver(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const comentario = comentarioCorreccion.trim();
                  if (!comentario) {
                    setError('Escribe el motivo: el postulante lo necesita.');
                    return;
                  }
                  const objetivo = pidiendoRechazo ?? pidiendoDevolver;
                  setPidiendoRechazo(null);
                  setPidiendoDevolver(null);
                  if (pidiendoRechazo) {
                    void rechazar(pidiendoRechazo, comentario);
                  } else if (objetivo) {
                    void devolverARevision(objetivo, comentario);
                  }
                }}
                disabled={enviando}
              >
                {enviando ? <Spinner /> : 'Confirmar'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {ajustandoMonto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brutal-tinta/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Ajustar monto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAjustandoMonto(null);
          }}
        >
          <Card className="w-full max-w-md">
            <h3 className="mb-2 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
              Ajustar monto
            </h3>
            <p className="mb-4 text-sm text-brutal-tinta/75">
              El ajuste queda registrado en la bitácora con tu justificación.
              Si el monto supera Q10,000 la solicitud seguirá requiriendo una
              segunda aprobación.
            </p>
            <div className="space-y-3">
              <Input
                label="Monto a otorgar (Q)"
                type="number"
                min={0}
                step="0.01"
                value={montoNuevo}
                onChange={(e) => setMontoNuevo(e.target.value)}
                placeholder={
                  ajustandoMonto.montoOtorgable ?? '0.00'
                }
              />
              <Textarea
                label="Justificación (obligatoria)"
                rows={3}
                value={justificacionMonto}
                onChange={(e) => setJustificacionMonto(e.target.value)}
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setAjustandoMonto(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => void ajustarMonto(ajustandoMonto)}
                disabled={enviando}
              >
                {enviando ? <Spinner /> : 'Guardar ajuste'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
