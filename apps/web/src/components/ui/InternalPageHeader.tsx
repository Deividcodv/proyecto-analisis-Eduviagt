import { Container } from '@/components/ui/Container';

interface InternalPageHeaderProps {
  title: string;
  subtitle?: string;
  etiqueta?: string;
}

export function InternalPageHeader({
  title,
  subtitle,
  etiqueta = 'Portal EDUVIAGT',
}: InternalPageHeaderProps) {
  return (
    <section className="brut-cinta border-b-[3px] border-brutal-tinta bg-brutal-tinta py-10 text-brutal-papel">
      <Container>
        <p className="brut-label mb-2 inline-block rounded-brutal border-2 border-brutal-gold bg-brutal-gold px-3 py-1 text-xs font-bold text-brutal-tinta">
          {etiqueta}
        </p>
        <h1 className="text-mega font-brut text-3xl font-black md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-3xl font-mono text-sm text-brutal-papel/80">{subtitle}</p>}
      </Container>
    </section>
  );
}
