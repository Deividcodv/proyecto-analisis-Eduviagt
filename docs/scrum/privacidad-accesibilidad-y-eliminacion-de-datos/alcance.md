# Privacidad, accesibilidad y eliminación de datos

**Alcance:** cierre de la exposición de documentos, páginas legales y
reencuadre como prototipo, accesibilidad WCAG 2.2 AA y eliminación de cuenta
con anonimización.

**Estado:** Completado

## Decisiones

| Decisión | Motivo |
|---|---|
| Los documentos ya no se sirven con `express.static` | Se exponían sin autenticación: cualquier persona que adivinara la ruta descargaba certificados y constancias de identidad de los postulantes. Ahora se entregan por un endpoint que comprueba que quien pide es el dueño o alguien que participa en la revisión. |
| Sin banner de consentimiento | El inventario real muestra que solo se usa `localStorage` para los tokens de sesión: no hay cookies, analítica ni rastreadores opcionales. Pedir consentimiento para rechazar algo que no existe sería engañoso. |
| Prototipo académico, sin autorización institucional | El pie de página, las páginas y el PDF de la constancia atribuían la plataforma al Ministerio de Educación. Se corrigen para que no haya afirmaciones institucionales sin respaldo. |
| Eliminar cuenta = anonimizar, no borrar | Las solicitudes, evaluaciones, votos, decisiones y auditoría deben poder justificar una beca ya otorgada. Se borran los datos personales y los documentos, y lo demás se conserva con un seudónimo. |

## Alcance de la eliminación

**Se borra**

- Nombre, correo, CUI, teléfono, fecha de nacimiento y dirección.
- Género, departamento y municipio.
- Perfiles académico y financiero de las solicitudes.
- Documentos adjuntos (filas y archivos).
- Permisos y preferencias de notificación.

**Se conserva, con seudónimo**

- Las solicitudes y el estado en que quedaron.
- Las evaluaciones, los votos y las decisiones de los comités.
- El historial de cambios de cada solicitud.
- La bitácora de auditoría, con la acción y su resultado; los datos personales
  que quedaban en su detalle se sanean.

## Accesibilidad (WCAG 2.2 AA)

- Anillo de foco visible y coherente en todo el portal, definido de una vez
  en `globals.css` y no control por control.
- Enlace «Saltar al contenido principal» como primer elemento enfocable.
- El menú lateral atrapa el foco mientras está abierto y lo devuelve al botón
  que lo abrió al cerrarse.
- Los chats de Eduvi anuncian los mensajes nuevos, el error y el estado de
  carga, y su campo de pregunta tiene nombre accesible.
- El botón flotante del chat comunica su estado (`aria-expanded` y nombre
  accesible que alterna entre abrir y cerrar).
- El logotipo deja de llevar un `alt` que repetía el texto contiguo.

## Verificación

- TypeScript sin errores en API y web.
- Pruebas unitarias del API, incluidas las de descarga de documentos y
  eliminación de cuenta.
- Playwright: auditoría con axe de todas las páginas (públicas, internas y las
  tres legales), recorrido con teclado y flujo completo de la segunda
  aprobación por monto.
