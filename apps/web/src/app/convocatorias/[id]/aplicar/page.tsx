'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { fetchConToken } from '@/lib/api-auth';
import { traducirError } from '@/lib/mensajes-error';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Stepper } from '@/components/ui/Stepper';
import { Spinner } from '@/components/ui/Spinner';
import { InternalPageHeader } from '@/components/ui/InternalPageHeader';
import {
  PasoCamposExtra,
  PasoDatosPersonales,
  PasoDocumentos,
  PasoEnviar,
  PasoPerfilAcademico,
  PasoPerfilFinanciero,
} from '@/components/solicitud/steps';
import {
  ETIQUETA_COBERTURA,
  formatearFecha,
  type CampoFormulario,
  type ConvocatoriaDetalle,
  type Solicitud,
  type SolicitudChecklist,
} from '@/lib/api';

export default function AplicarConvocatoriaPage() {
  return (
    <ProtectedRoute roles={['POSTULANTE']}>
      <AplicarConvocatoriaContent />
    </ProtectedRoute>
  );
}

interface MiSolicitud extends Solicitud {
  respuestas?: Record<string, Record<string, unknown>> | null;
  formularioSnapshot?: CampoFormulario[] | null;
}

function AplicarConvocatoriaContent() {
  const params = useParams<{ id: string }>();
  const convocatoriaId = params?.id;
  const router = useRouter();

  const [convocatoria, setConvocatoria] = useState<ConvocatoriaDetalle | null>(
    null,
  );
  const [solicitudId, setSolicitudId] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<
    Record<string, Record<string, unknown>> | null
  >(null);
  const [snapshot, setSnapshot] = useState<CampoFormulario[] | null>(null);
  const [checklist, setChecklist] = useState<SolicitudChecklist | null>(null);
  const [paso, setPaso] = useState('Convocatoria');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inicializar = useCallback(async () => {
    if (!convocatoriaId) return;
    setCargando(true);
    setError(null);
    try {
      const conv = await fetchConToken<ConvocatoriaDetalle>(
        `/convocatorias/${convocatoriaId}`,
      );
      setConvocatoria(conv);

      const mi = await fetchConToken<MiSolicitud | null>(
        `/convocatorias/${convocatoriaId}/mi-solicitud`,
      );

      if (mi) {
        setSolicitudId(mi.id);
        setRespuestas(mi.respuestas ?? null);
        setSnapshot(mi.formularioSnapshot ?? null);
      } else if (conv.estado === 'ABIERTA') {
        const creada = await fetchConToken<{ id: string }>('/solicitudes', {
          method: 'POST',
          body: { convocatoriaId },
        });
        setSolicitudId(creada.id);
        setSnapshot(conv.formulario ?? null);
      } else {
        setError('Esta convocatoria ya no acepta postulaciones.');
      }
    } catch (e) {
      setError(traducirError(e, 'No se pudo iniciar la postulación'));
    } finally {
      setCargando(false);
    }
  }, [convocatoriaId]);

  useEffect(() => {
    inicializar();
  }, [inicializar]);

  const cargarChecklist = useCallback(async () => {
    if (!solicitudId) return;
    try {
      const data = await fetchConToken<SolicitudChecklist>(
        `/solicitudes/${solicitudId}/checklist`,
      );
      setChecklist(data);
    } catch {
      // El resumen de progreso es informativo; un fallo no bloquea la postulación.
    }
  }, [solicitudId]);

  useEffect(() => {
    if (solicitudId) void cargarChecklist();
  }, [solicitudId, cargarChecklist]);

  const camposExtra = snapshot ?? convocatoria?.formulario ?? [];

  const pasos = ['Tus datos', 'Convocatoria', 'Perfil académico', 'Perfil financiero', 'Documentos'];
  if (camposExtra.length > 0) pasos.push('Información adicional');
  pasos.push('Enviar');

  const documentosOk =
    !checklist ||
    checklist.documentos.length === 0 ||
    checklist.documentos.every((d) => !d.obligatorio || d.cargado);
  const camposOk =
    !checklist || !checklist.pendientes.some((p) => p.startsWith('Campo "'));

  const completados: boolean[] = [
    true,
    true,
    !!checklist?.perfilAcademico,
    !!checklist?.perfilFinanciero,
    documentosOk,
  ];
  if (camposExtra.length > 0) completados.push(camposOk);
  completados.push(!!checklist && checklist.estado !== 'BORRADOR');

  const irAlSiguiente = () => {
    const indice = pasos.indexOf(paso);
    if (indice >= 0 && indice < pasos.length - 1) setPaso(pasos[indice + 1]);
  };

  const avanzar = async () => {
    await cargarChecklist();
    irAlSiguiente();
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!convocatoria) {
    return (
      <Container className="py-16">
        <p className="rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">
          {error ?? 'No se encontró la convocatoria.'}
        </p>
        <div className="mt-6">
          <Button href="/convocatorias" variant="ghost">
            Volver a las becas
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <>
      <InternalPageHeader
        etiqueta="Postulación"
        title="Completa tu postulación"
        subtitle={convocatoria.nombre}
      />

      <Container className="py-8">
        <div className="mb-4">
          <Link
            href={`/convocatorias/${convocatoria.id}`}
            className="font-mono text-xs font-bold uppercase text-brutal-tinta/70 hover:text-brutal-tinta"
          >
            ← Volver al detalle de la beca
          </Link>
        </div>

        {error && (
          <p className="mb-6 rounded-brutal border-[3px] border-brutal-naranja bg-brutal-naranja/15 p-4 text-sm font-bold text-brutal-tinta">
            {error}
          </p>
        )}

        {solicitudId && !error && (
          <>
            <div className="mb-8">
              <Stepper
                pasos={pasos}
                actual={pasos.indexOf(paso) + 1}
                completados={completados}
              />
            </div>

            {paso === 'Convocatoria' && (
              <Card>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <h2 className="font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
                    {convocatoria.nombre}
                  </h2>
                  <Badge estado={convocatoria.estado} />
                </div>
                <dl className="grid gap-3 font-mono text-sm text-brutal-tinta/80 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase text-brutal-tinta/50">Beca</dt>
                    <dd>{convocatoria.beca.nombre}</dd>
                  </div>
                  {convocatoria.nivelAcademico && (
                    <div>
                      <dt className="text-xs uppercase text-brutal-tinta/50">
                        Nivel académico
                      </dt>
                      <dd>{convocatoria.nivelAcademico.nombre}</dd>
                    </div>
                  )}
                  {convocatoria.cobertura && (
                    <div>
                      <dt className="text-xs uppercase text-brutal-tinta/50">
                        Cobertura
                      </dt>
                      <dd>{ETIQUETA_COBERTURA[convocatoria.cobertura]}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs uppercase text-brutal-tinta/50">Cierre</dt>
                    <dd>{formatearFecha(convocatoria.fechaCierre)}</dd>
                  </div>
                </dl>
                {convocatoria.descripcion && (
                  <p className="mt-4 text-sm text-brutal-tinta/80">
                    {convocatoria.descripcion}
                  </p>
                )}
                <p className="mt-4 text-sm text-brutal-tinta/70">
                  Vamos a completar tus datos personales, tu perfil académico, tu
                  perfil financiero, los documentos requeridos y la información
                  adicional de esta beca. Tus datos personales se cargan desde tu
                  perfil; puedes ajustarlos durante la postulación.
                </p>
                <div className="mt-6">
                  <Button onClick={irAlSiguiente}>Comenzar postulación</Button>
                </div>
              </Card>
            )}

            {paso === 'Tus datos' && (
              <PasoDatosPersonales
                solicitudId={solicitudId}
                onGuardado={avanzar}
                onError={setError}
              />
            )}

            {paso === 'Perfil académico' && (
              <PasoPerfilAcademico
                solicitudId={solicitudId}
                onGuardado={avanzar}
                onError={setError}
              />
            )}

            {paso === 'Perfil financiero' && (
              <PasoPerfilFinanciero
                solicitudId={solicitudId}
                onGuardado={avanzar}
                onError={setError}
              />
            )}

            {paso === 'Documentos' && (
              <PasoDocumentos
                solicitudId={solicitudId}
                onCompletado={avanzar}
                onError={setError}
              />
            )}

            {paso === 'Información adicional' && (
              <PasoCamposExtra
                solicitudId={solicitudId}
                campos={camposExtra}
                respuestas={respuestas}
                onGuardado={async () => {
                  const mi = await fetchConToken<MiSolicitud | null>(
                    `/convocatorias/${convocatoria.id}/mi-solicitud`,
                  ).catch(() => null);
                  if (mi) setRespuestas(mi.respuestas ?? null);
                  await avanzar();
                }}
                onError={setError}
              />
            )}

            {paso === 'Enviar' && (
              <PasoEnviar
                solicitudId={solicitudId}
                onEnviado={() => router.replace(`/solicitudes/${solicitudId}`)}
                onError={setError}
              />
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  const indice = pasos.indexOf(paso);
                  if (indice > 0) setPaso(pasos[indice - 1]);
                }}
                disabled={paso === 'Tus datos'}
              >
                Anterior
              </Button>
            </div>
          </>
        )}

        {!solicitudId && !error && (
          <p className="font-mono text-sm text-brutal-tinta/70">
            No se pudo preparar tu postulación.
          </p>
        )}
      </Container>
    </>
  );
}
