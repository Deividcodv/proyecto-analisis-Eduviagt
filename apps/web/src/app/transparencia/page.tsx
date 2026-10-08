import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Icon, type IconName } from '@/components/ui/Icon';

export const metadata: Metadata = {
  title: 'Transparencia | EDUVIAGT',
  description:
    'EDUVIAGT garantiza un proceso de gestión de becas transparente y auditable: cada acción queda documentada y verificable.',
};

const principios: {
  icono: IconName;
  titulo: string;
  texto: string;
}[] = [
  {
    icono: 'escudo',
    titulo: 'Equidad',
    texto:
      'Todos los postulantes son evaluados bajo los mismos criterios, pesos y procedimientos, sin excepciones discrecionales.',
  },
  {
    icono: 'check',
    titulo: 'Objetividad',
    texto:
      'Las evaluaciones se basan en puntajes y evidencias documentales, no en apreciaciones subjetivas.',
  },
  {
    icono: 'reloj',
    titulo: 'Trazabilidad',
    texto:
      'Cada mutación del sistema queda registrada en un historial de auditoría con autor, fecha, entidad e IP.',
  },
  {
    icono: 'estrella',
    titulo: 'Publicación',
    texto:
      'Los resultados de cada convocatoria se publican y notifican a los postulantes a través de la plataforma.',
  },
];

export default function TransparenciaPage() {
  return (
    <main>
      <section className="brut-cinta border-b-[3px] border-brutal-tinta bg-sigeb-blue-dark py-12 text-brutal-papel">
        <Container>
          <p className="brut-label text-xs font-bold text-brutal-gold">// Transparencia</p>
          <h1 className="text-mega text-3xl font-black md:text-5xl">Acceso a la información</h1>
          <p className="mt-2 max-w-2xl font-mono text-sm text-brutal-papel/80">
            Cómo EDUVIAGT garantiza que cada decisión en el otorgamiento de becas sea
            documentada, verificable y pública.
          </p>
        </Container>
      </section>

      <section className="bg-brutal-papel py-12">
        <Container>
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-8 shadow-brutal-sm">
              <h2 className="mb-3 font-brut text-2xl font-black uppercase tracking-wide text-brutal-cyan">
                Compromiso de transparencia
              </h2>
              <p className="text-brutal-tinta/80">
                El Ministerio de Educación de Guatemala se compromete a administrar
                los programas de becas con transparencia. Todo el ciclo —postulación,
                documentación, evaluación, comité y resolución— está digitalizado y
                cada acción deja una huella auditable en la plataforma.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {principios.map((p) => (
                <div
                  key={p.titulo}
                  className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-6 shadow-brutal-sm"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-brutal border-2 border-brutal-tinta bg-brutal-gold text-brutal-tinta">
                    <Icon name={p.icono} className="h-5 w-5" />
                  </div>
                  <h3 className="font-brut text-lg font-black uppercase">{p.titulo}</h3>
                  <p className="mt-1 text-sm text-brutal-tinta/70">{p.texto}</p>
                </div>
              ))}
            </div>

            <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-8 shadow-brutal-sm">
              <h2 className="mb-3 font-brut text-2xl font-black uppercase tracking-wide text-brutal-cyan">
                Proceso auditable
              </h2>
              <ol className="list-decimal space-y-2 pl-5 text-brutal-tinta/80 marker:font-brut marker:font-black marker:text-brutal-gold">
                <li>El postulante crea su cuenta y presenta su solicitud.</li>
                <li>Los documentos se cargan, validan y corrigen según sea necesario.</li>
                <li>
                  Los evaluadores asignan puntajes utilizando criterios públicos
                  ponderados.
                </li>
                <li>
                  El comité sesiona, delibera y emite la resolución final.
                </li>
                <li>
                  El resultado se registra y queda a disposición del postulante.
                </li>
              </ol>
            </div>

            <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-tinta p-8 text-brutal-papel shadow-brutal-sm">
              <h2 className="mb-3 font-brut text-2xl font-black uppercase tracking-wide text-brutal-gold">
                ¿Quieres verificar tu proceso?
              </h2>
              <p className="mb-6 text-brutal-papel/80">
                Consulta el estado de tu solicitud en cualquier momento, o utiliza
                el asistente virtual para resolver dudas sobre tu trámite.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/consulta"
                  className="inline-block rounded-brutal border-[3px] border-brutal-tinta bg-brutal-cyan px-6 py-3 font-brut font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm transition-transform hover:-translate-y-0.5"
                >
                  Consultar mi solicitud
                </a>
                <a
                  href="/soporte"
                  className="inline-block rounded-brutal border-[3px] border-brutal-tinta bg-brutal-gold px-6 py-3 font-brut font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm transition-transform hover:-translate-y-0.5"
                >
                  Hablar con soporte
                </a>
              </div>
            </div>

            <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-8 shadow-brutal-sm">
              <h2 className="mb-3 font-brut text-2xl font-black uppercase tracking-wide text-brutal-cyan">
                Institucional
              </h2>
              <p className="text-brutal-tinta/80">
                Los reportes consolidados y el historial de auditoría están
                disponibles para el personal autorizado del Ministerio a través del
                sistema interno.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
