/**
 * Identidad del asistente virtual de EDUVIAGT.
 *
 * El nombre, la descripción y los saludos viven aquí para que el chat
 * flotante y la sección de soporte digan exactamente lo mismo: si se cambia
 * en un sitio, cambia en los dos.
 */
export const NOMBRE_ASISTENTE = 'Eduvi';

/** Se muestra junto al nombre en las cabeceras de ambas interfaces. */
export const DESCRIPCION_ASISTENTE = 'Guía virtual de EDUVIAGT';

/** Texto corto para el botón flotante. */
export const ETIQUETA_ASISTENTE = 'Eduvi · guía virtual';

/**
 * Saludo inicial. El del equipo es distinto porque su trabajo es distinto:
 * analizan el avance de las convocatorias y las evaluaciones.
 */
export function saludoAsistente(esEquipo: boolean): string {
  return esEquipo
    ? '¡Hola! Soy Eduvi, tu guía virtual de EDUVIAGT. Estoy aquí para ayudarte a analizar el avance de las convocatorias, las solicitudes en revisión y el proceso de evaluación de los comités.'
    : '¡Hola! Soy Eduvi, tu guía virtual de EDUVIAGT. Estoy aquí para ayudarte con las convocatorias, los requisitos y el proceso de solicitud de becas.';
}

/** Mensaje de espera mientras el asistente responde. */
export function mensajeEspera(esEquipo: boolean): string {
  return esEquipo ? 'Analizando postulación…' : 'Analizando convocatorias…';
}
