'use client';

import { useEffect, useRef, useState } from 'react';
import { httpData } from '@/lib/api';
import { Icon } from '@/components/ui/Icon';
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
  '¿Qué convocatorias están abiertas?',
];

const SUGERENCIAS_POSTULANTE = [
  '¿Cómo consulto el estado de mi solicitud?',
  '¿Qué documentos necesito cargar?',
  '¿Cómo funciona la evaluación?',
];

const SUGERENCIAS_EQUIPO = [
  '¿Cuántas convocatorias están abiertas?',
  '¿Qué solicitudes están en revisión?',
  'Resumen del avance de las evaluaciones',
  'Explica el proceso de decisión de un comité',
];

export function ChatWidget() {
  const { usuario } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement | null>(null);

  const rol = (usuario?.rol ?? '').toUpperCase();
  const esEquipo = ROLES_EQUIPO.includes(rol);
  const sugerencias = esEquipo
    ? SUGERENCIAS_EQUIPO
    : rol === 'POSTULANTE'
      ? SUGERENCIAS_POSTULANTE
      : SUGERENCIAS_PUBLICAS;

  useEffect(() => {
    if (abierto && mensajes.length === 0) {
      setMensajes([
        {
          rol: 'asistente',
          contenido: esEquipo
            ? '¡Hola! Soy el asistente de EDUVIAGT. Puedo ayudarte a analizar el avance de las convocatorias, las solicitudes en revisión y el proceso de evaluación de los comités.'
            : '¡Hola! Soy el asistente de EDUVIAGT. Puedo ayudarte con preguntas sobre convocatorias, becas y el proceso de postulación.',
        },
      ]);
    }
  }, [abierto, mensajes.length, esEquipo]);

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
    <>
      <button
        onClick={() => setAbierto((a) => !a)}
        aria-label="Abrir chat con el asistente"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-sigeb-blue text-white shadow-lg transition-transform hover:scale-105"
      >
        <Icon name={abierto ? 'cerrar' : 'chat'} className="h-6 w-6" />
      </button>

      {abierto && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-sigeb-blue px-4 py-3 text-white">
            <div>
              <p className="font-semibold">Asistente EDUVIAGT</p>
              <p className="text-xs text-sigeb-white/80">
                Respuestas acotadas a la base de conocimiento
              </p>
            </div>
            <button
              onClick={() => setAbierto(false)}
              className="rounded p-1 hover:bg-white/20"
              aria-label="Cerrar chat"
            >
              <Icon name="cerrar" className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-sigeb-gray p-4">
            {mensajes.length === 0 && (
              <div className="space-y-2">
                {sugerencias.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => enviar(s)}
                    disabled={pensando}
                    className="block w-full rounded-lg border border-sigeb-blue/40 bg-white px-3 py-2 text-left text-xs font-semibold text-sigeb-blue transition-colors hover:bg-sigeb-blue hover:text-white disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.rol === 'usuario'
                    ? 'ml-auto bg-sigeb-blue text-white'
                    : 'bg-white text-brutal-tinta/90 shadow-sm'
                }`}
              >
                {m.contenido}
              </div>
            ))}
            {pensando && (
              <div className="flex max-w-[85%] items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm text-brutal-tinta/70 shadow-sm">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sigeb-blue" />
                {esEquipo
                  ? 'Analizando expediente...'
                  : 'Analizando convocatorias...'}
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}
            <div ref={finRef} />
          </div>

          <form
            className="flex items-center gap-2 border-t border-gray-200 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              enviar();
            }}
          >
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe tu pregunta..."
              maxLength={500}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sigeb-blue focus:outline-none focus:ring-2 focus:ring-sigeb-blue/20"
            />
            <button
              type="submit"
              disabled={!texto.trim() || pensando}
              className="rounded-lg bg-sigeb-gold px-4 py-2 text-sm font-semibold text-brutal-tinta transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </>
  );
}
