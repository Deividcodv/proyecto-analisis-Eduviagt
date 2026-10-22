'use client';

import { useState } from 'react';
import { fetchConToken } from '@/lib/api-auth';
import { cerrarSesionLocal } from '@/lib/auth';
import { traducirError } from '@/lib/mensajes-error';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';

interface ResultadoEliminacion {
  seudonimo: string;
  eliminados: string[];
  conservados: string[];
}

/**
 * Gestión de la cuenta: eliminar la propia cuenta.
 *
 * La eliminación anonimiza los datos personales y conserva, con un seudónimo,
 * los registros que permiten justificar las decisiones de beca ya tomadas.
 */
export function GestionDeCuenta() {
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [motivo, setMotivo] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoEliminacion | null>(null);

  const eliminar = async () => {
    setEnviando(true);
    setError(null);
    try {
      const r = await fetchConToken<ResultadoEliminacion>(
        '/auth/eliminar-cuenta',
        {
          method: 'POST',
          body: { contrasena, confirmacion, motivo: motivo || undefined },
        },
      );
      setResultado(r);
      setAbierto(false);
      setExito('Tu cuenta se eliminó correctamente.');
      // La sesión ya no sirve: se limpian los tokens, pero la persona sigue
      // viendo el resumen de qué se borró y qué se conservó.
      cerrarSesionLocal();
    } catch (e) {
      setError(traducirError(e, 'No se pudo eliminar la cuenta'));
      setAbierto(false);
    } finally {
      setEnviando(false);
    }
  };

  if (resultado) {
    return (
      <Card className="mt-6 max-w-3xl border-brutal-rojo">
        <h2 className="font-brut text-xl font-black uppercase tracking-wide text-brutal-rojo">
          Tu cuenta fue eliminada
        </h2>
        <p className="mt-2 text-sm text-brutal-tinta/80">
          Estos datos se borraron:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-brutal-tinta/80 marker:text-brutal-rojo">
          {resultado.eliminados.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-brutal-tinta/80">
          Y estos se conservaron, con un seudónimo, para poder justificar las
          decisiones ya tomadas:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-brutal-tinta/80 marker:text-brutal-teal">
          {resultado.conservados.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="mt-6">
          <Button
            onClick={() => {
              // Recarga completa: el contexto de sesión vuelve a leer el
              // almacenamiento y confirma que ya no hay tokens.
              window.location.assign('/');
            }}
          >
            Ir al inicio
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-6 max-w-3xl border-brutal-rojo">
      <h2 className="font-brut text-xl font-black uppercase tracking-wide text-brutal-rojo">
        Gestión de la cuenta
      </h2>
      <p className="mt-2 text-sm text-brutal-tinta/80">
        Puedes eliminar tu cuenta cuando quieras. Al hacerlo se borran tu
        nombre, tu correo, tu CUI, tus datos de contacto, tus perfiles y los
        documentos que adjuntaste.
      </p>
      <p className="mt-2 text-sm text-brutal-tinta/80">
        Para poder justificar las becas ya otorgadas, las solicitudes, las
        evaluaciones y la bitácora se conservan con un seudónimo que no
        permite saber de quién se trata.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-brutal border-[3px] border-brutal-rojo bg-red-50 p-4 text-sm font-bold text-brutal-rojo"
        >
          {error}
        </p>
      )}
      {exito && (
        <p className="mt-4 rounded-brutal border-[3px] border-brutal-tinta bg-brutal-lima/30 p-4 text-sm font-bold text-brutal-tinta">
          {exito}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="danger" onClick={() => setAbierto(true)}>
          Eliminar mi cuenta
        </Button>
      </div>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brutal-tinta/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Eliminar mi cuenta"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAbierto(false);
          }}
        >
          <Card className="w-full max-w-lg">
            <h3 className="mb-2 font-brut text-lg font-black uppercase tracking-wide text-brutal-tinta">
              Eliminar mi cuenta
            </h3>
            <p className="mb-4 text-sm text-brutal-tinta/75">
              Escribe tu contraseña y confirma con la palabra{' '}
              <strong>ELIMINAR</strong>.
            </p>
            <div className="space-y-3">
              <Input
                label="Tu contraseña"
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                autoComplete="current-password"
              />
              <Textarea
                label="Motivo (opcional)"
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ya no deseo usar la plataforma."
              />
              <Input
                label="Escribe ELIMINAR para confirmar"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={eliminar}
                disabled={
                  enviando ||
                  contrasena.length === 0 ||
                  confirmacion.trim().toUpperCase() !== 'ELIMINAR'
                }
              >
                {enviando ? <Spinner /> : 'Eliminar mi cuenta'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}
