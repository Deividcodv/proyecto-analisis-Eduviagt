import { ValidationError } from '@nestjs/common';
import { formatearErroresValidacion, mensajeDeError } from './mensajes-error';

describe('formatearErroresValidacion (S-007)', () => {
  it('traduce las plantillas en inglés de class-validator', () => {
    const errores = [
      { property: 'email', constraints: { isEmail: 'email must be an email' } },
    ] as ValidationError[];

    expect(formatearErroresValidacion(errores)).toEqual([
      'El campo «email» debe ser un correo electrónico válido.',
    ]);
  });

  it('conserva los mensajes propios que ya están en español', () => {
    const errores = [
      {
        property: 'cui',
        constraints: { matches: 'El CUI debe tener exactamente 13 dígitos' },
      },
    ] as ValidationError[];

    expect(formatearErroresValidacion(errores)).toEqual([
      'El CUI debe tener exactamente 13 dígitos',
    ]);
  });

  it('conserva el número de la restricción al traducir minLength', () => {
    const errores = [
      {
        property: 'nombres',
        constraints: {
          minLength: 'nombres must be longer than or equal to 2 characters',
        },
      },
    ] as ValidationError[];

    expect(formatearErroresValidacion(errores)).toEqual([
      'El campo «nombres» debe tener al menos 2 caracteres.',
    ]);
  });

  it('marca las propiedades no permitidas (whitelist)', () => {
    const errores = [
      {
        property: 'admin',
        constraints: { whitelistValidation: 'property admin should not exist' },
      },
    ] as ValidationError[];

    expect(formatearErroresValidacion(errores)).toEqual([
      'El campo «admin» no está permitido.',
    ]);
  });

  it('aplana los errores anidados', () => {
    const errores = [
      {
        property: 'direccion',
        children: [
          {
            property: 'calle',
            constraints: { isString: 'calle must be a string' },
          },
        ],
      },
    ] as ValidationError[];

    expect(formatearErroresValidacion(errores)).toEqual([
      'El campo «direccion.calle» debe ser texto.',
    ]);
  });

  it('no filtra plantillas en inglés desconocidas', () => {
    const errores = [
      { property: 'x', constraints: { algoRaro: 'x must be magical' } },
    ] as ValidationError[];

    expect(formatearErroresValidacion(errores)).toEqual([]);
  });
});

describe('mensajeDeError (S-007)', () => {
  it('traduce el «Unauthorized» por defecto de Nest', () => {
    expect(mensajeDeError(401, 'Unauthorized')).toBe(
      'Necesitas iniciar sesión para continuar.',
    );
  });

  it('no filtra la ruta técnica en el 404', () => {
    expect(mensajeDeError(404, 'Cannot GET /no-existe')).toBe(
      'No encontramos lo que buscas.',
    );
  });

  it('conserva los mensajes propios en español', () => {
    expect(mensajeDeError(401, 'Credenciales inválidas')).toBe(
      'Credenciales inválidas',
    );
  });

  it('usa el mensaje genérico cuando no hay detalle', () => {
    expect(mensajeDeError(500)).toBe(
      'No pudimos completar la solicitud. Intenta de nuevo.',
    );
  });

  it('no filtra una plantilla de validación en inglés', () => {
    expect(mensajeDeError(400, 'email must be an email')).toBe(
      'Los datos enviados no son válidos.',
    );
  });

  it('conserva un mensaje en español dentro de una lista', () => {
    expect(mensajeDeError(400, ['El CUI ya está registrado'])).toBe(
      'El CUI ya está registrado',
    );
  });
});
