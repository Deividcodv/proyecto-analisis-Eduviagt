import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Icon, type IconName } from '@/components/ui/Icon';

export const metadata: Metadata = {
  title: 'Centro de ayuda | EDUVIAGT',
  description:
    'Centro de ayuda de EDUVIAGT: guías, preguntas frecuentes, requisitos y soporte para tu proceso de becas.',
};

const recursos: {
  titulo: string;
  texto: string;
  href: string;
  icono: IconName;
  acento: string;
}[] = [
  {
    titulo: 'Preguntas frecuentes',
    texto: 'Respuestas a las dudas más comunes sobre el proceso de becas.',
    href: '/faq',
    icono: 'info',
    acento: 'bg-brutal-cyan',
  },
  {
    titulo: 'Requisitos',
    texto: 'Requisitos generales y documentos necesarios para postularte.',
    href: '/requisitos',
    icono: 'check',
    acento: 'bg-brutal-lima',
  },
  {
    titulo: 'Consultar solicitud',
    texto: 'Consulta el estado de tu solicitud sin iniciar sesión.',
    href: '/consulta',
    icono: 'buscar',
    acento: 'bg-brutal-gold',
  },
  {
    titulo: 'Convocatorias',
    texto: 'Explora las becas abiertas y sus documentos requeridos.',
    href: '/convocatorias',
    icono: 'becas',
    acento: 'bg-brutal-rosa',
  },
  {
    titulo: 'Transparencia',
    texto: 'Conoce cómo EDUVIAGT garantiza procesos auditable y verificables.',
    href: '/transparencia',
    icono: 'escudo',
    acento: 'bg-brutal-indigo',
  },
  {
    titulo: 'Contacto',
    texto: 'Canales de atención del Ministerio de Educación.',
    href: '/contacto',
    icono: 'correo',
    acento: 'bg-brutal-naranja',
  },
];

export default function AyudaPage() {
  return (
    <main>
      <section className="brut-cinta border-b-[3px] border-brutal-tinta bg-sigeb-blue-dark py-12 text-brutal-papel">
        <Container>
          <p className="brut-label text-xs font-bold text-brutal-gold">// Ayuda</p>
          <h1 className="text-mega text-3xl font-black md:text-5xl">
            Centro de ayuda
          </h1>
          <p className="mt-2 max-w-2xl font-mono text-sm text-brutal-papel/80">
            Todo lo que necesitas para navegar tu proceso de becas en EDUVIAGT.
          </p>
        </Container>
      </section>

      <section className="bg-brutal-papel py-12">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recursos.map((r) => (
              <a
                key={r.titulo}
                href={r.href}
                className="group rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-6 shadow-brutal-sm transition-transform hover:-translate-y-1"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-brutal border-[3px] border-brutal-tinta text-brutal-tinta ${r.acento}`}
                >
                  <Icon name={r.icono} className="h-6 w-6" />
                </div>
                <h2 className="font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta group-hover:text-brutal-cyan">
                  {r.titulo}
                </h2>
                <p className="mt-1 text-sm text-brutal-tinta/70">{r.texto}</p>
              </a>
            ))}

            <a
              href="/soporte"
              className="group rounded-brutal border-[3px] border-brutal-tinta bg-brutal-tinta p-6 text-brutal-papel shadow-brutal-sm transition-transform hover:-translate-y-1"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-brutal border-[3px] border-brutal-tinta bg-brutal-gold text-brutal-tinta">
                <Icon name="chat" className="h-6 w-6" />
              </div>
              <h2 className="font-brut text-lg font-black uppercase tracking-wide text-brutal-gold">
                Soporte y asistente
              </h2>
              <p className="mt-1 text-sm text-brutal-papel/80">
                Habla con el asistente virtual de EDUVIAGT para resolver tus dudas al
                instante.
              </p>
            </a>
          </div>

          <div className="mx-auto mt-12 max-w-3xl rounded-brutal border-[3px] border-brutal-tinta bg-brutal-cyan p-8 text-center shadow-brutal-sm">
            <h2 className="font-brut text-2xl font-black uppercase tracking-wide text-brutal-tinta">
              ¿Necesitas atención personalizada?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-brutal-tinta/80">
              El Ministerio de Educación atiende de lunes a viernes de 8:00 a
              16:00 horas. Revisa los{' '}
              <a href="/contacto" className="font-brut font-bold underline underline-offset-4">
                canales de contacto
              </a>
              .
            </p>
          </div>
        </Container>
      </section>
    </main>
  );
}
