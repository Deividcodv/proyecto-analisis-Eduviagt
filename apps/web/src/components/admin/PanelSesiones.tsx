'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  formatearFecha,
  type Sesion,
  type SesionDetalle,
  type Comite,
  type Solicitud,
} from '@/lib/api';
import { AvisoDialog } from '@/components/ui/AvisoDialog';

export function PanelSesiones() {
  const [sesiones, setSesiones] = useState<Sesion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [detalle, setDetalle] = useState<SesionDetalle | null>(null);
  const [comites, setComites] = useState<Comite[]>([]);
  const [evaluadas, setEvaluadas] = useState<Solicitud[]>([]);
  const [nueva, setNueva] = useState({
    comiteId: '',
    fecha: '',
    lugar: '',
    quorumMinimo: '',
  });
  const [agenda, setAgenda] = useState<string[]>([]);
  const [confirmandoFinalizar, setConfirmandoFinalizar] = useState<string | null>(
    null,
  );
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroComite, setFiltroComite] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [lista, listaComites, listaSolicitudes] = await Promise.all([
        fetchConToken<Sesion[]>('/sesiones'),
        fetchConToken<Comite[]>('/comites'),
        fetchConToken<Solicitud[]>('/solicitudes'),
      ]);
      setSesiones(lista);
      setComites(listaComites);
      setEvaluadas(listaSolicitudes.filter((s) => s.estado === 'EVALUADA'));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las sesiones');
      // Sin esto la lista queda en `null` y la vista muestra el spinner para
      // siempre, tragándose el mensaje de error.
      setSesiones([]);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crear = async () => {
    if (!nueva.comiteId || !nueva.fecha || agenda.length === 0) {
      setError('Comité, fecha y al menos una solicitud son obligatorios');
      return;
    }
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken('/sesiones', {
        method: 'POST',
        body: {
          comiteId: nueva.comiteId,
          fecha: new Date(nueva.fecha).toISOString(),
          lugar: nueva.lugar || undefined,
          quorumMinimo: nueva.quorumMinimo ? Number(nueva.quorumMinimo) : undefined,
          solicitudesIds: agenda,
        },
      });
      setExito('Sesión creada.');
      setMostrarForm(false);
      setNueva({ comiteId: '', fecha: '', lugar: '', quorumMinimo: '' });
      setAgenda([]);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la sesión');
    } finally {
      setEnviando(false);
    }
  };

  const abrirDetalle = async (id: string) => {
    setError(null);
    setExito(null);
    try {
      const det = await fetchConToken<SesionDetalle>(`/sesiones/${id}`);
      setDetalle(det);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la sesión');
    }
  };

  const finalizar = async (id: string) => {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/sesiones/${id}/finalizar`, { method: 'POST' });
      setExito('Sesión finalizada. Decisiones generadas.');
      abrirDetalle(id);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo finalizar la sesión');
    } finally {
      setEnviando(false);
    }
  };

  const toggleAgenda = (id: string) => {
    setAgenda((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  /** Quita una solicitud de la agenda de una sesión abierta. */
  const quitarDeAgenda = async (sesionId: string, solicitudId: string) => {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/sesiones/${sesionId}/agenda/${solicitudId}`, {
        method: 'DELETE',
      });
      setExito('Solicitud quitada de la agenda.');
      await abrirDetalle(sesionId);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo quitar de la agenda');
    } finally {
      setEnviando(false);
    }
  };

  if (!sesiones) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  const sesionesFiltradas = sesiones.filter(
    (s) =>
      (filtroEstado === '' || s.estado === filtroEstado) &&
      (filtroComite === '' || s.comiteId === filtroComite),
  );

  return (
    <div>
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
      

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            aria-label="Filtrar sesiones por estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            placeholder="Todos los estados"
            options={[
              { value: 'PROGRAMADA', label: 'Programadas' },
              { value: 'FINALIZADA', label: 'Finalizadas' },
            ]}
            className="w-56"
          />
          <Select
            aria-label="Filtrar sesiones por comité"
            value={filtroComite}
            onChange={(e) => setFiltroComite(e.target.value)}
            placeholder="Todos los comités"
            options={comites.map((c) => ({ value: c.id, label: c.nombre }))}
            className="w-72"
          />
        </div>
        <Button onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? 'Cancelar' : '+ Nueva sesión'}
        </Button>
      </div>

      {mostrarForm && (
        <Card className="mb-6 border-[3px] border-brutal-tinta shadow-brutal-sm">
          <h2 className="mb-4 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">Nueva sesión</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Comité"
              value={nueva.comiteId}
              onChange={(e) => setNueva((n) => ({ ...n, comiteId: e.target.value }))}
              options={comites.map((c) => ({ value: c.id, label: c.nombre }))}
            />
            <Input
              label="Fecha y hora"
              type="datetime-local"
              value={nueva.fecha}
              onChange={(e) => setNueva((n) => ({ ...n, fecha: e.target.value }))}
            />
            <Input
              label="Lugar"
              value={nueva.lugar}
              onChange={(e) => setNueva((n) => ({ ...n, lugar: e.target.value }))}
            />
            <Input
              label="Quórum mínimo"
              type="number"
              min={1}
              value={nueva.quorumMinimo}
              onChange={(e) => setNueva((n) => ({ ...n, quorumMinimo: e.target.value }))}
            />
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-brutal-tinta/80">
              Agenda — solicitudes evaluadas ({evaluadas.length} disponibles)
            </p>
            {evaluadas.length === 0 ? (
              <p className="text-sm font-bold text-brutal-gold-dark">
                No hay solicitudes evaluadas para agregar a la agenda.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {evaluadas.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco px-3 py-2 font-mono text-sm text-brutal-tinta"
                  >
                    <input
                      type="checkbox"
                      checked={agenda.includes(s.id)}
                      onChange={() => toggleAgenda(s.id)}
                      className="h-4 w-4 accent-brutal-tinta"
                    />
                    <span>
                      {s.convocatoria?.beca?.nombre}
                      <span className="block text-xs text-brutal-tinta/75">
                        {s.convocatoria?.nombre}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={crear} disabled={enviando || evaluadas.length === 0}>
              {enviando ? 'Creando…' : 'Crear sesión'}
            </Button>
            <Button variant="ghost" onClick={() => setMostrarForm(false)}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {detalle && (
        <Card className="mb-6 border-[3px] border-brutal-tinta shadow-brutal-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
                  {detalle.comite?.nombre}
                </h3>
                <Badge estado={detalle.estado} />
              </div>
              <p className="font-mono text-sm text-brutal-tinta/80">
                {formatearFecha(detalle.fecha)} · {detalle.lugar ?? 'Sin lugar'}
                {detalle.quorumMinimo ? ` · Quórum ${detalle.quorumMinimo}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              {detalle.estado === 'PROGRAMADA' && (
                <Button onClick={() => setConfirmandoFinalizar(detalle.id)} disabled={enviando}>
                  Finalizar sesión
                </Button>
              )}
              <Button variant="ghost" onClick={() => setDetalle(null)}>
                Cerrar
              </Button>
            </div>
          </div>

          {(() => {
            const votantes = new Set(detalle.votos.map((v) => v.usuario?.id)).size;
            const quorum = detalle.quorumMinimo ?? 1;
            const pct = Math.min(100, Math.round((votantes / quorum) * 100));
            return (
              <div className="mb-4 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-3">
                <div className="mb-1 flex items-center justify-between font-mono text-xs font-bold text-brutal-tinta">
                  <span>Quórum</span>
                  <span>
                    {votantes}/{quorum} votantes
                  </span>
                </div>
                <div className="h-3 w-full rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco">
                  <div
                    className={`h-full rounded-brutal ${votantes >= quorum ? 'bg-brutal-lima' : 'bg-brutal-naranja'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          <p className="mb-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">Agenda ({detalle.agenda.length})</p>
          {detalle.agenda.length === 0 ? (
            <p className="text-sm text-brutal-tinta/75">Sin solicitudes en la agenda.</p>
          ) : (
            <ul className="divide-y divide-brutal-tinta/20">
              {detalle.agenda.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="font-mono text-sm text-brutal-tinta">
                    {item.solicitud.usuario.nombres}
                    <span className="block text-xs text-brutal-tinta/75">
                      CUI {item.solicitud.usuario.cui} · Solicitud{' '}
                      {item.solicitud.id.slice(0, 8)}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge estado={item.solicitud.estado} />
                    {detalle.estado === 'PROGRAMADA' && (
                      <Button
                        variant="ghost"
                        onClick={() => quitarDeAgenda(detalle.id, item.solicitud.id)}
                        disabled={enviando}
                      >
                        Quitar
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {detalle.votos.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">
                Votos ({detalle.votos.length})
              </p>
              <ul className="divide-y divide-brutal-tinta/20">
                {detalle.votos.map((v) => (
                  <li key={v.id} className="flex items-center justify-between py-2 font-mono text-sm">
                    <span className="text-brutal-tinta">
                      {v.usuario?.nombres ?? 'Miembro'}
                      <span className="block text-xs text-brutal-tinta/75">
                        Solicitud {v.solicitud?.id.slice(0, 8)}
                      </span>
                    </span>
                    <Badge estado={v.voto} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {detalle.decisiones.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">Decisiones</p>
              <ul className="divide-y divide-brutal-tinta/20">
                {detalle.decisiones.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 py-2 font-mono text-sm">
                    <span className="font-bold text-brutal-tinta">
                      Solicitud {d.solicitudId.slice(0, 8)}
                    </span>
                    <Badge estado={d.resultado} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={confirmandoFinalizar !== null}
        title="Finalizar la sesión"
        description="Al finalizar, el comité decide las postulaciones de la agenda: las aprobadas quedan APPROBADA (o pasan a una segunda firma si el monto lo exige) y las rechazadas quedan RECHAZADA. Esta acción no se puede deshacer."
        confirmLabel="Finalizar y decidir"
        tone="danger"
        onCancel={() => setConfirmandoFinalizar(null)}
        onConfirm={() => {
          const id = confirmandoFinalizar;
          setConfirmandoFinalizar(null);
          if (id) void finalizar(id);
        }}
      />

      {sesionesFiltradas.length === 0 ? (
        <EmptyState title="Sin sesiones" description="Crea una sesión para el comité evaluador." />
      ) : (
        <div className="space-y-4">
          {sesionesFiltradas.map((sesion) => (
            <Card
              key={sesion.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-brutal-tinta">
                    {sesion.comite?.nombre}
                  </h3>
                  <Badge estado={sesion.estado} />
                </div>
                <p className="text-sm text-brutal-tinta/70">
                  {formatearFecha(sesion.fecha)}
                  {sesion.lugar ? ` · ${sesion.lugar}` : ''}
                </p>
                <p className="text-sm text-brutal-tinta/70">
                  {sesion._count?.agenda ?? 0} solicitudes · {sesion._count?.votos ?? 0} votos
                </p>
              </div>
              <Button variant="ghost" onClick={() => abrirDetalle(sesion.id)}>
                Ver sesión
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
