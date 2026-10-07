import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-md rounded-brutal border-[3px] border-dashed border-brutal-tinta bg-brutal-blanco p-8 text-center shadow-brutal-sm">
      <p className="font-brut text-lg font-black uppercase text-brutal-tinta">{title}</p>
      {description && <p className="mt-2 text-sm text-brutal-tinta/70">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}