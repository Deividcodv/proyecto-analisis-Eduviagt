'use client';

import { useEffect, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { CatalogoOtro } from '@/components/solicitud/CatalogoOtro';
import {
  fetcher,
  type NivelAcademico,
  type InstitucionEducativa,
  type SolicitudDetalle,
} from '@/lib/api';

export function PasoPerfilAcademico({
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
  const [niveles, setNiveles] = useState<NivelAcademico[]>([]);
  const [instituciones, setInstituciones] = useState<InstitucionEducativa[]>([]);
  const [busquedaInstitucion, setBusquedaInstitucion] = useState('');
  const [form, setForm] = useState({
    nivelId: '',
    nivelOtro: '',
    institucion: '',
    carrera: '',
    promedio: '',
  });

  useEffect(() => {
    fetcher<{ data: NivelAcademico[] }>('/catalogos/niveles-academicos').then(
      (r) => setNiveles(r.data ?? []),
    );
  }, []);

  useEffect(() => {
    const termino = busquedaInstitucion.trim();
    const timer = setTimeout(() => {
      const query = termino ? `?busqueda=${encodeURIComponent(termino)}` : '';
      fetcher<{ data: InstitucionEducativa[] }>(
        `/catalogos/instituciones${query}`,
      ).then((r) => setInstituciones(r.data ?? []));
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaInstitucion]);

  useEffect(() => {
    let activo = true;
    setCargandoPrevia(true);
    fetchConToken<SolicitudDetalle>(`/solicitudes/${solicitudId}`)
      .then((solicitud) => {
        if (!activo) return;
        const perfil = solicitud.perfilAcademico;
        if (!perfil) return;
        setForm(() => ({
          nivelId:
            perfil.nivelAcademicoId ?? (perfil.nivelAcademicoOtro ? '__otro__' : ''),
          nivelOtro: perfil.nivelAcademicoOtro ?? '',
          institucion: perfil.institucion ?? '',
          carrera: perfil.carrera ?? '',
          promedio: perfil.promedio === null ? '' : String(perfil.promedio),
        }));
      })
      .catch(() => {
        if (activo) onError('No se pudo cargar el perfil académico previo.');
      })
      .finally(() => {
        if (activo) setCargandoPrevia(false);
      });
    return () => {
      activo = false;
    };
  }, [solicitudId, onError]);

  const institucionEnCatalogo = instituciones.some(
    (i) => i.nombre === form.institucion,
  );

  const validar = (): string | null => {
    if (form.nivelId === '__otro__' && !form.nivelOtro.trim()) {
      return 'Escribe una opción en «Nivel académico (otro)».';
    }
    if (form.promedio !== '') {
      const promedio = Number(form.promedio);
      if (Number.isNaN(promedio) || promedio < 0 || promedio > 100) {
        return 'El promedio debe estar entre 0 y 100.';
      }
    }
    return null;
  };

  const guardar = async () => {
    const errorValidacion = validar();
    if (errorValidacion) {
      onError(errorValidacion);
      return;
    }
    setEnviando(true);
    try {
      const body = {
        institucion: form.institucion || undefined,
        carrera: form.carrera || undefined,
        promedio:
          form.promedio === '' ? undefined : Number(form.promedio),
        nivelAcademicoId:
          form.nivelId === '__otro__' ? undefined : form.nivelId || undefined,
        nivelAcademicoOtro:
          form.nivelId === '__otro__' && form.nivelOtro
            ? form.nivelOtro
            : undefined,
      };
      await fetchConToken(`/solicitudes/${solicitudId}/perfil-academico`, {
        method: 'PUT',
        body,
      });
      onGuardado();
    } catch (e) {
      onError(
        e instanceof Error ? e.message : 'No se pudo guardar el perfil académico',
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
      <h2 className="mb-1 text-xl font-bold text-brutal-tinta">
        Perfil académico
      </h2>
      <p className="mb-5 max-w-2xl text-sm text-brutal-tinta/70">
        Cuéntanos sobre tu formación actual. Usa la búsqueda para elegir tu
        institución del catálogo o escribe «otro» para indicar una que no esté
        listada.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <CatalogoOtro
          nombre="Nivel académico"
          opciones={niveles.map((n) => ({ value: n.id, label: n.nombre }))}
          value={form.nivelId}
          otroValue={form.nivelOtro}
          onChange={(id) =>
            setForm((f) => ({ ...f, nivelId: id, nivelOtro: '' }))
          }
          onOtroChange={(t) => setForm((f) => ({ ...f, nivelOtro: t }))}
        />
        <div>
          <Input
            label="Buscar institución"
            value={busquedaInstitucion}
            onChange={(e) => setBusquedaInstitucion(e.target.value)}
            placeholder="Escribe para filtrar el catálogo"
          />
          <div className="mt-3">
            <CatalogoOtro
              nombre="Institución"
              opciones={instituciones.map((i) => ({
                value: i.nombre,
                label: i.nombre,
              }))}
              value={
                form.institucion === ''
                  ? ''
                  : institucionEnCatalogo
                    ? form.institucion
                    : '__otro__'
              }
              otroValue={institucionEnCatalogo ? '' : form.institucion}
              onChange={(nombre) =>
                setForm((f) => ({
                  ...f,
                  institucion: nombre === '__otro__' ? '' : nombre,
                }))
              }
              onOtroChange={(texto) =>
                setForm((f) => ({ ...f, institucion: texto }))
              }
              placeholder="Seleccionar institución..."
            />
          </div>
        </div>
        <Input
          label="Carrera"
          value={form.carrera}
          onChange={(e) => setForm((f) => ({ ...f, carrera: e.target.value }))}
        />
        <Input
          label="Promedio (0-100)"
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={form.promedio}
          onChange={(e) => setForm((f) => ({ ...f, promedio: e.target.value }))}
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