import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Requisitos | EDUVIAGT',
  description:
    'Requisitos generales para postularte a las becas del Ministerio de Educación de Guatemala a través de EDUVIAGT.',
};

const generales = [
  {
    titulo: 'Cuenta en EDUVIAGT',
    texto:
      'Crear una cuenta personal usando tu número de CUI. Es la identidad con la que presentarás y darás seguimiento a tu solicitud.',
  },
  {
    titulo: 'Perfil académico',
    texto:
      'Institución donde estudias, carrera y promedio actual. Se verifica que estés inscrito en un programa elegible.',
  },
  {
    titulo: 'Perfil financiero',
    texto:
      'Información sobre el ingreso familiar y el número de dependientes, base para priorizar a los postulantes de mayor necesidad.',
  },
  {
    titulo: 'Documentos de identificación',
    texto:
      'Documento personal de identificación (DPI) vigente y, en el caso de menores, del responsable legal.',
  },
  {
    titulo: 'Certificaciones académicas',
    texto:
      'Certificados de estudios y constancias de notas que acrediten tu desempeño académico.',
  },
  {
    titulo: 'Declaración jurada',
    texto:
      'Declaración en la que confirmas que la información presentada es veraz y de tu responsabilidad.',
  },
];

export default function RequisitosPage() {
  return (
    <main>
      <section className="brut-cinta border-b-[3px] border-brutal-tinta bg-sigeb-blue-dark py-12 text-brutal-papel">
        <Container>
          <p className="brut-label text-xs font-bold text-brutal-gold">// Requisitos</p>
          <h1 className="text-mega text-3xl font-black md:text-5xl">
            Requisitos para postularte
          </h1>
          <p className="mt-2 max-w-2xl font-mono text-sm text-brutal-papel/80">
            Requisitos generales del proceso. Cada convocatoria puede definir
            documentos específicos adicionales.
          </p>
        </Container>
      </section>

      <section className="bg-brutal-papel py-12">
        <Container>
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-8 shadow-brutal-sm">
              <h2 className="mb-3 font-brut text-2xl font-black uppercase tracking-wide text-brutal-cyan">
                Requisitos generales
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {generales.map((r, i) => (
                  <div
                    key={r.titulo}
                    className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-5"
                  >
                    <div className="mb-2 font-brut text-3xl font-black text-brutal-cyan">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <h3 className="font-brut font-black uppercase tracking-wide text-brutal-tinta">
                      {r.titulo}
                    </h3>
                    <p className="mt-1 text-sm text-brutal-tinta/70">{r.texto}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-8 shadow-brutal-sm">
              <h2 className="mb-3 font-brut text-2xl font-black uppercase tracking-wide text-brutal-cyan">
                Documentos por convocatoria
              </h2>
              <p className="text-brutal-tinta/80">
                Cada convocatoria declara los documentos requeridos y si son
                obligatorios u opcionales. Debes cargar todos los obligatorios
                para poder enviar tu solicitud.
              </p>
              <a
                href="/convocatorias"
                className="mt-6 inline-block rounded-brutal border-[3px] border-brutal-tinta bg-brutal-gold px-6 py-3 font-brut font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm transition-transform hover:-translate-y-0.5"
              >
                Ver convocatorias
              </a>
            </div>

            <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-tinta p-8 text-brutal-papel shadow-brutal-sm">
              <h2 className="mb-3 font-brut text-2xl font-black uppercase tracking-wide text-brutal-gold">
                ¿Tienes dudas sobre los requisitos?
              </h2>
              <p className="mb-6 text-brutal-papel/80">
                Nuestro asistente virtual puede responder tus preguntas sobre la
                documentación necesaria para postularte.
              </p>
              <a
                href="/soporte"
                className="inline-block rounded-brutal border-[3px] border-brutal-tinta bg-brutal-cyan px-6 py-3 font-brut font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm transition-transform hover:-translate-y-0.5"
              >
                Hablar con soporte
              </a>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
