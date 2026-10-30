'use client';

import type { ReactNode } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';

interface AvisoDialogProps {
  open: boolean;
  titulo: string;
  mensaje: ReactNode;
  /** info = informativo, exito = se hizo, error = no se pudo. */
  tono?: 'info' | 'exito' | 'error';
  onCerrar: () => void;
  textoBoton?: string;
  acciones?: ReactNode;
  ancho?: 'md' | 'lg' | 'xl';
}

const ESTILO_TITULO = {
  info: 'text-brutal-tinta',
  exito: 'text-brutal-tinta',
  error: 'text-brutal-rojo',
} as const;

const FONDO_TITULO = {
  info: 'bg-brutal-cyan',
  exito: 'bg-brutal-lima',
  error: 'bg-red-50',
} as const;

/**
 * Ventana de aviso para el resultado de una acción.
 *
 * Sustituye a los banners de texto arriba de la página: el mensaje se lee
 * de frente y se cierra con un botón.
 */
export function AvisoDialog({
  open,
  titulo,
  mensaje,
  tono = 'info',
  onCerrar,
  textoBoton = 'Entendido',
  acciones,
  ancho = 'md',
}: AvisoDialogProps) {
  return (
    <Dialog
      open={open}
      titulo={titulo}
      onCerrar={onCerrar}
      ancho={ancho}
      pie={
        <>
          {acciones}
          <Button onClick={onCerrar}>{textoBoton}</Button>
        </>
      }
    >
      <div
        className={`rounded-brutal border-[3px] border-brutal-tinta p-3 ${FONDO_TITULO[tono]}`}
      >
        <p className={`text-sm font-bold ${ESTILO_TITULO[tono]}`}>{mensaje}</p>
      </div>
    </Dialog>
  );
}
