# Sprint 5 Recreacion - Retrospectiva

## Datos del Sprint

**Fecha:** 2026-10-02
**Participantes:** Jose (Developer), Marcos (Developer), Hamilton (Developer), Yemerson (Developer), David (Scrum Master / Reviewer)
**Sprint:** 5 - Reportes, Auditoria, Asistente IA y Paneles (44 pts)

## Que salio bien?

1. Tres modulos de API nuevos (reportes, audit, asistente) entregados con sus specs y registrados en
   `app.module.ts` sin romper los modulos de S4.
2. El asistente quedo **utilizable sin credenciales**: el fallback por reglas/KB es el proveedor por
   defecto, asi que el smoke de CI cubre US-37 y US-39 sin ningun secreto.
3. El CSV con BOM abrio en Excel sin la ventana de importacion, que era el detalle que mas suele fallar
   en estos sprints.
4. La bitacora de auditoria quedo con spec propia y el `GET /audit` con filtros se pudo demostrar con el
   rastro real de los logins del demo.
5. La verificacion por modulo con `git diff` VACIO contra el commit fuente se hizo temprano: el PR de
   Yemerson (12 archivos, dos de ellos con contenido de S4) se apruebo a la primera.

## Que salio mal?

1. El CSV se descargaba como `{"data":"\ufeffid;estado;..."}`: el `TransformInterceptor` global envolvia
   en JSON las respuestas de archivo. Solo se noto cuando Jose trato de abrirlo en Excel. El fix
   (`headersSent` en el interceptor) toca un archivo compartido de S1 y hubo que coordinarlo con Marcos.
2. El panel admin lo dejaron **dos personas en dos sprints**: Hamilton lo dejo funcional en S4 y Yemerson
   lo re-entrega en S5 como upgrade brutalista. Funciono porque se documento como excepcion, pero la
   propiedad de esos 4 archivos quedo difusa durante dos sprints.
3. El widget de chat se adelante a S5 sin revisar: uso `http()` en vez de `httpData()`, asi que con el
   interceptor global la respuesta llegaba como `{ data }` y la burbuja salia vacia. Se detectó en la
   prueba del dia 3, no en el review.
4. `components/ui/InternalPageHeader.tsx` lo importa el panel admin y **ningun espejo de S1-S4 lo entrega**
   (aparece recien en el espejo de S6). El build de la web se caia y no habia dueño asignado.
5. Los tokens brutalistas de `tailwind.config.js` y `globals.css` tampoco los entrega nadie: el panel
   compilaba pero se veia sin estilos. Se detecto tarde, el dia 3, y quedo como deuda.
6. `prisma migrate dev` tiro EPERM dos veces por tener la API corriendo en el puerto 3000.

### Correccion posterior a la simulacion

Al ejecutar de verdad las PRs contra `develop` de `proyecto-analisis-Eduviagt`, los puntos 4 y 5
resultaron falsos:

- `components/ui/InternalPageHeader.tsx` **ya existe** en ese repo. No habia hueco que rellenar.
- `apps/api/src/audit/` **ya venia completo**, asi que Marcos no tiene PR que entregar en S5.
- `.env.example` ya traia las variables `AI_*`.
- Los tokens brutalistas de `tailwind.config.js` y `globals.css` **no son de S5**: vienen de
  `1436e41`, que es el sprint 8, y `ab66393` no toca esos dos archivos. El "sin estilos" era en
  realidad una confusion de sprint, no una deuda.

La leccion real de esto no es sobre `InternalPageHeader`: es que la simulacion se hizo contra un
repo cuyo estado de `develop` es distinto al del repo donde ibamos a entregar. Antes de dar por
hecha una deuda hay que verificar el archivo contra la rama destino.

## Que podemos mejorar?

1. Publicar en el planning una tabla de **archivos compartidos y su dueño** por sprint, empezando por
   `app.module.ts`, el seed, `schema.prisma`, `.env.example`, `layout.tsx`, `app/page.tsx` y
   `tailwind.config.js`.
2. Verificar en el planning que todo archivo importado por un PR exista en `develop` **antes** de
   entregar: un `grep` de imports contra los espejos de S1-S4 lo detecta en 2 minutos.
3. Prohibir adelantar historias entre sprints en el mismo commit fuente sin su fix: la US-56 vino de
   `2e52a69` con el bug de desempaquetado.
4. Dejar el parche del `TransformInterceptor` (o cualquier archivo compartido) con un responsable unico y
   no "el que toque el archivo".

## Acciones de mejora

| Accion | Responsable | Fecha limite |
|--------|-------------|--------------|
| Tabla de archivos compartidos y su dueño en el planning de cada sprint | David | Sprint 6 |
| Chequeo de imports contra los espejos de sprints previos antes de abrir el PR | David | Hecho |
| Verificar contra la rama destino que un archivo "deuda" exista de verdad antes de anotarlo | David | Sprint 6 |
| Asignar dueño de `tailwind.config.js` y `globals.css` cuando se aborde S8 | David + Yemerson | Sprint 8 |
| Planificar la integracion dirigida de `AuditService` en los modulos de dominio | Marcos | Sprint 6 |
| Entregar el backend de `/seguridad/usuarios` + `PATCH /auth/perfil` + migracion de perfil | Yemerson | Sprint 6 |
| Pasar `@CurrentUser()` al proxy del asistente para cerrar el contexto por rol de US-38 | Hamilton | Sprint 6 |
| Documentar en el `.env.example` que la `AI_API_KEY` es opcional y el fallback es el default | David | Hecho en S5 |

## Felicitaciones / Reconocimientos

- A Jose por el detalle del BOM y por reportar el problema del envuelto del CSV en vez de parchearlo a
  ciegas.
- A Hamilton por una base de conocimiento que funciona sin credenciales: eso salva el CI de todos los
  sprints que vengan.
- A Yemerson por documentar la excepcion de los 4 paneles en vez de imponer un overwrite silencioso.
- A Marcos por respetar el alcance de su modulo y dejar la integracion dirigida como deuda escrita.

## Notas adicionales

- La simulacion continua en S6 (05-16 oct) con el sistema interno completo, constancia PDF y estabilizacion
  hasta el estado final `a720298` (CI #40).
- El unico cambio de codigo que el producto real hizo y aqui queda para S6 es la instrumentacion dirigida
  de auditoria de `16f724d` (26 archivos, 8 modulos de dominio).
