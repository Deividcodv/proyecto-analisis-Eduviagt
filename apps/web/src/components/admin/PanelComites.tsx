'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  type Comite,
  type ComiteDetalle,
  type ComiteMiembro,
  type UsuarioSimplificado,
} from '@/lib/api';

export function PanelComites() {
  const [comites, setComites] = useState<Comite[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: '', descripcion: '' });
  const [detalle, setDetalle] = useState<ComiteDetalle | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioSimplificado[]>([]);
  const [nuevoMiembro, setNuevoMiembro] = useState({ usuarioId: '', rol: 'VOCAL' });

  const cargar = useCallback(async () => {
    try {
      const lista = await fetchConToken<Comite[]>('/comites');
      setComites(lista);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los comités');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crear = async () => {
    if (!nuevo.nombre) {
      setError('El nombre es obligatorio');
      return;
    }
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken('/comites', {
        method: 'POST',
        body: { nombre: nuevo.nombre, descripcion: nuevo.descripcion || undefined },
      });
      setExito('Comité creado.');
      setMostrarForm(false);
      setNuevo({ nombre: '', descripcion: '' });
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el comité');
    } finally {
      setEnviando(false);
    }
  };

  const abrirDetalle = async (id: string) => {
    setError(null);
    setExito(null);
    try {
      const [det, catUsuarios] = await Promise.all([
        fetchConToken<ComiteDetalle>(`/comites/${id}`),
        fetchConToken<UsuarioSimplificado[]>('/seguridad/usuarios'),
      ]);
      setDetalle(det);
      setUsuarios(catUsuarios);
      setNuevoMiembro({ usuarioId: '', rol: 'VOCAL' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el detalle');
    }
  };

  const agregarMiembro = async () => {
    if (!detalle || !nuevoMiembro.usuarioId) {
      setError('Selecciona un usuario');
      return;
    }
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/comites/${detalle.id}/miembros`, {
        method: 'POST',
        body: {
          usuarioId: nuevoMiembro.usuarioId,
          rol: nuevoMiembro.rol,
        },
      });
      setExito('Miembro agregado.');
      abrirDetalle(detalle.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo agregar el miembro');
    } finally {
      setEnviando(false);
    }
  };

  const quitarMiembro = async (miembro: ComiteMiembro) => {
    if (!detalle) return;
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(
        `/comites/${detalle.id}/miembros/${miembro.usuario.id}`,
        { method: 'DELETE' },
      );
      setExito('Miembro eliminado.');
      abrirDetalle(detalle.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo quitar el miembro');
    } finally {
      setEnviando(false);
    }
  };

  const disponiblesParaAgregar = usuarios.filter(
    (u) => !detalle?.miembros.some((m) => m.usuario.id === u.id),
  );

  if (!comites) {
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
          {mostrarForm ? 'Cancelar' : '+ Nuevo comité'}
        </Button>
      </div>

      {mostrarForm && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-bold text-sigeb-blue-dark">Nuevo comité evaluador</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Nombre"
              value={nuevo.nombre}
              onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))}
            />
            <Input
              label="Descripción"
              value={nuevo.descripcion}
              onChange={(e) => setNuevo((n) => ({ ...n, descripcion: e.target.value }))}
            />
          </div>
          <div className="mt-4">
            <Button onClick={crear} disabled={enviando}>
              {enviando ? 'Creando...' : 'Crear'}
            </Button>
          </div>
        </Card>
      )}

      {detalle && (
        <Card className="mb-6 border-2 border-sigeb-blue">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-sigeb-blue-dark">{detalle.nombre}</h3>
              <p className="text-sm text-gray-600">
                {detalle.descripcion ?? 'Sin descripción'} · {detalle.miembros.length} miembros
              </p>
            </div>
            <Button variant="ghost" onClick={() => setDetalle(null)}>
              Cerrar
            </Button>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_0.5fr_auto]">
            <Select
              label="Agregar miembro"
              value={nuevoMiembro.usuarioId}
              onChange={(e) =>
                setNuevoMiembro((m) => ({ ...m, usuarioId: e.target.value }))
              }
              options={disponiblesParaAgregar.map((u) => ({
                value: u.id,
                label: `${u.nombres} (${u.rol.nombre})`,
              }))}
            />
            <Select
              label="Rol en el comité"
              value={nuevoMiembro.rol}
              onChange={(e) =>
                setNuevoMiembro((m) => ({ ...m, rol: e.target.value }))
              }
              options={[
                { value: 'PRESIDENTE', label: 'Presidente' },
                { value: 'VOCAL', label: 'Vocal' },
                { value: 'SECRETARIO', label: 'Secretario' },
              ]}
            />
            <div className="flex items-end">
              <Button
                onClick={agregarMiembro}
                disabled={enviando || !nuevoMiembro.usuarioId}
              >
                Agregar
              </Button>
            </div>
          </div>

          {detalle.miembros.length === 0 ? (
            <p className="text-sm text-gray-500">El comité no tiene miembros.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {detalle.miembros.map((miembro) => (
                <li
                  key={miembro.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-sigeb-blue-dark">
                      {miembro.usuario.nombres}
                      <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {miembro.rol}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">{miembro.usuario.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => quitarMiembro(miembro)}
                    disabled={enviando}
                  >
                    Quitar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {comites.length === 0 ? (
        <EmptyState title="Sin comités" description="Crea un comité evaluador para comenzar." />
      ) : (
        <div className="space-y-4">
          {comites.map((comite) => (
            <Card
              key={comite.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-sigeb-blue-dark">{comite.nombre}</h3>
                <p className="text-sm text-gray-600">
                  {comite.descripcion ?? 'Sin descripción'} · {comite._count?.miembros ?? 0} miembros
                </p>
              </div>
              <Button variant="ghost" onClick={() => abrirDetalle(comite.id)}>
                Gestionar miembros
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
