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
import {
  formatearFecha,
  type Sesion,
  type SesionDetalle,
  type Comite,
  type Solicitud,
} from '@/lib/api';

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

  if (!sesiones) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      )}
      {exito && (
        <p className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{exito}</p>
      )}

      <div className="mb-6 flex justify-end">
        <Button onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? 'Cancelar' : '+ Nueva sesión'}
        </Button>
      </div>

      {mostrarForm && (
        <Card className="mb-6 border-2 border-sigeb-blue">
          <h2 className="mb-4 text-lg font-bold text-sigeb-blue-dark">Nueva sesión</h2>
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
            <p className="mb-2 text-sm font-semibold text-gray-700">
              Agenda — solicitudes evaluadas ({evaluadas.length} disponibles)
            </p>
            {evaluadas.length === 0 ? (
              <p className="text-sm text-amber-700">
                No hay solicitudes en estado EVALUADA para agregar a la agenda.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {evaluadas.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={agenda.includes(s.id)}
                      onChange={() => toggleAgenda(s.id)}
                    />
                    <span>
                      {s.convocatoria?.beca?.nombre}
                      <span className="block text-xs text-gray-500">
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
              {enviando ? 'Creando...' : 'Crear sesión'}
            </Button>
            <Button variant="ghost" onClick={() => setMostrarForm(false)}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {detalle && (
        <Card className="mb-6 border-2 border-sigeb-blue">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-bold text-sigeb-blue-dark">
                  {detalle.comite?.nombre}
                </h3>
                <Badge estado={detalle.estado} />
              </div>
              <p className="text-sm text-gray-600">
                {formatearFecha(detalle.fecha)} · {detalle.lugar ?? 'Sin lugar'}
                {detalle.quorumMinimo ? ` · Quórum ${detalle.quorumMinimo}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              {detalle.estado === 'PROGRAMADA' && (
                <Button onClick={() => finalizar(detalle.id)} disabled={enviando}>
                  Finalizar sesión
                </Button>
              )}
              <Button variant="ghost" onClick={() => setDetalle(null)}>
                Cerrar
              </Button>
            </div>
          </div>

          <p className="mb-2 text-sm font-semibold text-gray-700">Agenda ({detalle.agenda.length})</p>
          {detalle.agenda.length === 0 ? (
            <p className="text-sm text-gray-500">Sin solicitudes en la agenda.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {detalle.agenda.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-sigeb-blue-dark">
                    {item.solicitud.usuario.nombres}
                    <span className="block text-xs text-gray-500">CUI {item.solicitud.usuario.cui}</span>
                  </span>
                  <span className="text-xs text-gray-500">{item.solicitud.estado}</span>
                </li>
              ))}
            </ul>
          )}

          {detalle.decisiones.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-gray-700">Decisiones</p>
              <ul className="divide-y divide-gray-100">
                {detalle.decisiones.map((d) => (
                  <li key={d.id} className="py-2 text-sm">
                    <span className="font-medium text-gray-700">Solicitud {d.solicitudId.slice(0, 8)}</span>{' '}
                    <Badge estado={d.resultado} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {sesiones.length === 0 ? (
        <EmptyState title="Sin sesiones" description="Crea una sesión para el comité evaluador." />
      ) : (
        <div className="space-y-4">
          {sesiones.map((sesion) => (
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
                <p className="text-sm text-gray-600">
                  {formatearFecha(sesion.fecha)}
                  {sesion.lugar ? ` · ${sesion.lugar}` : ''}
                </p>
                <p className="text-sm text-gray-500">
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
