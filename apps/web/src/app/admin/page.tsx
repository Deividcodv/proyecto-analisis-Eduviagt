'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { fetchConToken } from '@/lib/api-auth';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { InternalPageHeader } from '@/components/ui/InternalPageHeader';
import { PanelSolicitudes } from '@/components/admin/PanelSolicitudes';
import { PanelComites } from '@/components/admin/PanelComites';
import { PanelSesiones } from '@/components/admin/PanelSesiones';
import { formatearFecha, type Beca, type Convocatoria } from '@/lib/api';

export default function AdminPage() {
  return (
    <ProtectedRoute roles={['ADMIN']}>
      <AdminContent />
    </ProtectedRoute>
  );
}

function AdminContent() {
  const [pestana, setPestana] = useState<
    | 'convocatorias'
    | 'solicitudes'
    | 'comites'
    | 'sesiones'
    | 'seguridad'
  >('convocatorias');

  return (
    <>
      <InternalPageHeader
        title="Panel de administración"
        subtitle="Gestiona convocatorias, evaluaciones, comités, sesiones y usuarios del sistema."
      />

      <Container className="py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={pestana === 'convocatorias' ? 'primary' : 'ghost'}
            onClick={() => setPestana('convocatorias')}
          >
            Convocatorias
          </Button>
          <Button
            variant={pestana === 'solicitudes' ? 'primary' : 'ghost'}
            onClick={() => setPestana('solicitudes')}
          >
            Solicitudes
          </Button>
          <Button
            variant={pestana === 'comites' ? 'primary' : 'ghost'}
            onClick={() => setPestana('comites')}
          >
            Comités
          </Button>
          <Button
            variant={pestana === 'sesiones' ? 'primary' : 'ghost'}
            onClick={() => setPestana('sesiones')}
          >
            Sesiones
          </Button>
          <Button
            variant={pestana === 'seguridad' ? 'primary' : 'ghost'}
            onClick={() => setPestana('seguridad')}
          >
            Seguridad
          </Button>
        </div>

        {pestana === 'convocatorias' && <PanelConvocatorias />}
        {pestana === 'solicitudes' && <PanelSolicitudes />}
        {pestana === 'comites' && <PanelComites />}
        {pestana === 'sesiones' && <PanelSesiones />}
        {pestana === 'seguridad' && <PanelSeguridad />}
      </Container>
    </>
  );
}

const accionesPorEstado: Record<string, { value: string; label: string }[]> = {
  BORRADOR: [{ value: 'publicar', label: 'Publicar' }],
  ABIERTA: [{ value: 'cerrar', label: 'Cerrar' }],
  CERRADA: [{ value: 'iniciar_evaluacion', label: 'Iniciar evaluación' }],
  EN_EVALUACION: [{ value: 'resolver', label: 'Resolver' }],
  RESUELTA: [{ value: 'archivar', label: 'Archivar' }],
};

function PanelConvocatorias() {
  const [convocatorias, setConvocatorias] = useState<Convocatoria[] | null>(null);
  const [becas, setBecas] = useState<Beca[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [nuevo, setNuevo] = useState({
    nombre: '',
    descripcion: '',
    becaId: '',
    fechaApertura: '',
    fechaCierre: '',
  });
  const [acciones, setAcciones] = useState<Record<string, string>>({});

  const cargar = useCallback(async () => {
    try {
      const [lista, catBecas] = await Promise.all([
        fetchConToken<Convocatoria[]>('/convocatorias/todas'),
        fetchConToken<Beca[]>('/catalogos/becas'),
      ]);
      setConvocatorias(lista);
      setBecas(catBecas);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las convocatorias');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crear = async () => {
    if (!nuevo.nombre || !nuevo.becaId) {
      setError('Nombre y beca son obligatorios');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await fetchConToken('/convocatorias', {
        method: 'POST',
        body: {
          nombre: nuevo.nombre,
          descripcion: nuevo.descripcion || undefined,
          becaId: nuevo.becaId,
          fechaApertura: nuevo.fechaApertura
            ? new Date(nuevo.fechaApertura).toISOString()
            : undefined,
          fechaCierre: nuevo.fechaCierre
            ? new Date(nuevo.fechaCierre).toISOString()
            : undefined,
        },
      });
      setExito('Convocatoria creada.');
      setMostrarForm(false);
      setNuevo({ nombre: '', descripcion: '', becaId: '', fechaApertura: '', fechaCierre: '' });
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la convocatoria');
    } finally {
      setEnviando(false);
    }
  };

  const transicionar = async (id: string) => {
    const accion = acciones[id];
    if (!accion) return;
    setEnviando(true);
    setError(null);
    try {
      await fetchConToken(`/convocatorias/${id}/transicion`, {
        method: 'POST',
        body: { accion },
      });
      setExito('Estado actualizado.');
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el estado');
    } finally {
      setEnviando(false);
    }
  };

  if (!convocatorias) {
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
          {mostrarForm ? 'Cancelar' : '+ Nueva convocatoria'}
        </Button>
      </div>

      {mostrarForm && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-bold text-sigeb-blue-dark">
            Nueva convocatoria
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Nombre"
              value={nuevo.nombre}
              onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))}
            />
            <Select
              label="Beca"
              value={nuevo.becaId}
              onChange={(e) => setNuevo((n) => ({ ...n, becaId: e.target.value }))}
              options={becas.map((b) => ({ value: b.id, label: b.nombre }))}
            />
            <div className="md:col-span-2">
              <Input
                label="Descripción"
                value={nuevo.descripcion}
                onChange={(e) => setNuevo((n) => ({ ...n, descripcion: e.target.value }))}
              />
            </div>
            <Input
              label="Fecha de apertura"
              type="datetime-local"
              value={nuevo.fechaApertura}
              onChange={(e) => setNuevo((n) => ({ ...n, fechaApertura: e.target.value }))}
            />
            <Input
              label="Fecha de cierre"
              type="datetime-local"
              value={nuevo.fechaCierre}
              onChange={(e) => setNuevo((n) => ({ ...n, fechaCierre: e.target.value }))}
            />
          </div>
          <div className="mt-4">
            <Button onClick={crear} disabled={enviando}>
              {enviando ? <Spinner /> : 'Crear'}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {convocatorias.map((convocatoria) => {
          const opciones = accionesPorEstado[convocatoria.estado] ?? [];
          return (
            <Card
              key={convocatoria.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-sigeb-blue-dark">
                    {convocatoria.nombre}
                  </h3>
                  <Badge estado={convocatoria.estado} />
                </div>
                <p className="text-sm text-gray-600">{convocatoria.beca.nombre}</p>
                <p className="text-sm text-gray-500">
                  Cierra el {formatearFecha(convocatoria.fechaCierre)} ·{' '}
                  {convocatoria._count?.solicitudes ?? 0} solicitudes
                </p>
              </div>
              {opciones.length > 0 && (
                <div className="flex items-center gap-2">
                  <Select
                    value={acciones[convocatoria.id] ?? ''}
                    onChange={(e) =>
                      setAcciones((a) => ({ ...a, [convocatoria.id]: e.target.value }))
                    }
                    options={opciones}
                    className="w-52"
                  />
                  <Button
                    onClick={() => transicionar(convocatoria.id)}
                    disabled={!acciones[convocatoria.id] || enviando}
                  >
                    Aplicar
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

interface Permiso {
  id: string;
  nombre: string;
  descripcion?: string;
}

interface Rol {
  id: string;
  nombre: string;
  descripcion?: string;
  rolPermisos: { permiso: Permiso }[];
}

function PanelSeguridad() {
  const [roles, setRoles] = useState<Rol[] | null>(null);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [seleccion, setSeleccion] = useState<Record<string, Set<string>>>({});

  const cargar = useCallback(async () => {
    try {
      const [listaRoles, listaPermisos] = await Promise.all([
        fetchConToken<Rol[]>('/seguridad/roles'),
        fetchConToken<Permiso[]>('/seguridad/permisos'),
      ]);
      setRoles(listaRoles);
      setPermisos(listaPermisos);
      const iniciales: Record<string, Set<string>> = {};
      listaRoles.forEach((r) => {
        iniciales[r.id] = new Set(r.rolPermisos.map((p) => p.permiso.id));
      });
      setSeleccion(iniciales);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los roles');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const togglePermiso = (rolId: string, permisoId: string, on: boolean) => {
    setSeleccion((prev) => {
      const nuevo = new Set(prev[rolId] ?? []);
      if (on) nuevo.add(permisoId);
      else nuevo.delete(permisoId);
      return { ...prev, [rolId]: nuevo };
    });
  };

  const guardar = async (rolId: string) => {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/seguridad/roles/${rolId}/permisos`, {
        method: 'PATCH',
        body: { permisoIds: Array.from(seleccion[rolId] ?? []) },
      });
      setExito('Permisos actualizados.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar los permisos');
    } finally {
      setEnviando(false);
    }
  };

  if (!roles) {
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

      <div className="space-y-6">
        {roles.map((rol) => (
          <Card
            key={rol.id}
            className="grid gap-6 md:grid-cols-[220px_1fr]"
          >
            <div>
              <h3 className="text-lg font-bold text-sigeb-blue-dark">{rol.nombre}</h3>
              <p className="text-sm text-gray-600">{rol.descripcion ?? 'Sin descripción'}</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Permisos</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {permisos.map((permiso) => (
                  <label
                    key={permiso.id}
                    className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={(seleccion[rol.id] ?? new Set()).has(permiso.id)}
                      onChange={(e) =>
                        togglePermiso(rol.id, permiso.id, e.target.checked)
                      }
                    />
                    {permiso.nombre}
                  </label>
                ))}
              </div>
              <Button
                className="mt-4"
                onClick={() => guardar(rol.id)}
                disabled={enviando}
              >
                {enviando ? 'Guardando...' : 'Guardar permisos'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
