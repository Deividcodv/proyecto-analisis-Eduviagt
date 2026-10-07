'use client';

import { useEffect, useState } from 'react';

export function CuentaRegresiva({ fecha }: { fecha: string }) {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const temporizador = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(temporizador);
  }, []);

  const objetivo = new Date(fecha).getTime();
  const diff = objetivo - ahora;

  if (Number.isNaN(objetivo) || diff <= 0) {
    return (
      <span className="tabular font-bold text-brutal-tinta/60">
        Convocatoria cerrada
      </span>
    );
  }

  const dias = Math.floor(diff / 86_400_000);
  const horas = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutos = Math.floor((diff % 3_600_000) / 60_000);
  const segundos = Math.floor((diff % 60_000) / 1000);

  const urgente = dias <= 3;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-brutal border-2 px-3 py-1.5 font-mono ${
        urgente
          ? 'border-brutal-rojo bg-brutal-rojo/10 text-brutal-rojo'
          : 'border-brutal-tinta bg-brutal-lima/15 text-brutal-tinta'
      }`}
    >
      <span className={`tabular font-black ${urgente ? 'text-brutal-rojo' : 'text-brutal-tinta'}`}>
        {dias}d
      </span>
      <span className={urgente ? 'text-brutal-rojo/70' : 'text-brutal-tinta/60'}>:</span>
      <span className="tabular font-bold">{horas}h</span>
      <span className={urgente ? 'text-brutal-rojo/70' : 'text-brutal-tinta/60'}>:</span>
      <span className="tabular font-bold">{minutos}m</span>
      <span className={urgente ? 'text-brutal-rojo/70' : 'text-brutal-tinta/60'}>:</span>
      <span className="tabular font-bold">{segundos}s</span>
    </div>
  );
}