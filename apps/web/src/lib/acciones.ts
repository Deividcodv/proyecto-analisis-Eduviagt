import type { IconName } from '@/components/ui/Icon';

export interface Accion {
  titulo: string;
  descripcion: string;
  href: string;
  icono: IconName;
  acento:
    | 'bg-brutal-cyan'
    | 'bg-brutal-gold'
    | 'bg-brutal-lima'
    | 'bg-brutal-rosa'
    | 'bg-brutal-indigo'
    | 'bg-brutal-naranja'
    | 'bg-brutal-teal';
}

export const accionesPorRol: Record<string, Accion[]> = {
  POSTULANTE: [
    { titulo: 'Postularme a una beca', descripcion: 'Explora las becas abiertas y aplica',           href: '/convocatorias',     icono: 'becas',   acento: 'bg-brutal-cyan' },
    { titulo: 'Mi postulación',        descripcion: 'Seguimiento y estado de tu postulación',       href: '/dashboard',         icono: 'panel',   acento: 'bg-brutal-gold' },
    { titulo: 'Mis datos',             descripcion: 'Completa tu información personal',             href: '/perfil',            icono: 'usuario', acento: 'bg-brutal-indigo' },
    { titulo: 'Consultar estado',      descripcion: 'Consulta el estado de tu solicitud',           href: '/consulta',          icono: 'buscar',  acento: 'bg-brutal-rosa' },
  ],
  EVALUADOR: [
    { titulo: 'Mis evaluaciones',    descripcion: 'Revisa y puntúa las solicitudes asignadas',    href: '/evaluador',         icono: 'estrella', acento: 'bg-brutal-cyan' },
    { titulo: 'Mis reportes',        descripcion: 'Indicadores de tu actividad de evaluación',    href: '/reportes',          icono: 'grafica',  acento: 'bg-brutal-indigo' },
  ],
  COORDINADOR_COMITE: [
    { titulo: 'Sesiones',            descripcion: 'Crea y gestiona las sesiones de los comités',  href: '/coordinador',       icono: 'calendario', acento: 'bg-brutal-gold' },
    { titulo: 'Mis reportes',        descripcion: 'Indicadores de tus comités y sesiones',        href: '/reportes',          icono: 'grafica',    acento: 'bg-brutal-indigo' },
  ],
  MIEMBRO_COMITE: [
    { titulo: 'Votar en sesión',     descripcion: 'Participa en las sesiones y emite tu voto',    href: '/comite',            icono: 'votar',   acento: 'bg-brutal-lima' },
    { titulo: 'Mis reportes',        descripcion: 'Indicadores de tu participación en sesiones',   href: '/reportes',          icono: 'grafica', acento: 'bg-brutal-indigo' },
  ],
  ADMIN: [
    { titulo: 'Convocatorias',       descripcion: 'Crea, publica y actualiza convocatorias',      href: '/admin/convocatorias', icono: 'becas',      acento: 'bg-brutal-cyan' },
    { titulo: 'Solicitudes',         descripcion: 'Revisa solicitudes y estados',                 href: '/admin/solicitudes',   icono: 'documento',  acento: 'bg-brutal-gold' },
    { titulo: 'Comités',             descripcion: 'Organiza comités evaluadores',                 href: '/admin/comites',       icono: 'grupos',     acento: 'bg-brutal-lima' },
    { titulo: 'Sesiones',            descripcion: 'Agenda y resuelve sesiones',                   href: '/admin/sesiones',      icono: 'calendario', acento: 'bg-brutal-rosa' },
    { titulo: 'Seguridad',           descripcion: 'Roles, permisos y usuarios',                   href: '/admin/seguridad',     icono: 'escudo',     acento: 'bg-brutal-indigo' },
    { titulo: 'Reportes',            descripcion: 'Indicadores, tendencia y exportación CSV',     href: '/reportes',            icono: 'grafica',    acento: 'bg-brutal-teal' },
    { titulo: 'Auditoría',           descripcion: 'Historial de cambios por usuario/entidad',     href: '/auditoria',           icono: 'libro',      acento: 'bg-brutal-naranja' },
  ],
};
