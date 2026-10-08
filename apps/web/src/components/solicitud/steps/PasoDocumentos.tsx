'use client';

import { useEffect, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { SolicitudChecklist } from '@/lib/api';

export function PasoDocumentos({
  solicitudId,
  onCompletado,
  onError,
}: {
  solicitudId: string;
  onCompletado: () => void;
  onError: (msg: string) => void;
}) {
  const [checklist, setChecklist] = useState<SolicitudChecklist | null>(null);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [confirmTipo, setConfirmTipo] = useState<{
    tipoId: string;
    accion: 'eliminar' | 'reemplazar';
    archivo?: File;
  } | null>(null);

  const cargar = async () => {
    try {
      const data = await fetchConToken<SolicitudChecklist>(
        `/solicitudes/${solicitudId}/checklist`,
      );
      setChecklist(data);
    } catch (e) {
      onError(
        e instanceof Error ? e.message : 'No se pudo cargar el checklist',
      );
    }
  };

  useEffect(() => {
    cargar();
  }, [solicitudId]);

  const subir = async (tipoId: string, file: File) => {
    setSubiendo(tipoId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await fetchConToken(`/solicitudes/${solicitudId}/documentos/${tipoId}`, {
        method: 'POST',
        body: fd,
        isFormData: true,
      });
      await cargar();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo subir el documento');
    } finally {
      setSubiendo(null);
    }
  };

  const quitar = async (tipoId: string) => {
    setSubiendo(tipoId);
    try {
      await fetchConToken(`/solicitudes/${solicitudId}/documentos/${tipoId}`, {
        method: 'DELETE',
      });
      await cargar();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo eliminar el documento');
    } finally {
      setSubiendo(null);
    }
  };

  const onConfirmar = async () => {
    if (!confirmTipo) return;
    const { tipoId, accion, archivo } = confirmTipo;
    setConfirmTipo(null);
    if (accion === 'eliminar') {
      await quitar(tipoId);
    } else if (archivo) {
      await subir(tipoId, archivo);
    }
  };

  if (!checklist) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const totalObligatorios = checklist.documentos.filter((d) => d.obligatorio).length;
  const subidos = checklist.documentos.filter(
    (d) => d.obligatorio && d.cargado,
  ).length;

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-brutal-tinta">
        Documentos requeridos
      </h2>
      <p className="mb-5 text-sm text-brutal-tinta/70">
        Sube cada documento requerido (PDF, JPG o PNG, máx. 5 MB). Puedes
        reemplazar o eliminar un documento subido en cualquier momento.
      </p>

      {totalObligatorios > 0 && (
        <div className="mb-5">
          <div className="mb-1 flex justify-between font-mono text-xs font-bold text-brutal-tinta">
            <span>Obligatorios subidos</span>
            <span>
              {subidos}/{totalObligatorios}
            </span>
          </div>
          <div className="h-3 w-full rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel">
            <div
              className={`h-full rounded-brutal ${subidos === totalObligatorios ? 'bg-brutal-lima' : 'bg-sigeb-blue'} transition-all`}
              style={{ width: `${(subidos / totalObligatorios) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {checklist.documentos.map((doc) => {
          const rechazado = doc.estado === 'RECHAZADO';
          return (
            <Card
              key={doc.documentoTipoId}
              className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                rechazado ? 'border-brutal-rojo bg-red-50/40' : ''
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-brutal-tinta">{doc.nombre}</p>
                  <Badge estado={doc.estado} />
                  {doc.version > 0 && (
                    <span className="font-mono text-xs text-brutal-tinta/60">
                      v{doc.version}
                    </span>
                  )}
                </div>
                <p className="text-xs text-brutal-tinta/70">
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

              <div className="flex flex-wrap items-center gap-3">
                {doc.cargado ? (
                  <>
                    <label className="cursor-pointer rounded-brutal border-[3px] border-brutal-tinta bg-brutal-cyan px-4 py-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
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
                          if (file) {
                            setConfirmTipo({
                              tipoId: doc.documentoTipoId,
                              accion: 'reemplazar',
                              archivo: file,
                            });
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setConfirmTipo({
                          tipoId: doc.documentoTipoId,
                          accion: 'eliminar',
                        })
                      }
                      disabled={subiendo === doc.documentoTipoId}
                    >
                      Eliminar
                    </Button>
                  </>
                ) : (
                  <label className="cursor-pointer rounded-brutal border-[3px] border-brutal-tinta bg-brutal-cyan px-4 py-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
                    {subiendo === doc.documentoTipoId
                      ? 'Subiendo...'
                      : 'Subir archivo'}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      disabled={subiendo === doc.documentoTipoId}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) subir(doc.documentoTipoId, file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6">
        <Button onClick={onCompletado}>Continuar</Button>
      </div>

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
        onConfirm={() => onConfirmar()}
        onCancel={() => setConfirmTipo(null)}
      />
    </div>
  );
}