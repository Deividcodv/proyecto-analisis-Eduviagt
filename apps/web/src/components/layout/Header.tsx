import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { UserMenu } from '@/components/layout/UserMenu';

const enlaces = [
  { href: '/', label: 'Inicio' },
  { href: '/convocatorias', label: 'Convocatorias' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/consulta', label: 'Consultar solicitud' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white shadow-sm">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sigeb-blue text-lg font-bold text-white">
            S
          </div>
          <div>
            <p className="text-lg font-bold leading-tight text-sigeb-blue-dark">
              SIGEB
            </p>
            <p className="text-xs leading-tight text-sigeb-light">
              Sistema Integral de Gestión de Becas
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className="text-sm font-medium text-sigeb-blue-dark hover:text-sigeb-blue"
            >
              {enlace.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <UserMenu />
        </div>

        <MobileMenu />
      </Container>
    </header>
  );
}