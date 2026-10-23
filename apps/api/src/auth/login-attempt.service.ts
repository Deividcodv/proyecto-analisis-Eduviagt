import { Injectable } from '@nestjs/common';

export const LOGIN_ATTEMPT_SERVICE = 'LOGIN_ATTEMPT_SERVICE';

export interface ResultadoBloqueo {
  bloqueado: boolean;
  reintentarEnSegundos: number;
}

export interface ILoginAttemptService {
  estado(clave: string): ResultadoBloqueo;
  registrarFallo(clave: string): void;
  registrarExito(clave: string): void;
}

interface Registro {
  fallos: number;
  bloqueadoHasta: number;
}

/**
 * Límite de intentos de inicio de sesión (S-002).
 *
 * Tras `maxIntentos` fallos con la misma clave (IP + correo), la clave queda
 * bloqueada durante `ventanaMs`. Un inicio de sesión exitoso reinicia el
 * contador.
 *
 * NOTA: el estado vive en memoria del proceso. Con varias instancias de la API
 * habría que respaldarlo en un almacén compartido (p. ej. Redis).
 */
@Injectable()
export class LoginAttemptService implements ILoginAttemptService {
  private readonly registros = new Map<string, Registro>();

  constructor(
    private readonly maxIntentos = 5,
    private readonly ventanaMs = 15 * 60 * 1000,
    private readonly reloj: () => number = Date.now,
  ) {}

  estado(clave: string): ResultadoBloqueo {
    const registro = this.registros.get(clave);
    if (!registro) {
      return { bloqueado: false, reintentarEnSegundos: 0 };
    }

    const ahora = this.reloj();

    if (registro.bloqueadoHasta > ahora) {
      return {
        bloqueado: true,
        reintentarEnSegundos: Math.ceil((registro.bloqueadoHasta - ahora) / 1000),
      };
    }

    // El bloqueo ya expiró: se limpia para empezar de cero.
    if (registro.bloqueadoHasta > 0) {
      this.registros.delete(clave);
    }

    return { bloqueado: false, reintentarEnSegundos: 0 };
  }

  registrarFallo(clave: string): void {
    const ahora = this.reloj();
    const registro = this.registros.get(clave) ?? {
      fallos: 0,
      bloqueadoHasta: 0,
    };

    registro.fallos += 1;

    if (registro.fallos >= this.maxIntentos) {
      registro.bloqueadoHasta = ahora + this.ventanaMs;
    }

    this.registros.set(clave, registro);
  }

  registrarExito(clave: string): void {
    this.registros.delete(clave);
  }
}
