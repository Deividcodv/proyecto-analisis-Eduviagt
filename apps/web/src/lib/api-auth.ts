import { refreshAccessToken } from '@/lib/auth';

export interface PeticionAutenticadaOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  isFormData?: boolean;
}

export async function fetchConToken<T>(
  path: string,
  options: PeticionAutenticadaOptions = {},
): Promise<T> {
  const { method = 'GET', body, isFormData = false } = options;

  const doFetch = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (!isFormData && body !== undefined) headers['content-type'] = 'application/json';
    if (token) headers.authorization = `Bearer ${token}`;

    return fetch(`/api${path}`, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? (body as FormData)
            : JSON.stringify(body),
    });
  };

  let res = await doFetch(getToken());

  if (res.status === 401) {
    const nuevo = await refreshAccessToken();
    if (nuevo) {
      res = await doFetch(nuevo);
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const mensaje =
      (data as { message?: string } | null)?.message ??
      `La API respondió con estado ${res.status}`;
    throw new Error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
  }

  const json = (await res.json()) as { data: T };
  return json.data;

  function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('sigeb_access_token');
  }
}
