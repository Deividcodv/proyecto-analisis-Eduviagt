'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Container } from '@/components/ui/Container';
import { InternalPageHeader } from '@/components/ui/InternalPageHeader';
import { PanelSesiones } from '@/components/admin/PanelSesiones';

export default function CoordinadorPage() {
  return (
    <ProtectedRoute roles={['COORDINADOR_COMITE']}>
      <InternalPageHeader
        title="Coordinación de comités"
        subtitle="Crea y gestiona las sesiones de los comités evaluadores."
      />
      <Container className="py-8">
        <PanelSesiones />
      </Container>
    </ProtectedRoute>
  );
}
