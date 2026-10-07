'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';

type TipoReporte = 'solicitudes-por-estado' | 'convocatorias' | 'evaluaciones';

const OPCIONES_TIPO: { value: TipoReporte; label: string }[] = [
  { value: 'solicitudes-por-estado', label: 'Solicitudes por estado' },
  { value: 'convocatorias', label: 'Convocatorias' },
  { value: 'evaluaciones', label: 'Evaluaciones' },
];

function descargar(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = filename;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export function ExportarReporte() {
  const [tipo, setTipo] = useState<TipoReporte>('solicitudes-por-estado');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportar = async () => {
    setExportando(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);
      const query = params.toString() ? `?${params.toString()}` : '';
      const token = window.localStorage.getItem('sigeb_access_token') ?? '';

      const res = await fetch(`/api/reportes/${tipo}/csv${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msj =
          (data as { message?: string } | null)?.message ??
          `La API respondió con estado ${res.status}`;
        throw new Error(Array.isArray(msj) ? msj.join(', ') : msj);
      }

      const blob = await res.blob();
      const hoy = new Date().toISOString().slice(0, 10);
      descargar(blob, `reporte-${tipo}-${hoy}.csv`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo exportar el reporte');
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-4">
      <p className="brut-label mb-3 text-xs font-bold uppercase tracking-wide text-brutal-tinta">
        Exportar con rango de fechas
      </p>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
        <Select
          label="Tipo de reporte"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoReporte)}
          options={OPCIONES_TIPO}
        />
        <Input
          label="Desde"
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
        />
        <Input
          label="Hasta"
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
        />
        <div className="flex items-end">
          <Button
            onClick={() => void exportar()}
            disabled={exportando}
            className="whitespace-nowrap"
          >
            {exportando ? 'Exportando…' : '↓ Exportar CSV'}
          </Button>
        </div>
      </div>
      {error && (
        <p className="mt-3 rounded-brutal border-2 border-brutal-rojo bg-red-50 px-3 py-2 text-xs font-bold text-brutal-rojo">
          {error}
        </p>
      )}
      <p className="mt-2 font-mono text-[11px] text-brutal-tinta/70">
        Deja el rango vacío para exportar todo el historial. Archivo compatible
        con Excel (UTF-8 con BOM).
      </p>
    </div>
  );
}