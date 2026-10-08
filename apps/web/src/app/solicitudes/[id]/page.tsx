'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { fetchConToken, descargarConstancia } from '@/lib/api-auth';
import { traducirError } from '@/lib/mensajes-error';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LineaTemporal } from '@/components/solicitud/LineaTemporal';
import {
  formatearFecha,
  type CampoFormulario,
  type SolicitudDetalle,
  type SolicitudChecklist,
} from '@/lib/api';

export default function SolicitudDetallePage() {
  return (
    <ProtectedRoute roles={['POSTULANTE']}>
      <SolicitudDetalleContent />
    </ProtectedRoute>
  );
}

function SolicitudDetalleContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? '';

  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null);
  const [checklist, setChecklist] = useState<SolicitudChecklist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState<string | null>(null);
  const [confirmTipo, setConfirmTipo] = useState<{
    tipoId: string;
    accion: 'eliminar' | 'reemplazar';
    archivo?: File;
  } | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [detalle, chk] = await Promise.all([
        fetchConToken<SolicitudDetalle>(`/solicitudes/${id}`),
        fetchConToken<SolicitudChecklist>(`/solicitudes/${id}/checklist`),
      ]);
      setSolicitud(detalle);
      setChecklist(chk);
      setError(null);
    } catch (e) {
      setError(traducirError(e, 'No se pudo cargar la postulación'));
    }
  }, [id]);

  useEffect(() => {
    if (id) cargar();
  }, [id, cargar]);

  const subir = async (tipoId: string, file: File) => {
    setSubiendo(tipoId);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await fetchConToken(`/solicitudes/${id}/documentos/${tipoId}`, {
        method: 'POST',
        body: fd,
        isFormData: true,
      });
      await cargar();
      setExito('Documento subido correctamente.');
    } catch (e) {
      setError(traducirError(e, 'No se pudo subir el documento'));
    } finally {
      setSubiendo(null);
    }
  };

  const quitar = async (tipoId: string) => {
    setSubiendo(tipoId);
    setError(null);
    try {
      await fetchConToken(`/solicitudes/${id}/documentos/${tipoId}`, {
        method: 'DELETE',
      });
      await cargar();
      setExito('Documento eliminado.');
    } catch (e) {
      setError(traducirError(e, 'No se pudo eliminar el documento'));
    } finally {
      setSubiendo(null);
    }
  };

  const enviar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await fetchConToken(`/solicitudes/${id}/transicion`, {
        method: 'POST',
        body: { accion: 'enviar', comentario: 'Solicitud enviada por el postulante' },
      });
      await cargar();
      setExito('Postulación enviada.');
    } catch (e) {
      setError(traducirError(e, 'No se pudo enviar la postulación'));
    } finally {
      setEnviando(false);
    }
  };

  if (!solicitud) {
    return (
      <Container className="flex min-h-[50vh] items-center justify-center py-16">
        {error ? (
          <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-700">{error}</p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => router.replace('/dashboard')}
            >
              Volver al dashboard
            </Button>
          </div>
        ) : (
          <Spinner />
        )}
      </Container>
    );
  }

  const puedeEnviar = solicitud.estado === 'BORRADOR';
  const enCorreccion = solicitud.estado === 'CORRECCION';

  const corregir = async () => {
    setEnviando(true);
    setError(null);
    try {
      await fetchConToken(`/solicitudes/${id}/transicion`, {
        method: 'POST',
        body: { accion: 'corregir', comentario: 'Postulante aplica correcciones solicitadas' },
      });
      await cargar();
      setExito('Correcciones aplicadas. Revisa y vuelve a enviar tu postulación.');
    } catch (e) {
      setError(traducirError(e, 'No se pudieron aplicar las correcciones'));
    } finally {
      setEnviando(false);
    }
  };

  const descargarPdf = async () => {
    setError(null);
    try {
      await descargarConstancia(solicitud.id);
      setExito('Comprobante descargado.');
    } catch (e) {
      setError(traducirError(e, 'No se pudo descargar el comprobante'));
    }
  };

  return (
    <>
      <section className="brut-cinta border-b-[3px] border-brutal-tinta bg-sigeb-blue-dark py-10 text-brutal-papel">
        <Container>
          <button
            onClick={() => router.replace('/dashboard')}
            className="mb-4 inline-block rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco px-3 py-1 font-mono text-xs font-bold text-brutal-tinta"
          >
            ← Volver al dashboard
          </button>
          <p className="mb-2 inline-block rounded-brutal border-[3px] border-brutal-tinta bg-brutal-gold px-3 py-1 font-brut text-xs font-bold uppercase tracking-wide text-brutal-tinta">
            Mi postulación
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Badge estado={solicitud.estado} />
            <span className="brut-label font-mono text-xs font-bold uppercase text-brutal-gold">
              {solicitud.convocatoria.beca.nombre}
            </span>
          </div>
          <h1 className="text-mega mt-3 font-black text-2xl uppercase md:text-4xl">
            {solicitud.convocatoria.nombre}
          </h1>
          <p className="mt-1 font-mono text-sm text-brutal-papel/80">
            Postulada el {formatearFecha(solicitud.createdAt)}
          </p>
          {solicitud.estado === 'APROBADA' && (
            <Button
              onClick={descargarPdf}
              className="mt-5"
            >
              Descargar comprobante (PDF)
            </Button>
          )}
          {(puedeEnviar || enCorreccion) && (
            <Button
              href={`/convocatorias/${solicitud.convocatoria.id}/aplicar`}
              className="mt-5"
            >
              Continuar postulación
            </Button>
          )}
        </Container>
      </section>

      <Container className="py-8">
        {error && (
          <p className="mb-4 rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">
            {error}
          </p>
        )}
        {exito && (
          <p className="mb-4 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-lima/30 p-4 text-sm font-bold text-brutal-tinta">
            {exito}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <DocsSection
              documentos={checklist?.documentos ?? []}
              subiendo={subiendo}
              onSubir={subir}
              onConfirmar={(tipoId, accion, archivo) =>
                setConfirmTipo({ tipoId, accion, archivo })
              }
            />

            <Card>
              <h2 className="mb-3 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
                Historial de la solicitud
              </h2>
              {solicitud.historial && solicitud.historial.length > 0 ? (
                <LineaTemporal historial={solicitud.historial} />
              ) : (
                <p className="text-sm text-brutal-tinta/75">Sin movimientos registrados.</p>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="mb-3 text-lg font-black text-brutal-tinta">
                Perfil académico
              </h2>
              {solicitud.perfilAcademico ? (
                <dl className="space-y-1 text-sm text-brutal-tinta/70">
                  <PerfilItem
                    label="Institución"
                    value={solicitud.perfilAcademico.institucion}
                  />
                  <PerfilItem
                    label="Carrera"
                    value={solicitud.perfilAcademico.carrera}
                  />
                  <PerfilItem
                    label="Promedio"
                    value={
                      solicitud.perfilAcademico.promedio != null
                        ? String(solicitud.perfilAcademico.promedio)
                        : undefined
                    }
                  />
                </dl>
              ) : (
                <p className="text-sm text-brutal-tinta/70">No completado.</p>
              )}
            </Card>

            <Card>
              <h2 className="mb-3 text-lg font-black text-brutal-tinta">
                Perfil financiero
              </h2>
              {solicitud.perfilFinanciero ? (
                <dl className="space-y-1 text-sm text-brutal-tinta/70">
                  <PerfilItem
                    label="Ingreso familiar"
                    value={
                      solicitud.perfilFinanciero.ingresoFamiliar != null
                        ? `Q ${solicitud.perfilFinanciero.ingresoFamiliar}`
                        : undefined
                    }
                  />
                  <PerfilItem
                    label="Dependientes"
                    value={
                      solicitud.perfilFinanciero.numeroDependientes != null
                        ? String(solicitud.perfilFinanciero.numeroDependientes)
                        : undefined
                    }
                  />
                  <PerfilItem
                    label="Becas anteriores"
                    value={solicitud.perfilFinanciero.becasAnteriores ? 'Sí' : 'No'}
                  />
                </dl>
              ) : (
                <p className="text-sm text-brutal-tinta/70">No completado.</p>
              )}
            </Card>

            <RespuestasExtra
              campos={solicitud.formularioSnapshot}
              respuestas={solicitud.respuestas}
            />

            {enCorreccion && (
              <Card className="border-brutal-rojo bg-red-50/40">
                <h2 className="mb-2 text-lg font-black text-brutal-tinta">
                  Correcciones requeridas
                </h2>
                <p className="mb-4 text-sm text-brutal-tinta/70">
                  El comité solicitó cambios en tu solicitud. Aplica las
                  correcciones y vuelve a enviarla para continuar con la
                  evaluación.
                </p>
                <Button
                  onClick={corregir}
                  disabled={enviando}
                  className="w-full"
                  variant="danger"
                >
                  {enviando ? <Spinner /> : 'Aplicar correcciones'}
                </Button>
              </Card>
            )}

            {puedeEnviar && (
              <Card>
                <h2 className="mb-2 text-lg font-black text-brutal-tinta">
                  Enviar solicitud
                </h2>
                <p className="mb-4 text-sm text-brutal-tinta/70">
                  {checklist?.completo
                    ? 'Tu solicitud está completa. Envíala para su evaluación.'
                    : `Faltan elementos para enviar: ${
                        checklist?.pendientes.join(', ') ?? ''
                      }`}
                </p>
                <Button
                  onClick={enviar}
                  disabled={enviando || !checklist?.completo}
                  className="w-full"
                >
                  {enviando ? <Spinner /> : 'Enviar solicitud'}
                </Button>
              </Card>
            )}
          </div>
        </div>
      </Container>

      <ConfirmDialog
        open={confirmTipo !== null}
        title={
          confirmTipo?.accion === 'eliminar'
            ? 'Eliminar documento'
            : 'Reemplazar documento'
        }
        description={
          confirmTipo?.accion === 'eliminar'
            ? 'Se eliminará el archivo subido. Esta acción no se puede deshacer.'
            : 'El archivo actual será reemplazado por el nuevo.'
        }
        confirmLabel="Confirmar"
        tone={confirmTipo?.accion === 'eliminar' ? 'danger' : 'primary'}
        onConfirm={() => {
          if (!confirmTipo) return;
          const { tipoId, accion, archivo } = confirmTipo;
          setConfirmTipo(null);
          if (accion === 'eliminar') {
            void quitar(tipoId);
          } else if (archivo) {
            void subir(tipoId, archivo);
          }
        }}
        onCancel={() => setConfirmTipo(null)}
      />
    </>
  );
}

function DocsSection({
  documentos,
  subiendo,
  onSubir,
  onConfirmar,
}: {
  documentos: {
    documentoTipoId: string;
    nombre: string;
    obligatorio: boolean;
    cargado: boolean;
    estado: string;
    version: number;
    comentarioRechazo: string | null;
    archivoUrl: string | null;
  }[];
  subiendo: string | null;
  onSubir: (tipoId: string, file: File) => void;
  onConfirmar: (
    tipoId: string,
    accion: 'eliminar' | 'reemplazar',
    archivo?: File,
  ) => void;
}) {
  return (
    <Card>
      <h2 className="mb-4 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
        Documentos
      </h2>
      {documentos.length === 0 ? (
        <p className="font-mono text-sm text-brutal-tinta/75">No se requieren documentos para esta solicitud.</p>
      ) : (
        <div className="space-y-3">
          {documentos.map((doc) => {
            const rechazado = doc.estado === 'RECHAZADO';
            return (
              <div
                key={doc.documentoTipoId}
                className={`flex flex-col gap-2 rounded-brutal border-[3px] p-3 sm:flex-row sm:items-center sm:justify-between ${
                  rechazado
                    ? 'border-brutal-rojo bg-red-50/40'
                    : 'border-brutal-tinta bg-brutal-papel'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">{doc.nombre}</p>
                    <Badge estado={doc.estado} />
                    {doc.version > 0 && (
                      <span className="font-mono text-xs text-brutal-tinta/60">v{doc.version}</span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-brutal-tinta/75">
                    {doc.obligatorio ? 'Obligatorio' : 'Opcional'}
                  </p>
                  {rechazado && (
                    <p className="mt-1 rounded-brutal border-2 border-brutal-rojo bg-brutal-rojo/10 px-3 py-1.5 font-mono text-xs font-bold text-brutal-tinta">
                      Documento rechazado
                      {doc.comentarioRechazo
                        ? `: ${doc.comentarioRechazo}`
                        : '. Revisa el archivo y vuelve a subirlo.'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {doc.cargado ? (
                    <>
                      <label className="cursor-pointer rounded-brutal border-[3px] border-brutal-tinta bg-brutal-cyan px-4 py-1.5 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
                        {subiendo === doc.documentoTipoId
                          ? 'Subiendo...'
                          : rechazado
                            ? 'Subir de nuevo'
                            : 'Reemplazar'}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          disabled={subiendo === doc.documentoTipoId}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onConfirmar(doc.documentoTipoId, 'reemplazar', file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <Button
                        variant="ghost"
                        onClick={() => onConfirmar(doc.documentoTipoId, 'eliminar')}
                        disabled={subiendo === doc.documentoTipoId}
                      >
                        Eliminar
                      </Button>
                    </>
                  ) : (
                    <label className="cursor-pointer rounded-brutal border-[3px] border-brutal-tinta bg-brutal-cyan px-4 py-1.5 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
                      {subiendo === doc.documentoTipoId ? 'Subiendo...' : 'Subir'}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        disabled={subiendo === doc.documentoTipoId}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onSubir(doc.documentoTipoId, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function PerfilItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <dt className="text-brutal-tinta/70">{label}</dt>
      <dd className="font-medium text-brutal-tinta">{value}</dd>
    </div>
  );
}

function formatearRespuesta(valor: unknown): string | null {
  if (valor === undefined || valor === null || valor === '') return null;
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  return String(valor);
}

function RespuestasExtra({
  campos,
  respuestas,
}: {
  campos?: CampoFormulario[] | null;
  respuestas?: Record<string, Record<string, unknown>> | null;
}) {
  if (!campos || campos.length === 0) return null;

  const valores: Record<string, unknown> = {};
  for (const seccion of Object.values(respuestas ?? {})) {
    if (seccion && typeof seccion === 'object') Object.assign(valores, seccion);
  }

  const conValor = campos.filter(
    (campo) => formatearRespuesta(valores[campo.id]) !== null,
  );
  if (conValor.length === 0) return null;

  return (
    <Card>
      <h2 className="mb-3 text-lg font-black text-brutal-tinta">
        Información adicional
      </h2>
      <dl className="space-y-1 text-sm text-brutal-tinta/70">
        {conValor.map((campo) => (
          <PerfilItem
            key={campo.id}
            label={campo.etiqueta}
            value={formatearRespuesta(valores[campo.id])}
          />
        ))}
      </dl>
    </Card>
  );
}
