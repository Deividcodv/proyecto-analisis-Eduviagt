import { fetchConToken } from '@/lib/api-auth';

export type PermisoEfecto = 'PERMITIR' | 'DENEGAR';

export interface Permiso {
  id: string;
  modulo: string;
  accion: string;
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion?: string | null;
  rolPermisos: { permiso: Permiso }[];
}

export interface UsuarioListItem {
  id: string;
  cui: string;
  nombres: string;
  email: string;
  estado: 'ACTIVO' | 'INACTIVO';
  rol: { nombre: string };
}

export interface UsuarioDetalle {
  id: string;
  cui: string;
  nombres: string;
  email: string;
  estado: 'ACTIVO' | 'INACTIVO';
  rol: { id: string; nombre: string };
  usuarioPermisos: { efecto: PermisoEfecto; permiso: Permiso }[];
}

export interface CrearUsuarioPayload {
  cui: string;
  nombres: string;
  email: string;
  password: string;
  rolId: string;
}

export interface AsignarUsuarioPermisosPayload {
  permisos: { permisoId: string; efecto: PermisoEfecto }[];
}

export function listarRoles() {
  return fetchConToken<Rol[]>('/seguridad/roles');
}

export function listarPermisos() {
  return fetchConToken<Permiso[]>('/seguridad/permisos');
}

export function listarUsuarios(rol?: string) {
  const query = rol ? `?rol=${encodeURIComponent(rol)}` : '';
  return fetchConToken<UsuarioListItem[]>(`/seguridad/usuarios${query}`);
}

export function obtenerUsuario(id: string) {
  return fetchConToken<UsuarioDetalle>(`/seguridad/usuarios/${id}`);
}

export function crearUsuario(payload: CrearUsuarioPayload) {
  return fetchConToken<UsuarioListItem>('/seguridad/usuarios', {
    method: 'POST',
    body: payload,
  });
}

export function actualizarUsuario(
  id: string,
  payload: { rolId?: string; estado?: 'ACTIVO' | 'INACTIVO' },
) {
  return fetchConToken<UsuarioListItem>(`/seguridad/usuarios/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}

export function asignarPermisosAUsuario(
  id: string,
  payload: AsignarUsuarioPermisosPayload,
) {
  return fetchConToken<UsuarioDetalle>(`/seguridad/usuarios/${id}/permisos`, {
    method: 'PATCH',
    body: payload,
  });
}

export function asignarPermisosARol(rolId: string, permisoIds: string[]) {
  return fetchConToken<Rol>(`/seguridad/roles/${rolId}/permisos`, {
    method: 'PATCH',
    body: { permisoIds },
  });
}