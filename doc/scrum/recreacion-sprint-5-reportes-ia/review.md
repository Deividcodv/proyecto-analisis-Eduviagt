# Sprint 5 Recreacion - Review

## Resumen del Sprint

**Fecha de review:** 2026-10-02
**Participantes:** David (SM/PO), Jose (Developer), Marcos (Developer), Hamilton (Developer), Yemerson (Developer)

## Lo que se completo

- [x] US-34 - Agregados de solicitudes por estado, convocatorias y evaluaciones (solo ADMIN, permiso `reporte:ver`)
- [x] US-35 - Exportacion CSV de los 3 reportes con BOM UTF-8 y `Content-Type: text/csv`
- [x] US-36 - Modulo de auditoria con `AuditService.log()` y `GET /audit` paginado y filtrable
- [x] US-37 - `POST /asistente/preguntar` publico que responde desde la base de conocimiento
- [x] US-38 - `AsistenteIAProxy` con `OpenAIProveedor` opcional y degradacion a fallback
- [x] US-39 - Base de conocimiento con columna `tsvector` + indice GIN y 33 entradas de seed
- [x] US-54 - Panel de administracion con workbench por rol y paneles de solicitudes/comites/sesiones
- [x] US-55 - Panel de seguridad con matriz de roles, permisos y excepciones
- [x] US-56 - Widget de chat del asistente montado en el layout web (historia adelantada de S6)
- [x] Infraestructura compartida: `app.module.ts` (PR2), seed, `@@index([activo])`, migracion, `.gitattributes` y smoke de CI

## Lo que NO se completo

- [x] Nada del alcance del sprint. Qedan 4 deudas documentadas a conciencia para S6 (ver `goal.md`):
      instrumentacion dirigida de auditoria, backend `/seguridad/usuarios` + `PATCH /auth/perfil`,
      `app/page.tsx` y el contexto por rol del asistente.
- [x] Correccion posterior: `InternalPageHeader` y los tokens Tailwind brutalistas se anotaron como
      deuda, pero al verificar contra `develop` de `proyecto-analisis-Eduviagt` el componente ya
      existia y los tokens son de S8. No son deuda de este sprint.

## Demo

**Funcionalidades demostradas (demo 02 oct, 5 sprints simulados):**
1. Reportes: los 3 agregados con el admin autenticado; un 403 con un postulante por falta de `reporte:ver`.
2. CSV: se descarga y se abre en Excel sin la ventana de "asistente de importacion" (por el BOM).
3. Auditoria: `GET /audit` con filtros y el rastro de un login reciente (`?accion=login`).
4. Asistente: pregunta sin cuenta, respuesta acotada desde la KB y las `fuentes` que la respaldan;
   el mismo resultado con y sin `AI_API_KEY`.
5. Panel admin: workbench por rol y las 4 pestañas; la subtab Usuarios se muestra asumiendo que su
   backend llega en S6.
6. Widget de chat flotando en el portal, respondiendo con el fix de desempaquetado.

**Feedback del Product Owner (David):**
- El sprint cumple: por primera vez el admin tiene visibilidad (reportes), trazabilidad (auditoria) y
  control (panel). La US-56 adelantada fue un acierto para el demo, pero dejo una dependencia de `layout.tsx`
  que hay que vigilar.
- Se acepta con nombre propio que la subtab Usuarios no tiene backend: es deuda de S6, no fallo de S5.
  (El panel se ve sin los tokens brutalistas porque los tokens son de S8, no porque falten aqui.)

## Metricas

| Metrica | Valor |
|---------|-------|
| Puntos planificados | 44 |
| Puntos completados | 44 |
| Velocidad | 44 |
| Historias completadas | 9/9 (+ 4 de soporte) |
| Modulos nuevos de API | 3 (`reportes`, `audit`, `asistente`) |
| Specs nuevas | 4 (reportes, audit, asistente service, asistente proxy) |
| Commits fuente usados | 4 (`ab66393`, `1436e41`, `2e52a69` + hijos `00c1d21`, `16f724d`, `0a05250`, `dab4fcd`) |

## Decisiones tomadas

1. **US-36 se entrega como modulo, no como instrumentacion.** Marcos entrega `apps/api/src/audit/` y
   punto. La instrumentacion dirigida de los 8 modulos de dominio que hizo el producto real en `16f724d`
   se planifica en S6, para no romper la regla de un modulo = un dueño.
2. **Yemerson re-entrega los 4 paneles que Hamilton dejo en S4** (`app/admin/page.tsx`, `PanelSolicitudes`,
   `PanelComites`, `PanelSesiones`) como upgrade declarado a la version brutalista de `1436e41`. Es la unica
   excepcion al protocolo anti-interferencia del sprint y queda escrita en los dos README de miembro.
3. **El widget de chat se queda en S5** (US-56 adelantada) con el fix obligatorio `http()` -> `httpData()`:
   sin el, el `TransformInterceptor` global devuelve `{ data }` y la burbuja sale vacia.
4. **La US-38 se acepta con `rol: null`.** El controller no pasa `@CurrentUser()`, asi que el proxy resuelve
   contexto de visitante. Se documenta como deuda en vez de ampliar el alcance del sprint.
5. Verificacion de fidelidad contra `ab66393^1` (no contra `ab66393`, que es un merge de 3 padres y
   `git diff` contra un merge no devuelve nada), `1436e41` y `2e52a69`.

## Acciones para el siguiente sprint

1. Planificar S6 (05-16 oct) arrancando por las deudas de este sprint: integracion dirigida de auditoria,
   backend de `/seguridad/usuarios` con su migracion y `PATCH /auth/perfil`, y `app/page.tsx` con `HomeShell`.
2. Los tokens brutalistas de `tailwind.config.js` + `globals.css` son de S8 (`1436e41`): asignar dueno
   cuando se aborde el redisenio, no en S6.
3. Cerrar el bug del contexto por rol del asistente pasando `@CurrentUser()` al proxy.
4. Al tener credenciales de IA, activar `OpenAIProveedor` en staging y validar la acotacion de respuestas.
5. Verificar en el arranque de S6 que el fix `httpData()` del widget no se revierta al tocar `lib/api.ts`.
