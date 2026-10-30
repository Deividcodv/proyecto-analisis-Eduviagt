import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`border-[3px] border-brutal-tinta bg-brutal-blanco p-6 shadow-brutal ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
