'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { formatearFecha, type Convocatoria } from '@/lib/api';

const accionesPorEstado: Record<string, { value: string; label: string }[]> = {
  BORRADOR: [{ value: 'publicar', label: 'Publicar' }],
  ABIERTA: [{ value: 'cerrar', label: 'Cerrar' }],
  CERRADA: [{ value: 'iniciar_evaluacion', label: 'Iniciar evaluación' }],
  EN_EVALUACION: [{ value: 'resolver', label: 'Resolver' }],
  RESUELTA: [{ value: 'archivar', label: 'Archivar' }],
};

export function PanelConvocatorias() {
  const [convocatorias, setConvocatorias] = useState<Convocatoria[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [acciones, setAcciones] = useState<Record<string, string>>({});

  const cargar = useCallback(async () => {
    try {
      const lista = await fetchConToken<Convocatoria[]>('/convocatorias/todas');
      setConvocatorias(lista);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las convocatorias');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const transicionar = async (id: string) => {
    const accion = acciones[id];
    if (!accion) return;
    setEnviando(true);
    setError(null);
    try {
      await fetchConToken(`/convocatorias/${id}/transicion`, {
        method: 'POST',
        body: { accion },
      });
      setExito('Estado actualizado.');
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el estado');
    } finally {
      setEnviando(false);
    }
  };

  if (!convocatorias) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">{error}</p>
      )}
      {exito && (
        <p className="mb-4 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-lima/30 p-4 text-sm font-bold text-brutal-tinta">{exito}</p>
      )}

      <div className="mb-6 flex justify-end">
        <Button href="/admin/convocatorias/nueva">+ Nueva convocatoria</Button>
      </div>

      <div className="space-y-4">
        {convocatorias.map((convocatoria) => {
          const opciones = accionesPorEstado[convocatoria.estado] ?? [];
          return (
            <Card
              key={convocatoria.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-brutal-tinta">
                    {convocatoria.nombre}
                  </h3>
                  <Badge estado={convocatoria.estado} />
                </div>
                <p className="text-sm text-brutal-tinta/70">{convocatoria.beca.nombre}</p>
                <p className="text-sm text-brutal-tinta/70">
                  Cierra el {formatearFecha(convocatoria.fechaCierre)} ·{' '}
                  {convocatoria._count?.solicitudes ?? 0} solicitudes
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  href={`/admin/convocatorias/${convocatoria.id}`}
                  variant="ghost"
                >
                  Editar
                </Button>
                {opciones.length > 0 && (
                  <>
                    <Select
                      value={acciones[convocatoria.id] ?? ''}
                      onChange={(e) =>
                        setAcciones((a) => ({ ...a, [convocatoria.id]: e.target.value }))
                      }
                      options={opciones}
                      className="w-52"
                    />
                    <Button
                      onClick={() => transicionar(convocatoria.id)}
                      disabled={!acciones[convocatoria.id] || enviando}
                    >
                      Aplicar
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
