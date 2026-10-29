'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { AvisoDialog } from '@/components/ui/AvisoDialog';

type TipoReporte = 'solicitudes-por-estado' | 'convocatorias' | 'evaluaciones';
type TipoPdf = 'general' | 'detalle';

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

interface Props {
  /** Filtros que ya tiene la página: se aplican a la exportación. */
  convocatoriaId?: string;
  estado?: string;
}

/**
 * Exportación del reporte: CSV con los datos agregados y PDF con las
 * gráficas. Ambos respetan los filtros de la página.
 */
export function ExportarReporte({ convocatoriaId, estado }: Props = {}) {
  const [tipo, setTipo] = useState<TipoReporte>('solicitudes-por-estado');
  const [tipoPdf, setTipoPdf] = useState<TipoPdf>('general');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [exportando, setExportando] = useState('');
  const [error, setError] = useState<string | null>(null);

  const parametros = (extra?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    if (convocatoriaId) params.set('convocatoriaId', convocatoriaId);
    if (estado) params.set('estado', estado);
    for (const [clave, valor] of Object.entries(extra ?? {})) {
      params.set(clave, valor);
    }
    const texto = params.toString();
    return texto ? `?${texto}` : '';
  };

  const exportar = async (formato: 'csv' | 'pdf') => {
    setExportando(formato);
    setError(null);
    try {
      const token = window.localStorage.getItem('sigeb_access_token') ?? '';
      const esCsv = formato === 'csv';
      const url = esCsv
        ? `/api/reportes/${tipo}/csv${parametros()}`
        : `/api/reportes/${tipoPdf}/pdf${parametros()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msj =
          (data as { message?: string } | null)?.message ??
          'No pudimos completar la solicitud. Intenta de nuevo.';
        throw new Error(Array.isArray(msj) ? msj.join(', ') : msj);
      }

      const blob = await res.blob();
      const hoy = new Date().toISOString().slice(0, 10);
      const nombre = esCsv ? tipo : tipoPdf;
      descargar(blob, `reporte-${nombre}-${hoy}.${esCsv ? 'csv' : 'pdf'}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo exportar el reporte');
    } finally {
      setExportando('');
    }
  };

  return (
    <div className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel p-4">
      <p className="brut-label mb-3 text-xs font-bold uppercase tracking-wide text-brutal-tinta">
        Exportar el reporte
      </p>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
        <Select
          label="Datos (CSV)"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoReporte)}
          options={OPCIONES_TIPO}
        />
        <Select
          label="Reporte (PDF)"
          value={tipoPdf}
          onChange={(e) => setTipoPdf(e.target.value as TipoPdf)}
          options={[
            { value: 'general', label: 'Resumen general con gráficas' },
            { value: 'detalle', label: 'Detalle por convocatoria' },
          ]}
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
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button
          onClick={() => void exportar('csv')}
          disabled={exportando !== ''}
          className="whitespace-nowrap"
        >
          {exportando === 'csv' ? 'Exportando…' : '↓ Exportar CSV'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => void exportar('pdf')}
          disabled={exportando !== ''}
          className="whitespace-nowrap"
        >
          {exportando === 'pdf' ? 'Generando…' : '↓ Exportar PDF'}
        </Button>
      </div>
      <AvisoDialog
        open={!!error}
        titulo="No se pudo completar la acción"
        tono="error"
        mensaje={error ?? ''}
        onCerrar={() => {
          setError(null);
        }}
      />
      <p className="mt-2 font-mono text-[11px] text-brutal-tinta/70">
        Las exportaciones respetan los filtros de la página. Deja el rango
        vacío para exportar todo el historial.
      </p>
    </div>
  );
}
