import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';

/**
 * Página 404.
 *
 * Antes, una ruta inexistente devolvía la pantalla en blanco de Next.js, sin
 * ninguna vía de salida del portal.
 */
export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-brut text-6xl font-black uppercase tracking-wide text-brutal-cyan">
        404
      </p>
      <h1 className="mb-3 mt-4 font-brut text-2xl font-black uppercase tracking-wide text-brutal-tinta">
        Esta página no existe
      </h1>
      <p className="mb-8 max-w-md text-brutal-tinta/80">
        Puede que el enlace esté mal escrito o que la convocatoria que
        buscabas ya haya cerrado.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-block rounded-brutal border-[3px] border-brutal-tinta bg-brutal-gold px-6 py-2.5 font-brut font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm"
        >
          Ir al inicio
        </Link>
        <Link
          href="/convocatorias"
          className="inline-flex items-center gap-2 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco px-6 py-2.5 font-brut font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm"
        >
          <Icon name="becas" className="h-5 w-5" />
          Ver convocatorias
        </Link>
      </div>
    </Container>
  );
}
