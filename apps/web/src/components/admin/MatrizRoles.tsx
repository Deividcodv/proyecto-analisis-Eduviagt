'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Spinner } from '@/components/ui/Spinner';

interface Permiso {
  id: string;
  modulo: string;
  accion: string;
  descripcion?: string;
}

interface Rol {
  id: string;
  nombre: string;
  descripcion?: string;
  rolPermisos: { permiso: Permiso }[];
}

export function MatrizRoles() {
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

  const modulos = Array.from(new Set(permisos.map((p) => p.modulo)));

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">{error}</p>
      )}
      {exito && (
        <p className="mb-4 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-lima/30 p-4 text-sm font-bold text-brutal-tinta">{exito}</p>
      )}

      <div className="overflow-x-auto rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco">
        <table className="w-full min-w-[860px] text-left font-mono text-sm">
          <thead className="border-b-[3px] border-brutal-tinta bg-brutal-tinta">
            <tr>
              <th className="px-4 py-3 align-bottom text-xs font-bold uppercase tracking-wide text-brutal-papel">
                Módulo / Acción
              </th>
              {roles.map((rol) => (
                <th
                  key={rol.id}
                  className="px-3 py-3 text-center align-bottom text-xs font-black uppercase tracking-wide text-brutal-gold"
                >
                  {rol.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brutal-tinta/20">
            {modulos.map((modulo) => (
              <Fragment key={modulo}>
                <tr className="bg-brutal-gold/40">
                  <td
                    colSpan={roles.length + 1}
                    className="px-4 py-2 font-brut text-xs font-black uppercase tracking-wide text-brutal-tinta"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Icon name="chevron" className="h-3 w-3 -rotate-90" />
                      {modulo}
                    </span>
                  </td>
                </tr>
                {permisos
                  .filter((p) => p.modulo === modulo)
                  .map((permiso) => (
                    <tr key={permiso.id} className="hover:bg-brutal-cyan/10">
                      <td className="px-4 py-2 font-bold text-brutal-tinta">{permiso.accion}</td>
                      {roles.map((rol) => (
                        <td key={rol.id} className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={(seleccion[rol.id] ?? new Set()).has(permiso.id)}
                            onChange={(e) =>
                              togglePermiso(rol.id, permiso.id, e.target.checked)
                            }
                            className="h-5 w-5 accent-brutal-tinta"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-6 mb-3 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
        Guardar por rol
      </h3>
      <div className="flex flex-wrap gap-3">
        {roles.map((rol) => (
          <div key={rol.id} className="flex items-center gap-2">
            <span className="brut-label text-sm font-bold text-brutal-tinta">{rol.nombre}</span>
            <Button onClick={() => guardar(rol.id)} disabled={enviando} className="!px-4 !py-2 text-xs">
              {enviando ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
