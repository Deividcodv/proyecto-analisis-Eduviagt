'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { httpData } from '@/lib/api';
import {
  getAccessToken,
  getRefreshToken,
  logout as logoutLocal,
  refreshAccessToken,
  Usuario,
  login as loginApi,
} from '@/lib/auth';

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarPerfil = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setUsuario(null);
        return;
      }
      const perfil = await httpData<{ id: string; cui: string; nombres: string; email: string; rol: { nombre: string } }>(
        '/auth/perfil',
        { token },
      );
      setUsuario({
        id: perfil.id,
        cui: perfil.cui,
        nombres: perfil.nombres,
        email: perfil.email,
        rol: perfil.rol.nombre,
      });
    } catch {
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await refreshAccessToken();
      await cargarPerfil();
    };
    void init();
  }, [cargarPerfil]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginApi(email, password);
    setUsuario(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    logoutLocal();
    setUsuario(null);
  }, []);

  const getToken = useCallback(() => getAccessToken(), []);

  const value = useMemo<AuthContextValue>(
    () => ({ usuario, cargando, login, logout, getToken }),
    [usuario, cargando, login, logout, getToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}

export function useRefreshToken(): string | null {
  return getRefreshToken();
}
