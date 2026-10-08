'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export function BotonPostular({
  convocatoriaId,
  abierta,
}: {
  convocatoriaId: string;
  abierta: boolean;
}) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="h-12 animate-pulse rounded-brutal border-[3px] border-brutal-tinta/30 bg-brutal-tinta/10" />
    );
  }

  if (!abierta) {
    return (
      <>
        <Button disabled className="w-full text-center">
          Convocatoria cerrada
        </Button>
        <p className="text-center font-mono text-xs text-brutal-tinta/60">
          Esta convocatoria ya no acepta postulaciones.
        </p>
      </>
    );
  }

  if (usuario) {
    return (
      <>
        <Button
          href={`/convocatorias/${convocatoriaId}/aplicar`}
          className="w-full text-center"
        >
          Postularme ahora
        </Button>
        <p className="text-center font-mono text-xs text-brutal-tinta/80">
          Iniciarás un expediente de postulación.{' '}
          <Link href="/dashboard" className="font-brut font-bold text-brutal-cyan hover:bg-brutal-cyan/20">
            Ir a mis solicitudes
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <Button href="/registro" className="w-full text-center">
        Crear cuenta y postularme
      </Button>
      <p className="text-center font-mono text-xs text-brutal-tinta/80">
        <Link href="/login" className="font-brut font-bold text-brutal-cyan hover:bg-brutal-cyan/20">
          Inicia sesión
        </Link>{' '}
        si ya tienes una cuenta.
      </p>
    </>
  );
}