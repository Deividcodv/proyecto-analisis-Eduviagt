'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { useAuth } from '@/context/AuthContext';
import {
  useNotificacionesStream,
  type EventoNotificacion,
} from '@/lib/notificaciones-stream';
import type { ListaNotificaciones, Notificacion } from '@/lib/api';

function formatearMomento(fecha: string): string {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleString('es-GT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CampanaNotificaciones() {
  const { usuario } = useAuth();
  const [items, setItems] = useState<Notificacion[]>([]);
  const [total, setTotal] = useState(0);
  const [noLeidas, setNoLeidas] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const cargar = useCallback(async () => {
    try {
      const [lista, pendientes] = await Promise.all([
        fetchConToken<ListaNotificaciones>('/notificaciones?pageSize=20'),
        fetchConToken<number>('/notificaciones/no-leidas'),
      ]);
      setItems(lista.items);
      setTotal(lista.total);
      setNoLeidas(pendientes);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudieron cargar las notificaciones',
      );
    }
  }, []);

  useEffect(() => {
    if (usuario) void cargar();
  }, [usuario, cargar]);

  useNotificacionesStream((evento: EventoNotificacion) => {
    if (evento.bulk || !evento.id) {
      void cargar();
      return;
    }
    const nueva: Notificacion = {
      id: evento.id,
      tipo: evento.tipo,
      titulo: evento.titulo,
      cuerpo: evento.cuerpo ?? null,
      leidaAt: null,
      createdAt: evento.createdAt ?? new Date().toISOString(),
    };
    setItems((prev) => [nueva, ...prev].slice(0, 20));
    setTotal((t) => t + 1);
    setNoLeidas((n) => n + 1);
  }, !!usuario);

  useEffect(() => {
    if (!abierto) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [abierto]);

  const marcarLeida = async (id: string) => {
    setCargando(true);
    try {
      await fetchConToken(`/notificaciones/${id}/leida`, { method: 'PATCH' });
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo marcar como leída');
    } finally {
      setCargando(false);
    }
  };

  const marcarTodas = async () => {
    setCargando(true);
    try {
      await fetchConToken('/notificaciones/leer-todas', { method: 'POST' });
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar');
    } finally {
      setCargando(false);
    }
  };

  if (!usuario) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label="Notificaciones"
        className="relative flex h-9 w-9 items-center justify-center rounded-brutal border-2 border-brutal-cyan bg-brutal-tinta text-brutal-cyan transition-colors hover:bg-brutal-cyan hover:text-brutal-tinta"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-brutal-tinta bg-brutal-rojo px-1 font-mono text-[10px] font-black text-brutal-papel">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-papel shadow-brutal"
        >
          <div className="flex items-center justify-between border-b-[3px] border-brutal-tinta bg-brutal-tinta px-3 py-2">
            <p className="font-brut text-xs font-black uppercase tracking-wide text-brutal-papel">
              Notificaciones {noLeidas > 0 && `(${noLeidas})`}
            </p>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={marcarTodas}
                disabled={cargando}
                className="font-mono text-[10px] font-bold uppercase text-brutal-cyan hover:underline disabled:opacity-50"
              >
                Marcar todas
              </button>
            )}
          </div>

          {error && (
            <p className="border-b-2 border-brutal-tinta bg-red-50 px-3 py-2 text-xs font-bold text-brutal-rojo">
              {error}
            </p>
          )}

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center font-mono text-xs text-brutal-tinta/70">
                No tienes notificaciones.
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.leidaAt && marcarLeida(n.id)}
                  className={`block w-full border-b-2 border-brutal-tinta/20 px-3 py-2 text-left transition-colors hover:bg-brutal-cyan/20 ${
                    n.leidaAt ? 'opacity-70' : 'bg-brutal-cyan/10'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {!n.leidaAt && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-brutal-rojo" />
                    )}
                    <span className="font-brut text-xs font-bold text-brutal-tinta">
                      {n.titulo}
                    </span>
                  </span>
                  {n.cuerpo && (
                    <span className="mt-0.5 block font-mono text-[11px] text-brutal-tinta/80">
                      {n.cuerpo}
                    </span>
                  )}
                  <span className="mt-1 block font-mono text-[10px] text-brutal-tinta/50">
                    {formatearMomento(n.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>

          {total > items.length && (
            <p className="px-3 py-2 text-center font-mono text-[10px] text-brutal-tinta/60">
              Mostrando las {items.length} más recientes de {total}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
