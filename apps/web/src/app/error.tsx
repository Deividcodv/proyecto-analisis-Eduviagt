'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';

/**
 * Error de una sección de la web.
 *
 * Aísla el fallo: si una parte falla, el resto de la página sigue
 * funcionando y la persona puede reintentar sin recargarla entera.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error en la página:', error);
  }, [error]);

  return (
    <Container className="py-16 text-center">
      <Icon name="alerta" className="mb-6 mx-auto h-14 w-14 text-brutal-rojo" />
      <h2 className="mb-3 font-brut text-2xl font-black uppercase tracking-wide text-brutal-tinta">
        No pudimos cargar esta sección
      </h2>
      <p className="mx-auto mb-8 max-w-md text-brutal-tinta/80">
        Vuelve a intentarlo. Si el problema continúa, revisa tu conexión o
        escribe a soporte.
      </p>
      <Button onClick={() => reset()}>Reintentar</Button>
    </Container>
  );
}
