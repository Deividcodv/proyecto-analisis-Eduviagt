import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Convocatorias } from '@/components/home/Convocatorias';

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
            transparente.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button href="/convocatorias">Explorar becas</Button>
            <Button href="/consulta" variant="secondary">
              Consultar mi solicitud
            </Button>
          </div>
        </Container>
      </section>

      {/* Convocatorias abiertas (datos reales desde el API) */}
      <section className="border-y-[3px] border-brutal-tinta bg-brutal-papel py-16">
        <Container>
          <div className="mb-12 flex flex-col items-start gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="brut-label text-xs font-bold text-sigeb-blue">// Convocatorias</p>
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

      {/* Sobre SIGEB */}
      <section className="border-b-[3px] border-brutal-tinta bg-sigeb-blue-dark py-16 text-brutal-papel">
        <Container>
          <div className="mx-auto max-w-4xl">
            <p className="brut-label text-xs font-bold text-brutal-gold">// Sobre SIGEB</p>
            <h2 className="text-mega text-3xl font-black md:text-5xl">Transparencia total</h2>
            <p className="mt-4 font-mono text-base text-brutal-papel/80">
              SIGEB es la plataforma para la gestión integral de programas de
              becas del Ministerio de Educación de Guatemala. Cada paso queda
              documentado y auditable.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                { icona: 'ℹ', titulo: 'Información clara', texto: 'Acceso sencillo a todos los programas de becas disponibles.' },
                { icona: '✓', titulo: 'Seguimiento en vivo', texto: 'Consulta el estado de tu postulación en tiempo real.' },
                { icona: '★', titulo: 'Proceso transparente', texto: 'Evaluación justa y decisiones documentadas.' },
              ].map((item) => (
                <div
                  key={item.titulo}
                  className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-6 text-brutal-tinta shadow-brutal-sm"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-brutal border-2 border-brutal-tinta bg-brutal-gold text-2xl">
                    {item.icona}
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
      <section className="bg-brutal-papel py-16">
        <Container>
          <p className="brut-label text-xs font-bold text-sigeb-blue">// Proceso</p>
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
                <div className="font-brut text-5xl font-black text-sigeb-blue transition-transform group-hover:rotate-6">
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
    </div>
  );
}