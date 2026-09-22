interface BadgeProps {
  estado: string;
  className?: string;
}

const colores: Record<string, string> = {
  ABIERTA: 'bg-green-100 text-green-800',
  BORRADOR: 'bg-gray-200 text-gray-700',
  CERRADA: 'bg-gray-100 text-gray-600',
  EN_EVALUACION: 'bg-blue-100 text-blue-800',
  RESUELTA: 'bg-purple-100 text-purple-800',
  ARCHIVADA: 'bg-gray-200 text-gray-600',
  ENVIADA: 'bg-blue-100 text-blue-800',
  EN_REVISION: 'bg-indigo-100 text-indigo-800',
  CORRECCION: 'bg-amber-100 text-amber-800',
  EVALUADA: 'bg-teal-100 text-teal-800',
  APROBADA: 'bg-green-100 text-green-800',
  RECHAZADA: 'bg-red-100 text-red-800',
};

export function Badge({ estado, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${colores[estado] ?? 'bg-gray-100 text-gray-700'} ${className}`}
    >
      {estado}
    </span>
  );
}