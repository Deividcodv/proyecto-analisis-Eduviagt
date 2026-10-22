'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { traducirError } from '@/lib/mensajes-error';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { SolicitudChecklist } from '@/lib/api';

export function PasoEnviar({
  solicitudId,
  onEnviado,
  onError,
}: {
  solicitudId: string;
  onEnviado: () => void;
  onError: (msg: string) => void;
}) {
  const [checklist, setChecklist] = useState<SolicitudChecklist | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [conformidad, setConformidad] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await fetchConToken<SolicitudChecklist>(
        `/solicitudes/${solicitudId}/checklist`,
      );
      setChecklist(data);
    } catch (e) {
      onError(traducirError(e, 'No se pudo cargar el resumen de la postulación'));
    } finally {
      setCargando(false);
    }
  }, [solicitudId, onError]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const enviar = async () => {
    setEnviando(true);
    try {
      await fetchConToken(`/solicitudes/${solicitudId}/transicion`, {
        method: 'POST',
        body: { accion: 'enviar', comentario: 'Solicitud enviada por el postulante' },
      });
      onEnviado();
    } catch (e) {
      onError(traducirError(e, 'No se pudo enviar la postulación'));
    } finally {
      setEnviando(false);
    }
  };

  if (cargando && !checklist) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!checklist) {
    return (
      <Card className="text-center">
        <p className="text-lg font-bold text-brutal-tinta">
          No se pudo cargar el resumen de la postulación
        </p>
        <p className="mt-1 text-sm text-brutal-tinta/70">
          Revisa tu conexión e inténtalo de nuevo.
        </p>
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" onClick={cargar}>
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-brutal-tinta">
        Revisa y envía
      </h2>
      <p className="mb-5 text-sm text-brutal-tinta/70">
        Verifica que toda tu información esté completa antes de enviar tu
        solicitud.
      </p>

      <Card className="mb-4">
        <h3 className="mb-3 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">
          1. Perfiles
        </h3>
        <ul className="space-y-2 text-sm text-brutal-tinta/80">
          <li className="flex justify-between">
            <span>Perfil académico</span>
            <span className={checklist.perfilAcademico ? 'font-semibold text-brutal-lima' : 'font-semibold text-brutal-rojo'}>
              {checklist.perfilAcademico ? 'Completo' : 'Incompleto'}
            </span>
          </li>
          <li className="flex justify-between">
            <span>Perfil financiero</span>
            <span className={checklist.perfilFinanciero ? 'font-semibold text-brutal-lima' : 'font-semibold text-brutal-rojo'}>
              {checklist.perfilFinanciero ? 'Completo' : 'Incompleto'}
            </span>
          </li>
        </ul>
      </Card>

      <Card className="mb-4">
        <h3 className="mb-3 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">
          2. Documentos
        </h3>
        {checklist.documentos.length === 0 ? (
          <p className="text-sm text-brutal-tinta/70">
            No se requieren documentos para esta convocatoria.
          </p>
        ) : (
          <ul className="space-y-2">
            {checklist.documentos.map((doc) => (
              <li
                key={doc.documentoTipoId}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-brutal-tinta/80">{doc.nombre}</span>
                  {doc.obligatorio && (
                    <span className="font-mono text-xs text-brutal-tinta/50">obligatorio</span>
                  )}
                </div>
                <Badge estado={doc.estado} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mb-6">
        <h3 className="mb-3 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">
          3. Conformidad
        </h3>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={conformidad}
            onChange={(e) => setConformidad(e.target.checked)}
            className="mt-1 h-5 w-5 accent-brutal-tinta"
          />
          <span className="text-sm text-brutal-tinta/85">
            Declaro bajo juramento que la información proporcionada es
            verdadera y me comprometo a presentar la documentación original si
            así se me requiere.
          </span>
        </label>
      </Card>

      {checklist.pendientes.length > 0 && (
        <p className="mb-4 rounded-brutal border-[3px] border-brutal-naranja bg-brutal-naranja/15 p-3 font-mono text-sm font-bold text-brutal-tinta">
          Falta completar: {checklist.pendientes.join(', ')}
        </p>
      )}

      <Button
        onClick={enviar}
        disabled={enviando || !checklist.completo || !conformidad}
      >
        {enviando ? <Spinner /> : 'Enviar solicitud'}
      </Button>
      {!conformidad && (
        <p className="mt-2 text-xs text-brutal-tinta/60">
          Marca la declaración de conformidad para habilitar el envío.
        </p>
      )}
    </div>
  );
}