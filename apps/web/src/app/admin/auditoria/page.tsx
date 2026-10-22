'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

interface EntradaBitacora {
  id: string;
  fechaHora: string;
  actorId: string | null;
  actorNombre: string | null;
  actorRol: string | null;
  actorCorreo: string | null;
  modulo: string;
  entidad: string;
  entidadId: string | null;
  accionClave: string;
  accionHumana: string;
  descripcionHumana: string;
  camposClave: unknown;
  datosRelevantes: unknown;
  resultado: string;
  motivo: string | null;
  ip: string | null;
  userAgent: string | null;
  origen: string;
  correlacionId: string | null;
}

interface RespuestaBitacora {
  total: number;
  page: number;
  limit: number;
  items: EntradaBitacora[];
}

const MODULOS = [
  { value: 'solicitud', label: 'Solicitudes' },
  { value: 'convocatoria', label: 'Convocatorias' },
  { value: 'comite', label: 'Comités' },
  { value: 'sesion', label: 'Sesiones' },
  { value: 'usuario', label: 'Usuarios' },
  { value: 'rol', label: 'Roles y permisos' },
];

/** Fecha y hora en el formato que pide el backlog: DD/MM/YYYY HH:mm:ss. */
function fechaLegible(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function valorLegible(valor: unknown): string {
  if (valor === null || valor === undefined) return '—';
  if (typeof valor === 'object') return JSON.stringify(valor);
  return String(valor);
}

export default function AdminAuditoriaPage() {
  const [entradas, setEntradas] = useState<EntradaBitacora[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [modulo, setModulo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<EntradaBitacora | null>(null);
  const LIMITE = 25;

  const cargar = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        limit: String(LIMITE),
      });
      if (modulo) params.set('modulo', modulo);
      const data = await fetchConToken<RespuestaBitacora>(
        `/bitacora?${params.toString()}`,
      );
      setEntradas(data.items ?? []);
      setTotal(data.total ?? 0);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo cargar la bitácora',
      );
      setEntradas([]);
    }
  }, [pagina, modulo]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-brut text-xl font-black uppercase tracking-wide text-brutal-tinta">
            Bitácora del sistema
          </h2>
          <p className="mt-1 text-sm text-brutal-tinta/70">
            Quién hizo qué y cuándo. El registro es de solo lectura: no se puede
            modificar ni eliminar.
          </p>
        </div>
        <Select
          label="Módulo"
          value={modulo}
          onChange={(e) => {
            setPagina(1);
            setModulo(e.target.value);
          }}
          placeholder="Todos"
          className="w-64"
          options={MODULOS}
        />
      </div>

      {error && (
        <p className="mb-4 rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo">
          {error}
        </p>
      )}

      {entradas === null ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : entradas.length === 0 ? (
        <EmptyState
          title="No hay registros"
          description="Todavía no hay movimientos que coincidan con el filtro elegido."
        />
      ) : (
        <div className="space-y-3">
          {entradas.map((entrada) => (
            <Card key={entrada.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brutal-tinta">
                    {entrada.actorNombre ?? 'Sistema'}
                    <span className="ml-2 font-mono text-xs font-bold uppercase text-brutal-tinta/60">
                      {entrada.actorRol ?? '—'}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-brutal-tinta/80">
                    {entrada.accionHumana}
                  </p>
                  {entrada.descripcionHumana &&
                    entrada.descripcionHumana !== entrada.accionHumana && (
                      <p className="mt-0.5 font-mono text-xs text-brutal-tinta/70">
                        {entrada.descripcionHumana}
                      </p>
                    )}
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-bold text-brutal-tinta/70">
                    {fechaLegible(entrada.fechaHora)}
                  </p>
                  <p className="font-mono text-xs text-brutal-tinta/50">
                    {entrada.modulo} · {entrada.resultado}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <Button variant="ghost" onClick={() => setDetalle(entrada)}>
                  Ver detalle
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
          >
            ← Anteriores
          </Button>
          <span className="font-mono text-xs font-bold text-brutal-tinta/70">
            Página {pagina} de {totalPaginas} · {total} registros
          </span>
          <Button
            variant="ghost"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
          >
            Siguientes →
          </Button>
        </div>
      )}

      {detalle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brutal-tinta/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Detalle del registro"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetalle(null);
          }}
        >
          <Card className="w-full max-w-lg">
            <h3 className="mb-3 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
              {detalle.accionHumana}
            </h3>
            <dl className="grid gap-2 font-mono text-xs text-brutal-tinta/80">
              <div className="flex gap-2">
                <dt className="w-36 shrink-0 text-brutal-tinta/50">Persona:</dt>
                <dd className="font-bold text-brutal-tinta">
                  {detalle.actorNombre ?? 'Sistema'}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-36 shrink-0 text-brutal-tinta/50">Rol:</dt>
                <dd className="font-bold text-brutal-tinta">
                  {detalle.actorRol ?? '—'}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-36 shrink-0 text-brutal-tinta/50">Correo:</dt>
                <dd className="font-bold text-brutal-tinta">
                  {detalle.actorCorreo ?? '—'}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-36 shrink-0 text-brutal-tinta/50">
                  Fecha y hora:
                </dt>
                <dd className="font-bold text-brutal-tinta">
                  {fechaLegible(detalle.fechaHora)}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-36 shrink-0 text-brutal-tinta/50">Módulo:</dt>
                <dd className="font-bold text-brutal-tinta">
                  {detalle.modulo} · {detalle.entidad}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-36 shrink-0 text-brutal-tinta/50">Acción:</dt>
                <dd className="font-bold text-brutal-tinta">
                  {detalle.accionClave} ({detalle.resultado})
                </dd>
              </div>
              {detalle.motivo && (
                <div className="flex gap-2">
                  <dt className="w-36 shrink-0 text-brutal-tinta/50">Motivo:</dt>
                  <dd className="font-bold text-brutal-tinta">
                    {detalle.motivo}
                  </dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="w-36 shrink-0 text-brutal-tinta/50">IP:</dt>
                <dd className="font-bold text-brutal-tinta">
                  {detalle.ip ?? '—'}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-36 shrink-0 text-brutal-tinta/50">Origen:</dt>
                <dd className="font-bold text-brutal-tinta">
                  {detalle.origen}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-36 shrink-0 text-brutal-tinta/50">
                  Navegador:
                </dt>
                <dd className="break-all font-bold text-brutal-tinta">
                  {detalle.userAgent ?? '—'}
                </dd>
              </div>
              {detalle.camposClave != null && (
                <div className="flex gap-2">
                  <dt className="w-36 shrink-0 text-brutal-tinta/50">
                    Campos clave:
                  </dt>
                  <dd className="break-all font-bold text-brutal-tinta">
                    {valorLegible(detalle.camposClave)}
                  </dd>
                </div>
              )}
              {detalle.datosRelevantes != null && (
                <div className="flex gap-2">
                  <dt className="w-36 shrink-0 text-brutal-tinta/50">
                    Datos relevantes:
                  </dt>
                  <dd className="break-all font-bold text-brutal-tinta">
                    {valorLegible(detalle.datosRelevantes)}
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-5 flex justify-end">
              <Button variant="ghost" onClick={() => setDetalle(null)}>
                Cerrar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
