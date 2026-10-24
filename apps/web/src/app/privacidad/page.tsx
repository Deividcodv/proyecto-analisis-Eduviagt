import type { Metadata } from 'next';
import { Apartado, PaginaLegal } from '@/components/legal/PaginaLegal';

export const metadata: Metadata = {
  title: 'Privacidad | EDUVIAGT',
  description:
    'Qué datos recopila EDUVIAGT, para qué los usa, cuánto tiempo los conserva y cómo pedir su eliminación.',
};

export default function PrivacidadPage() {
  return (
    <PaginaLegal
      etiqueta="Privacidad"
      titulo="Política de privacidad"
      descripcion="Qué datos recopila el portal, para qué se utilizan, cuánto tiempo se conservan y cómo puedes ejercer tus derechos."
      actualizado="Octubre de 2026"
    >
      <Apartado titulo="Qué datos recopilamos">
        <p>
          Solo se recogen los datos que el proceso de beca necesita. No hay
          ningún tipo de dato que el sistema solicite de más o para
          perfila a la persona.
        </p>
        <ul className="list-disc space-y-2 pl-5 marker:text-brutal-gold">
          <li>
            <strong>Cuenta:</strong> CUI, nombre completo, correo electrónico,
            teléfono, fecha de nacimiento, dirección, género, departamento y
            municipio.
          </li>
          <li>
            <strong>Postulación:</strong> institución educativa, carrera,
            promedio, nivel académico, ingreso familiar mensual, número de
            dependientes, becas anteriores, la descripción que escribas de tu
            situación y las respuestas del formulario de la convocatoria.
          </li>
          <li>
            <strong>Documentos:</strong> los archivos que adjuntas (certificado
            académico, constancia de inscripción, copia de DPI, comprobante de
            ingresos y los que la convocatoria solicite).
          </li>
          <li>
            <strong>Uso del sistema:</strong> registro de auditoría y bitácora
            (persona, fecha y hora, acción, resultado y dirección IP de la
            conexión), y las notificaciones que te enviamos.
          </li>
        </ul>
      </Apartado>

      <Apartado titulo="Para qué los usamos">
        <ul className="list-disc space-y-2 pl-5 marker:text-brutal-gold">
          <li>Gestionar tu cuenta y tu postulación.</li>
          <li>Evaluar la solicitud con los criterios públicos de la convocatoria.</li>
          <li>
            Notificarte los cambios de estado de tu solicitud y resolver tus
            dudas.
          </li>
          <li>
            Generar la constancia de beca cuando tu solicitud es aprobada.
          </li>
          <li>
            Cumplir la trazabilidad del proceso: cada decisión sobre una beca
            queda documentada y es verificable.
          </li>
        </ul>
        <p>
          No vendemos ni cedemos tus datos, y no los usamos para publicidad
          externa.
        </p>
      </Apartado>

      <Apartado titulo="A quién tienen acceso">
        <p>
          Al personal de evaluación solo le corresponde ver la postulación que
          tiene asignada. Los documentos que adjuntas <strong>no se sirven
          como archivos públicos</strong>: se entregan por un acceso
          autenticado que comprueba que quien los pide es el dueño de la
          solicitud o alguien que participa en su revisión.
        </p>
        <p>
          En esta versión del prototipo <strong>no hay proveedores externos</strong>
          que traten tus datos: todo se opera en la infraestructura del
          proyecto. Si se contratan servicios de alojamiento, analítica o
          soporte, se informará aquí antes de activarlos.
        </p>
      </Apartado>

      <Apartado titulo="Cuánto tiempo los conservamos">
        <p>
          Los datos de tu cuenta y de tus postulaciones se conservan mientras
          tu solicitud esté vigente y mientras el proceso de becas pueda
          requerir justificarla. Vencido ese plazo, <strong>eliminamos tu
          cuenta desde tu perfil</strong>: se borran tus datos personales, tus
          documentos y tus archivos.
        </p>
        <p>
          Lo que se conserva es únicamente la trazabilidad de la decisión, con
          un seudónimo: una vez eliminada la cuenta, no se puede saber a quién
          pertenecía una evaluación, un voto o una resolución. Así se pueden
          justificar becas ya otorgadas sin conservar información personal de
          las personas postulantes.
        </p>
      </Apartado>

      <Apartado titulo="Tus derechos">
        <p>
          Puedes consultar y corregir tus datos en cualquier momento desde{' '}
          <strong>Mi perfil</strong>, y puedes eliminarlos por completo con la
          opción <strong>Eliminar mi cuenta</strong> de la misma pantalla.
        </p>
        <p>
          La eliminación requiere confirmar tu contraseña: es una operación
          irreversible y anonimiza lo que, por trazabilidad, debe conservarse.
        </p>
      </Apartado>

      <Apartado titulo="Seguridad">
        <p>
          Las contraseñas se guardan cifradas y nunca se muestran. Las
          sesiones se controlan con un token de acceso de corta duración que se
          renueva automáticamente. Cada acción sensible queda registrada con
          su responsable, su fecha y su resultado.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
