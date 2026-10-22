import type { Metadata } from 'next';
import { Apartado, PaginaLegal } from '@/components/legal/PaginaLegal';

export const metadata: Metadata = {
  title: 'Términos y condiciones | EDUVIAGT',
  description:
    'Condiciones de uso del portal EDUVIAGT: quién puede usarlo, qué se compromete al postular y cómo funciona el proceso de evaluación.',
};

export default function TerminosPage() {
  return (
    <PaginaLegal
      etiqueta="Términos"
      titulo="Términos y condiciones"
      descripcion="Las reglas del juego: quién puede usar el portal, qué se compromete al postular y cómo se decide cada beca."
      actualizado="Octubre de 2026"
    >
      <Apartado titulo="Naturaleza del servicio">
        <p>
          EDUVIAGT es un <strong>prototipo académico</strong> que simula el
          proceso de gestión de becas. Su
          objetivo es demostrar el funcionamiento del ciclo completo:
          postulación, evaluación por comité, decisión y trazabilidad.
        </p>
        <p>
          Mientras no exista autorización institucional, las postulaciones
          realizadas en esta plataforma <strong>no producen una beca real</strong>
          ni generan compromiso de pago alguno. Los resultados son
          simulaciones a partir de los datos de demostración.
        </p>
      </Apartado>

      <Apartado titulo="Quién puede usarlo">
        <ul className="list-disc space-y-2 pl-5 marker:text-brutal-gold">
          <li>
            <strong>Postulantes:</strong> cualquier persona con CUI válido que
            se registre y acepte estos términos.
          </li>
          <li>
            <strong>Personal:</strong> evaluadores, coordinadores, miembros de
            comité, jefes de becas y administradores, con las
            responsabilidades que les asigna su rol.
          </li>
        </ul>
        <p>
          Cada persona tiene una sola cuenta y es responsable de la
          información que carga en ella.
        </p>
      </Apartado>

      <Apartado titulo="Tus compromisos al postular">
        <ul className="list-disc space-y-2 pl-5 marker:text-brutal-gold">
          <li>Declarar la verdad en los datos que cargas.</li>
          <li>Adjuntar solo documentos que te pertenezcan y que estén vigentes.</li>
          <li>No suplantar a otra persona ni enviar información en su nombre.</li>
          <li>Atender los requerimientos de corrección que te indique el comité.</li>
        </ul>
        <p>
          Presentar información falsa o documentos ajenos puede acarrear la價 acarrear la
          anulación de la postulación y, en su caso, las medidas que
          correspondan según la normativa vigente.
        </p>
      </Apartado>

      <Apartado titulo="Cómo funcionan las convocatorias">
        <ol className="list-decimal space-y-2 pl-5 marker:font-brut marker:font-black marker:text-brutal-gold">
          <li>
            Cada convocatoria publica sus criterios de evaluación, sus pesos, el
            monto que se otorga y los documentos que exige.
          </li>
          <li>
            Tu postulación se revisa y la evalúan los evaluadores asignados,
            siguiendo los criterios ponderados publicados.
          </li>
          <li>
            El comité delibera en sesión y emite la resolución. Toda
            postulación cuyo monto supere Q10,000 requiere <strong>una
            segunda aprobación firmada por una persona distinta</strong> a la
            que aprobó en primera instancia.
          </li>
          <li>
            La decisión se notifica a tu correo y en tu panel, y queda
            registrada en la bitácora del sistema.
          </li>
        </ol>
        <p>
          Los criterios, los pesos y el monto de cada convocatoria se
          muestran antes de postular y no cambian durante el proceso.
        </p>
      </Apartado>

      <Apartado titulo="Límites de Eduvi, la guía virtual">
        <p>
          Eduvi responde <strong>solo con la base de conocimiento del
          portal</strong>: convocatorias, requisitos, pasos del proceso y
          preguntas frecuentes.
        </p>
        <ul className="list-disc space-y-2 pl-5 marker:text-brutal-gold">
          <li>No es asesoría legal, financiera ni académica.</li>
          <li>
            No conoce el estado de tu solicitud: para eso está la
            consulta de seguimiento.
          </li>
          <li>
            Puede equivocarse: si su respuesta no coincide con lo que
            dice esta plataforma, prevalece lo que dice la convocatoria
            oficial.
          </li>
        </ul>
      </Apartado>

      <Apartado titulo="Cambios en estos términos">
        <p>
          Pueden ajustarse cuando cambie el funcionamiento del sistema. La
          fecha de última actualización aparece al inicio de esta página y, en
          caso de un cambio sustancial, se informará en el portal.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
