import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Nosotros | EDUVIAGT',
  description:
    'EDUVIAGT es la plataforma oficial de becas del Ministerio de Educación de Guatemala (Mineduc). Conoce su misión, visión y cómo postularte a las convocatorias de becas.',
};

const pilares = [
  {
    titulo: 'Misión',
    texto:
      'Garantizar el acceso a una educación de calidad para todas las personas, creando oportunidades que transforman vidas a través de programas de becas que apoyan la formación académica en Guatemala.',
    icono: 'escudo' as IconName,
  },
  {
    titulo: 'Visión',
    texto:
      'Ser el sistema referente de gestión de becas en la región, reconocido por su transparencia, eficiencia e impacto en la reducción de la deserción escolar y el acceso equitativo a la educación superior.',
    icono: 'grafica' as IconName,
  },
  {
    titulo: 'Objetivos',
    resume: true,
    icono: 'estrella' as IconName,
  },
];

const comoFunciona = [
  {
    titulo: 'Regístrate',
    descripcion: 'Crea tu cuenta con tu documento de identificación.',
    icono: 'usuario' as IconName,
  },
  {
    titulo: 'Postúlate',
    descripcion: 'Elige una convocatoria abierta y completa tu postulación.',
    icono: 'documento' as IconName,
  },
  {
    titulo: 'Adjunta documentos',
    descripcion: 'Sube los documentos requeridos por la convocatoria.',
    icono: 'subir' as IconName,
  },
  {
    titulo: 'Evaluación',
    descripcion: 'Tu solicitud es revisada por el comité de becas.',
    icono: 'check' as IconName,
  },
  {
    titulo: 'Resultado',
    descripcion: 'Consulta tu resultado y descarga tu constancia.',
    icono: 'estrella' as IconName,
  },
];

export default function NosotrosPage() {
  return (
    <main>
      <section className="brut-cinta border-b-[3px] border-brutal-tinta bg-sigeb-blue-dark py-12 text-brutal-papel">
        <Container>
          <p className="brut-label text-xs font-bold text-brutal-gold">// Nosotros</p>
          <h1 className="text-mega text-3xl font-black md:text-5xl">Nosotros</h1>
          <p className="mt-2 max-w-2xl font-mono text-sm text-brutal-papel/80">
            Conoce la plataforma oficial de becas del Ministerio de Educación de
            Guatemala y el sistema que hace posible la gestión de becas en el país.
          </p>
        </Container>
      </section>

      <section className="bg-brutal-papel py-12">
        <Container>
          <div className="mx-auto max-w-5xl space-y-10">
            <div className="rounded-brutal border-[3px] border-brutal-tinta bg-sigeb-blue-dark p-8 text-brutal-papel shadow-brutal-sm md:p-10">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-brutal border-2 border-brutal-gold bg-brutal-gold p-2 text-brutal-tinta">
                  <Icon name="escudo" className="h-7 w-7" />
                </span>
                <p className="brut-label text-xs font-bold text-brutal-gold">
                  ¿Qué es EDUVIAGT?
                </p>
              </div>
              <p className="font-brut text-xl font-black uppercase leading-tight tracking-wide md:text-2xl">
                La plataforma de becas del Ministerio de Educación de Guatemala
              </p>
              <p className="mt-4 max-w-3xl text-brutal-papel/85">
                EDUVIAGT es el sistema oficial del <strong>Ministerio de Educación de
                Guatemala (Mineduc)</strong> para gestionar todo el ciclo de las becas
                educativas: la publicación de convocatorias, la postulación de las y los
                estudiantes, la carga de documentos, la evaluación por parte de los comités
                y la publicación de resultados. Todo desde un mismo lugar, con procesos
                transparentes y verificables.
              </p>
              <p className="mt-3 max-w-3xl text-brutal-papel/85">
                Nuestro objetivo es que cualquier persona pueda acceder a una beca de forma
                ágil, justa y sin trámites confusos, poniendo la tecnología al servicio de la
                educación en Guatemala.
              </p>
              <div className="mt-6">
                <Button href="/convocatorias">Ver convocatorias abiertas</Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {pilares.map((pilar) =>
                pilar.resume ? (
                  <div
                    key={pilar.titulo}
                    className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-8 shadow-brutal-sm"
                  >
                    <span className="mb-4 inline-block rounded-brutal border-2 border-brutal-tinta bg-brutal-cyan p-2 text-brutal-tinta">
                      <Icon name={pilar.icono} className="h-6 w-6" />
                    </span>
                    <h2 className="mb-3 font-brut text-xl font-black uppercase tracking-wide text-brutal-tinta">
                      {pilar.titulo}
                    </h2>
                    <ul className="space-y-2 pl-2 text-sm text-brutal-tinta/80 marker:text-brutal-gold">
                      <li>Ampliar el acceso a becas de excelencia académica.</li>
                      <li>Garantizar un proceso de postulación transparente y justo.</li>
                      <li>Facilitar el seguimiento de solicitudes en tiempo real.</li>
                      <li>Fomentar la permanencia y culminación de estudios superiores.</li>
                    </ul>
                  </div>
                ) : (
                  <div
                    key={pilar.titulo}
                    className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-8 shadow-brutal-sm"
                  >
                    <span className="mb-4 inline-block rounded-brutal border-2 border-brutal-tinta bg-brutal-cyan p-2 text-brutal-tinta">
                      <Icon name={pilar.icono} className="h-6 w-6" />
                    </span>
                    <h2 className="mb-3 font-brut text-xl font-black uppercase tracking-wide text-brutal-tinta">
                      {pilar.titulo}
                    </h2>
                    <p className="text-sm text-brutal-tinta/80">{pilar.texto}</p>
                  </div>
                ),
              )}
            </div>

            <div>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-brut text-2xl font-black uppercase tracking-wide text-brutal-tinta">
                    ¿Cómo funciona?
                  </h2>
                  <p className="font-mono text-sm text-brutal-tinta/70">
                    Cinco pasos sencillos para postularte a una beca.
                  </p>
                </div>
                <span className="brut-label rounded-brutal border-2 border-brutal-tinta bg-brutal-gold px-3 py-1 text-xs font-bold text-brutal-tinta">
                  Tu futuro empieza aquí
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {comoFunciona.map((paso, indice) => (
                  <div
                    key={paso.titulo}
                    className="relative flex flex-col rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-5 shadow-brutal-sm"
                  >
                    <span className="absolute right-3 top-3 font-brut text-xs font-black text-brutal-tinta/30">
                      0{indice + 1}
                    </span>
                    <span className="mb-3 inline-block rounded-brutal border-2 border-brutal-tinta bg-brutal-lima p-2 text-brutal-tinta">
                      <Icon name={paso.icono} className="h-5 w-5" />
                    </span>
                    <h3 className="font-brut text-sm font-black uppercase tracking-wide text-brutal-tinta">
                      {paso.titulo}
                    </h3>
                    <p className="mt-1 text-xs text-brutal-tinta/70">{paso.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-8 shadow-brutal-sm">
              <h2 className="mb-3 font-brut text-2xl font-black uppercase tracking-wide text-brutal-cyan">
                Programas de becas
              </h2>
              <ul className="space-y-2 pl-5 text-brutal-tinta/80 marker:text-brutal-gold">
                <li>Beca de Excelencia Académica</li>
                <li>Beca de Inspiración Cívica</li>
                <li>Programas de apoyo a la formación técnica y profesional</li>
              </ul>
              <div className="mt-6">
                <Button href="/convocatorias">Explorar convocatorias</Button>
              </div>
            </div>

            <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-8 shadow-brutal-sm">
              <h2 className="mb-3 font-brut text-2xl font-black uppercase tracking-wide text-brutal-cyan">
                Transparencia
              </h2>
              <p className="text-brutal-tinta/80">
                EDUVIAGT publica los resultados de cada convocatoria y mantiene un registro
                auditable de todas las acciones del proceso, asegurando que cada decisión sea
                documentada y verificable.
              </p>
            </div>

            <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-8 shadow-brutal-sm">
              <h2 className="mb-3 font-brut text-2xl font-black uppercase tracking-wide text-brutal-cyan">
                Contacto
              </h2>
              <p className="text-brutal-tinta/80">
                EDUVIAGT · Ministerio de Educación de Guatemala
              </p>
              <p className="mt-2 text-brutal-tinta/80">
                Para consultas sobre becas, contáctanos a través de nuestro{' '}
                <a
                  href="mailto:soporte@eduviagt.gob.gt"
                  className="font-brut font-bold text-brutal-cyan hover:bg-brutal-cyan"
                >
                  centro de soporte
                </a>
                , la{' '}
                <a href="/consulta" className="font-brut font-bold text-brutal-cyan hover:bg-brutal-cyan">
                  consulta de solicitudes
                </a>{' '}
                o el centro de ayuda.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}