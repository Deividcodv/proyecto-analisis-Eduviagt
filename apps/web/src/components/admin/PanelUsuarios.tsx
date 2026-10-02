'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import {
  listarUsuarios,
  listarRoles,
  crearUsuario,
  actualizarUsuario,
  obtenerUsuario,
  asignarPermisosAUsuario,
  listarPermisos,
  type UsuarioListItem,
  type Rol,
  type Permiso,
  type PermisoEfecto,
} from '@/lib/seguridad';

type EstadoPermiso = PermisoEfecto | null;

const EFECTOS: EstadoPermiso[] = [null, 'PERMITIR', 'DENEGAR'];

export function PanelUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioListItem[] | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevo, setNuevo] = useState({
    cui: '',
    nombres: '',
    email: '',
    password: '',
    rolId: '',
  });

  const [detalleId, setDetalleId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [lista, listaRoles] = await Promise.all([
        listarUsuarios(),
        listarRoles(),
      ]);
      setUsuarios(lista);
      setRoles(listaRoles);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los usuarios');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crear = async () => {
    if (!nuevo.cui || !nuevo.nombres || !nuevo.email || !nuevo.password || !nuevo.rolId) {
      setError('Todos los campos son obligatorios');
      return;
    }
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await crearUsuario(nuevo);
      setExito('Usuario/empleado creado.');
      setMostrarForm(false);
      setNuevo({ cui: '', nombres: '', email: '', password: '', rolId: '' });
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el usuario');
    } finally {
      setEnviando(false);
    }
  };

  const cambiarRol = async (usuario: UsuarioListItem, rolId: string) => {
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await actualizarUsuario(usuario.id, { rolId });
      setExito(`Rol de ${usuario.nombres} actualizado.`);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el rol');
    } finally {
      setEnviando(false);
    }
  };

  const cambiarEstado = async (usuario: UsuarioListItem) => {
    const nuevoEstado = usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await actualizarUsuario(usuario.id, { estado: nuevoEstado });
      setExito(
        nuevoEstado === 'ACTIVO'
          ? `Usuario ${usuario.nombres} activado.`
          : `Usuario ${usuario.nombres} inactivado.`,
      );
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el estado');
    } finally {
      setEnviando(false);
    }
  };

  const filtrados = (usuarios ?? []).filter((u) => {
    const q = busqueda.trim().toLowerCase();
    const coincideTexto =
      !q ||
      u.nombres.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.cui.includes(q);
    const coincideRol = !filtroRol || u.rol.nombre === filtroRol;
    return coincideTexto && coincideRol;
  });

  if (!usuarios) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">{error}</p>
      )}
      {exito && (
        <p className="mb-4 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-lima/30 p-4 text-sm font-bold text-brutal-tinta">{exito}</p>
      )}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            placeholder="Buscar por nombre, correo o CUI…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="md:w-72"
          />
          <Select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            options={roles.map((r) => ({ value: r.nombre, label: r.nombre }))}
            placeholder="Todos los roles"
            className="md:w-56"
          />
        </div>
        <Button onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? 'Cancelar' : '+ Nuevo usuario/empleado'}
        </Button>
      </div>

      {mostrarForm && (
        <Card className="mb-6">
          <h2 className="mb-4 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
            Nuevo usuario / empleado
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="CUI (13 dígitos)"
              value={nuevo.cui}
              onChange={(e) => setNuevo((n) => ({ ...n, cui: e.target.value }))}
              maxLength={13}
            />
            <Input
              label="Nombres completos"
              value={nuevo.nombres}
              onChange={(e) => setNuevo((n) => ({ ...n, nombres: e.target.value }))}
            />
            <Input
              label="Correo electrónico"
              type="email"
              value={nuevo.email}
              onChange={(e) => setNuevo((n) => ({ ...n, email: e.target.value }))}
            />
            <Input
              label="Contraseña inicial"
              type="password"
              value={nuevo.password}
              onChange={(e) => setNuevo((n) => ({ ...n, password: e.target.value }))}
            />
            <Select
              label="Rol"
              value={nuevo.rolId}
              onChange={(e) => setNuevo((n) => ({ ...n, rolId: e.target.value }))}
              options={roles.map((r) => ({ value: r.id, label: r.nombre }))}
            />
          </div>
          <div className="mt-4">
            <Button onClick={crear} disabled={enviando}>
              {enviando ? <Spinner /> : 'Crear usuario'}
            </Button>
          </div>
        </Card>
      )}

      {detalleId && (
        <MatrizPermisosUsuario
          usuarioId={detalleId}
          onClose={() => setDetalleId(null)}
          onGuardado={() => {
            cargar();
            setExito('Permisos individuales actualizados.');
          }}
          onError={(msg) => setError(msg)}
        />
      )}

      <div className="overflow-x-auto rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco">
        <table className="w-full min-w-[760px] text-left font-mono text-sm">
          <thead className="border-b-[3px] border-brutal-tinta bg-brutal-tinta">
            <tr className="text-xs font-bold uppercase tracking-wide text-brutal-papel">
              <th className="px-4 py-3">CUI</th>
              <th className="px-4 py-3">Nombres</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brutal-tinta/20">
            {filtrados.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-brutal-cyan/10">
                <td className="px-4 py-3 text-xs text-brutal-tinta/60">{usuario.cui}</td>
                <td className="px-4 py-3 font-bold text-brutal-tinta">{usuario.nombres}</td>
                <td className="px-4 py-3 text-brutal-tinta/70">{usuario.email}</td>
                <td className="px-4 py-3">
                  <Select
                    value={usuario.rol.nombre}
                    onChange={(e) => cambiarRol(usuario, roles.find((r) => r.nombre === e.target.value)?.id ?? '')}
                    options={roles.map((r) => ({ value: r.nombre, label: r.nombre }))}
                    className="w-48"
                  />
                </td>
                <td className="px-4 py-3">
                  <Badge estado={usuario.estado} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      className="!px-3 !py-1.5 text-xs"
                      onClick={() => setDetalleId(usuario.id)}
                    >
                      Permisos
                    </Button>
                    <Button
                      variant="ghost"
                      className="!px-3 !py-1.5 text-xs"
                      onClick={() => cambiarEstado(usuario)}
                      disabled={enviando}
                    >
                      {usuario.estado === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-brutal-tinta/50">
                  No hay usuarios que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface MatrizPermisosUsuarioProps {
  usuarioId: string;
  onClose: () => void;
  onGuardado: () => void;
  onError: (msg: string) => void;
}

function MatrizPermisosUsuario({
  usuarioId,
  onClose,
  onGuardado,
  onError,
}: MatrizPermisosUsuarioProps) {
  const [permisos, setPermisos] = useState<Permiso[] | null>(null);
  const [estados, setEstados] = useState<Record<string, EstadoPermiso>>({});
  const [nombre, setNombre] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.all([obtenerUsuario(usuarioId), listarPermisos()])
      .then(([usuario, lista]) => {
        if (!activo) return;
        setNombre(usuario.nombres);
        setPermisos(lista);
        const mapa: Record<string, EstadoPermiso> = {};
        lista.forEach((p) => {
          mapa[p.id] = null;
        });
        (usuario.usuarioPermisos ?? []).forEach((up) => {
          mapa[up.permiso.id] = up.efecto;
        });
        setEstados(mapa);
      })
      .catch((e) => {
        if (activo) onError(e instanceof Error ? e.message : 'No se pudieron cargar los permisos');
      });
    return () => {
      activo = false;
    };
  }, [usuarioId, onError]);

  const ciclar = (permisoId: string) => {
    setEstados((prev) => {
      const actual = prev[permisoId] ?? null;
      const siguiente = EFECTOS[(EFECTOS.indexOf(actual) + 1) % EFECTOS.length];
      return { ...prev, [permisoId]: siguiente };
    });
  };

  const guardar = async () => {
    setEnviando(true);
    try {
      await asignarPermisosAUsuario(usuarioId, {
        permisos: Object.entries(estados)
          .filter(([, efecto]) => efecto !== null)
          .map(([permisoId, efecto]) => ({ permisoId, efecto: efecto as PermisoEfecto })),
      });
      onGuardado();
      onClose();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudieron guardar los permisos');
    } finally {
      setEnviando(false);
    }
  };

  if (!permisos) {
    return <div className="flex justify-center py-10"><Spinner /></div>;
  }

  const modulos = Array.from(new Set(permisos.map((p) => p.modulo)));

  return (
    <Card className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
          Permisos individuales — <span className="text-sigeb-blue">{nombre}</span>
        </h2>
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      </div>
      <p className="mb-4 font-mono text-sm text-brutal-tinta/70">
        Haz clic para alternar: vacío = heredar del rol · ✓ = PERMITIR · ✗ = DENEGAR.
      </p>
      <div className="overflow-x-auto rounded-brutal border-[3px] border-brutal-tinta">
        <table className="w-full text-left font-mono text-sm">
          <thead className="border-b-[3px] border-brutal-tinta bg-brutal-tinta">
            <tr>
              <th className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-brutal-papel">Módulo</th>
              <th className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-brutal-papel">Acción</th>
              <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wide text-brutal-papel">Efecto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brutal-tinta/20">
            {modulos.map((modulo) => (
              <PermisosPorModulo
                key={modulo}
                modulo={modulo}
                permisos={permisos.filter((p) => p.modulo === modulo)}
                estados={estados}
                onCiclar={ciclar}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-2">
        <Button onClick={guardar} disabled={enviando}>
          {enviando ? <Spinner /> : 'Guardar permisos'}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Card>
  );
}

function PermisosPorModulo({
  modulo,
  permisos,
  estados,
  onCiclar,
}: {
  modulo: string;
  permisos: Permiso[];
  estados: Record<string, EstadoPermiso>;
  onCiclar: (permisoId: string) => void;
}) {
  return (
    <>
      <tr className="bg-brutal-gold/40">
        <td
          colSpan={3}
          className="px-4 py-2 font-brut text-xs font-black uppercase tracking-wide text-brutal-tinta"
        >
          ▸ {modulo}
        </td>
      </tr>
      {permisos.map((permiso) => (
        <tr key={permiso.id} className="hover:bg-brutal-cyan/10">
          <td className="px-4 py-2 font-bold text-brutal-tinta">{permiso.accion}</td>
          <td colSpan={2} className="px-4 py-2 text-right">
            <button
              type="button"
              onClick={() => onCiclar(permiso.id)}
              className={`inline-flex min-w-[8rem] items-center justify-center gap-2 rounded-brutal border-[3px] px-3 py-1.5 font-brut text-xs font-bold uppercase tracking-wide transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${
                estados[permiso.id] === 'PERMITIR'
                  ? 'border-brutal-tinta bg-brutal-lima text-brutal-tinta shadow-brutal-sm'
                  : estados[permiso.id] === 'DENEGAR'
                    ? 'border-brutal-tinta bg-brutal-rojo text-brutal-blanco shadow-brutal-sm'
                    : 'border-brutal-tinta border-dashed bg-brutal-blanco text-brutal-tinta/60'
              }`}
            >
              {estados[permiso.id] === 'PERMITIR'
                ? '✓ PERMITIR'
                : estados[permiso.id] === 'DENEGAR'
                  ? '✗ DENEGAR'
                  : '— Herencia'}
            </button>
          </td>
        </tr>
      ))}
    </>
  );
}