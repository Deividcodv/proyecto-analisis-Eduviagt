'use client';

import { Badge } from '@/components/ui/Badge';
import { Icon, type IconName } from '@/components/ui/Icon';
import { formatearFecha, type HistorialEstado } from '@/lib/api';

const ICONO_ESTADO: Record<string, IconName> = {
  BORRADOR: 'editar',
  ENVIADA: 'subir',
  EN_REVISION: 'buscar',
  CORRECCION: 'alerta',
  EVALUADA: 'check',
  APROBADA: 'check',
  RECHAZADA: 'cerrar',
};

const COLOR_NODO: Record<string, string> = {
  BORRADOR: 'bg-gray-300 text-brutal-tinta',
  ENVIADA: 'bg-sigeb-blue text-white',
  EN_REVISION: 'bg-brutal-indigo text-white',
  CORRECCION: 'bg-brutal-naranja text-brutal-tinta',
  EVALUADA: 'bg-brutal-teal text-brutal-tinta',
  APROBADA: 'bg-brutal-lima text-brutal-tinta',
  RECHAZADA: 'bg-brutal-rojo text-brutal-tinta',
};

export function LineaTemporal({ historial }: { historial: HistorialEstado[] }) {
  if (historial.length === 0) {
    return <p className="text-sm text-brutal-tinta/75">Sin movimientos registrados.</p>;
  }

  const ultimo = historial.length - 1;

  return (
    <ol className="space-y-0">
      {historial.map((h, index) => {
        const esActual = index === ultimo;
        const icono = ICONO_ESTADO[h.estado] ?? 'info';
        const tono = COLOR_NODO[h.estado] ?? 'bg-gray-300 text-brutal-tinta';
        return (
          <li key={index} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-brutal border-[3px] border-brutal-tinta shadow-brutal-sm ${tono}`}
              >
                <span className="font-brut text-sm font-black leading-none">
                  <Icon name={icono} className="h-4 w-4" />
                </span>
              </div>
              {index < ultimo && (
                <div className="w-[3px] flex-1 border-l-[3px] border-dashed border-brutal-tinta/40" />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge estado={h.estado} />
                {esActual && (
                  <span className="rounded-brutal border-2 border-brutal-tinta bg-brutal-gold px-2 py-0.5 font-brut text-xs font-bold uppercase tracking-wide text-brutal-tinta">
                    Estado actual
                  </span>
                )}
              </div>
              <div className="mt-0.5 font-mono text-xs text-brutal-tinta/80">
                {formatearFecha(h.fecha)}
                {esActual && ' · hoy'}
              </div>
              {h.comentario && (
                <p className="mt-1 font-mono text-sm text-brutal-tinta/80">
                  {h.comentario}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}