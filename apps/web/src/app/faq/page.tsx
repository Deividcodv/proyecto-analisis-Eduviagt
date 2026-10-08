import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Preguntas frecuentes | EDUVIAGT',
  description:
    'Respuestas a las preguntas más frecuentes sobre el proceso de becas del Ministerio de Educación de Guatemala en EDUVIAGT.',
};

const faqs = [
  {
    pregunta: '¿Cómo me registro en EDUVIAGT?',
    respuesta:
      'Ve a la página de registro y completa tus datos personales, incluyendo tu número de CUI. Una cuenta por persona; tu CUI será tu identidad en el sistema.',
  },
  {
    pregunta: '¿Qué tipos de beca se gestionan?',
    respuesta:
      'EDUVIAGT gestiona programas de becas de excelencia académica, inspiración cívica y apoyo a la formación técnica y profesional del Ministerio de Educación.',
  },
  {
    pregunta: '¿Cuáles son los requisitos para postularme?',
    respuesta:
      'Necesitas una cuenta activa, completar tus perfiles académico y financiero, y cargar los documentos requeridos por la convocatoria. Consulta la página de requisitos para el detalle.',
  },
  {
    pregunta: '¿Cómo consulto el estado de mi solicitud?',
    respuesta:
      'Puedes iniciar sesión e ir a "Mis solicitudes", o usar la consulta pública ingresando tu número de solicitud en la sección de consulta.',
  },
  {
    pregunta: '¿Qué significa que mi solicitud esté en corrección?',
    respuesta:
      'Alguno de tus documentos o datos necesita ajustes. Revisa la solicitud, corrige lo indicado y vuelve a enviarla para continuar el proceso.',
  },
  {
    pregunta: '¿Cuánto tiempo toma la evaluación?',
    respuesta:
      'El tiempo varía según la convocatoria y el número de postulantes. Una vez asignados los evaluadores, el avance se refleja en el estado de tu solicitud.',
  },
  {
    pregunta: '¿Puedo postularme a más de una convocatoria?',
    respuesta:
      'Puedes crear una solicitud por cada convocatoria abierta a la que desees postularte, siempre que cumpla los requisitos correspondientes.',
  },
  {
    pregunta: '¿Cómo se publican los resultados?',
    respuesta:
      'Los resultados de cada convocatoria se registran en la plataforma y quedan disponibles en el estado de tu solicitud una vez la convocatoria se resuelve.',
  },
  {
    pregunta: '¿Qué hago si mi documento fue rechazado?',
    respuesta:
      'Dirígete al detalle de tu solicitud, revisa el motivo del rechazo, reemplaza el documento y vuelve a enviar la solicitud.',
  },
  {
    pregunta: '¿Necesito enviar documentación física?',
    respuesta:
      'No. Todo el proceso es digital a través de EDUVIAGT. Solo en casos específicos el Ministerio puede solicitar la verificación presencial del original.',
  },
];

export default function FaqPage() {
  return (
    <main>
      <section className="brut-cinta border-b-[3px] border-brutal-tinta bg-sigeb-blue-dark py-12 text-brutal-papel">
        <Container>
          <p className="brut-label text-xs font-bold text-brutal-gold">// FAQ</p>
          <h1 className="text-mega text-3xl font-black md:text-5xl">
            Preguntas frecuentes
          </h1>
          <p className="mt-2 max-w-2xl font-mono text-sm text-brutal-papel/80">
            Respuestas a las dudas más comunes sobre el proceso de becas.
          </p>
        </Container>
      </section>

      <section className="bg-brutal-papel py-12">
        <Container>
          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((f, i) => (
              <details
                key={f.pregunta}
                className="group rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco shadow-brutal-sm"
                open={i === 0}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 font-brut font-black uppercase tracking-wide text-brutal-tinta marker:content-none">
                  <span>{f.pregunta}</span>
                  <span className="text-brutal-cyan transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="border-t-2 border-brutal-tinta/15 px-6 py-4 text-brutal-tinta/80">
                  {f.respuesta}
                </div>
              </details>
            ))}

            <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-tinta p-8 text-brutal-papel shadow-brutal-sm">
              <h2 className="mb-3 font-brut text-2xl font-black uppercase tracking-wide text-brutal-gold">
                ¿No resolviste tu duda?
              </h2>
              <p className="mb-6 text-brutal-papel/80">
                Consulta el centro de ayuda o habla directamente con nuestro
                asistente virtual.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/ayuda"
                  className="inline-block rounded-brutal border-[3px] border-brutal-tinta bg-brutal-cyan px-6 py-3 font-brut font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm transition-transform hover:-translate-y-0.5"
                >
                  Centro de ayuda
                </a>
                <a
                  href="/soporte"
                  className="inline-block rounded-brutal border-[3px] border-brutal-tinta bg-brutal-gold px-6 py-3 font-brut font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm transition-transform hover:-translate-y-0.5"
                >
                  Hablar con soporte
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
