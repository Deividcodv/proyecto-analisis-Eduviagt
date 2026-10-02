'use client';

import useSWR from 'swr';
import { fetcher, type Convocatoria, type ListaResponse } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

function formatearFecha(fecha: string) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) {
    return fecha;
  }
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function Convocatorias() {
  const { data, error, isLoading, mutate } = useSWR<ListaResponse<Convocatoria>>(
    '/convocatorias',
    fetcher,
  );

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-xl bg-gray-200"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="mb-4 font-medium text-red-700">
          No se pudieron cargar las convocatorias en este momento.
        </p>
        <button
          type="button"
          onClick={() => void mutate()}
          className="rounded-lg bg-sigeb-blue px-4 py-2 font-semibold text-white hover:bg-sigeb-blue-dark"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const activas = (data?.data ?? []).filter((c) => c.estado === 'ABIERTA');

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {activas.length === 0 ? (
        <p className="col-span-full text-center text-brutal-tinta/70">
          Por el momento no hay convocatorias abiertas. Vuelve pronto.
        </p>
      ) : (
        activas.map((convocatoria) => (
          <Card key={convocatoria.id}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <Badge estado={convocatoria.estado} />
              <span className="text-xs font-medium text-brutal-tinta/70">
                {convocatoria.beca.nombre}
              </span>
            </div>
            <h3 className="mb-2 text-lg font-bold text-sigeb-blue-dark">
              {convocatoria.nombre}
            </h3>
            {convocatoria.descripcion && (
              <p className="mb-4 line-clamp-3 text-sm text-brutal-tinta/70">
                {convocatoria.descripcion}
              </p>
            )}
            <dl className="space-y-1 text-xs text-brutal-tinta/70">
              <div className="flex justify-between">
                <dt>Apertura</dt>
                <dd>{formatearFecha(convocatoria.fechaApertura)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Cierre</dt>
                <dd>{formatearFecha(convocatoria.fechaCierre)}</dd>
              </div>
            </dl>
          </Card>
        ))
      )}
    </div>
  );
}