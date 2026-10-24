'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

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
  placeholder = 'Seleccionar…',
}: CatalogoOtroProps) {
  const esOtro = value === '__otro__';

  return (
    <div>
      <Select
        label={nombre}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        options={[...opciones, { value: '__otro__', label: 'Otro' }]}
      />
      {esOtro && (
        <Input
          label={`${nombre} (otro)`}
          className="mt-2"
          value={otroValue}
          onChange={(e) => onOtroChange(e.target.value)}
          placeholder="Escribe tu opción"
        />
      )}
    </div>
  );
}
