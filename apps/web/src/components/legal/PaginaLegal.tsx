import type { ReactNode } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';

/**
 * Estructura común de las páginas legales (privacidad, términos y cookies).
 *
 * Todas comparten la misma advertencia: el proyecto es un prototipo académico
 * sin autorización institucional, de modo que estos textos describen el
 * funcionamiento real del sistema y no constituyen documentos legales
 * definitivos.
 */
export function PaginaLegal({
  etiqueta,
  titulo,
  descripcion,
  actualizado,
  children,
}: {
  etiqueta: string;
  titulo: string;
  descripcion: string;
  actualizado: string;
  children: ReactNode;
}) {
  return (
    <main id="contenido-principal">
      <section className="brut-cinta border-b-[3px] border-brutal-tinta bg-sigeb-blue-dark py-12 text-brutal-papel">
        <Container>
          <p className="brut-label text-xs font-bold text-brutal-gold">
            // {etiqueta}
          </p>
          <h1 className="text-mega text-3xl font-black md:text-5xl">{titulo}</h1>
          <p className="mt-2 max-w-2xl font-mono text-sm text-brutal-papel/80">
            {descripcion}
          </p>
          <p className="mt-3 font-mono text-xs text-brutal-papel/60">
            Última actualización: {actualizado}
          </p>
        </Container>
      </section>

      <section className="bg-brutal-papel py-12">
        <Container>
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="rounded-brutal border-[3px] border-brutal-naranja bg-brutal-naranja/15 p-6">
              <h2 className="mb-2 flex items-center gap-2 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
                <Icon name="alerta" className="h-5 w-5 text-brutal-naranja" />
                Prototipo académico
              </h2>
              <p className="text-sm text-brutal-tinta/80">
                EDUVIAGT es un <strong>prototipo académico sin autorización
                institucional</strong>. Esta página describe con precisión cómo
                funciona el sistema en esta versión, pero no constituye un
                documento legal definitivo ni sustituye las políticas oficiales
                de la entidad que en su momento administre las becas. Antes de
                poner el sistema en producción deben aprobarse estas
                pantallas, definirse la entidad responsable y revisarse con
                asesoría jurídica.
              </p>
            </div>

            {children}

            <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-tinta p-8 text-brutal-papel shadow-brutal-sm">
              <h2 className="mb-3 font-brut text-2xl font-black uppercase tracking-wide text-brutal-gold">
                ¿Tienes dudas?
              </h2>
              <p className="mb-6 text-brutal-papel/80">
                Escríbenos por el formulario de contacto o consulta el centro de
                ayuda antes de presentar tu solicitud.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/contacto"
                  className="inline-block rounded-brutal border-[3px] border-brutal-tinta bg-brutal-cyan px-6 py-3 font-brut font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm transition-transform hover:-translate-y-0.5"
                >
                  Contactar
                </Link>
                <Link
                  href="/ayuda"
                  className="inline-block rounded-brutal border-[3px] border-brutal-tinta bg-brutal-gold px-6 py-3 font-brut font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm transition-transform hover:-translate-y-0.5"
                >
                  Centro de ayuda
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

/** Bloque de contenido con título. */
export function Apartado({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-8 shadow-brutal-sm">
      <h2 className="mb-3 font-brut text-2xl font-black uppercase tracking-wide text-brutal-cyan">
        {titulo}
      </h2>
      <div className="space-y-3 text-brutal-tinta/80">{children}</div>
    </div>
  );
}
