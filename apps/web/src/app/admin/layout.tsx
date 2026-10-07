'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Container } from '@/components/ui/Container';
import { InternalPageHeader } from '@/components/ui/InternalPageHeader';
import { Icon, type IconName } from '@/components/ui/Icon';

const pestanas: { href: string; label: string; icono: IconName }[] = [
  { href: '/admin/convocatorias', label: 'Convocatorias', icono: 'becas' },
  { href: '/admin/solicitudes', label: 'Solicitudes', icono: 'documento' },
  { href: '/admin/comites', label: 'Comités', icono: 'grupos' },
  { href: '/admin/sesiones', label: 'Sesiones', icono: 'calendario' },
  { href: '/admin/seguridad', label: 'Seguridad', icono: 'escudo' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute roles={['ADMIN']}>
      <InternalPageHeader
        etiqueta="Administración"
        title="Panel de administración"
        subtitle="Gestiona convocatorias, solicitudes, comités, sesiones y usuarios del sistema."
      />
      <Container className="py-8">
        <nav
          aria-label="Secciones de administración"
          className="mb-6 flex flex-wrap gap-2"
        >
          {pestanas.map((pestana) => {
            const activo =
              pathname === pestana.href || pathname.startsWith(`${pestana.href}/`);
            return (
              <Link
                key={pestana.href}
                href={pestana.href}
                aria-current={activo ? 'page' : undefined}
                className={`inline-flex items-center gap-2 rounded-brutal border-[3px] border-brutal-tinta px-4 py-2 font-brut text-xs font-bold uppercase tracking-wide transition-all ${
                  activo
                    ? 'bg-brutal-tinta text-brutal-papel shadow-brutal-sm'
                    : 'bg-brutal-blanco text-brutal-tinta hover:bg-brutal-cyan'
                }`}
              >
                <Icon name={pestana.icono} className="h-4 w-4" />
                {pestana.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </Container>
    </ProtectedRoute>
  );
}
