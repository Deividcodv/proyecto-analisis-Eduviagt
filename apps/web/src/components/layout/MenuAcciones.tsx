'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { accionesPorRol } from '@/lib/acciones';
import { Icon } from '@/components/ui/Icon';

export function MenuAcciones() {
  const { usuario } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!abierto) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [abierto]);

  useEffect(() => { setAbierto(false); }, [pathname]);

  if (!usuario) return null;

  const rol = (usuario.rol || '').toUpperCase();
  const acciones = accionesPorRol[rol] ?? accionesPorRol.ADMIN;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-brutal border-2 border-brutal-cyan bg-brutal-cyan px-3 py-1.5 font-brut text-xs font-black uppercase tracking-wide text-brutal-tinta transition-colors hover:-translate-y-0.5 hover:bg-brutal-papel"
      >
        <Icon name="panel" className="h-4 w-4" />
        Acciones
        <span className="text-[10px]">{abierto ? '▲' : '▼'}</span>
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-2 shadow-brutal"
        >
          <p className="brut-label mb-1 px-2 pt-1 text-[10px] font-bold uppercase text-brutal-tinta/50">
            Puedes realizar
          </p>
          <nav className="flex flex-col">
            {acciones.map((accion) => (
              <Link
                key={accion.titulo}
                href={accion.href}
                onClick={() => setAbierto(false)}
                className="flex items-center gap-3 rounded-brutal border-2 border-transparent px-2 py-2 text-brutal-tinta transition-colors hover:border-brutal-tinta hover:bg-white"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 border-brutal-tinta text-base text-brutal-tinta ${accion.acento}`}
                >
                  <Icon name={accion.icono} className="h-4 w-4" />
                </span>
                <span className="font-brut text-xs font-bold uppercase tracking-wide">
                  {accion.titulo}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
