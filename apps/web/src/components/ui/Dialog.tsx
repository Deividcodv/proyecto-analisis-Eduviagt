'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Ventana modal base.
 *
 * Reúne lo que todas las ventanas necesitan: papel de diálogo, foco dentro
 * del panel al abrir, cierre con Escape, y cierre al pulsar fuera. El
 * contenido y el pie los decide quien la usa.
 */
interface DialogProps {
  open: boolean;
  titulo: string;
  descripcion?: ReactNode;
  onCerrar: () => void;
  children?: ReactNode;
  pie?: ReactNode;
  ancho?: 'md' | 'lg' | 'xl';
  etiquetaCerrar?: string;
}

const ANCHOS = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

export function Dialog({
  open,
  titulo,
  descripcion,
  onCerrar,
  children,
  pie,
  ancho = 'md',
  etiquetaCerrar = 'Cerrar',
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alPulsar);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', alPulsar);
  }, [open, onCerrar]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brutal-tinta/70 p-4">
      <button
        type="button"
        aria-label={etiquetaCerrar}
        onClick={onCerrar}
        className="absolute inset-0 h-full w-full cursor-default"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className={`relative my-8 w-full ${ANCHOS[ancho]} rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-6 shadow-brutal-lg`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
              {titulo}
            </h2>
            {descripcion && (
              <p className="mt-1 text-sm text-brutal-tinta/75">{descripcion}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label={etiquetaCerrar}
            className="shrink-0 rounded-brutal border-[3px] border-brutal-tinta px-3 py-1 font-brut text-xs font-bold uppercase tracking-wide text-brutal-tinta hover:bg-brutal-naranja"
          >
            ×
          </button>
        </div>

        {children}

        {pie && <div className="mt-6 flex flex-wrap justify-end gap-3">{pie}</div>}
      </div>
    </div>
  );
}
