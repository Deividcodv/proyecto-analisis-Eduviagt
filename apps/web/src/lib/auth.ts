import { httpData } from '@/lib/api';

const ACCESS_KEY = 'sigeb_access_token';
const REFRESH_KEY = 'sigeb_refresh_token';

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
  user: Usuario;
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
