'use client';

import { useEffect, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import type { SolicitudDetalle } from '@/lib/api';

export function PasoPerfilFinanciero({
  solicitudId,
  onGuardado,
  onError,
}: {
  solicitudId: string;
  onGuardado: () => void;
  onError: (msg: string) => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [cargandoPrevia, setCargandoPrevia] = useState(true);
  const [form, setForm] = useState({
    ingresoFamiliar: '',
    numeroDependientes: '',
    becasAnteriores: false,
    descripcionSituacion: '',
  });

  useEffect(() => {
    let activo = true;
    setCargandoPrevia(true);
    fetchConToken<SolicitudDetalle>(`/solicitudes/${solicitudId}`)
      .then((solicitud) => {
        if (!activo) return;
        const perfil = solicitud.perfilFinanciero;
        if (!perfil) return;
        setForm({
          ingresoFamiliar:
            perfil.ingresoFamiliar === null
              ? ''
              : String(perfil.ingresoFamiliar),
          numeroDependientes:
            perfil.numeroDependientes === null
              ? ''
              : String(perfil.numeroDependientes),
          becasAnteriores: perfil.becasAnteriores,
          descripcionSituacion: perfil.descripcionSituacion ?? '',
        });
      })
      .catch(() => {
        if (activo) onError('No se pudo cargar el perfil financiero previo.');
      })
      .finally(() => {
        if (activo) setCargandoPrevia(false);
      });
    return () => {
      activo = false;
    };
  }, [solicitudId, onError]);

  const guardar = async () => {
    setEnviando(true);
    try {
      const body = {
        ingresoFamiliar:
          form.ingresoFamiliar === ''
            ? undefined
            : Number(form.ingresoFamiliar),
        numeroDependientes:
          form.numeroDependientes === ''
            ? undefined
            : Number(form.numeroDependientes),
        becasAnteriores: form.becasAnteriores,
        descripcionSituacion: form.descripcionSituacion || undefined,
      };
      await fetchConToken(`/solicitudes/${solicitudId}/perfil-financiero`, {
        method: 'PUT',
        body,
      });
      onGuardado();
    } catch (e) {
      onError(
        e instanceof Error ? e.message : 'No se pudo guardar el perfil financiero',
      );
    } finally {
      setEnviando(false);
    }
  };

  if (cargandoPrevia) {
    return (
      <div className="flex items-center gap-3 py-10 font-mono text-sm font-bold text-brutal-tinta/70">
        <Spinner /> Cargando tu perfil previamente guardado…
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-5 text-xl font-bold text-brutal-tinta">
        Perfil financiero
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Ingreso familiar mensual (Q)"
          type="number"
          min={0}
          value={form.ingresoFamiliar}
          onChange={(e) =>
            setForm((f) => ({ ...f, ingresoFamiliar: e.target.value }))
          }
        />
        <Input
          label="Número de dependientes"
          type="number"
          min={0}
          value={form.numeroDependientes}
          onChange={(e) =>
            setForm((f) => ({ ...f, numeroDependientes: e.target.value }))
          }
        />
      </div>
      <label className="mt-4 flex cursor-pointer items-center gap-2 font-mono text-sm text-brutal-tinta">
        <input
          type="checkbox"
          checked={form.becasAnteriores}
          onChange={(e) =>
            setForm((f) => ({ ...f, becasAnteriores: e.target.checked }))
          }
          className="h-4 w-4 accent-brutal-tinta"
        />
        He recibido becas anteriormente
      </label>
      <div className="mt-4">
        <label className="mb-1 block font-brut text-xs font-bold uppercase tracking-wide text-brutal-tinta">
          Describe tu situación socioeconómica
        </label>
        <textarea
          className="w-full rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco px-3 py-2 font-mono text-sm text-brutal-tinta focus:bg-brutal-cyan/10 focus:outline-none"
          rows={4}
          value={form.descripcionSituacion}
          onChange={(e) =>
            setForm((f) => ({ ...f, descripcionSituacion: e.target.value }))
          }
        />
      </div>
      <div className="mt-6">
        <Button onClick={guardar} disabled={enviando}>
          {enviando ? <Spinner /> : 'Guardar y continuar'}
        </Button>
      </div>
    </div>
  );
}