'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { etiquetaEstado } from '@/lib/etiquetas';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

interface FilaDetalle {
  id: string;
  nombre: string;
  beca: string;
  estado: string;
  total: number;
  borradores: number;
  enviadas: number;
  enRevision: number;
  evaluadas: number;
  aprobadas: number;
  rechazadas: number;
  totalDecisiones: number;
  completitud: number | null;
  tasaAprobacion: number | null;
  tiempoPromedioResolucionDias: number | null;
}

interface Totales {
  convocatorias: number;
  total: number;
  borradores: number;
  enviadas: number;
  enRevision: number;
  evaluadas: number;
  aprobadas: number;
  rechazadas: number;
  totalDecisiones: number;
  completitud: number | null;
  tasaAprobacion: number | null;
  tiempoPromedioResolucionDias: number | null;
}

interface Detalle {
  totales: Totales;
  filas: FilaDetalle[];
}

type ClaveColumna =
  | 'total'
  | 'borradores'
  | 'enviadas'
  | 'enRevision'
  | 'evaluadas'
  | 'aprobadas'
  | 'rechazadas';

const COLUMNAS: { clave: ClaveColumna; label: string }[] = [
  { clave: 'total', label: 'Total' },
  { clave: 'borradores', label: 'Borrad.' },
  { clave: 'enviadas', label: 'Enviadas' },
  { clave: 'enRevision', label: 'En revisión' },
  { clave: 'evaluadas', label: 'Evaluadas' },
  { clave: 'aprobadas', label: 'Aprob.' },
  { clave: 'rechazadas', label: 'Rech.' },
];

function pct(valor: number | null): string {
  return valor == null ? '—' : `${valor}%`;
}

function dias(valor: number | null): string {
  return valor == null ? '—' : `${valor} d`;
}

export function TablaDetalle() {
  const [data, setData] = useState<Detalle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const detalle = await fetchConToken<Detalle>('/reportes/detalle');
      setData(detalle);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el detalle');
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

  if (data.filas.length === 0) {
    return (
      <Card>
        <p className="font-mono text-sm text-brutal-tinta/70">
          Aún no hay convocatorias registradas.
        </p>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse font-mono text-xs">
        <thead>
          <tr className="bg-brutal-tinta text-brutal-papel">
            <th className="border-2 border-brutal-tinta px-2 py-2 text-left">
              Convocatoria
            </th>
            {COLUMNAS.map((c) => (
              <th
                key={c.clave}
                className="border-2 border-brutal-tinta px-2 py-2 text-right"
              >
                {c.label}
              </th>
            ))}
            <th className="border-2 border-brutal-tinta px-2 py-2 text-right">
              Completitud
            </th>
            <th className="border-2 border-brutal-tinta px-2 py-2 text-right">
              Aprobación
            </th>
            <th className="border-2 border-brutal-tinta px-2 py-2 text-right">
              Resolución
            </th>
          </tr>
        </thead>
        <tbody>
          {data.filas.map((f) => (
            <tr key={f.id} className="odd:bg-white even:bg-brutal-papel">
              <td className="border-2 border-brutal-tinta px-2 py-2">
                <span className="block font-brut font-bold text-brutal-tinta">
                  {f.nombre}
                </span>
                <span className="block text-[10px] text-brutal-tinta/60">
                  {f.beca} · {etiquetaEstado(f.estado)}
                </span>
              </td>
              {COLUMNAS.map((c) => (
                <td
                  key={c.clave}
                  className="border-2 border-brutal-tinta px-2 py-2 text-right text-brutal-tinta"
                >
                  {f[c.clave] as number}
                </td>
              ))}
              <td className="border-2 border-brutal-tinta px-2 py-2 text-right text-brutal-tinta">
                {pct(f.completitud)}
              </td>
              <td className="border-2 border-brutal-tinta px-2 py-2 text-right text-brutal-tinta">
                {pct(f.tasaAprobacion)}
              </td>
              <td className="border-2 border-brutal-tinta px-2 py-2 text-right text-brutal-tinta">
                {dias(f.tiempoPromedioResolucionDias)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-brutal-cyan font-bold text-brutal-tinta">
            <td className="border-2 border-brutal-tinta px-2 py-2">
              TOTAL ({data.totales.convocatorias} convocatorias)
            </td>
            {COLUMNAS.map((c) => (
              <td
                key={c.clave}
                className="border-2 border-brutal-tinta px-2 py-2 text-right"
              >
                {data.totales[c.clave] as number}
              </td>
            ))}
            <td className="border-2 border-brutal-tinta px-2 py-2 text-right">
              {pct(data.totales.completitud)}
            </td>
            <td className="border-2 border-brutal-tinta px-2 py-2 text-right">
              {pct(data.totales.tasaAprobacion)}
            </td>
            <td className="border-2 border-brutal-tinta px-2 py-2 text-right">
              {dias(data.totales.tiempoPromedioResolucionDias)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
