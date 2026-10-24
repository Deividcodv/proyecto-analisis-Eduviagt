import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

/**
 * Campo de texto multilínea del sistema. Sigue el mismo patrón que `Input`:
 * etiqueta asociada por `htmlFor`, `aria-invalid` y `aria-describedby` cuando
 * hay error, y anillo de foco visible para navegación por teclado.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, className = '', id, ...rest }, ref) {
    const autoId = useId();
    const textareaId = id ?? rest.name ?? autoId;
    const errorId = `${textareaId}-error`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1 block font-brut text-xs font-bold uppercase tracking-wide text-brutal-tinta"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-brutal border-[3px] px-3 py-2 text-sm text-brutal-tinta transition-all placeholder:text-brutal-tinta/50 focus:outline-none focus-visible:ring-[3px] focus-visible:ring-brutal-tinta focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-blanco ${
            error
              ? 'border-brutal-rojo bg-red-50 text-brutal-tinta'
              : 'border-brutal-tinta bg-brutal-blanco text-brutal-tinta focus:bg-brutal-cyan/10'
          } ${className}`}
          {...rest}
        />
        {error && (
          <p id={errorId} className="mt-1 font-mono text-xs font-bold text-brutal-rojo">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
