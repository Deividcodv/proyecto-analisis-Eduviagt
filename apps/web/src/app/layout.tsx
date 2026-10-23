import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@/styles/globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { ChatWidget } from '@/components/chat/ChatWidget';

/*
 * Las fuentes se auto-alojan en `src/fonts` en vez de descargarse de Google
 * Fonts durante el build. Con `next/font/google` el build dependia de una
 * conexion externa y ya fallo en produccion con
 * `An error occurred in next/font: Cannot read properties of null`.
 * Ahora el build es determinista y funciona sin red.
 *
 * Archivo e Instrument Sans son fuentes variables: un solo archivo cubre
 * todos los pesos. Space Mono es estatica y necesita uno por peso.
 */

const display = localFont({
  src: '../fonts/archivo-variable.woff2',
  weight: '700 900',
  style: 'normal',
  variable: '--font-display',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

const body = localFont({
  src: '../fonts/instrumentsans-variable.woff2',
  weight: '400 700',
  style: 'normal',
  variable: '--font-body',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

const mono = localFont({
  src: [
    { path: '../fonts/spacemono-400.woff2', weight: '400' },
    { path: '../fonts/spacemono-700.woff2', weight: '700' },
  ],
  style: 'normal',
  variable: '--font-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'monospace'],
});

export const metadata: Metadata = {
  title: 'EDUVIAGT - Sistema Integral de Gestión de Becas',
  description:
    'EDUVIAGT es un prototipo académico que administra el ciclo completo de una beca: publicación de convocatorias, postulación, carga y revisión de documentos, evaluación, decisión de comités y consulta de estado.',
  keywords: ['becas', 'MINEDUC', 'Guatemala', 'educación', 'postulación', 'EDUVIAGT'],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/marca.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className={`${body.className} brut-body`}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <a
              href="#contenido-principal"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-brutal focus:border-[3px] focus:border-brutal-tinta focus:bg-brutal-gold focus:px-4 focus:py-2 focus:font-brut focus:text-sm focus:font-bold focus:uppercase focus:tracking-wide focus:text-brutal-tinta"
            >
              Saltar al contenido principal
            </a>
            <Header />
            <main id="contenido-principal" className="flex-1" tabIndex={-1}>
              {children}
            </main>
            <Footer />
            <ChatWidget />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}