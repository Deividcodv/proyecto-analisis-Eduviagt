'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { COLORS_BRUTAL } from '@/components/reportes/paleta';

interface Etapa {
  clave: string;
  etiqueta: string;
  cantidad: number;
  porcentaje: number;
}

interface Embudo {
  total: number;
  etapas: Etapa[];
  conversion: {
    envio: number | null;
    evaluacion: number | null;
    decision: number | null;
    aprobacion: number | null;
  };
}

function formatConv(valor: number | null): string {
  return valor == null ? '—' : `${valor}%`;
}

export function EmbudoConversion() {
  const [data, setData] = useState<Embudo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const embudo = await fetchConToken<Embudo>('/reportes/embudo');
      setData(embudo);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el embudo');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (error) {
    return (
      <p className="rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">
        {error}
      </p>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {data.total === 0 ? (
        <Card>
          <p className="font-mono text-sm text-brutal-tinta/70">
            Aún no hay solicitudes para calcular el embudo.
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {data.etapas.map((etapa, i) => (
              <div key={etapa.clave}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <p className="font-brut text-xs font-black uppercase tracking-wide text-brutal-tinta">
                    {etapa.etiqueta}
                  </p>
                  <p className="font-mono text-xs text-brutal-tinta/70">
                    {etapa.cantidad} · {etapa.porcentaje}%
                  </p>
                </div>
                <div className="h-6 w-full border-2 border-brutal-tinta bg-brutal-papel">
                  <div
                    className="h-full border-r-2 border-brutal-tinta transition-all"
                    style={{
                      width: `${Math.max(etapa.porcentaje, etapa.cantidad > 0 ? 2 : 0)}%`,
                      backgroundColor: COLORS_BRUTAL[i % COLORS_BRUTAL.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ['Envío', data.conversion.envio],
              ['Evaluación', data.conversion.evaluacion],
              ['Decisión', data.conversion.decision],
              ['Aprobación', data.conversion.aprobacion],
            ].map(([label, valor]) => (
              <span
                key={label as string}
                className="rounded-brutal border-2 border-brutal-tinta bg-brutal-gold px-2 py-1 font-mono text-[11px] font-bold text-brutal-tinta"
              >
                {label}: {formatConv(valor as number | null)}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
