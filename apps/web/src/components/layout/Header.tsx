'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { NavigationDrawer } from '@/components/layout/NavigationDrawer';
import { UserMenu } from '@/components/layout/UserMenu';
import { CampanaNotificaciones } from '@/components/layout/CampanaNotificaciones';

const enlacesPublicos = [
  { href: '/', label: 'Inicio' },
  { href: '/convocatorias', label: 'Convocatorias' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/consulta', label: 'Consultar solicitud' },
];

export function Header() {
  const { usuario, cargando } = useAuth();
  const esLogueado = !cargando && !!usuario;
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-brutal-tinta bg-brutal-tinta">
      <Container className="flex items-center gap-3 py-3">
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú de navegación"
          aria-expanded={menuAbierto}
          aria-controls="menu-navegacion"
          className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-brutal-papel text-brutal-papel transition-colors hover:bg-brutal-gold hover:text-brutal-tinta"
        >
          <Icon name="menu" className="h-6 w-6" />
        </button>

        <Link href="/" className="group flex items-center gap-3">
          <div className="h-11 w-11 overflow-hidden rounded-md border-[3px] border-brutal-tinta shadow-brutal-sm transition-transform group-hover:-rotate-6">
            <Image src="/marca.svg" alt="EDUVIAGT" width={44} height={44} className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="font-brut text-lg font-black uppercase leading-tight tracking-wide text-brutal-papel">
              EDUVIAGT
            </p>
            <p className="brut-label text-[10px] leading-tight text-brutal-cyan">
              Sistema Integral de Gestión de Becas
            </p>
          </div>
        </Link>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {!esLogueado && (
            <nav className="flex items-center gap-1">
              {enlacesPublicos.map((enlace) => (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  className="px-3 py-2 font-brut text-xs font-bold uppercase tracking-wide text-brutal-papel transition-colors hover:bg-brutal-gold hover:text-brutal-tinta"
                >
                  {enlace.label}
                </Link>
              ))}
            </nav>
          )}
          {esLogueado && <CampanaNotificaciones />}
          <UserMenu />
        </div>

        <NavigationDrawer
          abierto={menuAbierto}
          onCerrar={() => setMenuAbierto(false)}
        />
      </Container>
    </header>
  );
}
