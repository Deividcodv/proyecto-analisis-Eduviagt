'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { httpData, type ConsultaSolicitud } from '@/lib/api';
import { etiquetaEstado } from '@/lib/etiquetas';
import { traducirError } from '@/lib/mensajes-error';

export function ConsultaForm() {
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ConsultaSolicitud | null>(null);

  async function consultar(e: React.FormEvent) {
    e.preventDefault();
    const codigoTrim = codigo.trim();
    if (!codigoTrim) {
      setError('Ingresa el número de tu solicitud.');
      return;
    }
    setCargando(true);
    setError(null);
    setResultado(null);
    try {
      const data = await httpData<ConsultaSolicitud>(
        `/solicitudes/consulta/${encodeURIComponent(codigoTrim)}`,
      );
      setResultado(data);
    } catch (err) {
      setError(traducirError(err, 'No se pudo consultar la solicitud.'));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <form
        onSubmit={consultar}
        className="flex flex-col gap-4 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco p-6 shadow-brutal-sm sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Input
            label="Número de solicitud"
            name="codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Escribe tu número de solicitud"
            disabled={cargando}
          />
        </div>
        <Button type="submit" disabled={cargando}>
          {cargando ? 'Consultando...' : 'Consultar'}
        </Button>
      </form>

      {error && (
        <div className="rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">
          {error}
        </div>
      )}

      {cargando && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {resultado && <ResultadoConsulta resultado={resultado} />}
    </div>
  );
}

const coloresEstado: Record<string, string> = {
  BORRADOR: 'bg-brutal-tinta/15 text-brutal-tinta',
  ENVIADA: 'bg-brutal-cyan/20 text-brutal-tinta',
  EN_REVISION: 'bg-brutal-gold/20 text-brutal-tinta',
  CORRECCION: 'bg-brutal-naranja/20 text-brutal-tinta',
  EVALUADA: 'bg-brutal-indigo/20 text-brutal-tinta',
  APROBADA: 'bg-brutal-lima/30 text-brutal-tinta',
  RECHAZADA: 'bg-brutal-rojo/20 text-brutal-tinta',
};

function ResultadoConsulta({ resultado }: { resultado: ConsultaSolicitud }) {
  const etapa = resultado.historial ?? [];

  return (
    <div className="overflow-hidden rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco shadow-brutal">
      <div className="brut-cinta border-b border-brutal-tinta bg-brutal-tinta px-6 py-4 text-brutal-papel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="brut-label font-mono text-xs text-brutal-papel/85">
              Solicitud
            </p>
            <p className="font-mono text-sm font-bold text-brutal-gold">
              {resultado.codigo}
            </p>
          </div>
          <span
            className={`rounded-brutal border-2 border-brutal-tinta px-3 py-1 text-xs font-black ${
              coloresEstado[resultado.estado] ?? 'bg-brutal-papel text-brutal-tinta'
            }`}
          >
            {etiquetaEstado(resultado.estado)}
          </span>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="brut-label font-mono text-xs text-brutal-tinta/75">Beca</p>
            <p className="font-brut font-bold text-brutal-tinta">
              {resultado.beca ?? '—'}
            </p>
          </div>
          <div>
            <p className="brut-label font-mono text-xs text-brutal-tinta/75">Convocatoria</p>
            <p className="font-brut font-bold text-brutal-tinta">
              {resultado.convocatoria ?? '—'}
            </p>
          </div>
        </div>

        {etapa.length > 0 ? (
          <div className="mt-6">
            <p className="mb-3 font-brut text-sm font-bold uppercase tracking-wide text-brutal-cyan">
              Historial del proceso
            </p>
            <ol className="relative space-y-4 border-l-[3px] border-brutal-tinta pl-6">
              {etapa.map((hito, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[27px] top-1 h-4 w-4 rounded-brutal border-2 border-brutal-tinta bg-brutal-gold" />
                  <p className="font-brut text-sm font-bold uppercase text-brutal-tinta">
                    {etiquetaEstado(hito.estado)}
                  </p>
                  {hito.comentario && (
                    <p className="text-xs text-brutal-tinta/80">{hito.comentario}</p>
                  )}
                  <p className="font-mono text-xs text-brutal-tinta/75">
                    {new Date(hito.fecha).toLocaleDateString('es-GT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="mt-4 text-xs text-brutal-tinta/75">
            Sin historial registrado aún.
          </p>
        )}
      </div>
    </div>
  );
}
