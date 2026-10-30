'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchConToken, verDocumento } from '@/lib/api-auth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import type {
  CampoFormulario,
  EvaluacionAsignada,
  SolicitudChecklist,
  SolicitudDetalle,
} from '@/lib/api';
import { AvisoDialog } from '@/components/ui/AvisoDialog';

interface Props {
  evaluacion: EvaluacionAsignada;
  onCerrar: () => void;
  onCambio: () => void;
}

/**
 * Ventana de detalle de la postulación para el evaluador.
 *
 * Concentra todo lo que hace falta para judged la postulación: quién la
 * presentó, qué convocatoria abrió y cuándo cierra, cuánto se otorgará, los
 * perfiles, las respuestas del formulario y los documentos que el postulante
 * adjuntó (con su descarga). Abajo está la zona de calificación: cada
 * criterio con su puntaje y sus observaciones, y el botón que cierra la
 * revisión.
 */
export function DetalleEvaluacion({ evaluacion, onCerrar, onCambio }: Props) {
  const [detalle, setDetalle] = useState<SolicitudDetalle | null>(null);
  const [checklist, setChecklist] = useState<SolicitudChecklist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  // Estado local: al confirmar la imparcialidad el formulario se habilita
  // al instante, sin esperar a que el panel se recargue.
  const [imparcialidad, setImparcialidad] = useState(
    evaluacion.imparcialidadConfirmada,
  );
  const [marcas, setMarcas] = useState<
    Record<string, { puntaje: string; observaciones: string }>
  >({});
  const panelRef = useRef<HTMLDivElement>(null);

  const solicitudId = evaluacion.solicitudId;

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const [det, chk] = await Promise.all([
        fetchConToken<SolicitudDetalle>(`/solicitudes/${solicitudId}`),
        fetchConToken<SolicitudChecklist>(`/solicitudes/${solicitudId}/checklist`),
      ]);
      setDetalle(det);
      setChecklist(chk);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo cargar el detalle de la solicitud',
      );
    }
  }, [solicitudId]);

  useEffect(() => {
    cargar();
    setMarcas((prev) => {
      const siguiente: Record<string, { puntaje: string; observaciones: string }> = {};
      evaluacion.criterios.forEach((c) => {
        siguiente[c.id] = prev[c.id] ?? {
          puntaje: c.puntaje != null ? String(c.puntaje) : '',
          observaciones: c.observaciones ?? '',
        };
      });
      return siguiente;
    });
  }, [cargar, evaluacion.criterios]);

  // Escape cierra la ventana y el foco entra al panel (WCAG 2.1.2).
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alPulsar);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', alPulsar);
  }, [onCerrar]);

  const confirmarImparcialidad = async () => {
    setGuardando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/solicitudes/${solicitudId}/imparcialidad`, {
        method: 'PATCH',
        body: { confirma: true },
      });
      // El formulario se habilita en el momento: no hace falta cerrar y
      // volver a abrir el detalle.
      setImparcialidad(true);
      await cargar();
      onCambio();
      setExito('Declaración de imparcialidad confirmada. Ya puedes puntuar.');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo confirmar la imparcialidad',
      );
    } finally {
      setGuardando(false);
    }
  };

  const puntuar = async (criterioId: string, nombre: string) => {
    const marca = marcas[criterioId];
    const bruto = (marca?.puntaje ?? '').trim();
    if (bruto === '') {
      setError(`Escribe un puntaje entre 0 y 100 para "${nombre}".`);
      setExito(null);
      return;
    }
    const puntaje = Number(bruto);
    if (Number.isNaN(puntaje) || puntaje < 0 || puntaje > 100) {
      setError('El puntaje debe ser un número entre 0 y 100.');
      setExito(null);
      return;
    }
    setGuardando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/solicitudes/${solicitudId}/criterios/${criterioId}`, {
        method: 'PUT',
        body: { puntaje, observaciones: marca?.observaciones || undefined },
      });
      await cargar();
      onCambio();
      setExito(`Puntaje registrado para "${nombre}"`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar el puntaje');
    } finally {
      setGuardando(false);
    }
  };


  const descargar = async (documentoId: string) => {
    setError(null);
    try {
      await verDocumento(solicitudId, documentoId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo abrir el documento');
    }
  };

  const respuestas = Object.values(detalle?.respuestas ?? {}).flatMap((seccion) =>
    Object.values(seccion ?? {}).map((valor) => String(valor)),
  );
  const camposExtra = Array.isArray(detalle?.formularioSnapshot)
    ? (detalle?.formularioSnapshot as CampoFormulario[])
    : [];

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
        aria-label="Detalle de la postulación"
        tabIndex={-1}
        className="relative my-8 w-full max-w-3xl rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-5 shadow-brutal-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-brut text-xl font-black uppercase tracking-wide text-brutal-tinta">
              Detalle de la postulación
            </h2>
            <p className="font-mono text-xs text-brutal-tinta/70">
              Solicitud <span className="font-bold">{solicitudId.slice(0, 8)}</span> ·{' '}
              {evaluacion.solicitud.convocatoria.beca.nombre}
            </p>
          </div>
          <Button variant="ghost" onClick={onCerrar}>
            Cerrar
          </Button>
        </div>

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
                  <dd className="font-bold">{evaluacion.solicitud.usuario.nombres}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brutal-tinta/60">CUI</dt>
                  <dd className="font-bold">{evaluacion.solicitud.usuario.cui}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brutal-tinta/60">Enviada</dt>
                  <dd className="font-bold">
                    {new Date(evaluacion.solicitud.createdAt).toLocaleDateString('es-GT')}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brutal-tinta/60">Estado</dt>
                  <dd>
                    <Badge estado={evaluacion.solicitud.estado} />
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brutal-tinta/60">Convocatoria</dt>
                  <dd className="text-right font-bold">
                    {evaluacion.solicitud.convocatoria.nombre}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brutal-tinta/60">Apertura</dt>
                  <dd className="font-bold">
                    {evaluacion.solicitud.convocatoria.fechaApertura
                      ? new Date(evaluacion.solicitud.convocatoria.fechaApertura).toLocaleDateString('es-GT')
                      : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brutal-tinta/60">Cierre</dt>
                  <dd className="font-bold">
                    {evaluacion.solicitud.convocatoria.fechaCierre
                      ? new Date(evaluacion.solicitud.convocatoria.fechaCierre).toLocaleDateString('es-GT')
                      : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-brutal-tinta/60">Monto a otorgar</dt>
                  <dd className="font-bold">
                    {detalle.montoOtorgable
                      ? `Q${detalle.montoOtorgable}`
                      : evaluacion.solicitud.convocatoria.montoBase
                        ? `Q${evaluacion.solicitud.convocatoria.montoBase}`
                        : 'Por calcular'}
                  </dd>
                </div>
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

            {(camposExtra.length > 0 || respuestas.length > 0) && (
              <section className="rounded-brutal border-2 border-brutal-tinta/30 p-3">
                <h3 className="mb-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta/80">
                  Respuestas del formulario
                </h3>
                <dl className="grid gap-1 font-mono text-xs text-brutal-tinta/85 sm:grid-cols-2">
                  {camposExtra.map((campo) => {
                    const valor = Object.values(detalle.respuestas ?? {}).reduce<Record<string, unknown>>(
                      (todo, seccion) => ({ ...todo, ...(seccion ?? {}) }),
                      {},
                    )[campo.id];
                    if (valor === undefined || valor === null || valor === '') return null;
                    return (
                      <div key={campo.id} className="flex justify-between gap-2">
                        <dt className="text-brutal-tinta/60">{campo.etiqueta}</dt>
                        <dd className="font-bold">
                          {typeof valor === 'boolean' ? (valor ? 'Sí' : 'No') : String(valor)}
                        </dd>
                      </div>
                    );
                  })}
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
                      <span className="text-brutal-tinta/80">
                        {doc.nombre}
                        {doc.estado === 'RECHAZADO' && (
                          <span className="ml-2 font-bold text-brutal-rojo">
                            rechazado
                          </span>
                        )}
                      </span>
                      {doc.cargado && doc.documentoId ? (
                        <Button
                          variant="ghost"
                          onClick={() => descargar(doc.documentoId!)}
                        >
                          Descargar
                        </Button>
                      ) : (
                        <span className="text-brutal-tinta/50">
                          {doc.cargado ? 'sin archivo' : 'no cargado'}
                        </span>
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

            <section className="rounded-brutal border-2 border-brutal-tinta/30 p-3">
              <h3 className="mb-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta/80">
                Tu evaluación
              </h3>

              {!imparcialidad ? (
                <div className="mb-3 rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-3">
                  <p className="mb-2 font-mono text-sm font-bold text-brutal-rojo">
                    Antes de puntuar debes declarar que no tienes relación con
                    la persona postulante.
                  </p>
                  <Button onClick={confirmarImparcialidad} disabled={guardando}>
                    Confirmar imparcialidad
                  </Button>
                </div>
              ) : (
                <p className="mb-3 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-lima/30 px-3 py-2 font-mono text-sm font-bold text-brutal-tinta">
                  Declaración de imparcialidad confirmada.
                </p>
              )}

              <div className="space-y-3">
                {evaluacion.criterios.map((criterio) => {
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
                            Puntuado ({criterio.puntaje})
                          </span>
                        )}
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_0.5fr_auto]">
                        <Input
                          label={`Observaciones · ${criterio.nombre}`}
                          id={`observaciones-${criterio.id}`}
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
                          label={`Puntaje (0-100) · ${criterio.nombre}`}
                          id={`puntaje-${criterio.id}`}
                          type="number"
                          min={0}
                          max={100}
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
                          onClick={() => puntuar(criterio.id, criterio.nombre)}
                          disabled={guardando || !imparcialidad}
                        >
                          Guardar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-brutal-tinta/20 pt-3">
                <p className="font-mono text-xs text-brutal-tinta/70">
                  {evaluacion.completados}/{evaluacion.totalCriterios} criterios
                  puntuados
                </p>
                {evaluacion.finalizada ? (
                  <p className="font-mono text-sm font-bold text-brutal-tinta">
                    Evaluación finalizada.
                  </p>
                ) : (
                  <p className="font-mono text-xs text-brutal-tinta/70">
                    Al calificar el último criterio tu evaluación queda
                    cerrada.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
