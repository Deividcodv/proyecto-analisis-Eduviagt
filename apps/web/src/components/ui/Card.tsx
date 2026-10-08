import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`border-[3px] border-brutal-tinta bg-brutal-blanco p-6 shadow-brutal ${className}`}
    >
      {children}
    </div>
  );
}