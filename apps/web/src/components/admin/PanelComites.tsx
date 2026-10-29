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
  type Comite,
  type ComiteDetalle,
  type ComiteMiembro,
  type UsuarioSimplificado,
} from '@/lib/api';
import { AvisoDialog } from '@/components/ui/AvisoDialog';

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
      // Sin esto la lista queda en `null` y la vista muestra el spinner para
      // siempre, tragándose el mensaje de error.
      setComites([]);
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
    // El catálogo de usuarios es auxiliar: si falla, el detalle del comité
    // se sigue mostrando (solo se pierde la lista para agregar miembros).
    const [resDetalle, resUsuarios] = await Promise.allSettled([
      fetchConToken<ComiteDetalle>(`/comites/${id}`),
      fetchConToken<UsuarioSimplificado[]>('/seguridad/personal'),
    ]);
    if (resDetalle.status === 'fulfilled') {
      setDetalle(resDetalle.value);
    } else {
      setDetalle(null);
      setError(
        resDetalle.reason instanceof Error
          ? resDetalle.reason.message
          : 'No se pudo cargar el detalle',
      );
    }
    setUsuarios(resUsuarios.status === 'fulfilled' ? resUsuarios.value : []);
    setNuevoMiembro({ usuarioId: '', rol: 'VOCAL' });
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

  /** Cambia el rol de un miembro dentro del comité. */
  const cambiarRol = async (
    miembro: ComiteMiembro,
    rol: string,
  ) => {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/comites/${detalle!.id}/miembros/${miembro.usuario.id}`, {
        method: 'PATCH',
        body: { rol },
      });
      setExito(`Rol de ${miembro.usuario.nombres} actualizado a ${rol}.`);
      await abrirDetalle(detalle!.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el rol');
    } finally {
      setEnviando(false);
    }
  };

  /** Archiva o reactiva un comité. */
  const cambiarEstado = async (comite: Comite, activo: boolean) => {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await fetchConToken(`/comites/${comite.id}`, {
        method: 'PATCH',
        body: { activo },
      });
      setExito(activo ? 'Comité reactivado.' : 'Comité archivado.');
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el comité');
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
      

      <div className="mb-6 flex justify-end">
        <Button onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? 'Cancelar' : '+ Nuevo comité'}
        </Button>
      </div>

      {mostrarForm && (
        <Card className="mb-6">
          <h2 className="mb-4 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">Nuevo comité evaluador</h2>
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
              {enviando ? 'Creando…' : 'Crear'}
            </Button>
          </div>
        </Card>
      )}

      {detalle && (
        <Card className="mb-6 border-[3px] border-brutal-tinta shadow-brutal-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">{detalle.nombre}</h3>
              <p className="font-mono text-sm text-brutal-tinta/80">
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
            <p className="font-mono text-sm text-brutal-tinta/75">El comité no tiene miembros.</p>
          ) : (
            <ul className="divide-y divide-brutal-tinta/20">
              {detalle.miembros.map((miembro) => (
                <li
                  key={miembro.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <div>
                    <p className="font-mono text-sm font-bold text-brutal-tinta">
                      {miembro.usuario.nombres}
                    </p>
                    <p className="font-mono text-xs text-brutal-tinta/75">{miembro.usuario.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      aria-label={`Rol de ${miembro.usuario.nombres} en el comité`}
                      value={miembro.rol}
                      onChange={(e) =>
                        cambiarRol(miembro, e.target.value)
                      }
                      options={[
                        { value: 'PRESIDENTE', label: 'Presidente' },
                        { value: 'VOCAL', label: 'Vocal' },
                        { value: 'SECRETARIO', label: 'Secretario' },
                      ]}
                      className="w-44"
                    />
                    <Button
                      variant="ghost"
                      onClick={() => quitarMiembro(miembro)}
                      disabled={enviando}
                    >
                      Quitar
                    </Button>
                  </div>
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
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-brutal-tinta">{comite.nombre}</h3>
                  {comite.activo ? (
                    <Badge estado="APROBAR" />
                  ) : (
                    <span className="rounded-brutal border-2 border-brutal-tinta bg-gray-300 px-2 py-0.5 font-brut text-xs font-bold text-brutal-tinta">
                      Archivado
                    </span>
                  )}
                </div>
                <p className="text-sm text-brutal-tinta/70">
                  {comite.descripcion ?? 'Sin descripción'} · {comite._count?.miembros ?? 0} miembros
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" onClick={() => cambiarEstado(comite, !comite.activo)} disabled={enviando}>
                  {comite.activo ? 'Archivar' : 'Reactivar'}
                </Button>
                <Button variant="ghost" onClick={() => abrirDetalle(comite.id)}>
                  Gestionar miembros
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
