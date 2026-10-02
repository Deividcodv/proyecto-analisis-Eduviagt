'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
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
  const [filtroEstado, setFiltroEstado] = useState('EN_REVISION');
  const [asignando, setAsignando] = useState<Solicitud | null>(null);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreSolicitud>>({});

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
      setError(e instanceof Error ? e.message : 'No se pudo obtener el score');
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
          options={[
            { value: 'EN_REVISION', label: 'En revisión' },
            { value: 'EVALUADA', label: 'Evaluadas' },
            { value: 'APROBADA', label: 'Aprobadas' },
            { value: 'RECHAZADA', label: 'Rechazadas' },
            { value: '', label: 'Todas' },
          ]}
          className="w-56"
        />
      </div>

      {asignando && (
        <Card className="mb-6 border-[3px] border-brutal-tinta shadow-brutal-sm">
          <h3 className="mb-2 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
            Asignar evaluadores a la solicitud
          </h3>
          <p className="mb-4 font-mono text-sm text-brutal-tinta/60">
            {asignando.convocatoria?.nombre} · {asignando.convocatoria?.beca?.nombre}
          </p>
          {evaluadores.length === 0 ? (
            <p className="font-mono text-sm text-brutal-rojo">
              No hay usuarios con rol EVALUADOR registrados en el sistema.
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
                    <span className="block text-xs text-brutal-tinta/50">{ev.email}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <Button onClick={asignar} disabled={enviando || evaluadores.length === 0}>
              {enviando ? 'Asignando...' : 'Asignar'}
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
                      <h3 className="text-lg font-semibold text-sigeb-blue-dark">
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
                        Score: {score.score.toFixed(2)}
                      </span>
                    )}
                    <Button variant="ghost" onClick={() => verScore(solicitud.id)}>
                      {score ? 'Actualizar score' : 'Ver score'}
                    </Button>
                    {solicitud.estado === 'EN_REVISION' && (
                      <Button onClick={() => abrirAsignacion(solicitud)}>
                        Asignar evaluadores
                      </Button>
                    )}
                  </div>
                </div>
                {score && (
                  <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-3">
                    <p className="mb-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">
                      Score por evaluador
                    </p>
                    {score.evaluadores.length === 0 ? (
                      <p className="font-mono text-sm text-brutal-tinta/50">
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
                              <span className="text-brutal-tinta/50">
                                {' '}({ev.completados}/{ev.total})
                              </span>
                            </span>
                            <span
                              className={
                                ev.completo
                                  ? 'rounded-brutal border-2 border-brutal-tinta bg-brutal-lima px-2 py-0.5 font-bold text-brutal-tinta'
                                  : 'font-semibold text-brutal-tinta/50'
                              }
                            >
                              {ev.completo ? `${ev.score?.toFixed(2) ?? '—'}` : 'Pendiente'}
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
    </div>
  );
}
