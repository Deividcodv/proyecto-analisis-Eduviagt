import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, error, options, placeholder = 'Seleccionar…', className = '', id, ...rest },
    ref,
  ) {
    // Sin `id` ni `name`, la etiqueta quedaría desasociada del select:
    // se genera un id estable para que `htmlFor` siempre apunte al control.
    const autoId = useId();
    const selectId = id ?? rest.name ?? autoId;
    const errorId = `${selectId}-error`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1 block font-brut text-xs font-bold uppercase tracking-wide text-brutal-tinta"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`max-w-full rounded-brutal border-[3px] px-3 py-2 text-sm text-brutal-tinta transition-all placeholder:text-brutal-tinta/50 focus:bg-brutal-cyan/10 focus:outline-none focus-visible:ring-[3px] focus-visible:ring-brutal-tinta focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-blanco ${
            error ? 'border-brutal-rojo bg-red-50' : 'border-brutal-tinta bg-brutal-blanco'
          } ${className}`}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>
              {opcion.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} className="mt-1 font-mono text-xs font-bold text-brutal-rojo">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';