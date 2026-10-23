import { ValidationError } from '@nestjs/common';

/**
 * Mensajes de error en español para la persona usuaria (S-007).
 *
 * Antes, el filtro de excepciones reenviaba tal cual los mensajes por defecto
 * de Nest y de class-validator, que están en inglés («Unauthorized»,
 * «email must be an email», «Cannot GET /ruta»). Aquí se traducen a un texto
 * claro y en español, sin filtrar detalles internos.
 */

/** Mensaje claro por código HTTP, para respuestas sin detalle útil. */
const MENSAJE_POR_ESTADO: Record<number, string> = {
  400: 'Los datos enviados no son válidos.',
  401: 'Necesitas iniciar sesión para continuar.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos lo que buscas.',
  405: 'Esa acción no está permitida aquí.',
  409: 'Ya existe un registro con esos datos.',
  413: 'El archivo es demasiado grande.',
  415: 'El formato del archivo no es compatible.',
  422: 'Los datos enviados no son válidos.',
  429: 'Demasiados intentos. Espera un momento e intenta de nuevo.',
  500: 'No pudimos completar la solicitud. Intenta de nuevo.',
};

/** Mensajes por defecto de Nest (en inglés) que NO deben llegar al usuario. */
const MENSAJES_NEST_INGLES = new Set([
  'Unauthorized',
  'Forbidden',
  'Not Found',
  'Bad Request',
  'Internal Server Error',
  'Method Not Allowed',
  'Conflict',
  'Unprocessable Entity',
  'Too Many Requests',
  'Request Timeout',
  'Payload Too Large',
  'Unsupported Media Type',
]);

/** «Cannot GET /ruta», «Cannot POST /ruta», etc. */
const RUTA_TECNICA = /^Cannot\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\S+/i;

/** Marcadores típicos de las plantillas en inglés de class-validator. */
const MARCADORES_INGLES = /\b(must|should)\b/i;

function pareceIngles(texto: string): boolean {
  return MARCADORES_INGLES.test(texto);
}

function esMensajeTecnicoEnIngles(texto: string): boolean {
  const limpio = texto.trim();
  return (
    MENSAJES_NEST_INGLES.has(limpio) ||
    RUTA_TECNICA.test(limpio) ||
    pareceIngles(limpio)
  );
}

function mensajeGenerico(status: number): string {
  return (
    MENSAJE_POR_ESTADO[status] ??
    'No pudimos completar la solicitud. Intenta de nuevo.'
  );
}

/** Traduce una restricción de class-validator a una frase en español. */
function restriccionEnEspanol(
  clave: string,
  mensajeOriginal: string,
): string | null {
  const numero = mensajeOriginal.match(/(\d+)/)?.[1];
  switch (clave) {
    case 'isString':
      return 'debe ser texto';
    case 'isNotEmpty':
      return 'no puede quedar vacío';
    case 'isEmail':
      return 'debe ser un correo electrónico válido';
    case 'isBoolean':
      return 'debe ser verdadero o falso';
    case 'isInt':
      return 'debe ser un número entero';
    case 'isNumber':
      return 'debe ser un número';
    case 'isArray':
      return 'debe ser una lista';
    case 'isUUID':
      return 'no tiene un formato válido';
    case 'isDateString':
      return 'debe ser una fecha válida';
    case 'isEnum':
    case 'isIn':
      return 'debe ser uno de los valores permitidos';
    case 'whitelistValidation':
      return 'no está permitido';
    case 'minLength':
      return numero
        ? `debe tener al menos ${numero} caracteres`
        : 'es más corto de lo permitido';
    case 'maxLength':
      return numero
        ? `debe tener como máximo ${numero} caracteres`
        : 'es más largo de lo permitido';
    case 'min':
      return numero
        ? `no puede ser menor que ${numero}`
        : 'es menor de lo permitido';
    case 'max':
      return numero
        ? `no puede ser mayor que ${numero}`
        : 'es mayor de lo permitido';
    case 'matches':
      return 'no tiene el formato esperado';
    default:
      return null;
  }
}

/**
 * Convierte los errores del ValidationPipe (class-validator, plantillas en
 * inglés) en una lista de mensajes en español, aplanando anidamientos.
 */
export function formatearErroresValidacion(
  errores: ValidationError[],
  prefijo = '',
): string[] {
  const salida: string[] = [];

  for (const error of errores) {
    const campo = prefijo ? `${prefijo}.${error.property}` : error.property;

    for (const [clave, mensajeOriginal] of Object.entries(
      error.constraints ?? {},
    )) {
      if (pareceIngles(mensajeOriginal)) {
        const texto = restriccionEnEspanol(clave, mensajeOriginal);
        if (texto) salida.push(`El campo «${campo}» ${texto}.`);
      } else {
        // Mensaje propio del DTO (ya está en español): se respeta tal cual.
        salida.push(mensajeOriginal);
      }
    }

    if (error.children && error.children.length > 0) {
      salida.push(...formatearErroresValidacion(error.children, campo));
    }
  }

  return salida;
}

/**
 * Devuelve un mensaje en español para la respuesta de error. Si el mensaje
 * original es un texto técnico en inglés (Nest o class-validator) o no hay
 * detalle, usa un mensaje genérico por código de estado.
 */
export function mensajeDeError(status: number, crudo?: unknown): string {
  if (Array.isArray(crudo)) {
    const detalles = crudo
      .filter((m): m is string => typeof m === 'string' && m.trim() !== '')
      .map((m) => m.trim())
      .filter((m) => !esMensajeTecnicoEnIngles(m));
    return detalles.length > 0 ? detalles.join(' ') : mensajeGenerico(status);
  }

  if (typeof crudo === 'string' && crudo.trim() !== '') {
    const texto = crudo.trim();
    return esMensajeTecnicoEnIngles(texto) ? mensajeGenerico(status) : texto;
  }

  return mensajeGenerico(status);
}
