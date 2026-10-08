import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { ConsultaForm } from '@/components/consulta/ConsultaForm';

export const metadata: Metadata = {
  title: 'Consultar solicitud | EDUVIAGT',
  description:
    'Consulta el estado de tu solicitud de beca sin necesidad de iniciar sesión.',
};

export default function ConsultaPage() {
  return (
    <main>
      <section className="brut-cinta border-b-[3px] border-brutal-tinta bg-sigeb-blue-dark py-12 text-brutal-papel">
        <Container>
          <p className="brut-label text-xs font-bold text-brutal-gold">// Consulta</p>
          <h1 className="text-mega text-3xl font-black md:text-5xl">
            Consulta el estado de tu beca
          </h1>
          <p className="mt-2 max-w-2xl font-mono text-sm text-brutal-papel/80">
            Ingresa el número de solicitud que recibiste al postularte para
            conocer en qué etapa se encuentra tu proceso.
          </p>
        </Container>
      </section>

      <section className="bg-brutal-papel py-12">
        <Container className="min-h-[40vh]">
          <ConsultaForm />
        </Container>
      </section>
    </main>
  );
}

