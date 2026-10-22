'use client';

import { useEffect, useRef } from 'react';

export interface UseNotificacionesSonidoOptions {
  noLeidas: number;
  habilitado: boolean;
  volumen?: number;
}

export function useNotificacionesSonido({
  noLeidas,
  habilitado,
  volumen = 40,
}: UseNotificacionesSonidoOptions) {
  const prevNoLeidasRef = useRef<number>(noLeidas);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reproducidoRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/notificacion.mp3');
    }
    const audio = audioRef.current;
    const vol = Math.max(0, Math.min(100, volumen)) / 100;
    audio.volume = vol;
  }, [volumen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduced = mql.matches;
    const prev = prevNoLeidasRef.current;
    const curr = noLeidas;
    if (habilitado && !reduced && curr > prev && !reproducidoRef.current) {
      reproducidoRef.current = true;
      audioRef.current
        ?.play()
        .catch(() => {})
        .finally(() => {
          setTimeout(() => {
            reproducidoRef.current = false;
          }, 1000);
        });
    }
    prevNoLeidasRef.current = curr;
  }, [noLeidas, habilitado]);
}
