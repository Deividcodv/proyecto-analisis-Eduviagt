'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchConToken, verDocumento } from '@/lib/api-auth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type {
  Desembolso,
  ScoreSolicitud,
  SolicitudChecklist,
  SolicitudDetalle,
} from '@/lib/api';
import {
  ETIQUETA_DESEMBOLSO,
  ETIQUETA_METODO_PAGO,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FormularioDesembolso } from './FormularioDesembolso';
import { AvisoDialog } from '@/components/ui/AvisoDialog';

interface Props {
  solicitudId: string;
  onCerrar: () => void;
}

/**
 * Detalle de una postulación para el personal.
 *
 * La lista muestra solo la información general (código y persona); aquí está
 * lo demás: la beca, el monto a otorgar, las fechas de la convocatoria, los
 * perfiles, las respuestas del formulario, los documentos que adjuntó el
 * postulante y los puntajes de los evaluadores.
 */
export function DetalleSolicitudRevision({ solicitudId, onCerrar }: Props) {
  const [detalle, setDetalle] = useState<SolicitudDetalle | null>(null);
  const [checklist, setChecklist] = useState<SolicitudChecklist | null>(null);
  const [score, setScore] = useState<ScoreSolicitud | null>(null);
  const [desembolso, setDesembolso] = useState<Desembolso | null>(null);
  const [editandoPago, setEditandoPago] = useState(false);
  const [guardandoPago, setGuardandoPago] = useState(false);
  const { usuario } = useAuth();
  const puedeGestionar =
    (usuario?.rol ?? '').toUpperCase() === 'ADMIN' ||
    (usuario?.rol ?? '').toUpperCase() === 'JEFE_BECAS';
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const cargar = useCallback(async () => {
    setError(null);
    // Cada recurso se resuelve por separado: que el score no esté
    // disponible (falta permiso) no puede dejar el detalle en blanco.
    const [resDetalle, resChecklist, resScore, resPago] = await Promise.allSettled([
      fetchConToken<SolicitudDetalle>(`/solicitudes/${solicitudId}`),
      fetchConToken<SolicitudChecklist>(`/solicitudes/${solicitudId}/checklist`),
      fetchConToken<ScoreSolicitud>(`/solicitudes/${solicitudId}/score`),
      fetchConToken<Desembolso | null>(`/solicitudes/${solicitudId}/desembolso`),
    ]);

    if (resDetalle.status === 'fulfilled') {
      setDetalle(resDetalle.value);
    } else {
      setDetalle(null);
      setError(
        resDetalle.reason instanceof Error
          ? resDetalle.reason.message
          : 'No se pudo cargar el detalle de la solicitud',
      );
    }

    if (resChecklist.status === 'fulfilled') {
      setChecklist(resChecklist.value);
    } else {
      setChecklist(null);
    }

    if (resScore.status === 'fulfilled') {
      setScore(resScore.value);
    } else {
      setScore(null);
    }

    if (resPago.status === 'fulfilled') {
      setDesembolso(resPago.value);
    } else {
      setDesembolso(null);
    }
  }, [solicitudId]);

  const guardarPago = async (datos: Record<string, unknown>) => {
    setGuardandoPago(true);
    try {
      const guardado = await fetchConToken<Desembolso>(
        `/solicitudes/${solicitudId}/desembolso`,
        { method: 'PATCH', body: datos },
      );
      setDesembolso(guardado);
      setEditandoPago(false);
      await cargar();
    } finally {
      setGuardandoPago(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alPulsar);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', alPulsar);
  }, [onCerrar]);

  const descargar = async (documentoId: string) => {
    setError(null);
    try {
      await verDocumento(solicitudId, documentoId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo abrir el documento');
    }
  };

  const montoAOtorgar =
    detalle?.montoOtorgable ?? detalle?.convocatoria?.montoBase ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brutal-tinta/60 p-4">
      <button
        type="button"
        aria-label="Cerrar detalle"
        onClick={onCerrar}
        className="absolute inset-0 h-full w-full cursor-default"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de la solicitud"
        tabIndex={-1}
        className="relative my-8 w-full max-w-3xl rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-5 shadow-brutal-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-brut text-xl font-black uppercase tracking-wide text-brutal-tinta">
              Detalle de la solicitud
            </h2>
            {detalle && (
              <p className="font-mono text-xs text-brutal-tinta/70">
                Solicitud <span className="font-bold">{detalle.id.slice(0, 8)}</span>
              </p>
            )}
          </div>
          <Button variant="ghost" onClick={onCerrar}>
            Cerrar
          </Button>
        </div>

        <AvisoDialog
        open={!!error}
        titulo="No se pudo completar la acción"
        tono="error"
        mensaje={error ?? ''}
        onCerrar={() => {
          setError(null);
        }}
      />

        {!detalle ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-5">
            <section className="rounded-brutal border-2 border-brutal-tinta/30 p-3">
              <h3 className="mb-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta/80">
                Postulación
              </h3>
              <dl className="grid gap-1 font-mono text-xs text-brutal-tinta/85 sm:grid-cols-2">
                <div className="flex justify-between gap-2">
                  <dt className="text-brutal-tinta/60">Postulante</dt>
                  <dd className="font-bold">{detalle.usuario?.nombres ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brutal-tinta/60">CUI</dt>
                  <dd className="font-bold">{detalle.usuario?.cui ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brutal-tinta/60">Estado</dt>
                  <dd>
                    <Badge estado={detalle.estado} />
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brutal-tinta/60">Enviada</dt>
                  <dd className="font-bold">
                    {new Date(detalle.createdAt).toLocaleDateString('es-GT')}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brutal-tinta/60">Beca</dt>
                  <dd className="text-right font-bold">
                    {detalle.convocatoria?.beca?.nombre ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brutal-tinta/60">Convocatoria</dt>
                  <dd className="text-right font-bold">
                    {detalle.convocatoria?.nombre ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brutal-tinta/60">Apertura</dt>
                  <dd className="font-bold">
                    {detalle.convocatoria?.fechaApertura
                      ? new Date(detalle.convocatoria.fechaApertura).toLocaleDateString('es-GT')
                      : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brutal-tinta/60">Cierre</dt>
                  <dd className="font-bold">
                    {detalle.convocatoria?.fechaCierre
                      ? new Date(detalle.convocatoria.fechaCierre).toLocaleDateString('es-GT')
                      : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brutal-tinta/60">Monto a otorgar</dt>
                  <dd className="font-bold">
                    {montoAOtorgar ? `Q${montoAOtorgar}` : 'Por calcular'}
                  </dd>
                </div>
                {detalle.montoAprobado && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-brutal-tinta/60">Monto aprobado</dt>
                    <dd className="font-bold">Q{detalle.montoAprobado}</dd>
                  </div>
                )}
              </dl>
            </section>

            {(detalle.perfilAcademico || detalle.perfilFinanciero) && (
              <section className="rounded-brutal border-2 border-brutal-tinta/30 p-3">
                <h3 className="mb-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta/80">
                  Perfiles
                </h3>
                <dl className="grid gap-1 font-mono text-xs text-brutal-tinta/85 sm:grid-cols-2">
                  {detalle.perfilAcademico?.institucion && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-brutal-tinta/60">Institución</dt>
                      <dd className="font-bold">{detalle.perfilAcademico.institucion}</dd>
                    </div>
                  )}
                  {detalle.perfilAcademico?.carrera && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-brutal-tinta/60">Carrera</dt>
                      <dd className="font-bold">{detalle.perfilAcademico.carrera}</dd>
                    </div>
                  )}
                  {detalle.perfilAcademico?.promedio != null && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-brutal-tinta/60">Promedio</dt>
                      <dd className="font-bold">{detalle.perfilAcademico.promedio}</dd>
                    </div>
                  )}
                  {detalle.perfilFinanciero?.ingresoFamiliar != null && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-brutal-tinta/60">Ingreso familiar</dt>
                      <dd className="font-bold">
                        Q{detalle.perfilFinanciero.ingresoFamiliar}
                      </dd>
                    </div>
                  )}
                  {detalle.perfilFinanciero?.numeroDependientes != null && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-brutal-tinta/60">Dependientes</dt>
                      <dd className="font-bold">
                        {detalle.perfilFinanciero.numeroDependientes}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            <section className="rounded-brutal border-2 border-brutal-tinta/30 p-3">
              <h3 className="mb-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta/80">
                Documentos
              </h3>
              {checklist && checklist.documentos.length > 0 ? (
                <ul className="space-y-1">
                  {checklist.documentos.map((doc) => (
                    <li
                      key={doc.documentoTipoId}
                      className="flex items-center justify-between gap-2 font-mono text-xs"
                    >
                      <span className="text-brutal-tinta/80">{doc.nombre}</span>
                      {doc.cargado && doc.documentoId ? (
                        <Button variant="ghost" onClick={() => descargar(doc.documentoId!)}>
                          Descargar
                        </Button>
                      ) : (
                        <span className="text-brutal-tinta/50">no cargado</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-mono text-xs text-brutal-tinta/60">
                  La postulación no tiene documentos adjuntos.
                </p>
              )}
            </section>

            {score && score.evaluadores.length > 0 && (
              <section className="rounded-brutal border-2 border-brutal-tinta/30 p-3">
                <h3 className="mb-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta/80">
                  Evaluación
                </h3>
                <ul className="space-y-3 font-mono text-xs">
                  {score.evaluadores.map((ev) => (
                    <li key={ev.evaluador.id}>
                      <div className="flex justify-between gap-2">
                        <span className="font-bold text-brutal-tinta">
                          {ev.evaluador.nombres}
                        </span>
                        <span className="font-bold">
                          {ev.score != null
                            ? `${ev.score.toFixed(2)}/100`
                            : 'en curso'}
                        </span>
                      </div>
                      {ev.criterios.length > 0 && (
                        <ul className="mt-1 space-y-1">
                          {ev.criterios.map((c) => (
                            <li key={c.id} className="text-brutal-tinta/80">
                              <span className="font-bold">{c.nombre}</span> ·{' '}
                              {c.puntaje}/100
                              {c.observaciones && (
                                <span className="block text-brutal-tinta/70">
                                  «{c.observaciones}»
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(desembolso || detalle.estado === 'APROBADA') && (
              <section className="rounded-brutal border-2 border-brutal-tinta/30 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta/80">
                    Desembolso
                  </h3>
                  {puedeGestionar && detalle.estado === 'APROBADA' && (
                    <Button variant="ghost" onClick={() => setEditandoPago(true)}>
                      Registrar pago
                    </Button>
                  )}
                </div>
                <dl className="grid gap-1 font-mono text-xs text-brutal-tinta/85 sm:grid-cols-2">
                  <div className="flex justify-between gap-2">
                    <dt className="text-brutal-tinta/60">Estado</dt>
                    <dd className="font-bold">
                      {desembolso
                        ? ETIQUETA_DESEMBOLSO[desembolso.estado] ??
                          desembolso.estado
                        : 'Pendiente de gestionar'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-brutal-tinta/60">Monto</dt>
                    <dd className="font-bold">
                      Q{desembolso?.monto ?? detalle.montoAprobado ?? '—'}
                    </dd>
                  </div>
                  {desembolso?.metodo && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-brutal-tinta/60">Entrega</dt>
                      <dd className="font-bold">
                        {ETIQUETA_METODO_PAGO[desembolso.metodo] ??
                          desembolso.metodo}
                        {desembolso.banco ? ` · ${desembolso.banco}` : ''}
                      </dd>
                    </div>
                  )}
                  {desembolso?.fechaPago && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-brutal-tinta/60">Fecha del pago</dt>
                      <dd className="font-bold">
                        {new Date(desembolso.fechaPago).toLocaleDateString('es-GT')}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            {detalle.historial && detalle.historial.length > 0 && (
              <section className="rounded-brutal border-2 border-brutal-tinta/30 p-3">
                <h3 className="mb-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta/80">
                  Historial
                </h3>
                <ul className="space-y-1 font-mono text-xs text-brutal-tinta/80">
                  {detalle.historial.map((h, i) => (
                    <li key={`${h.fecha}-${i}`}>
                      {new Date(h.fecha).toLocaleString('es-GT')} · {h.estado}
                      {h.comentario ? ` · ${h.comentario}` : ''}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>

      {editandoPago && (
        <FormularioDesembolso
          solicitudId={solicitudId}
          desembolso={desembolso}
          montoAprobado={detalle?.montoAprobado}
          onGuardar={guardarPago}
          onCerrar={() => setEditandoPago(false)}
          guardando={guardandoPago}
        />
      )}
    </div>
  );
}
