import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

export function MarcoBrutal({
  titulo,
  children,
  className = '',
}: {
  titulo: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`flex flex-col p-5 ${className}`}>
      <p className="brut-label mb-4 text-xs font-bold uppercase tracking-wide text-brutal-gold">
        {titulo}
      </p>
      <div className="relative min-h-[260px] flex-1">{children}</div>
    </Card>
  );
}
