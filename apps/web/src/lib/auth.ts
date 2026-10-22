import { httpData } from '@/lib/api';

const ACCESS_KEY = 'sigeb_access_token';
const REFRESH_KEY = 'sigeb_refresh_token';

// S-004: la API devuelve el rol siempre como objeto { id, nombre }
// (login, registro y perfil). En el cliente se aplana a texto una sola vez
// en el AuthContext, para que el resto de la app siga trabajando con strings.
export interface UsuarioRespuesta {
  id: string;
  cui: string;
  nombres: string;
  email: string;
  rol: { id: string; nombre: string };
}

export interface Usuario {
  id: string;
  cui: string;
  nombres: string;
  email: string;
  rol: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UsuarioRespuesta;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function storeTokens(accessToken: string, refreshToken: string) {
  window.localStorage.setItem(ACCESS_KEY, accessToken);
  window.localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

/**
 * Cierra la sesión en el navegador sin tocar el estado de la interfaz: se
 * usa cuando la persona debe poder seguir viendo una pantalla (por ejemplo,
 * el resumen de qué se borró al eliminar su cuenta).
 *
 * Los tokens de acceso son de corta duración y el servidor ya invalida la
 * cuenta eliminada, así que no hace falta llamar a ningún endpoint.
 */
export function cerrarSesionLocal(): void {
  clearTokens();
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await httpData<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  storeTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function registrar(datos: {
  cui: string;
  nombres: string;
  email: string;
  password: string;
}): Promise<void> {
  await httpData('/auth/registro', { method: 'POST', body: datos });
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const data = await httpData<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
    window.localStorage.setItem(ACCESS_KEY, data.accessToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

export function logout() {
  clearTokens();
}
