'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { rutaPorRol, nombreRol } from '@/lib/rol';
import { enlacesPublicos, navegacionDeRol, type EnlaceNav } from '@/lib/navegacion';
import { Icon } from '@/components/ui/Icon';

interface NavigationDrawerProps {
  abierto: boolean;
  onCerrar: () => void;
}

export function NavigationDrawer({ abierto, onCerrar }: NavigationDrawerProps) {
  const { usuario, logout } = useAuth();
  const router = useRouter();
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', onKey);
    cerrarRef.current?.focus();
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const grupos = usuario ? navegacionDeRol(usuario.rol) : [];

  const handleLogout = () => {
    onCerrar();
    logout();
    router.push('/');
  };

  const renderEnlace = (enlace: EnlaceNav) => (
    <Link
      key={enlace.href}
      href={enlace.href}
      onClick={onCerrar}
      className="flex items-center gap-3 rounded-brutal border-2 border-transparent px-3 py-2.5 text-brutal-tinta transition-colors hover:border-brutal-tinta hover:bg-white"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-brutal-tinta bg-brutal-cyan text-brutal-tinta">
        <Icon name={enlace.icono} className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-brut text-sm font-bold uppercase tracking-wide">
          {enlace.label}
        </span>
        {enlace.descripcion && (
          <span className="block truncate text-xs text-brutal-tinta/60">
            {enlace.descripcion}
          </span>
        )}
      </span>
    </Link>
  );

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación"
    >
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={onCerrar}
        className="absolute inset-0 h-full w-full cursor-default bg-brutal-tinta/70"
      />

      <aside className="absolute left-0 top-0 flex h-full w-full max-w-sm flex-col overflow-y-auto border-r-[3px] border-brutal-tinta bg-brutal-papel shadow-brutal">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-brutal-tinta bg-brutal-tinta px-4 py-3">
          <Link href="/" onClick={onCerrar} className="flex items-center gap-2">
            <span className="h-9 w-9 overflow-hidden rounded-md border-2 border-brutal-papel">
              <Image
                src="/marca.svg"
                alt="EDUVIAGT"
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            </span>
            <span className="font-brut text-base font-black uppercase tracking-wide text-brutal-papel">
              EDUVIAGT
            </span>
          </Link>
          <button
            ref={cerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="flex h-9 w-9 items-center justify-center border-2 border-brutal-papel text-brutal-papel transition-colors hover:bg-brutal-gold hover:text-brutal-tinta"
          >
            <Icon name="cerrar" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 px-4 py-5">
          {usuario ? (
            <>
              <p className="brut-label mb-1 text-[10px] font-bold uppercase text-brutal-tinta/50">
                Sesión activa
              </p>
              <p className="font-brut text-sm font-bold text-brutal-tinta">
                {usuario.nombres}
              </p>
              <p className="mb-4 text-xs text-brutal-tinta/60">{nombreRol(usuario.rol)}</p>

              <Link
                href={rutaPorRol(usuario.rol)}
                onClick={onCerrar}
                className="mb-4 flex items-center gap-3 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-gold px-3 py-3 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                <Icon name="panel" className="h-5 w-5" />
                Ir a mi panel
              </Link>

              {grupos.map((grupo) => (
                <div key={grupo.titulo} className="mb-5">
                  <p className="brut-label mb-2 px-1 text-[10px] font-bold uppercase text-brutal-tinta/50">
                    {grupo.titulo}
                  </p>
                  <nav className="flex flex-col gap-1">
                    {grupo.enlaces.map(renderEnlace)}
                  </nav>
                </div>
              ))}

              <div className="mb-5">
                <p className="brut-label mb-2 px-1 text-[10px] font-bold uppercase text-brutal-tinta/50">
                  Explora
                </p>
                <nav className="flex flex-col gap-1">
                  {enlacesPublicos.map(renderEnlace)}
                </nav>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-rojo px-3 py-3 font-brut text-sm font-bold uppercase tracking-wide text-brutal-papel transition-colors hover:bg-brutal-tinta"
              >
                <Icon name="salir" className="h-5 w-5" />
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <p className="brut-label mb-2 px-1 text-[10px] font-bold uppercase text-brutal-tinta/50">
                Navegación
              </p>
              <nav className="mb-5 flex flex-col gap-1">
                {enlacesPublicos.map(renderEnlace)}
              </nav>

              <div className="grid gap-3">
                <Link
                  href="/login"
                  onClick={onCerrar}
                  className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco px-4 py-3 text-center font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta transition-colors hover:bg-brutal-cyan"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  onClick={onCerrar}
                  className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-tinta px-4 py-3 text-center font-brut text-sm font-bold uppercase tracking-wide text-brutal-papel transition-colors hover:bg-brutal-gold hover:text-brutal-tinta"
                >
                  Registrarse
                </Link>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
