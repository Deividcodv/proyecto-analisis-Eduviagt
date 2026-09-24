'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
}

function rutaPorRol(rol: string): string {
  const r = (rol || '').toUpperCase();
  if (r === 'EVALUADOR') return '/evaluador';
  if (r !== 'POSTULANTE') return '/admin';
  return '/dashboard';
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;
    if (!usuario) {
      router.replace('/login');
      return;
    }
    if (roles && !roles.includes((usuario.rol || '').toUpperCase())) {
      router.replace(rutaPorRol(usuario.rol));
    }
  }, [cargando, usuario, roles, router]);

  if (cargando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  if (roles && !roles.includes((usuario.rol || '').toUpperCase())) {
    return null;
  }

  return <>{children}</>;
}
