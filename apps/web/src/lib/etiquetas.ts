export const ETIQUETA_ESTADO: Record<string, string> = {
  BORRADOR: 'Borrador',
  ENVIADA: 'Enviada',
  EN_REVISION: 'En revisión',
  CORRECCION: 'Necesita correcciones',
  EVALUADA: 'Evaluada',
  APROBADA: 'Aprobada',
  RECHAZADA: 'No seleccionada',
  ABIERTA: 'Abierta',
  CERRADA: 'Cerrada',
  EN_EVALUACION: 'En evaluación',
  RESUELTA: 'Resuelta',
  ARCHIVADA: 'Archivada',
  PROGRAMADA: 'Programada',
  EN_CURSO: 'En curso',
  FINALIZADA: 'Finalizada',
  PENDIENTE: 'Falta subir',
  CARGADO: 'Recibido',
  RECHAZADO: 'Rechazado',
  ABSTENCION: 'Abstención',
  APROBAR: 'A favor',
  RECHAZAR: 'En contra',
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
};

export function etiquetaEstado(estado: string): string {
  return ETIQUETA_ESTADO[(estado || '').toUpperCase()] ?? estado;
}

export const ETIQUETA_SECCION: Record<string, string> = {
  academico: 'Perfil académico',
  socioeconomico: 'Perfil socioeconómico',
  personal: 'Datos personales',
  adicional: 'Información adicional',
};

export const ETIQUETA_TIPO_CAMPO: Record<string, string> = {
  texto: 'Texto corto',
  textarea: 'Texto largo',
  numero: 'Número',
  fecha: 'Fecha',
  seleccion: 'Selección',
  booleano: 'Sí / No',
  archivo: 'Archivo',
};
