import { redirect } from 'next/navigation';

/**
 * La ruta canónica del panel de revisión es `/revision`, compartida por el
 * personal que participa en el flujo (administrador, jefe de becas y
 * comité). Esta ruta se conserva para que los enlaces anteriores sigan
 * funcionando.
 */
export default function AdminSolicitudesPage() {
  redirect('/revision');
}
