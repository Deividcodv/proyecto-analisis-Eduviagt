'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { HogarPostulante } from '@/components/home/HogarPostulante';

export default function DashboardPage() {
  return (
    <ProtectedRoute roles={['POSTULANTE']}>
      <HogarPostulante />
    </ProtectedRoute>
  );
}
