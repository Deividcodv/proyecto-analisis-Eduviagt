import type { ReactNode } from 'react';

export type IconName =
  | 'inicio'
  | 'becas'
  | 'documento'
  | 'usuario'
  | 'campana'
  | 'grafica'
  | 'calendario'
  | 'grupos'
  | 'escudo'
  | 'menu'
  | 'cerrar'
  | 'check'
  | 'alerta'
  | 'subir'
  | 'descargar'
  | 'editar'
  | 'salir'
  | 'buscar'
  | 'mas'
  | 'panel'
  | 'reloj'
  | 'libro'
  | 'info'
  | 'estrella'
  | 'votar'
  | 'chevron'
  | 'correo'
  | 'chat'
  | 'telefono'
  | 'ubicacion';

const paths: Record<IconName, ReactNode> = {
  inicio: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </>
  ),
  becas: (
    <>
      <circle cx="12" cy="8" r="5" />
      <path d="M8.5 12.5 7 21l5-2.5L17 21l-1.5-8.5" />
    </>
  ),
  documento: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 13h6M9 17h6" />
    </>
  ),
  usuario: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  campana: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  grafica: (
    <>
      <path d="M2 20h20" />
      <path d="M5 20v-6" />
      <path d="M11 20V5" />
      <path d="M17 20v-9" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" />
      <path d="M3 10h18" />
      <path d="M8 3v4M16 3v4" />
    </>
  ),
  grupos: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5" />
      <path d="M16 5a3.5 3.5 0 0 1 0 7" />
      <path d="M17.5 15c2.6.6 4.5 2.2 4.5 5" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="M4 12.5 9.5 18 20 6" />,
  alerta: (
    <>
      <path d="M12 3 2 20h20z" />
      <path d="M12 9v5" />
      <path d="M12 17h.01" />
    </>
  ),
  subir: (
    <>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </>
  ),
  descargar: (
    <>
      <path d="M12 5v14" />
      <path d="m5 12 7 7 7-7" />
    </>
  ),
  editar: (
    <>
      <path d="M4 20h4L20 8l-4-4L4 16z" />
      <path d="m14 6 4 4" />
    </>
  ),
  salir: (
    <>
      <path d="M15 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4" />
      <path d="m10 17 5-5-5-5" />
      <path d="M15 12H3" />
    </>
  ),
  buscar: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  mas: <path d="M12 5v14M5 12h14" />,
  panel: (
    <>
      <rect x="3" y="3" width="18" height="18" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  libro: (
    <>
      <path d="M12 6C10 4 6 4 4 4v14c2 0 6 0 8 2 2-2 6-2 8-2V4c-2 0-6 0-8 2z" />
      <path d="M12 6v16" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <path d="M12 8h.01" />
    </>
  ),
  estrella: <path d="m12 3 2.6 5.5 6 .8-4.3 4.2 1 6-5.3-2.9L6.7 19.5l1-6L3.4 9.3l6-.8z" />,
  votar: (
    <>
      <path d="m4 12 5 5L20 6" />
      <path d="M4 20h16" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  correo: (
    <>
      <rect x="3" y="5" width="18" height="14" />
      <path d="m3 6 9 6 9-6" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5h16v11H9l-5 4z" />
      <path d="M8 10h8" />
    </>
  ),
  telefono: (
    <path d="M5 3h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" />
  ),
  ubicacion: (
    <>
      <path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
};

interface IconProps {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, className = 'h-5 w-5', strokeWidth = 2.5 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
