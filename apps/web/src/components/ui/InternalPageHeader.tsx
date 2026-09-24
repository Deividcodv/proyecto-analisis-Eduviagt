import { Container } from '@/components/ui/Container';

interface InternalPageHeaderProps {
  title: string;
  subtitle?: string;
}

export function InternalPageHeader({ title, subtitle }: InternalPageHeaderProps) {
  return (
    <section className="border-b-4 border-sigeb-gold bg-sigeb-blue-dark py-10 text-white">
      <Container>
        <p className="mb-2 inline-block rounded-full bg-sigeb-gold px-3 py-1 text-xs font-bold uppercase tracking-wide text-sigeb-blue-dark">
          Sistema interno
        </p>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sigeb-white/85">{subtitle}</p>}
      </Container>
    </section>
  );
}
