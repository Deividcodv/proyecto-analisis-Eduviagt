'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { fetchConToken } from '@/lib/api-auth';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { InternalPageHeader } from '@/components/ui/InternalPageHeader';
import { DetalleEvaluacion } from '@/components/evaluador/DetalleEvaluacion';
import type { EvaluacionAsignada } from '@/lib/api';
import { AvisoDialog } from '@/components/ui/AvisoDialog';

export default function EvaluadorPage() {
  return (
    <ProtectedRoute roles={['EVALUADOR']}>
      <EvaluadorContent />
    </ProtectedRoute>
  );
}

/**
 * Panel del evaluador.
 *
 * El listado muestra solo la información general de cada postulación (quién
 * la presentó, de qué beca es y qué tanto lleva). El detalle completo —datos
 * del postulante, convocatoria, montos, perfiles, respuestas y documentos—
 * está en la ventana de detalle, que se abre desde cada tarjeta.
 *
 * Las postulaciones se separan en dos colas: las que el evaluador tiene
 * pendientes y las que ya terminó.
 */
function EvaluadorContent() {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionAsignada[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<EvaluacionAsignada | null>(null);

  const cargar = useCallback(async () => {
    try {
      const data = await fetchConToken<EvaluacionAsignada[]>(
        '/evaluaciones/mias',
      );
      setEvaluaciones(data);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudieron cargar las evaluaciones',
      );
      // Sin esto la vista se queda en el spinner para siempre.
      setEvaluaciones([]);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const pendientes = (evaluaciones ?? []).filter((e) => !e.finalizada);
  const terminadas = (evaluaciones ?? []).filter((e) => e.finalizada);

  if (evaluaciones === null) {
    return (
      <>
        <InternalPageHeader
          title="Panel del evaluador"
          subtitle="Revisa y puntúa las solicitudes asignadas."
        />
        <Container className="py-8">
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        </Container>
      </>
    );
  }

  const TarjetaPostulacion = ({
    evaluacion,
    etiqueta,
  }: {
    evaluacion: EvaluacionAsignada;
    etiqueta: string;
  }) => (
    <Card data-solicitud-id={evaluacion.solicitudId} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-brutal-tinta">
              {evaluacion.solicitud.usuario.nombres}
            </h3>
            {/* Si el evaluador ya terminó, su evaluación está cerrada:
                aunque la solicitud siga en revisión esperando a otro
                evaluador, para él ya está evaluada. */}
            {evaluacion.finalizada ? (
              <Badge estado="EVALUADA" />
            ) : (
              <Badge estado={evaluacion.solicitud.estado} />
            )}
          </div>
          <p className="font-mono text-xs text-brutal-tinta/70">
            Solicitud {evaluacion.solicitudId.slice(0, 8)} · CUI{' '}
            {evaluacion.solicitud.usuario.cui}
          </p>
          <p className="text-sm text-brutal-tinta/80">
            {evaluacion.solicitud.convocatoria.beca.nombre}
          </p>
          <p className="text-sm text-brutal-tinta/70">
            {evaluacion.solicitud.convocatoria.nombre}
          </p>
          {evaluacion.finalizada &&
            evaluacion.solicitud.estado === 'EN_REVISION' && (
              <p className="mt-1 font-mono text-xs font-bold text-brutal-tinta/70">
                Evaluada por ti · esperando otro evaluador
              </p>
            )}
        </div>
        <div className="text-right">
          <span className="font-mono text-sm font-bold text-brutal-tinta">
            {evaluacion.completados}/{evaluacion.totalCriterios} completados
          </span>
          <p className="mt-1 font-mono text-xs text-brutal-tinta/70">
            {etiqueta}
          </p>
        </div>
      </div>
      <div>
        <Button onClick={() => setAbierta(evaluacion)}>Abrir detalle</Button>
      </div>
    </Card>
  );

  return (
    <>
      <InternalPageHeader
        title="Panel del evaluador"
        subtitle="Revisa y puntúa las solicitudes asignadas."
      />

      <Container className="py-8">
        <AvisoDialog
        open={!!error}
        titulo="No se pudo completar la acción"
        tono="error"
        mensaje={error ?? ''}
        onCerrar={() => {
          setError(null);
        }}
      />

        <section data-testid="cola-por-evaluar" className="mb-8">
          <h2 className="mb-3 font-brut text-xl font-black uppercase tracking-wide text-brutal-tinta">
            Por evaluar
          </h2>
          {pendientes.length === 0 ? (
            <Card className="text-center">
              <p className="text-sm font-bold text-brutal-tinta/80">
                No tienes postulaciones pendientes de evaluar.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendientes.map((ev) => (
                <TarjetaPostulacion
                  key={ev.solicitudId}
                  evaluacion={ev}
                  etiqueta="Pendiente de tu evaluación"
                />
              ))}
            </div>
          )}
        </section>

        <section data-testid="cola-evaluadas">
          <h2 className="mb-3 font-brut text-xl font-black uppercase tracking-wide text-brutal-tinta">
            Ya evaluadas
          </h2>
          {terminadas.length === 0 ? (
            <Card className="text-center">
              <p className="text-sm font-bold text-brutal-tinta/80">
                Todavía no has terminado ninguna evaluación.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {terminadas.map((ev) => (
                <TarjetaPostulacion
                  key={ev.solicitudId}
                  evaluacion={ev}
                  etiqueta="Evaluación finalizada"
                />
              ))}
            </div>
          )}
        </section>
      </Container>

      {abierta && (
        <DetalleEvaluacion
          evaluacion={abierta}
          onCerrar={() => setAbierta(null)}
          onCambio={cargar}
        />
      )}
    </>
  );
}
