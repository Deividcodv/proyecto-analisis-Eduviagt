import { Container } from '@/components/ui/Container';

/**
 * Pantalla de carga global.
 *
 * Antes, mientras se cargaba una ruta, la persona veía una página en blanco
 * sin ninguna señal de que algo estaba pasando.
 */
export default function Loading() {
  return (
    <Container className="flex min-h-[50vh] flex-col items-center justify-center py-16">
      <div
        className="mb-6 h-12 w-12 animate-spin rounded-full border-[3px] border-brutal-tinta border-t-brutal-gold"
        role="status"
        aria-label="Cargando"
      />
      <p className="font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">
        Cargando EDUVIAGT…
      </p>
    </Container>
  );
}
