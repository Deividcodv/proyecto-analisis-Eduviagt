'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

const rutaPorRol = (rol: string): string => {
  const r = (rol || '').toUpperCase();
  if (r === 'EVALUADOR') return '/evaluador';
  if (r !== 'POSTULANTE') return '/admin';
  return '/dashboard';
};

export function UserMenu() {
  const { usuario, cargando, logout } = useAuth();
  const router = useRouter();

  if (cargando) return null;

  if (!usuario) {
    return (
      <div className="hidden gap-3 md:flex">
        <Button href="/login" variant="ghost">
          Iniciar sesión
        </Button>
        <Button href="/registro">Registrarse</Button>
      </div>
    );
  }

  const ruta = rutaPorRol(usuario.rol);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="hidden items-center gap-3 md:flex">
      <Link
        href={ruta}
        className="text-sm font-medium text-sigeb-blue-dark hover:text-sigeb-blue"
      >
        Hola, {usuario.nombres.split(' ')[0]}
      </Link>
      <Button onClick={handleLogout} variant="ghost">
        Cerrar sesión
      </Button>
    </div>
  );
}
