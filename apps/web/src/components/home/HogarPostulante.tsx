'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchConToken } from '@/lib/api-auth';
import { traducirError } from '@/lib/mensajes-error';
import {
  fetcher,
  formatearFecha,
  type Convocatoria,
  type ListaResponse,
  type Solicitud,
} from '@/lib/api';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { InternalPageHeader } from '@/components/ui/InternalPageHeader';
import { KpisPanel } from '@/components/home/KpisPanel';
import { ConvocatoriaCard } from '@/components/convocatorias/ConvocatoriaCard';

interface ProximoPaso {
  titulo: string;
  detalle: string;
  href: string;
  cta: string;
  icono: IconName;
}

function calcularProximoPaso(solicitudes: Solicitud[]): ProximoPaso {
  if (solicitudes.length === 0) {
    return {
      titulo: 'Explora las becas disponibles',
      detalle:
        'Aún no te has postulado a ninguna beca. Revisa las convocatorias abiertas y encuentra la que necesitas.',
      href: '/convocatorias',
      cta: 'Ver becas abiertas',
      icono: 'becas',
    };
  }

  const borrador = solicitudes.find((s) => s.estado === 'BORRADOR');
  if (borrador) {
    return {
      titulo: 'Termina tu postulación',
      detalle: `Tienes una postulación sin enviar para «${borrador.convocatoria?.nombre ?? 'una beca'}».`,
      href: `/convocatorias/${borrador.convocatoriaId}/aplicar`,
      cta: 'Continuar postulación',
      icono: 'documento',
    };
  }

  const correccion = solicitudes.find((s) => s.estado === 'CORRECCION');
  if (correccion) {
    return {
      titulo: 'Revisa las correcciones solicitadas',
      detalle:
        'El comité pidió cambios en tu postulación. Revísalos y vuelve a enviarla para continuar.',
      href: `/solicitudes/${correccion.id}`,
      cta: 'Ver correcciones',
      icono: 'alerta',
    };
  }

  const aprobada = solicitudes.find((s) => s.estado === 'APROBADA');
  if (aprobada) {
    return {
      titulo: '¡Tu beca fue aprobada!',
      detalle:
        'Puedes descargar tu constancia y revisar los detalles de tu postulación.',
      href: `/solicitudes/${aprobada.id}`,
      cta: 'Ver mi constancia',
      icono: 'check',
    };
  }

  return {
    titulo: 'Tu postulación está en proceso',
    detalle:
      'Estamos revisando tu información. Te avisaremos cuando haya novedades.',
    href: `/solicitudes/${solicitudes[0].id}`,
    cta: 'Ver detalle',
    icono: 'reloj',
  };
}

const accesosRapidos: { label: string; href: string; icono: IconName }[] = [
  { label: 'Postularme a una beca', href: '/convocatorias', icono: 'becas' },
  { label: 'Completar mis datos', href: '/perfil', icono: 'usuario' },
  { label: 'Consultar estado', href: '/consulta', icono: 'buscar' },
];

export function HogarPostulante() {
  const { usuario } = useAuth();
  const [solicitudes, setSolicitudes] = useState<Solicitud[] | null>(null);
  const [convocatorias, setConvocatorias] = useState<Convocatoria[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    fetchConToken<Solicitud[]>('/solicitudes')
      .then((data) => {
        if (activo) setSolicitudes(data);
      })
      .catch((e) => {
        if (activo) setError(traducirError(e));
      });

    fetcher<ListaResponse<Convocatoria>>('/convocatorias')
      .then((res) => {
        if (activo) setConvocatorias(res.data ?? []);
      })
      .catch(() => {
        if (activo) setConvocatorias([]);
      });

    return () => {
      activo = false;
    };
  }, []);

  const abiertas = useMemo(
    () => (convocatorias ?? []).filter((c) => c.estado === 'ABIERTA').slice(0, 3),
    [convocatorias],
  );

  const proximoPaso = useMemo(
    () => (solicitudes ? calcularProximoPaso(solicitudes) : null),
    [solicitudes],
  );

  const cargando = solicitudes === null && convocatorias === null;

  return (
    <>
      <InternalPageHeader
        title={`Hola, ${usuario?.nombres?.split(' ')[0] ?? ''}`}
        subtitle="Este es tu espacio para postularte a una beca y darle seguimiento."
      />

      <Container className="py-10">
        {error && (
          <p className="mb-6 rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">
            {error}
          </p>
        )}

        {cargando ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <>
            <KpisPanel />

            {proximoPaso && (
              <Card className="mt-8 flex flex-col gap-4 border-brutal-tinta bg-brutal-cyan/10 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-brutal border-[3px] border-brutal-tinta bg-brutal-gold text-brutal-tinta">
                    <Icon name={proximoPaso.icono} className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="brut-label text-[10px] font-bold uppercase text-brutal-tinta/60">
                      Tu siguiente paso
                    </p>
                    <h2 className="font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
                      {proximoPaso.titulo}
                    </h2>
                    <p className="mt-1 text-sm text-brutal-tinta/75">
                      {proximoPaso.detalle}
                    </p>
                  </div>
                </div>
                <Button href={proximoPaso.href} className="shrink-0 whitespace-nowrap">
                  {proximoPaso.cta}
                </Button>
              </Card>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {accesosRapidos.map((acceso) => (
                <Link
                  key={acceso.href}
                  href={acceso.href}
                  className="inline-flex items-center gap-2 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco px-4 py-2 font-brut text-xs font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-brutal-cyan hover:shadow-none"
                >
                  <Icon name={acceso.icono} className="h-4 w-4" />
                  {acceso.label}
                </Link>
              ))}
            </div>

            <section className="mt-10">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-brut text-xl font-black uppercase tracking-wide text-brutal-tinta">
                  Mis postulaciones
                </h2>
                <Link
                  href="/convocatorias"
                  className="font-mono text-xs font-bold uppercase text-brutal-cyan hover:text-brutal-tinta"
                >
                  Ver becas →
                </Link>
              </div>

              {solicitudes && solicitudes.length > 0 ? (
                <div className="space-y-4">
                  {solicitudes.map((sol) => {
                    const docsRequeridos =
                      sol.convocatoria?._count?.documentosRequeridos ?? 0;
                    const docsCargados = sol._count?.documentos ?? 0;
                    const codigoConv = `CONV-${(sol.convocatoria?.id ?? '')
                      .slice(0, 6)
                      .toUpperCase()}`;

                    return (
                      <Card
                        key={sol.id}
                        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-bold text-brutal-tinta">
                              {sol.convocatoria?.beca?.nombre ?? 'Beca'}
                            </h3>
                            <Badge estado={sol.estado} />
                          </div>
                          <p className="mt-1 text-sm text-brutal-tinta/70">
                            <span className="font-mono font-bold text-brutal-tinta">
                              {codigoConv}
                            </span>
                            {' · '}
                            {sol.convocatoria?.nombre ?? ''}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brutal-tinta/60">
                            <span>Postulada el {formatearFecha(sol.createdAt)}</span>
                            {docsRequeridos > 0 && (
                              <span>
                                Documentos:{' '}
                                <span className="font-bold text-brutal-tinta">
                                  {docsCargados}
                                </span>
                                /{docsRequeridos}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          href={`/solicitudes/${sol.id}`}
                          variant="ghost"
                          className="shrink-0 whitespace-nowrap"
                        >
                          Ver detalle
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="Aún no tienes postulaciones"
                  description="Cuando te postules a una beca, aquí verás el estado de tu solicitud."
                >
                  <Button href="/convocatorias">Ver becas abiertas</Button>
                </EmptyState>
              )}
            </section>

            <section className="mt-12">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-brut text-xl font-black uppercase tracking-wide text-brutal-tinta">
                  Becas abiertas
                </h2>
                <Link
                  href="/convocatorias"
                  className="font-mono text-xs font-bold uppercase text-brutal-cyan hover:text-brutal-tinta"
                >
                  Ver todas →
                </Link>
              </div>

              {abiertas.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {abiertas.map((convocatoria) => (
                    <ConvocatoriaCard
                      key={convocatoria.id}
                      convocatoria={convocatoria}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-brutal border-[3px] border-dashed border-brutal-tinta bg-brutal-blanco p-6 text-center text-sm text-brutal-tinta/70">
                  Por el momento no hay becas abiertas. Vuelve pronto.
                </p>
              )}
            </section>
          </>
        )}
      </Container>
    </>
  );
}
