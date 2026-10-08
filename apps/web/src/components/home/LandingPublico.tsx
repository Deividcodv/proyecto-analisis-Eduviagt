import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Convocatorias } from '@/components/home/Convocatorias';

const ESTADISTICAS = [
  { valor: String(new Date().getFullYear()), etiqueta: 'Ciclo vigente' },
  { valor: '100%', etiqueta: 'Proceso digital' },
  { valor: '06', etiqueta: 'Pasos del proceso' },
  { valor: '01', etiqueta: 'Plataforma oficial' },
];

const REQUISITOS = [
  'Ser guatemalteco(a) de nacimiento o naturalizado',
  'Cumplir el rango de edad establecido por el programa',
  'Promedio mínimo de 80 puntos en los últimos estudios',
  'No contar con otra beca financiada por el Estado',
  'Disponibilidad para cursar los estudios de tiempo completo',
];

const DOCUMENTOS = [
  'DPI / Código Único de Identificación',
  'Certificado de nacimiento',
  'Historias de calificaciones o cierre de pensum',
  'Constancia de la institución educativa',
  'Carta de compromiso',
];

export function LandingPublico() {
  return (
    <div>
      {/* Hero */}
      <section className="brut-cinta border-b-[3px] border-brutal-tinta bg-brutal-tinta py-24 text-brutal-papel">
        <Container className="text-left">
          <p className="brut-label mb-4 inline-block rounded-brutal border-2 border-brutal-gold bg-brutal-gold px-3 py-1 text-xs font-bold text-brutal-tinta">
            ⬢ Ministerio de Educación · Guatemala
          </p>
          <h1 className="text-mega max-w-4xl font-black text-5xl md:text-7xl">
            Oportunidades que transforman vidas
          </h1>
          <p className="mt-6 max-w-2xl font-mono text-base text-brutal-papel/80 md:text-lg">
            Encuentra programas de becas del Ministerio de Educación de Guatemala
            y realiza tu proceso de postulación de forma sencilla, segura y
            transparente. Todo tu expediente, un solo lugar.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button href="/convocatorias">Explorar becas</Button>
            <Button href="/registro" variant="secondary">
              Crear mi cuenta
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-brutal-papel/70">
            <span>● Proceso 100 % digital</span>
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brutal-gold" />
            <span>● Seguimiento auditable</span>
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brutal-gold" />
            <span>● Gratuito</span>
          </div>
        </Container>
      </section>

      {/* Cinta de estadísticas */}
      <section className="grid grid-cols-2 border-b-[3px] border-brutal-tinta bg-brutal-blanco md:grid-cols-4">
        {ESTADISTICAS.map((stat) => (
          <div
            key={stat.etiqueta}
            className="flex flex-col items-center gap-1 border-r-[3px] border-brutal-tinta px-4 py-8 last:border-r-0"
          >
            <div className="text-mega text-3xl font-black text-brutal-cyan md:text-4xl">
              {stat.valor}
            </div>
            <div className="brut-label text-center text-[10px] font-bold uppercase text-brutal-tinta/70">
              {stat.etiqueta}
            </div>
          </div>
        ))}
      </section>

      {/* Convocatorias abiertas (datos reales desde el API) */}
      <section className="border-b-[3px] border-brutal-tinta bg-brutal-papel py-16">
        <Container>
          <div className="mb-12 flex flex-col items-start gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="brut-label text-xs font-bold text-brutal-cyan">// Convocatorias</p>
              <h2 className="text-mega text-3xl font-black md:text-5xl">
                Convocatorias abiertas
              </h2>
            </div>
            <span className="brut-label rounded-brutal border-2 border-brutal-tinta bg-brutal-cyan px-3 py-1 text-xs font-bold text-brutal-tinta">
              Datos en vivo
            </span>
          </div>
          <Convocatorias />
        </Container>
      </section>

      {/* Misión / Visión */}
      <section className="border-b-[3px] border-brutal-tinta bg-brutal-blanco py-16">
        <Container>
          <p className="brut-label text-xs font-bold text-brutal-gold">// Institucional</p>
          <h2 className="text-mega mb-10 text-3xl font-black text-brutal-tinta md:text-5xl">
            Misión y visión
          </h2>
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr_auto] lg:items-stretch">
            <div className="rounded-brutal border-[3px] border-brutal-tinta border-t-[10px] border-t-brutal-gold bg-brutal-papel p-6 shadow-brutal-sm">
              <p className="brut-label mb-3 font-mono text-xs font-bold text-brutal-gold">
                // Misión
              </p>
              <p className="text-sm leading-relaxed text-brutal-tinta/80">
                Ampliar el acceso a la educación superior mediante el
                otorgamiento de becas a estudiantes guatemaltecos de escasos
                recursos, en el marco de la transparencia, la equidad y la
                excelencia académica.
              </p>
            </div>
            <div className="rounded-brutal border-[3px] border-brutal-tinta border-t-[10px] border-t-brutal-cyan bg-brutal-papel p-6 shadow-brutal-sm">
              <p className="brut-label mb-3 font-mono text-xs font-bold text-brutal-cyan">
                // Visión
              </p>
              <p className="text-sm leading-relaxed text-brutal-tinta/80">
                Ser el programa de becas más confiable y transparente de
                Guatemala, donde cada quetzal invertido se traduzca en
                oportunidades reales de transformación educativa.
              </p>
            </div>
            <div className="flex items-end">
              <Button href="/nosotros" variant="ghost" className="w-full">
                Conocer más →
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Sobre EDUVIAGT */}
      <section className="border-b-[3px] border-brutal-tinta bg-sigeb-blue-dark py-16 text-brutal-papel">
        <Container>
          <div className="mx-auto max-w-4xl">
            <p className="brut-label text-xs font-bold text-brutal-gold">// Sobre EDUVIAGT</p>
            <h2 className="text-mega text-3xl font-black md:text-5xl">Transparencia total</h2>
            <p className="mt-4 font-mono text-base text-brutal-papel/80">
              EDUVIAGT es la plataforma para la gestión integral de programas de
              becas del Ministerio de Educación de Guatemala. Cada paso queda
              documentado y auditable.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                { icono: 'info' as IconName, titulo: 'Información clara', texto: 'Acceso sencillo a todos los programas de becas disponibles.' },
                { icono: 'check' as IconName, titulo: 'Seguimiento en vivo', texto: 'Consulta el estado de tu postulación en tiempo real.' },
                { icono: 'estrella' as IconName, titulo: 'Proceso transparente', texto: 'Evaluación justa y decisiones documentadas.' },
              ].map((item) => (
                <div
                  key={item.titulo}
                  className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-6 text-brutal-tinta shadow-brutal-sm"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-brutal border-2 border-brutal-tinta bg-brutal-gold text-2xl">
                    <Icon name={item.icono} className="h-6 w-6" />
                  </div>
                  <h3 className="font-brut text-lg font-black uppercase">{item.titulo}</h3>
                  <p className="mt-1 text-sm text-brutal-tinta/70">{item.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Cómo solicitar */}
      <section className="border-b-[3px] border-brutal-tinta bg-brutal-papel py-16">
        <Container>
          <p className="brut-label text-xs font-bold text-brutal-cyan">// Proceso</p>
          <h2 className="text-mega mb-12 text-3xl font-black text-brutal-tinta md:text-5xl">
            ¿Cómo solicitar una beca?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { numero: '01', titulo: 'REGÍSTRATE', texto: 'Crea tu cuenta con tu CUI' },
              { numero: '02', titulo: 'POSTÚLATE', texto: 'Selecciona una convocatoria' },
              { numero: '03', titulo: 'DOCUMENTA', texto: 'Carga los requisitos' },
              { numero: '04', titulo: 'EVALUACIÓN', texto: 'Tu solicitud es evaluada' },
              { numero: '05', titulo: 'COMITÉ', texto: 'Se revisa tu expediente' },
              { numero: '06', titulo: 'RESULTADO', texto: 'Consulta tu resolución' },
            ].map((paso) => (
              <div
                key={paso.numero}
                className="group rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-6 shadow-brutal-sm transition-transform hover:-translate-y-1"
              >
                <div className="font-brut text-5xl font-black text-brutal-cyan transition-transform group-hover:rotate-6">
                  {paso.numero}
                </div>
                <h3 className="mt-3 font-brut text-lg font-black uppercase text-brutal-tinta">
                  {paso.titulo}
                </h3>
                <p className="text-sm text-brutal-tinta/70">{paso.texto}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Requisitos */}
      <section className="border-b-[3px] border-brutal-tinta bg-brutal-blanco py-16">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="brut-label text-xs font-bold text-brutal-cyan">// Requisitos</p>
              <h2 className="text-mega mb-8 text-3xl font-black text-brutal-tinta md:text-5xl">
                Requisitos generales
              </h2>
              <ul className="space-y-3">
                {REQUISITOS.map((req) => (
                  <li key={req} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-brutal border-2 border-brutal-tinta bg-brutal-gold text-brutal-tinta">
                      <Icon name="check" className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-mono text-sm leading-relaxed text-brutal-tinta/80">
                      {req}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="brut-label text-xs font-bold text-brutal-gold">// Documentos</p>
              <h2 className="text-mega mb-8 text-3xl font-black text-brutal-tinta md:text-5xl">
                Documentación
              </h2>
              <div className="flex flex-wrap gap-3">
                {DOCUMENTOS.map((doc) => (
                  <span
                    key={doc}
                    className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-cyan/15 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-brutal-tinta"
                  >
                    {doc}
                  </span>
                ))}
              </div>
              <p className="mt-6 max-w-xl font-mono text-sm leading-relaxed text-brutal-tinta/60">
                La lista exacta de documentos se define para cada convocatoria.
                Revisa los detalles del programa antes de postularte.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Cinta final de acción */}
      <section className="bg-brutal-papel py-16">
        <Container>
          <div className="flex flex-col items-center gap-6 border-[3px] border-brutal-tinta bg-brutal-gold px-6 py-14 text-center shadow-brutal">
            <h2 className="text-mega text-3xl font-black text-brutal-tinta md:text-5xl">
              Tu oportunidad empieza hoy
            </h2>
            <p className="max-w-xl font-mono text-sm text-brutal-tinta/80">
              Crea tu cuenta y postúlate a las convocatorias abiertas. El proceso
              es gratuito, digital y totalmente auditable.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button href="/registro">Crear mi cuenta</Button>
              <Button href="/login" variant="ghost">
                Acceso al sistema
              </Button>
            </div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-brutal-tinta/60">
              <Link href="/consulta" className="underline decoration-brutal-tinta underline-offset-4 hover:bg-brutal-tinta/10">
                ¿Ya te postulaste? Consulta tu solicitud por código →
              </Link>
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}