export const ROL = {
  ADMIN: 'ADMIN',
  POSTULANTE: 'POSTULANTE',
  EVALUADOR: 'EVALUADOR',
  COORDINADOR_COMITE: 'COORDINADOR_COMITE',
  MIEMBRO_COMITE: 'MIEMBRO_COMITE',
  // Sprint 8 (US-806): autoridad para crear/publicar convocatorias,
  // aprobar en primera instancia y ajustar montos con justificación.
  JEFE_BECAS: 'JEFE_BECAS',
} as const;

/**
 * Roles que participan en la revisión de las postulaciones y, por tanto,
 * pueden consultar los documentos que el postulante adjuntó.
 */
export const ROLES_REVISORES: string[] = [
  ROL.ADMIN,
  ROL.JEFE_BECAS,
  ROL.COORDINADOR_COMITE,
  ROL.EVALUADOR,
  ROL.MIEMBRO_COMITE,
];

/**
 * Umbral de control (Sprint 8 - REQ-01): a partir de este monto, la
 * aprobación requiere una segunda firma de una persona distinta.
 */
export const UMBRAL_SEGUNDA_APROBACION_GTQ = 10000;
