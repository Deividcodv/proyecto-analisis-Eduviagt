'use client';

import { useParams } from 'next/navigation';
import { FormularioConvocatoria } from '@/components/admin/FormularioConvocatoria';

export default function EditarConvocatoriaPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  return id ? <FormularioConvocatoria convocatoriaId={id} /> : null;
}
