'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PanelSolicitudes } from '@/components/admin/PanelSolicitudes';
import { Container } from '@/components/ui/Container';
import { InternalPageHeader } from '@/components/ui/InternalPageHeader';

/**
 * Panel de revisión de postulaciones.
 *
 * Es la ruta del personal que participa en la revisión: el administrador, el
 * jefe de becas y el comité (coordinador y miembros). Todos ven el mismo
 * panel; lo que puede hacer cada uno lo decide el API.
 */
export default function RevisionPage() {
  return (
    <ProtectedRoute roles={['ADMIN', 'JEFE_BECAS', 'COORDINADOR_COMITE', 'MIEMBRO_COMITE']}>
      <>
        <InternalPageHeader
          title="Solicitudes"
          subtitle="Revisa las postulaciones, asigna evaluadores y firma las decisiones."
        />
        <Container className="py-8">
          <PanelSolicitudes />
        </Container>
      </>
    </ProtectedRoute>
  );
}
