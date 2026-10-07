import type { Metadata } from 'next';
import { Archivo, Space_Mono, Instrument_Sans } from 'next/font/google';
import '@/styles/globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { ChatWidget } from '@/components/chat/ChatWidget';

const display = Archivo({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-display',
});

const body = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

const mono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'EDUVIAGT - Sistema Integral de Gestión de Becas',
  description:
    'EDUVIAGT es la plataforma del Ministerio de Educación de Guatemala para administrar el ciclo completo de una beca: publicación de convocatorias, postulación de estudiantes, carga y revisión de documentos, evaluación, decisión de comités evaluadores y consulta de estado.',
  keywords: ['becas', 'MINEDUC', 'Guatemala', 'educación', 'postulación', 'EDUVIAGT'],
  icons: {
    icon: '/marca.svg',
    shortcut: '/marca.svg',
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
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <ChatWidget />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}