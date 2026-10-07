const ROLES_CON_PANEL = ['EVALUADOR', 'COORDINADOR_COMITE', 'MIEMBRO_COMITE', 'ADMIN', 'POSTULANTE'];

const ROLES_LABELS: Record<string, string> = {
  POSTULANTE: 'Postulante',
  EVALUADOR: 'Evaluador',
  COORDINADOR_COMITE: 'Coord. Comité',
  MIEMBRO_COMITE: 'Miembro Comité',
  ADMIN: 'Admin',
};

export function rutaPorRol(rol: string): string {
  const r = (rol || '').toUpperCase();
  if (r === 'EVALUADOR') return '/evaluador';
  if (r === 'COORDINADOR_COMITE') return '/coordinador';
  if (r === 'MIEMBRO_COMITE') return '/comite';
  if (r === 'POSTULANTE') return '/dashboard';
  return '/admin';
}

export function nombreRol(rol: string): string {
  return ROLES_LABELS[(rol || '').toUpperCase()] ?? 'Admin';
}

export function tienePanel(rol: string): boolean {
  return ROLES_CON_PANEL.includes((rol || '').toUpperCase());
}