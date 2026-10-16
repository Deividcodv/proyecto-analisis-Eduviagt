/**
 * Datos de prueba con correlativos simples y auto-generados.
 *
 * Regla: cuando el dato lo escribimos nosotros usamos valores "fáciles"
 * (repetidos o secuenciales); cuando hace falta unicidad (evitar choques entre
 * corridas) derivamos el valor automáticamente del reloj.
 */

let contador = 0;

function siguiente(): number {
  contador += 1;
  return contador;
}

/** CUI de exactamente 13 dígitos, simple y único por corrida. */
export function cuiSimple(): string {
  const ts = Date.now().toString().slice(-8);
  const seq = String(siguiente()).padStart(4, '0');
  return `1${ts}${seq}`;
}

/** Correo simple y único por corrida. */
export function emailSimple(prefijo = 'u'): string {
  return `${prefijo}${Date.now()}${siguiente()}@test.gt`;
}

/** Nombre legible con correlativo corto. */
export function nombreSimple(prefijo = 'Prueba'): string {
  return `${prefijo} ${String(siguiente()).padStart(3, '0')}`;
}
