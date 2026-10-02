import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { ChatWidget } from '@/components/chat/ChatWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SIGEB - Sistema Integral de Gestión de Becas',
  description:
    'Plataforma para que el Ministerio de Educación administre el ciclo completo de una beca: publicación de convocatorias, postulación de estudiantes, carga y revisión de documentos, evaluación, decisión de comités evaluadores y consulta de estado.',
  keywords: ['becas', 'MINEDUC', 'Guatemala', 'educación', 'postulación'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col bg-sigeb-gray">
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