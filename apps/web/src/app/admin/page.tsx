'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * `/admin` es un atajo: lleva al panel de convocatorias.
 *
 * La redirección se hace en el cliente a propósito. Con `redirect()` de
 * servidor, la presencia de un `loading.tsx` en la raíz hace que Next
 * resuelva el límite de Suspense antes de aplicar el redirect, y la
 * navegación se queda en `/admin` sin llegar a su destino.
 */
export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/convocatorias');
  }, [router]);

  return null;
}
