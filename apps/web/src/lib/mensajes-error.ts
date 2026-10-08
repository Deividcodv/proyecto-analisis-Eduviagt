const MAPA_ERRORES: { patron: RegExp; mensaje: string }[] = [
  {
    patron: /estado 401|no autoriz|no autenticad|unauthorized/i,
    mensaje: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  },
  {
    patron: /estado 403|prohibid|sin permiso|forbidden/i,
    mensaje: 'No tienes permiso para realizar esta acción.',
  },
  {
    patron: /estado 404|no encontrad|not found/i,
    mensaje: 'No encontramos la información solicitada.',
  },
  {
    patron: /estado 5\d\d|intern[oa] del servidor|internal server/i,
    mensaje: 'Ocurrió un error en el sistema. Intenta de nuevo más tarde.',
  },
  {
    patron: /failed to fetch|networkerror|load failed|network request failed/i,
    mensaje: 'No pudimos conectar con el sistema. Revisa tu conexión.',
  },
];

export function traducirError(
  error: unknown,
  respaldo = 'Ocurrió un error inesperado.',
): string {
  const mensaje =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  if (!mensaje) return respaldo;

  for (const { patron, mensaje: reemplazo } of MAPA_ERRORES) {
    if (patron.test(mensaje)) return reemplazo;
  }

  return mensaje;
}
