'use client';

import { useEffect, useRef } from 'react';
import { getAccessToken, refreshAccessToken } from '@/lib/auth';

export interface EventoNotificacion {
  id: string | null;
  usuarioId: string;
  tipo: string;
  titulo: string;
  cuerpo?: string | null;
  createdAt?: string;
  bulk?: boolean;
}

type Listener = (evento: EventoNotificacion) => void;

export function useNotificacionesStream(
  onEvento: Listener,
  activo = true,
): void {
  const ref = useRef(onEvento);
  ref.current = onEvento;

  useEffect(() => {
    if (!activo) return;

    let cerrado = false;
    let source: EventSource | null = null;
    let reintento: ReturnType<typeof setTimeout> | undefined;

    const conectar = () => {
      const token = getAccessToken();
      if (!token || cerrado) return;

      source = new EventSource(
        `/api/notificaciones/stream?token=${encodeURIComponent(token)}`,
      );

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as EventoNotificacion & {
            type?: string;
          };
          if (data?.tipo === 'hb' || data?.type === 'hb') return;
          ref.current(data);
        } catch {
          // Ignora payloads no-JSON
        }
      };

      source.onerror = () => {
        source?.close();
        source = null;
        if (cerrado) return;
        void refreshAccessToken().then(() => {
          if (!cerrado) reintento = setTimeout(conectar, 1000);
        });
      };
    };

    conectar();

    return () => {
      cerrado = true;
      if (reintento) clearTimeout(reintento);
      source?.close();
    };
  }, [activo]);
}
