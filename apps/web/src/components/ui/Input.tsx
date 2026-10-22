import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className = '', id, ...rest }, ref) {
    // Sin `id` ni `name`, la etiqueta quedaría desasociada del campo:
    // se genera un id estable para que `htmlFor` siempre apunte al input.
    const autoId = useId();
    const inputId = id ?? rest.name ?? autoId;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block font-brut text-xs font-bold uppercase tracking-wide text-brutal-tinta"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`rounded-brutal border-[3px] px-3 py-2 text-sm text-brutal-tinta transition-all placeholder:text-brutal-tinta/50 focus:outline-none focus-visible:ring-[3px] focus-visible:ring-brutal-tinta focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-blanco ${
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

Input.displayName = 'Input';