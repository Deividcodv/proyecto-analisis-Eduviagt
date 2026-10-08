import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Icon, type IconName } from '@/components/ui/Icon';
import { MiniAsistente } from '@/components/soporte/MiniAsistente';

export const metadata: Metadata = {
  title: 'Soporte | EDUVIAGT',
  description:
    'Soporte y asistente virtual de EDUVIAGT: resuelve tus dudas sobre becas, convocatorias y tu solicitud.',
};

const canales: {
  icono: IconName;
  titulo: string;
  texto: string;
  href?: string;
}[] = [
  {
    icono: 'correo',
    titulo: 'Correo',
    texto: 'mesadeayuda@mineduc.gob.gt',
  },
  {
    icono: 'telefono',
    titulo: 'Teléfono',
    texto: '+502 2411-9595',
  },
  {
    icono: 'reloj',
    titulo: 'Horario',
    texto: 'Lun a vie · 8:00 a 16:00',
  },
  {
    icono: 'info',
    titulo: 'FAQ',
    texto: 'Respuestas a dudas frecuentes',
    href: '/faq',
  },
];

export default function SoportePage() {
  return (
    <main>
      <section className="brut-cinta border-b-[3px] border-brutal-tinta bg-sigeb-blue-dark py-12 text-brutal-papel">
        <Container>
          <p className="brut-label text-xs font-bold text-brutal-gold">// Soporte</p>
          <h1 className="text-mega text-3xl font-black md:text-5xl">Soporte</h1>
          <p className="mt-2 max-w-2xl font-mono text-sm text-brutal-papel/80">
            Mesa de ayuda del Ministerio de Educación. Resuelve tus dudas con el
            asistente virtual o contacta a nuestro equipo.
          </p>
        </Container>
      </section>

      <section className="bg-brutal-papel py-12">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="brut-label mb-4 text-xs font-bold text-brutal-gold">
                // Asistente virtual
              </p>
              <MiniAsistente />
            </div>

            <div className="space-y-6">
              <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-6 shadow-brutal-sm">
                <h2 className="mb-3 font-brut text-lg font-black uppercase tracking-wide text-brutal-cyan">
                  Canales de atención
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {canales.map((c) => {
                    const Contenido = (
                      <>
                        <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-brutal border-2 border-brutal-tinta bg-brutal-gold text-brutal-tinta">
                          <Icon name={c.icono} className="h-4 w-4" />
                        </div>
                        <h3 className="font-brut font-black uppercase tracking-wide text-brutal-tinta">
                          {c.titulo}
                        </h3>
                        <p className="mt-1 text-sm text-brutal-tinta/70">{c.texto}</p>
                      </>
                    );
                    return c.href ? (
                      <a
                        key={c.titulo}
                        href={c.href}
                        className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-4 transition-transform hover:-translate-y-0.5"
                      >
                        {Contenido}
                      </a>
                    ) : (
                      <div
                        key={c.titulo}
                        className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-4"
                      >
                        {Contenido}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-tinta p-6 text-brutal-papel shadow-brutal-sm">
                <h2 className="mb-3 font-brut text-lg font-black uppercase tracking-wide text-brutal-gold">
                  ¿Buscas más recursos?
                </h2>
                <p className="mb-4 text-sm text-brutal-papel/80">
                  Consulta el centro de ayuda con guías, requisitos y preguntas
                  frecuentes del proceso de becas.
                </p>
                <a
                  href="/ayuda"
                  className="inline-block rounded-brutal border-[3px] border-brutal-tinta bg-brutal-cyan px-5 py-2.5 font-brut text-xs font-black uppercase text-brutal-tinta shadow-brutal-sm transition-transform hover:-translate-y-0.5"
                >
                  Ir al centro de ayuda
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
