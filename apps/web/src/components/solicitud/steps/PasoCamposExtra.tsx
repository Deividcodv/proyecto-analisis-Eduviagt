'use client';

import { useEffect, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { traducirError } from '@/lib/mensajes-error';
import { ETIQUETA_SECCION } from '@/lib/etiquetas';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import type {
  CampoFormulario,
  SeccionCampoFormulario,
} from '@/lib/api';

const ORDEN_SECCIONES: SeccionCampoFormulario[] = [
  'personal',
  'academico',
  'socioeconomico',
  'adicional',
];

type Valores = Record<string, unknown>;

function iniciales(
  campos: CampoFormulario[],
  respuestas?: Record<string, Record<string, unknown>> | null,
): Valores {
  const valores: Valores = {};
  for (const campo of campos) {
    for (const seccion of Object.values(respuestas ?? {})) {
      if (seccion && campo.id in seccion) {
        valores[campo.id] = seccion[campo.id];
      }
    }
  }
  return valores;
}

function estaVacio(campo: CampoFormulario, valor: unknown): boolean {
  if (campo.tipo === 'booleano') return valor !== true;
  if (valor === undefined || valor === null) return true;
  if (typeof valor === 'string') return valor.trim() === '';
  return false;
}

export function PasoCamposExtra({
  solicitudId,
  campos,
  respuestas,
  onGuardado,
  onError,
}: {
  solicitudId: string;
  campos: CampoFormulario[];
  respuestas?: Record<string, Record<string, unknown>> | null;
  onGuardado: () => void;
  onError: (msg: string) => void;
}) {
  const [valores, setValores] = useState<Valores>(() =>
    iniciales(campos, respuestas),
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState<string | null>(null);

  useEffect(() => {
    setValores(iniciales(campos, respuestas));
  }, [campos, respuestas]);

  const setValor = (id: string, valor: unknown) => {
    setValores((v) => ({ ...v, [id]: valor }));
    setErrores((e) => {
      if (!e[id]) return e;
      const copia = { ...e };
      delete copia[id];
      return copia;
    });
  };

  const validar = (): boolean => {
    const nuevos: Record<string, string> = {};
    for (const campo of campos) {
      const valor = valores[campo.id];
      if (campo.requerido && estaVacio(campo, valor)) {
        nuevos[campo.id] =
          campo.tipo === 'booleano'
            ? 'Debes marcar esta opción para continuar'
            : 'Este campo es obligatorio';
        continue;
      }
      if (
        campo.tipo === 'numero' &&
        typeof valor === 'string' &&
        valor.trim() !== '' &&
        Number.isNaN(Number(valor))
      ) {
        nuevos[campo.id] = 'Ingresa un número válido';
      }
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const subirArchivo = async (campo: CampoFormulario, file: File) => {
    if (!campo.documentoTipoId) {
      onError('Este campo no tiene un tipo de documento configurado.');
      return;
    }
    setSubiendo(campo.id);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await fetchConToken(
        `/solicitudes/${solicitudId}/documentos/${campo.documentoTipoId}`,
        { method: 'POST', body: fd, isFormData: true },
      );
      setValor(campo.id, file.name);
    } catch (e) {
      onError(traducirError(e, 'No se pudo subir el archivo'));
    } finally {
      setSubiendo(null);
    }
  };

  const guardar = async () => {
    if (!validar()) {
      onError('Revisa los campos marcados antes de continuar.');
      return;
    }
    setGuardando(true);
    try {
      const secciones = Array.from(new Set(campos.map((c) => c.seccion)));
      for (const seccion of secciones) {
        const deSeccion = campos.filter((c) => c.seccion === seccion);
        const payload: Valores = {};
        for (const campo of deSeccion) {
          payload[campo.id] = valores[campo.id];
        }
        await fetchConToken(`/solicitudes/${solicitudId}/respuestas`, {
          method: 'PUT',
          body: { seccion, valores: payload },
        });
      }
      onGuardado();
    } catch (e) {
      onError(traducirError(e, 'No se pudieron guardar las respuestas'));
    } finally {
      setGuardando(false);
    }
  };

  if (campos.length === 0) {
    return (
      <div>
        <h2 className="mb-2 text-xl font-bold text-brutal-tinta">
          Información adicional
        </h2>
        <p className="mb-5 text-sm text-brutal-tinta/70">
          Esta beca no requiere información adicional.
        </p>
        <Button onClick={onGuardado}>Continuar</Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-brutal-tinta">
        Información adicional
      </h2>
      <p className="mb-5 text-sm text-brutal-tinta/70">
        Completa los campos solicitados por esta beca. Los campos con asterisco
        (*) son obligatorios.
      </p>

      <div className="space-y-6">
        {ORDEN_SECCIONES.filter((s) =>
          campos.some((c) => c.seccion === s),
        ).map((seccion) => (
          <Card key={seccion}>
            <h3 className="mb-4 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta">
              {ETIQUETA_SECCION[seccion]}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {campos
                .filter((c) => c.seccion === seccion)
                .map((campo) => (
                  <CampoExtra
                    key={campo.id}
                    campo={campo}
                    valor={valores[campo.id]}
                    error={errores[campo.id]}
                    subiendo={subiendo === campo.id}
                    onChange={(v) => setValor(campo.id, v)}
                    onArchivo={(file) => subirArchivo(campo, file)}
                  />
                ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? <Spinner /> : 'Guardar y continuar'}
        </Button>
      </div>
    </div>
  );
}

function Ayuda({ texto }: { texto?: string }) {
  if (!texto) return null;
  return <p className="mt-1 font-mono text-xs text-brutal-tinta/60">{texto}</p>;
}

function ErrorCampo({ texto }: { texto?: string }) {
  if (!texto) return null;
  return (
    <p className="mt-1 font-mono text-xs font-bold text-brutal-rojo" role="alert">
      {texto}
    </p>
  );
}

function CampoExtra({
  campo,
  valor,
  error,
  subiendo,
  onChange,
  onArchivo,
}: {
  campo: CampoFormulario;
  valor: unknown;
  error?: string;
  subiendo: boolean;
  onChange: (valor: unknown) => void;
  onArchivo: (file: File) => void;
}) {
  const etiqueta = `${campo.etiqueta}${campo.requerido ? ' *' : ''}`;

  if (campo.tipo === 'textarea') {
    return (
      <div className="md:col-span-2">
        <label className="mb-1 block font-brut text-xs font-bold uppercase tracking-wide text-brutal-tinta">
          {etiqueta}
        </label>
        <textarea
          rows={3}
          value={typeof valor === 'string' ? valor : ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-brutal border-[3px] bg-brutal-blanco px-3 py-2 text-sm text-brutal-tinta focus:bg-brutal-cyan/10 focus:outline-none ${
            error ? 'border-brutal-rojo bg-red-50' : 'border-brutal-tinta'
          }`}
        />
        <Ayuda texto={campo.ayuda} />
        <ErrorCampo texto={error} />
      </div>
    );
  }

  if (campo.tipo === 'seleccion') {
    return (
      <div>
        <Select
          label={etiqueta}
          value={typeof valor === 'string' ? valor : ''}
          onChange={(e) => onChange(e.target.value)}
          options={(campo.opciones ?? []).map((o) => ({ value: o, label: o }))}
        />
        <Ayuda texto={campo.ayuda} />
        <ErrorCampo texto={error} />
      </div>
    );
  }

  if (campo.tipo === 'booleano') {
    return (
      <div className="self-end">
        <label className="flex items-center gap-2 font-mono text-sm text-brutal-tinta">
          <input
            type="checkbox"
            checked={valor === true || valor === 'true'}
            onChange={(e) => onChange(e.target.checked)}
          />
          {etiqueta}
        </label>
        <Ayuda texto={campo.ayuda} />
        <ErrorCampo texto={error} />
      </div>
    );
  }

  if (campo.tipo === 'archivo') {
    return (
      <div className="md:col-span-2">
        <label className="mb-1 block font-brut text-xs font-bold uppercase tracking-wide text-brutal-tinta">
          {etiqueta}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-brutal border-[3px] border-brutal-tinta bg-brutal-cyan px-4 py-2 font-brut text-sm font-bold uppercase tracking-wide text-brutal-tinta shadow-brutal-sm transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
            {subiendo ? 'Subiendo...' : typeof valor === 'string' && valor ? 'Reemplazar' : 'Subir archivo'}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              disabled={subiendo}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onArchivo(file);
                e.target.value = '';
              }}
            />
          </label>
          {typeof valor === 'string' && valor && (
            <span className="font-mono text-xs text-brutal-tinta/70">{valor}</span>
          )}
        </div>
        <Ayuda texto={campo.ayuda} />
        <ErrorCampo texto={error} />
      </div>
    );
  }

  const tipoInput =
    campo.tipo === 'numero' ? 'number' : campo.tipo === 'fecha' ? 'date' : 'text';

  return (
    <div>
      <Input
        label={etiqueta}
        type={tipoInput}
        value={
          valor === undefined || valor === null
            ? ''
            : typeof valor === 'string'
              ? valor
              : String(valor)
        }
        onChange={(e) => onChange(e.target.value)}
        error={error}
      />
      <Ayuda texto={campo.ayuda} />
    </div>
  );
}
