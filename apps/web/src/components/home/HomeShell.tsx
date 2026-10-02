'use client';

import { useAuth } from '@/context/AuthContext';
import { LandingPublico } from '@/components/home/LandingPublico';
import { Workbench } from '@/components/home/Workbench';

export function HomeShell() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <section className="brut-cinta border-b-[3px] border-brutal-tinta bg-brutal-tinta py-24 text-brutal-papel">
        <p className="brut-label text-center text-xs font-bold text-brutal-gold">
          // Cargando SIGEB…
        </p>
      </section>
    );
  }

  if (usuario) return <Workbench />;
  return <LandingPublico />;
}