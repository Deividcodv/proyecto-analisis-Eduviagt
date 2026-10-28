import type { IconName } from '@/components/ui/Icon';

export interface EnlaceNav {
  label: string;
  href: string;
  icono: IconName;
  descripcion?: string;
}

export interface GrupoNav {
  titulo: string;
  enlaces: EnlaceNav[];
}

export const enlacesPublicos: EnlaceNav[] = [
  { label: 'Inicio', href: '/', icono: 'inicio' },
  { label: 'Convocatorias', href: '/convocatorias', icono: 'becas' },
  { label: 'Nosotros', href: '/nosotros', icono: 'info' },
  { label: 'Consultar solicitud', href: '/consulta', icono: 'buscar' },
  { label: 'Ayuda', href: '/ayuda', icono: 'libro' },
];

/**
 * Enlace al perfil personal. Todos los roles con cuenta pueden editar sus
 * datos y sus preferencias de notificación, no solo los postulantes.
 */
const ENLACE_MI_PERFIL: EnlaceNav = {
  label: 'Mi perfil',
  href: '/perfil',
  icono: 'usuario',
  descripcion: 'Tus datos y preferencias',
};

export const navegacionPorRol: Record<string, GrupoNav[]> = {
  POSTULANTE: [
    {
      titulo: 'Mi beca',
      enlaces: [
        {
          label: 'Mi panel',
          href: '/dashboard',
          icono: 'panel',
          descripcion: 'Resumen de tu postulación',
        },
        {
          label: 'Becas disponibles',
          href: '/convocatorias',
          icono: 'becas',
          descripcion: 'Explora y postúlate',
        },
        {
          label: 'Mis datos',
          href: '/perfil',
          icono: 'usuario',
          descripcion: 'Completa tu información personal',
        },
        {
          label: 'Consultar estado',
          href: '/consulta',
          icono: 'buscar',
          descripcion: 'Consulta por número de solicitud',
        },
      ],
    },
  ],
  ADMIN: [
    {
      titulo: 'Gestión',
      enlaces: [
        { label: 'Convocatorias', href: '/admin/convocatorias', icono: 'becas' },
        { label: 'Solicitudes', href: '/admin/solicitudes', icono: 'documento' },
        { label: 'Comités', href: '/admin/comites', icono: 'grupos' },
        { label: 'Sesiones', href: '/admin/sesiones', icono: 'calendario' },
        { label: 'Reportes', href: '/reportes', icono: 'grafica' },
        { label: 'Auditoría', href: '/auditoria', icono: 'libro' },
        { label: 'Seguridad', href: '/admin/seguridad', icono: 'escudo' },
      ],
    },
    {
      titulo: 'Mi cuenta',
      enlaces: [ENLACE_MI_PERFIL],
    },
  ],
  JEFE_BECAS: [
    {
      titulo: 'Gestión de becas',
      enlaces: [
        { label: 'Convocatorias', href: '/admin/convocatorias', icono: 'becas' },
        { label: 'Solicitudes', href: '/admin/solicitudes', icono: 'documento' },
        { label: 'Comités', href: '/admin/comites', icono: 'grupos' },
        { label: 'Sesiones', href: '/admin/sesiones', icono: 'calendario' },
        { label: 'Reportes', href: '/reportes', icono: 'grafica' },
        { label: 'Consultar solicitud', href: '/consulta', icono: 'buscar' },
      ],
    },
    {
      titulo: 'Mi cuenta',
      enlaces: [ENLACE_MI_PERFIL],
    },
  ],
  EVALUADOR: [
    {
      titulo: 'Evaluación',
      enlaces: [
        { label: 'Mis evaluaciones', href: '/evaluador', icono: 'estrella' },
        { label: 'Mis reportes', href: '/reportes', icono: 'grafica' },
      ],
    },
    {
      titulo: 'Mi cuenta',
      enlaces: [ENLACE_MI_PERFIL],
    },
  ],
  COORDINADOR_COMITE: [
    {
      titulo: 'Comités',
      enlaces: [
        { label: 'Sesiones', href: '/coordinador', icono: 'calendario' },
        { label: 'Mis reportes', href: '/reportes', icono: 'grafica' },
      ],
    },
    {
      titulo: 'Mi cuenta',
      enlaces: [ENLACE_MI_PERFIL],
    },
  ],
  MIEMBRO_COMITE: [
    {
      titulo: 'Comité',
      enlaces: [
        { label: 'Votar en sesión', href: '/comite', icono: 'votar' },
        { label: 'Mis reportes', href: '/reportes', icono: 'grafica' },
      ],
    },
    {
      titulo: 'Mi cuenta',
      enlaces: [ENLACE_MI_PERFIL],
    },
  ],
};

export function navegacionDeRol(rol: string): GrupoNav[] {
  return navegacionPorRol[(rol || '').toUpperCase()] ?? [];
}
