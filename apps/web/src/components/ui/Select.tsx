import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, options, placeholder = 'Seleccionar...', className = '', id, ...rest },
    ref,
  ) {
    const selectId = id ?? rest.name;

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
          className={`rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco px-3 py-2 text-sm text-brutal-tinta transition-all placeholder:text-brutal-tinta/50 focus:bg-brutal-cyan/10 focus:outline-none ${className}`}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>
              {opcion.label}
            </option>
          ))}
        </select>
      </div>
    );
  },
);

Select.displayName = 'Select';