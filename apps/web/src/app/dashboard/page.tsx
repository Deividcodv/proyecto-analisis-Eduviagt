'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { fetchConToken } from '@/lib/api-auth';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { formatearFecha, type Solicitud } from '@/lib/api';

const ordenEstados = [
  'BORRADOR',
  'ENVIADA',
  'EN_REVISION',
  'CORRECCION',
  'EVALUADA',
  'APROBADA',
  'RECHAZADA',
];

export default function DashboardPage() {
  return (
    <ProtectedRoute roles={['POSTULANTE']}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { usuario } = useAuth();
  const [solicitudes, setSolicitudes] = useState<Solicitud[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    fetchConToken<Solicitud[]>('/solicitudes')
      .then((data) => {
        if (activo) setSolicitudes(data);
      })
      .catch((e: Error) => {
        if (activo) setError(e.message);
      });
    return () => {
      activo = false;
    };
  }, []);

  const totales = (solicitudes ?? []).reduce<Record<string, number>>(
    (acc, s) => {
      acc[s.estado] = (acc[s.estado] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <>
      <section className="bg-sigeb-blue py-12 text-white">
        <Container>
          <h1 className="text-3xl font-bold md:text-4xl">
            Hola, {usuario?.nombres}
          </h1>
          <p className="mt-2 text-sigeb-white/90">
            Aquí puedes dar seguimiento a tus solicitudes de beca.
          </p>
        </Container>
      </section>

      <Container className="py-10">
        {error && (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {!solicitudes && !error ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : solicitudes && solicitudes.length === 0 ? (
          <EmptyState
            title="Aún no tienes solicitudes"
            description="Cuando te postules a una convocatoria, aquí verás el estado de tu solicitud."
          >
            <Button href="/convocatorias">Ver convocatorias abiertas</Button>
          </EmptyState>
        ) : (() => {
          const lista = solicitudes ?? [];
          return (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {ordenEstados.map((estado) => {
                  const cantidad = totales[estado] ?? 0;
                  if (cantidad === 0) return null;
                  return (
                    <Card key={estado} className="p-4">
                      <p className="text-3xl font-bold text-sigeb-blue-dark">
                        {cantidad}
                      </p>
                      <div className="mt-1">
                        <Badge estado={estado} />
                      </div>
                    </Card>
                  );
                })}
              </div>

              <h2 className="mt-10 mb-4 text-xl font-bold text-sigeb-blue-dark">
                Mis solicitudes
              </h2>

              <div className="space-y-4">
                {lista.map((sol) => (
                  <Card key={sol.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-sigeb-blue-dark">
                          {sol.convocatoria.beca.nombre}
                        </h3>
                        <Badge estado={sol.estado} />
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {sol.convocatoria.nombre}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Postulada el {formatearFecha(sol.createdAt)} ·{' '}
                        {sol._count?.documentos ?? 0} documento
                        {(sol._count?.documentos ?? 0) === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Button
                      href={`/solicitudes/${sol.id}`}
                      variant="ghost"
                      className="shrink-0 whitespace-nowrap"
                    >
                      Ver detalle
                    </Button>
                  </Card>
                ))}
              </div>

              <div className="mt-8">
                <Button href="/solicitudes/nueva">Crear nueva solicitud</Button>
              </div>
            </>
          );
        })()}
      </Container>
    </>
  );
}
