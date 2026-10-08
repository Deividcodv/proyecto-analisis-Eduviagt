import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className = '', id, ...rest }, ref) {
    const inputId = id ?? rest.name;

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
          className={`rounded-brutal border-[3px] px-3 py-2 text-sm text-brutal-tinta transition-all placeholder:text-brutal-tinta/50 focus:outline-none ${
            error
              ? 'border-brutal-rojo bg-red-50 text-brutal-tinta'
              : 'border-brutal-tinta bg-brutal-blanco text-brutal-tinta focus:bg-brutal-cyan/10'
          } ${className}`}
          {...rest}
        />
        {error && <p className="mt-1 font-mono text-xs font-bold text-brutal-rojo">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';