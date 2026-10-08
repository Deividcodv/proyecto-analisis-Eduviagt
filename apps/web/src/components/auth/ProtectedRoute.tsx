'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { rutaPorRol } from '@/lib/rol';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
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
