'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchConToken } from '@/lib/api-auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import type {
  Beca,
  BecaCobertura,
  CampoFormulario,
  ConvocatoriaDetalle,
  DocumentoTipo,
  NivelAcademico,
  SeccionCampoFormulario,
  TipoCampoFormulario,
} from '@/lib/api';

const SECCIONES: { value: SeccionCampoFormulario; label: string }[] = [
  { value: 'personal', label: 'Datos personales' },
  { value: 'academico', label: 'Perfil académico' },
  { value: 'socioeconomico', label: 'Perfil socioeconómico' },
  { value: 'adicional', label: 'Información adicional' },
];

const TIPOS: { value: TipoCampoFormulario; label: string }[] = [
  { value: 'texto', label: 'Texto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'numero', label: 'Número' },
  { value: 'fecha', label: 'Fecha' },
  { value: 'seleccion', label: 'Selección' },
  { value: 'booleano', label: 'Sí/No' },
  { value: 'archivo', label: 'Archivo (documento)' },
];

const COBERTURAS: { value: BecaCobertura; label: string }[] = [
  { value: 'COMPLETA', label: 'Beca completa' },
  { value: 'PARCIAL', label: 'Beca parcial' },
];

function nuevoId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `campo-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `campo-${Date.now().toString(36)}`;
}

function mismosDocumentos(
  a: { documentoTipoId: string; obligatorio: boolean }[],
  b: { documentoTipoId: string; obligatorio: boolean }[],
): boolean {
  if (a.length !== b.length) return false;
  const normalizar = (lista: typeof a) =>
    [...lista]
      .map((d) => `${d.documentoTipoId}:${d.obligatorio}`)
      .sort()
      .join('|');
  return normalizar(a) === normalizar(b);
}

interface DocumentoRequeridoState {
  documentoTipoId: string;
  obligatorio: boolean;
}

interface FormState {
  nombre: string;
  descripcion: string;
  becaId: string;
  nivelAcademicoId: string;
  cobertura: BecaCobertura | '';
  fechaApertura: string;
  fechaCierre: string;
  evaluadoresMinimos: number;
  maxCorrecciones: number;
}

const FORM_INICIAL: FormState = {
  nombre: '',
  descripcion: '',
  becaId: '',
  nivelAcademicoId: '',
  cobertura: '',
  fechaApertura: '',
  fechaCierre: '',
  evaluadoresMinimos: 2,
  maxCorrecciones: 3,
};

function aInputLocal(fecha?: string | null): string {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function FormularioConvocatoria({
  convocatoriaId,
}: {
  convocatoriaId?: string;
}) {
  const router = useRouter();
  const esEdicion = Boolean(convocatoriaId);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const [becas, setBecas] = useState<Beca[]>([]);
  const [niveles, setNiveles] = useState<NivelAcademico[]>([]);
  const [documentosTipo, setDocumentosTipo] = useState<DocumentoTipo[]>([]);

  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [campos, setCampos] = useState<CampoFormulario[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoRequeridoState[]>([]);
  const [documentosIniciales, setDocumentosIniciales] = useState<
    DocumentoRequeridoState[]
  >([]);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [catBecas, catNiveles, catDocs] = await Promise.all([
        fetchConToken<Beca[]>('/catalogos/becas'),
        fetchConToken<NivelAcademico[]>('/catalogos/niveles-academicos'),
        fetchConToken<DocumentoTipo[]>('/catalogos/documentos-tipo'),
      ]);
      setBecas(catBecas);
      setNiveles(catNiveles);
      setDocumentosTipo(catDocs);

      if (convocatoriaId) {
        const conv = await fetchConToken<ConvocatoriaDetalle>(
          `/convocatorias/${convocatoriaId}`,
        );
        setForm({
          nombre: conv.nombre,
          descripcion: conv.descripcion ?? '',
          becaId: conv.beca.id,
          nivelAcademicoId: conv.nivelAcademico?.id ?? '',
          cobertura: conv.cobertura ?? '',
          fechaApertura: aInputLocal(conv.fechaApertura),
          fechaCierre: aInputLocal(conv.fechaCierre),
          evaluadoresMinimos: conv.evaluadoresMinimos ?? 2,
          maxCorrecciones: conv.maxCorrecciones ?? 3,
        });
        setCampos(conv.formulario ?? []);
        const docs = (conv.documentosRequeridos ?? []).map((d) => ({
          documentoTipoId: d.documentoTipo.id,
          obligatorio: d.obligatorio,
        }));
        setDocumentos(docs);
        setDocumentosIniciales(docs);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la información');
    } finally {
      setCargando(false);
    }
  }, [convocatoriaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const actualizarCampo = (indice: number, cambio: Partial<CampoFormulario>) => {
    setCampos((lista) =>
      lista.map((campo, i) => (i === indice ? { ...campo, ...cambio } : campo)),
    );
  };

  const agregarCampo = () => {
    setCampos((lista) => [
      ...lista,
      {
        id: nuevoId(),
        seccion: 'adicional',
        etiqueta: '',
        tipo: 'texto',
        requerido: false,
      },
    ]);
  };

  const quitarCampo = (indice: number) => {
    setCampos((lista) => lista.filter((_, i) => i !== indice));
  };

  const validar = (): string | null => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio';
    if (!form.becaId) return 'Debes seleccionar una beca';
    for (let i = 0; i < campos.length; i++) {
      if (!campos[i].etiqueta.trim()) {
        return `El campo #${i + 1} del formulario necesita una etiqueta`;
      }
      if (campos[i].tipo === 'seleccion' && (campos[i].opciones ?? []).length === 0) {
        return `El campo "${campos[i].etiqueta}" de tipo selección necesita opciones`;
      }
      if (campos[i].tipo === 'archivo' && !campos[i].documentoTipoId) {
        return `El campo "${campos[i].etiqueta}" de tipo archivo necesita un tipo de documento`;
      }
    }
    return null;
  };

  const guardar = async () => {
    const errorValidacion = validar();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }
    setGuardando(true);
    setError(null);
    setExito(null);

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion || undefined,
      becaId: form.becaId,
      nivelAcademicoId: form.nivelAcademicoId || null,
      cobertura: form.cobertura || null,
      formulario: campos,
      fechaApertura: form.fechaApertura
        ? new Date(form.fechaApertura).toISOString()
        : null,
      fechaCierre: form.fechaCierre
        ? new Date(form.fechaCierre).toISOString()
        : null,
      evaluadoresMinimos: form.evaluadoresMinimos,
      maxCorrecciones: form.maxCorrecciones,
    };

    try {
      if (!convocatoriaId) {
        const creada = await fetchConToken<{ id: string }>('/convocatorias', {
          method: 'POST',
          body: payload,
        });
        if (documentos.length > 0) {
          await fetchConToken(`/convocatorias/${creada.id}/documentos`, {
            method: 'PATCH',
            body: { items: documentos },
          });
        }
        router.replace(`/admin/convocatorias/${creada.id}`);
        return;
      }

      await fetchConToken(`/convocatorias/${convocatoriaId}`, {
        method: 'PATCH',
        body: payload,
      });
      if (mismosDocumentos(documentos, documentosIniciales) === false) {
        await fetchConToken(`/convocatorias/${convocatoriaId}/documentos`, {
          method: 'PATCH',
          body: { items: documentos },
        });
        setDocumentosIniciales(documentos);
      }
      setExito('Convocatoria guardada.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la convocatoria');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">
          {error}
        </p>
      )}
      {exito && (
        <p className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-lima/30 p-4 text-sm font-bold text-brutal-tinta">
          {exito}
        </p>
      )}

      <Card>
        <h2 className="mb-4 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
          Datos generales
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
          <Select
            label="Beca"
            value={form.becaId}
            onChange={(e) => setForm((f) => ({ ...f, becaId: e.target.value }))}
            options={becas.map((b) => ({ value: b.id, label: b.nombre }))}
          />
          <div className="md:col-span-2">
            <label className="mb-1 block font-brut text-xs font-bold uppercase tracking-wide text-brutal-tinta">
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) =>
                setForm((f) => ({ ...f, descripcion: e.target.value }))
              }
              rows={3}
              className="w-full rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco px-3 py-2 text-sm text-brutal-tinta focus:bg-brutal-cyan/10 focus:outline-none"
            />
          </div>
          <Select
            label="Nivel académico"
            value={form.nivelAcademicoId}
            onChange={(e) =>
              setForm((f) => ({ ...f, nivelAcademicoId: e.target.value }))
            }
            options={niveles.map((n) => ({ value: n.id, label: n.nombre }))}
            placeholder="Cualquier nivel"
          />
          <Select
            label="Cobertura"
            value={form.cobertura}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                cobertura: e.target.value as BecaCobertura | '',
              }))
            }
            options={COBERTURAS}
            placeholder="Sin definir"
          />
          <Input
            label="Fecha de apertura"
            type="datetime-local"
            value={form.fechaApertura}
            onChange={(e) =>
              setForm((f) => ({ ...f, fechaApertura: e.target.value }))
            }
          />
          <Input
            label="Fecha de cierre"
            type="datetime-local"
            value={form.fechaCierre}
            onChange={(e) =>
              setForm((f) => ({ ...f, fechaCierre: e.target.value }))
            }
          />
          <Input
            label="Evaluadores mínimos"
            type="number"
            min={1}
            max={20}
            value={form.evaluadoresMinimos}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                evaluadoresMinimos: Number(e.target.value) || 1,
              }))
            }
          />
          <Input
            label="Máximo de correcciones"
            type="number"
            min={0}
            max={20}
            value={form.maxCorrecciones}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                maxCorrecciones: Number(e.target.value) || 0,
              }))
            }
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
          Documentos requeridos
        </h2>
        <p className="mb-4 font-mono text-xs text-brutal-tinta/60">
          Selecciona los documentos que el postulante deberá cargar.
        </p>
        <div className="space-y-2">
          {documentosTipo.map((doc) => {
            const seleccionado = documentos.find(
              (d) => d.documentoTipoId === doc.id,
            );
            return (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-brutal border-2 border-brutal-tinta/20 px-3 py-2"
              >
                <label className="flex items-center gap-2 font-mono text-sm text-brutal-tinta">
                  <input
                    type="checkbox"
                    checked={Boolean(seleccionado)}
                    onChange={(e) => {
                      setDocumentos((lista) =>
                        e.target.checked
                          ? [...lista, { documentoTipoId: doc.id, obligatorio: true }]
                          : lista.filter((d) => d.documentoTipoId !== doc.id),
                      );
                    }}
                  />
                  {doc.nombre}
                </label>
                {seleccionado && (
                  <label className="flex items-center gap-2 font-mono text-xs text-brutal-tinta/80">
                    <input
                      type="checkbox"
                      checked={seleccionado.obligatorio}
                      onChange={(e) =>
                        setDocumentos((lista) =>
                          lista.map((d) =>
                            d.documentoTipoId === doc.id
                              ? { ...d, obligatorio: e.target.checked }
                              : d,
                          ),
                        )
                      }
                    />
                    Obligatorio
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
              Formulario de postulación
            </h2>
            <p className="font-mono text-xs text-brutal-tinta/60">
              Campos adicionales que el postulante deberá completar.
            </p>
          </div>
          <Button variant="ghost" onClick={agregarCampo}>
            + Agregar campo
          </Button>
        </div>

        {campos.length === 0 ? (
          <p className="rounded-brutal border-2 border-dashed border-brutal-tinta/30 p-6 text-center font-mono text-sm text-brutal-tinta/60">
            Sin campos adicionales. El postulante completará el perfil académico,
            financiero y los documentos.
          </p>
        ) : (
          <div className="space-y-4">
            {campos.map((campo, indice) => (
              <div
                key={campo.id}
                className="rounded-brutal border-[3px] border-brutal-tinta/30 bg-brutal-papel/40 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-brutal-tinta/60">
                    Campo #{indice + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => quitarCampo(indice)}
                    className="font-mono text-xs font-bold uppercase text-brutal-rojo hover:underline"
                  >
                    Quitar
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Etiqueta"
                    value={campo.etiqueta}
                    onChange={(e) =>
                      actualizarCampo(indice, { etiqueta: e.target.value })
                    }
                  />
                  <Select
                    label="Sección"
                    value={campo.seccion}
                    onChange={(e) =>
                      actualizarCampo(indice, {
                        seccion: e.target.value as SeccionCampoFormulario,
                      })
                    }
                    options={SECCIONES}
                    placeholder="Seleccionar sección"
                  />
                  <Select
                    label="Tipo"
                    value={campo.tipo}
                    onChange={(e) =>
                      actualizarCampo(indice, {
                        tipo: e.target.value as TipoCampoFormulario,
                      })
                    }
                    options={TIPOS}
                    placeholder="Seleccionar tipo"
                  />
                  <Input
                    label="Texto de ayuda (opcional)"
                    value={campo.ayuda ?? ''}
                    onChange={(e) =>
                      actualizarCampo(indice, { ayuda: e.target.value })
                    }
                  />

                  {campo.tipo === 'seleccion' && (
                    <div className="md:col-span-2">
                      <Input
                        label="Opciones (separadas por coma)"
                        value={(campo.opciones ?? []).join(', ')}
                        onChange={(e) =>
                          actualizarCampo(indice, {
                            opciones: e.target.value
                              .split(',')
                              .map((o) => o.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    </div>
                  )}

                  {campo.tipo === 'archivo' && (
                    <Select
                      label="Tipo de documento"
                      value={campo.documentoTipoId ?? ''}
                      onChange={(e) =>
                        actualizarCampo(indice, {
                          documentoTipoId: e.target.value || undefined,
                        })
                      }
                      options={documentosTipo.map((d) => ({
                        value: d.id,
                        label: d.nombre,
                      }))}
                    />
                  )}

                  <label className="flex items-center gap-2 font-mono text-sm text-brutal-tinta">
                    <input
                      type="checkbox"
                      checked={Boolean(campo.requerido)}
                      onChange={(e) =>
                        actualizarCampo(indice, { requerido: e.target.checked })
                      }
                    />
                    Campo obligatorio
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? <Spinner /> : esEdicion ? 'Guardar cambios' : 'Crear convocatoria'}
        </Button>
        <Button variant="ghost" href="/admin">
          Volver al panel
        </Button>
      </div>
    </div>
  );
}
