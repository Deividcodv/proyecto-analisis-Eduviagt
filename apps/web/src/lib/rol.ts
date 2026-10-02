const ROLES_CON_PANEL = ['EVALUADOR', 'COORDINADOR_COMITE', 'MIEMBRO_COMITE', 'ADMIN', 'POSTULANTE'];

export function rutaPorRol(rol: string): string {
  const r = (rol || '').toUpperCase();
  if (r === 'EVALUADOR') return '/evaluador';
  if (r === 'COORDINADOR_COMITE') return '/coordinador';
  if (r === 'MIEMBRO_COMITE') return '/comite';
  if (r === 'POSTULANTE') return '/dashboard';
  return '/admin';
}

export function tienePanel(rol: string): boolean {
  return ROLES_CON_PANEL.includes((rol || '').toUpperCase());
}