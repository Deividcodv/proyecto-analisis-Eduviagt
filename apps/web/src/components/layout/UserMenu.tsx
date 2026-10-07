'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { MenuAcciones } from '@/components/layout/MenuAcciones';

export function UserMenu() {
  const { usuario, cargando, logout } = useAuth();
  const router = useRouter();

  if (cargando) return null;

  if (!usuario) {
    return (
      <div className="hidden gap-3 md:flex">
        <Button
          href="/login"
          variant="ghost"
          className="!border-brutal-papel !bg-transparent !text-brutal-papel hover:!bg-brutal-gold hover:!text-brutal-tinta"
        >
          Iniciar sesión
        </Button>
        <Button href="/registro">Registrarse</Button>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="hidden items-center gap-3 md:flex">
      <MenuAcciones />
      <span className="font-mono text-xs text-brutal-papel">
        Hola, {usuario.nombres.split(' ')[0]}
      </span>
      <Button
        onClick={handleLogout}
        className="!border-brutal-rojo !bg-brutal-rojo !text-brutal-papel hover:!bg-brutal-tinta hover:!text-brutal-papel"
      >
        Cerrar sesión
      </Button>
    </div>
  );
}
