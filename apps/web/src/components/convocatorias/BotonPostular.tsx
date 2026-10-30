'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchConToken } from '@/lib/api-auth';
import { Button } from '@/components/ui/Button';

interface MiPostulacion {
  id: string;
  estado: string;
}

/** Estados en los que la postulación se puede seguir completando. */
const EDITABLES = ['BORRADOR', 'CORRECCION'];

export function BotonPostular({
  convocatoriaId,
  abierta,
}: {
  convocatoriaId: string;
  abierta: boolean;
}) {
  const { usuario, cargando } = useAuth();
  const [mi, setMi] = useState<MiPostulacion | null>(null);

  // Si la persona ya postuló a esta convocatoria, el botón lo dice: puede
  // continuar un borrador o ir a ver la postulación que ya envió.
  useEffect(() => {
    if (!usuario) {
      setMi(null);
      return;
    }
    let vigente = true;
    fetchConToken<MiPostulacion | null>(
      `/convocatorias/${convocatoriaId}/mi-solicitud`,
    )
      .then((dato) => {
        if (vigente) setMi(dato);
      })
      .catch(() => {
        // Sin la postulación no se cambia nada: el botón sigue siendo el de
        // postular.
      });
    return () => {
      vigente = false;
    };
  }, [usuario, convocatoriaId]);

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
    const enBorrador = mi ? EDITABLES.includes(mi.estado) : false;

    if (mi && !enBorrador) {
      return (
        <>
          <Button
            href={`/solicitudes/${mi.id}`}
            className="w-full text-center"
          >
            Ver mi postulación
          </Button>
          <p className="text-center font-mono text-xs text-brutal-tinta/80">
            Ya te postulaste a esta beca.{' '}
            <Link href="/dashboard" className="font-brut font-bold text-brutal-cyan hover:bg-brutal-cyan/20">
              Ir a mis solicitudes
            </Link>
          </p>
        </>
      );
    }

    return (
      <>
        <Button
          href={`/convocatorias/${convocatoriaId}/aplicar`}
          className="w-full text-center"
        >
          {enBorrador ? 'Continuar postulación' : 'Postularme ahora'}
        </Button>
        <p className="text-center font-mono text-xs text-brutal-tinta/80">
          {enBorrador
            ? 'Tienes una postulación a medio completar.'
            : 'Iniciarás tu postulación.'}{' '}
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