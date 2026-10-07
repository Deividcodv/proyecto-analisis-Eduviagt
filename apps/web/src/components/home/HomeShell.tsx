'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LandingPublico } from '@/components/home/LandingPublico';
import { HogarPostulante } from '@/components/home/HogarPostulante';
import { rutaPorRol } from '@/lib/rol';

export function HomeShell() {
  const { usuario, cargando } = useAuth();
  const router = useRouter();
  const rol = (usuario?.rol ?? '').toUpperCase();

  useEffect(() => {
    if (cargando || !usuario) return;
    if (rol !== 'POSTULANTE') {
      router.replace(rutaPorRol(rol));
    }
  }, [cargando, usuario, rol, router]);

  if (cargando) {
    return (
      <section className="brut-cinta border-b-[3px] border-brutal-tinta bg-brutal-tinta py-24 text-brutal-papel">
        <p className="brut-label text-center text-xs font-bold text-brutal-gold">
          // Cargando EDUVIAGT…
        </p>
      </section>
    );
  }

  if (!usuario) return <LandingPublico />;
  if (rol === 'POSTULANTE') return <HogarPostulante />;

  return (
    <section className="flex min-h-[40vh] items-center justify-center py-24">
      <p className="font-mono text-sm text-brutal-tinta/70">
        Llevándote a tu panel…
      </p>
    </section>
  );
}
