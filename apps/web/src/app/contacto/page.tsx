import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Icon, type IconName } from '@/components/ui/Icon';

export const metadata: Metadata = {
  title: 'Contacto | EDUVIAGT',
  description:
    'Contacta al Ministerio de Educación de Guatemala para resolver dudas sobre el proceso de becas gestionado a través de EDUVIAGT.',
};

const canales: {
  icono: IconName;
  titulo: string;
  lineas: string[];
}[] = [
  {
    icono: 'correo',
    titulo: 'Correo',
    lineas: ['mesadeayuda@mineduc.gob.gt', 'becas@mineduc.gob.gt'],
  },
  {
    icono: 'telefono',
    titulo: 'Teléfono',
    lineas: ['+502 2411-9595', '+502 2411-9596'],
  },
  {
    icono: 'reloj',
    titulo: 'Horario',
    lineas: ['Lunes a viernes', '8:00 a 16:00 horas'],
  },
  {
    icono: 'ubicacion',
    titulo: 'Dirección',
    lineas: [
      '5a. calle 6-56 zona 1',
      'Ciudad de Guatemala, Guatemala',
    ],
  },
];

export default function ContactoPage() {
  return (
    <main>
      <section className="brut-cinta border-b-[3px] border-brutal-tinta bg-sigeb-blue-dark py-12 text-brutal-papel">
        <Container>
          <p className="brut-label text-xs font-bold text-brutal-gold">// Contacto</p>
          <h1 className="text-mega text-3xl font-black md:text-5xl">Contáctanos</h1>
          <p className="mt-2 max-w-2xl font-mono text-sm text-brutal-papel/80">
            El equipo del Ministerio de Educación de Guatemala está para ayudarte
            con tu proceso de becas.
          </p>
        </Container>
      </section>

      <section className="bg-brutal-papel py-12">
        <Container>
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-8 shadow-brutal-sm">
              <h2 className="mb-3 font-brut text-2xl font-black uppercase tracking-wide text-brutal-cyan">
                Canales de atención
              </h2>
              <p className="mb-6 text-brutal-tinta/80">
                El Ministerio de Educación de Guatemala atiende consultas sobre
                becas a través de los siguientes canales.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {canales.map((c) => (
                  <div
                    key={c.titulo}
                    className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-5"
                  >
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-brutal border-2 border-brutal-tinta bg-brutal-gold text-brutal-tinta">
                      <Icon name={c.icono} className="h-5 w-5" />
                    </div>
                    <h3 className="font-brut font-black uppercase tracking-wide text-brutal-tinta">
                      {c.titulo}
                    </h3>
                    {c.lineas.map((l) => (
                      <p key={l} className="mt-1 font-mono text-sm text-brutal-tinta/70">
                        {l}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  titulo: 'Consultar mi solicitud',
                  texto:
                    'Consulta el estado actual de tu solicitud de beca sin necesidad de iniciar sesión.',
                  href: '/consulta',
                  acento: 'bg-brutal-cyan',
                },
                {
                  titulo: 'Centro de ayuda',
                  texto:
                    'Recursos, preguntas frecuentes y guías del proceso de becas.',
                  href: '/ayuda',
                  acento: 'bg-brutal-lima',
                },
                {
                  titulo: 'Soporte',
                  texto:
                    'Habla con el asistente virtual o consigue ayuda para tu trámite.',
                  href: '/soporte',
                  acento: 'bg-brutal-gold',
                },
                {
                  titulo: 'Sobre EDUVIAGT',
                  texto:
                    'Conoce la misión, visión y objetivos del sistema de becas.',
                  href: '/nosotros',
                  acento: 'bg-brutal-rosa',
                },
              ].map((c) => (
                <a
                  key={c.titulo}
                  href={c.href}
                  className="group rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-6 shadow-brutal-sm transition-transform hover:-translate-y-1"
                >
                  <div
                    className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-brutal border-2 border-brutal-tinta text-brutal-tinta ${c.acento}`}
                  >
                    <Icon name="chevron" className="h-4 w-4 -rotate-90" />
                  </div>
                  <h3 className="font-brut font-black uppercase tracking-wide text-brutal-tinta group-hover:text-brutal-cyan">
                    {c.titulo}
                  </h3>
                  <p className="mt-1 text-sm text-brutal-tinta/70">{c.texto}</p>
                </a>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
