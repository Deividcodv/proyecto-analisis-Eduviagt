import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';

const columnas = [
  {
    titulo: 'Institucional',
    enlaces: [
      { href: '/', label: 'Inicio' },
      { href: '/nosotros', label: 'Sobre EDUVIAGT' },
      { href: '/transparencia', label: 'Transparencia' },
      { href: '/contacto', label: 'Contacto' },
    ],
  },
  {
    titulo: 'Becas',
    enlaces: [
      { href: '/convocatorias', label: 'Convocatorias' },
      { href: '/requisitos', label: 'Requisitos' },
      { href: '/faq', label: 'Preguntas frecuentes' },
    ],
  },
  {
    titulo: 'Ayuda',
    enlaces: [
      { href: '/ayuda', label: 'Centro de ayuda' },
      { href: '/consulta', label: 'Consultar solicitud' },
      { href: '/soporte', label: 'Soporte' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t-[3px] border-brutal-tinta bg-brutal-tinta py-12 text-brutal-papel">
      <Container>
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-md border-[3px] border-brutal-tinta bg-brutal-gold px-3 py-1 font-brut text-xl font-black uppercase text-brutal-tinta shadow-brutal-sm">
              <Image src="/marca.svg" alt="" width={28} height={28} className="object-cover" />
              EDUVIAGT
            </div>
            <p className="text-sm text-brutal-papel/85">
              Sistema Integral de Gestión de Becas
            </p>
            <p className="mt-2 text-sm text-brutal-papel/85">Ministerio de Educación</p>
            <p className="text-sm text-brutal-papel/85">República de Guatemala</p>
          </div>

          {columnas.map((columna) => (
            <div key={columna.titulo}>
              <h4 className="mb-4 font-brut text-sm font-black uppercase tracking-wide text-brutal-cyan">
                {columna.titulo.toUpperCase()}
              </h4>
              <ul className="space-y-2 text-sm text-brutal-papel/85">
                {columna.enlaces.map((enlace) => (
                  <li key={enlace.href}>
                    <Link
                      href={enlace.href}
                      className="transition-colors underline decoration-brutal-gold/40 underline-offset-4 hover:text-brutal-cyan"
                    >
                      {enlace.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t-2 border-brutal-papel/20 pt-6 text-center md:flex-row md:text-left">
          <p className="font-mono text-xs text-brutal-papel/85">
            © 2026 Ministerio de Educación de Guatemala. Todos los derechos reservados.
          </p>
          <p className="brut-label text-[10px] text-brutal-gold">v1.1 — brutal edition</p>
        </div>
      </Container>
    </footer>
  );
}