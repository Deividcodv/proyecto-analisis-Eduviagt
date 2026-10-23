'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';

/**
 * Error global de la aplicación.
 *
 * Antes, un fallo de renderizado devolvía la pantalla en blanco del
 * navegador. Ahora hay una pantalla explicativa, con la forma de reintentar
 * sin perder lo que la persona estaba haciendo.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Queda registrado en la consola del navegador para poder diagnosticarlo.
    console.error('Error global de la aplicación:', error);
  }, [error]);

  return (
    <html lang="es">
      <body className="brut-body">
        <Container className="flex min-h-screen flex-col items-center justify-center py-16 text-center">
          <Icon name="alerta" className="mb-6 h-16 w-16 text-brutal-rojo" />
          <h1 className="mb-3 font-brut text-3xl font-black uppercase tracking-wide text-brutal-tinta">
            Algo salió mal
          </h1>
          <p className="mb-8 max-w-md text-brutal-tinta/80">
            No pudimos mostrar esta pantalla. El problema ya quedó registrado y
            el equipo lo revisará.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => reset()}>Reintentar</Button>
            <Link
              href="/"
              className="inline-block rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco px-6 py-2.5 font-brut font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm"
            >
              Ir al inicio
            </Link>
          </div>
          {error.digest && (
            <p className="mt-8 font-mono text-xs text-brutal-tinta/60">
              Referencia: {error.digest}
            </p>
          )}
        </Container>
      </body>
    </html>
  );
}
