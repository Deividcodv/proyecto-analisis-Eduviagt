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
  ],
  EVALUADOR: [
    {
      titulo: 'Evaluación',
      enlaces: [
        { label: 'Mis evaluaciones', href: '/evaluador', icono: 'estrella' },
        { label: 'Mis reportes', href: '/reportes', icono: 'grafica' },
      ],
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
  ],
  MIEMBRO_COMITE: [
    {
      titulo: 'Comité',
      enlaces: [
        { label: 'Votar en sesión', href: '/comite', icono: 'votar' },
        { label: 'Mis reportes', href: '/reportes', icono: 'grafica' },
      ],
    },
  ],
};

export function navegacionDeRol(rol: string): GrupoNav[] {
  return navegacionPorRol[(rol || '').toUpperCase()] ?? [];
}
