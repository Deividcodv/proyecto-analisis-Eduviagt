'use client';

import { useEffect, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { fetcher, type Genero, type Departamento } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

interface Perfil {
  id: string;
  nombres: string;
  telefono: string | null;
  fechaNacimiento: string | null;
  genero: { id: string; nombre: string } | null;
  departamento: { id: string; nombre: string } | null;
  municipio: { id: string; nombre: string } | null;
}

export function PasoDatosPersonales({
  solicitudId,
  onGuardado,
  onError,
}: {
  solicitudId: string;
  onGuardado: () => void;
  onError: (msg: string) => void;
}) {
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [form, setForm] = useState({
    nombres: '',
    telefono: '',
    fechaNacimiento: '',
    generoId: '',
    departamentoId: '',
    municipioId: '',
  });

  useEffect(() => {
    let activo = true;
    Promise.all([
      fetcher<{ data: Genero[] }>('/catalogos/generos'),
      fetcher<{ data: Departamento[] }>('/catalogos/departamentos'),
      fetchConToken<Perfil>('/auth/perfil'),
    ])
      .then(([gen, deptos, perfil]) => {
        if (!activo) return;
        setGeneros(gen.data ?? []);
        setDepartamentos(deptos.data ?? []);
        setForm({
          nombres: perfil.nombres ?? '',
          telefono: perfil.telefono ?? '',
          fechaNacimiento: perfil.fechaNacimiento?.slice(0, 10) ?? '',
          generoId: perfil.genero?.id ?? '',
          departamentoId: perfil.departamento?.id ?? '',
          municipioId: perfil.municipio?.id ?? '',
        });
      })
      .catch((e) => {
        if (activo) {
          onError(
            e instanceof Error ? e.message : 'No se pudieron cargar tus datos.',
          );
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [onError]);

  const departamento = departamentos.find(
    (d) => d.id === form.departamentoId,
  );
  const municipios = departamento?.municipios ?? [];

  const guardar = async () => {
    if (!form.nombres.trim()) {
      onError('Escribe tus nombres completos.');
      return;
    }
    setEnviando(true);
    try {
      await fetchConToken('/auth/perfil', {
        method: 'PATCH',
        body: {
          nombres: form.nombres.trim(),
          telefono: form.telefono.trim() || undefined,
          fechaNacimiento: form.fechaNacimiento || undefined,
          generoId: form.generoId || undefined,
          departamentoId: form.departamentoId || undefined,
          municipioId: form.municipioId || undefined,
        },
      });
      await fetchConToken(`/solicitudes/${solicitudId}/perfil-academico`, {
        method: 'PUT',
        body: {
          generoId: form.generoId || undefined,
          departamentoId: form.departamentoId || undefined,
          municipioId: form.municipioId || undefined,
        },
      });
      onGuardado();
    } catch (e) {
      onError(
        e instanceof Error ? e.message : 'No se pudieron guardar tus datos.',
      );
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center gap-3 py-10 font-mono text-sm font-bold text-brutal-tinta/70">
        <Spinner /> Cargando tus datos…
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-brutal-tinta">Tus datos</h2>
      <p className="mb-5 max-w-2xl text-sm text-brutal-tinta/70">
        Estos datos se cargan desde tu perfil y acompañan tu postulación. Puedes
        ajustarlos aquí: se guardarán en tu perfil para las próximas becas.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input
            label="Nombres completos"
            value={form.nombres}
            onChange={(e) =>
              setForm((f) => ({ ...f, nombres: e.target.value }))
            }
            placeholder="Juan Carlos Pérez"
          />
        </div>
        <Input
          label="Teléfono"
          type="tel"
          value={form.telefono}
          onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
          placeholder="+502 5555 1234"
        />
        <Input
          label="Fecha de nacimiento"
          type="date"
          value={form.fechaNacimiento}
          onChange={(e) =>
            setForm((f) => ({ ...f, fechaNacimiento: e.target.value }))
          }
        />
        <Select
          label="Género"
          value={form.generoId}
          onChange={(e) =>
            setForm((f) => ({ ...f, generoId: e.target.value }))
          }
          options={generos.map((g) => ({ value: g.id, label: g.nombre }))}
          placeholder="Seleccionar género"
        />
        <Select
          label="Departamento"
          value={form.departamentoId}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              departamentoId: e.target.value,
              municipioId: '',
            }))
          }
          options={departamentos.map((d) => ({
            value: d.id,
            label: d.nombre,
          }))}
          placeholder="Seleccionar departamento"
        />
        <div className="md:col-span-2">
          <Select
            label="Municipio"
            value={form.municipioId}
            onChange={(e) =>
              setForm((f) => ({ ...f, municipioId: e.target.value }))
            }
            options={municipios.map((m) => ({ value: m.id, label: m.nombre }))}
            placeholder={
              form.departamentoId
                ? 'Seleccionar municipio'
                : 'Primero selecciona un departamento'
            }
            disabled={!form.departamentoId}
          />
        </div>
      </div>
      <div className="mt-6">
        <Button onClick={guardar} disabled={enviando}>
          {enviando ? <Spinner /> : 'Guardar y continuar'}
        </Button>
      </div>
    </div>
  );
}