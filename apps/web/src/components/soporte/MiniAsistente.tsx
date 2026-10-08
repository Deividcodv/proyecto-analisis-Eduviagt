'use client';

import { useEffect, useRef, useState } from 'react';
import { httpData } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Mensaje {
  rol: 'usuario' | 'asistente';
  contenido: string;
}

interface Respuesta {
  respuesta: string;
  fuentes?: string[];
}

const ROLES_EQUIPO = ['ADMIN', 'COORDINADOR_COMITE', 'MIEMBRO_COMITE', 'EVALUADOR'];

const SUGERENCIAS_PUBLICAS = [
  '¿Cómo me registro?',
  '¿Qué requisitos necesito?',
  '¿Cómo consulto mi solicitud?',
  'Estado de mi convocatoria',
];

const SUGERENCIAS_EQUIPO = [
  '¿Cuántas convocatorias están abiertas?',
  '¿Qué solicitudes están en revisión?',
  'Resumen del avance de las evaluaciones',
  'Explica el proceso de decisión de un comité',
];

export function MiniAsistente() {
  const { usuario } = useAuth();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement | null>(null);

  const rol = (usuario?.rol ?? '').toUpperCase();
  const esEquipo = ROLES_EQUIPO.includes(rol);
  const sugerencias = esEquipo ? SUGERENCIAS_EQUIPO : SUGERENCIAS_PUBLICAS;

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, pensando]);

  const enviar = async (pregunta?: string) => {
    const contenido = (pregunta ?? texto).trim();
    if (!contenido || pensando) return;
    setTexto('');
    setError(null);
    setMensajes((m) => [...m, { rol: 'usuario', contenido }]);
    setPensando(true);
    try {
      const res = await httpData<Respuesta>('/asistente/preguntar', {
        method: 'POST',
        body: { pregunta: contenido },
      });
      setMensajes((m) => [
        ...m,
        { rol: 'asistente', contenido: res.respuesta },
      ]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo contactar al asistente',
      );
    } finally {
      setPensando(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco shadow-brutal">
      <div className="flex items-center justify-between border-b-[3px] border-brutal-tinta bg-brutal-tinta px-5 py-4 text-brutal-papel">
        <div>
          <p className="font-brut font-black uppercase tracking-wide text-brutal-gold">
            Asistente virtual EDUVIAGT
          </p>
          <p className="text-xs text-brutal-papel/75">
            Respuestas acotadas a la base de conocimiento del Ministerio
          </p>
        </div>
        <span className="hidden rounded-brutal border-2 border-brutal-lima bg-brutal-lima px-2 py-1 text-[10px] font-black text-brutal-tinta sm:block">
          ● En línea
        </span>
      </div>

      <div className="flex h-80 flex-col gap-4 overflow-y-auto bg-brutal-papel/60 p-4">
        {mensajes.length === 0 ? (
          <div className="my-auto">
            <p className="mb-4 font-mono text-sm text-brutal-tinta/80">
              ¡Hola! Soy el asistente de EDUVIAGT. ¿En qué puedo ayudarte? Por
              ejemplo:
            </p>
            <div className="flex flex-wrap gap-2">
              {sugerencias.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  disabled={pensando}
                  className="rounded-brutal border-2 border-brutal-tinta bg-brutal-cyan px-3 py-1.5 text-xs font-bold text-brutal-tinta transition-colors hover:bg-brutal-gold disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          mensajes.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-brutal px-4 py-2 text-sm ${
                m.rol === 'usuario'
                  ? 'ml-auto border-2 border-brutal-tinta bg-brutal-cyan text-brutal-tinta'
                  : 'self-start border-2 border-brutal-tinta bg-brutal-blanco text-brutal-tinta/90'
              }`}
            >
              {m.contenido}
            </div>
          ))
        )}
        {pensando && (
          <div className="self-start flex items-center gap-2 rounded-brutal border-2 border-brutal-tinta bg-brutal-blanco px-4 py-2 text-sm text-brutal-tinta/70">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brutal-cyan" />
            {esEquipo ? 'Analizando expediente…' : 'Analizando convocatorias…'}
          </div>
        )}
        {error && (
          <div className="rounded-brutal border-2 border-brutal-rojo bg-red-50 px-3 py-2 text-xs text-brutal-rojo">
            {error}
          </div>
        )}
        <div ref={finRef} />
      </div>

      <form
        className="flex items-center gap-2 border-t-[3px] border-brutal-tinta p-3"
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe tu pregunta…"
          maxLength={500}
          className="flex-1 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-blanco px-3 py-2 text-sm text-brutal-tinta focus:bg-brutal-cyan/10 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!texto.trim() || pensando}
          className="rounded-brutal border-[3px] border-brutal-tinta bg-brutal-gold px-5 py-2 font-brut text-xs font-black uppercase text-brutal-tinta transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}