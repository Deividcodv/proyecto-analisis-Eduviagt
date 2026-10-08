import { etiquetaEstado } from '@/lib/etiquetas';

interface BadgeProps {
  estado: string;
  className?: string;
}

const colores: Record<string, string> = {
  ABIERTA: 'bg-brutal-lima text-brutal-tinta border-brutal-tinta',
  BORRADOR: 'bg-gray-300 text-brutal-tinta border-brutal-tinta',
  CERRADA: 'bg-gray-200 text-brutal-tinta border-brutal-tinta',
  EN_EVALUACION: 'bg-sigeb-blue text-white border-brutal-tinta',
  RESUELTA: 'bg-brutal-rosa text-brutal-tinta border-brutal-tinta',
  ARCHIVADA: 'bg-brutal-tinta/60 text-white border-brutal-tinta',
  ENVIADA: 'bg-sigeb-blue text-white border-brutal-tinta',
  EN_REVISION: 'bg-brutal-indigo text-white border-brutal-tinta',
  CORRECCION: 'bg-brutal-naranja text-brutal-tinta border-brutal-tinta',
  EVALUADA: 'bg-brutal-teal text-brutal-tinta border-brutal-tinta',
  APROBADA: 'bg-brutal-lima text-brutal-tinta border-brutal-tinta',
  RECHAZADA: 'bg-brutal-rojo text-brutal-tinta border-brutal-tinta',
  PROGRAMADA: 'bg-sigeb-blue text-white border-brutal-tinta',
  EN_CURSO: 'bg-brutal-naranja text-brutal-tinta border-brutal-tinta',
  FINALIZADA: 'bg-brutal-rosa text-brutal-tinta border-brutal-tinta',
  CARGADO: 'bg-brutal-lima text-brutal-tinta border-brutal-tinta',
  PENDIENTE: 'bg-brutal-cyan text-brutal-tinta border-brutal-tinta',
  RECHAZADO: 'bg-brutal-rojo text-brutal-tinta border-brutal-tinta',
  ABSTENCION: 'bg-gray-300 text-brutal-tinta border-brutal-tinta',
  APROBAR: 'bg-brutal-lima text-brutal-tinta border-brutal-tinta',
  RECHAZAR: 'bg-brutal-rojo text-brutal-tinta border-brutal-tinta',
  ACTIVO: 'bg-brutal-lima text-brutal-tinta border-brutal-tinta',
  INACTIVO: 'bg-brutal-tinta/60 text-white border-brutal-tinta',
};

export function Badge({ estado, className = '' }: BadgeProps) {
  const clave = (estado || '').toUpperCase();

  return (
    <span
      className={`inline-block rounded-brutal border-2 border-brutal-tinta px-3 py-1 font-brut text-xs font-bold uppercase tracking-wide ${colores[clave] ?? 'bg-gray-300 text-brutal-tinta border-brutal-tinta'} ${className}`}
    >
      {etiquetaEstado(estado)}
    </span>
  );
}
