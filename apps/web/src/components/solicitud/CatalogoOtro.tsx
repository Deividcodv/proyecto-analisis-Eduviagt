'use client';

interface Opcion {
  value: string;
  label: string;
}

interface CatalogoOtroProps {
  nombre: string;
  opciones: Opcion[];
  value: string;
  otroValue: string;
  onChange: (id: string) => void;
  onOtroChange: (texto: string) => void;
  placeholder?: string;
}

export function CatalogoOtro({
  nombre,
  opciones,
  value,
  otroValue,
  onChange,
  onOtroChange,
  placeholder = 'Seleccionar...',
}: CatalogoOtroProps) {
  const esOtro = value === '__otro__';
  return (
    <div>
      <div className="w-full">
        <label className="mb-1 block text-sm font-medium text-brutal-tinta">
          {nombre}
        </label>
        <select
          className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-brutal-tinta transition-colors focus:border-sigeb-blue focus:outline-none focus:ring-2 focus:ring-sigeb-blue/20 ${
            value ? '' : 'text-brutal-tinta/70'
          }`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {opciones.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>
              {opcion.label}
            </option>
          ))}
          <option value="__otro__">Otro</option>
        </select>
      </div>
      {esOtro && (
        <input
          type="text"
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-sigeb-blue focus:outline-none focus:ring-2 focus:ring-sigeb-blue/20"
          placeholder="Escribe tu opción"
          value={otroValue}
          onChange={(e) => onOtroChange(e.target.value)}
        />
      )}
    </div>
  );
}
