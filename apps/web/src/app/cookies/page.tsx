import type { Metadata } from 'next';
import { Apartado, PaginaLegal } from '@/components/legal/PaginaLegal';

export const metadata: Metadata = {
  title: 'Cookies | EDUVIAGT',
  description:
    'Qué almacenamiento usa EDUVIAGT en tu navegador y por qué. EDUVIAGT no utiliza cookies ni tecnologías de seguimiento opcionales.',
};

export default function CookiesPage() {
  return (
    <PaginaLegal
      etiqueta="Cookies"
      titulo="Cookies y almacenamiento"
      descripcion="Qué guarda el portal en tu navegador, para qué sirve y por qué no hay banner de consentimiento que aceptar."
      actualizado="Octubre de 2026"
    >
      <Apartado titulo="EDUVIAGT no utiliza cookies">
        <p>
          Este sitio <strong>no instala cookies</strong> ni ningún otro
          rastreador. Tampoco usa herramientas de analítica, publicidad ni
          perfiles de comportamiento.
        </p>
        <p>
          Por eso <strong>no hay un banner de consentimiento</strong>: no
          existe ninguna tecnología opcional que puedas rechazar. Si en el
          futuro se añadiera alguna, se informaría en esta página y se pediría
          tu consentimiento antes de activarla.
        </p>
      </Apartado>

      <Apartado titulo="Qué sí guardamos en tu navegador">
        <p>
          Usamos el <strong>almacenamiento local del navegador</strong>{' '}
          (<code>localStorage</code>), que es una zona de tu propio equipo y no
          se comparte con terceros. Ahí se guardan únicamente dos elementos:
        </p>
        <ul className="list-disc space-y-2 pl-5 marker:text-brutal-gold">
          <li>
            <code>sigeb_access_token</code>: la credencial de sesión de
            corta duración. Se necesita para saber que iniciaste sesión.
          </li>
          <li>
            <code>sigeb_refresh_token</code>: la credencial que permite
            renovar la anterior sin volver a escribir tu contraseña.
          </li>
        </ul>
        <p>
          Ambos son <strong>esenciales</strong>: sin ellos no se puede
          mantener la sesión iniciada. No se usan para identificarte fuera de
          este portal ni se envían a ningún servicio de terceros.
        </p>
      </Apartado>

      <Apartado titulo="Tus preferencias no viven en tu navegador">
        <p>
          La preferencia de <strong>reproducir sonido</strong> y el volumen se
          guardan en el servidor, asociados a tu cuenta, para que tu
          configuración te acompañe desde cualquier equipo. Puedes
          modificarlos o desactivarlos en{' '}
          <strong>Mi perfil</strong>.
        </p>
      </Apartado>

      <Apartado titulo="Cómo borrarlo">
        <p>
          Al cerrar sesión se eliminan ambos tokens del almacenamiento local.
          También puedes borrarlos desde la configuración de tu navegador
          (en Chrome: <em>Configuración → Privacidad y seguridad → Datos de
          sitios</em>).
        </p>
        <p>
          Si el navegador bloquea el almacenamiento local, el portal te
          permitirá ver la información pública, pero no mantener la sesión
          iniciada.
        </p>
      </Apartado>

      <Apartado titulo="Tecnologías de terceros">
        <p>
          En esta versión del prototipo <strong>no se incrusta ningún
          contenido de terceros</strong> que pueda instalar tecnología propia
          propia en tu navegador. Si se incorporan servicios externos (por
          ejemplo, un reproductor de video o un mapa), se documentarán aquí
          con su política y su finalidad.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
