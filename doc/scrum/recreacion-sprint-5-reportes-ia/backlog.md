# Sprint 5 Recreacion - Backlog

## User Stories Asignadas

Estimaciones alineadas al `doc/scrum/product-backlog.md` (S5 del producto real). El equipo sostiene
~40+ pts por sprint (S4 cerro en 44). Total: **44 puntos**.

| ID | Historia | Prioridad | Puntos | Asignado | Hito | Estado |
|----|----------|-----------|--------|----------|------|--------|
| US-34 | Como admin, quiero reportes de resumen (solicitudes por estado, convocatorias, evaluaciones) para tener visibilidad | Should | 5 | Jose | M1 | Completo |
| US-35 | Como admin, quiero exportar los reportes a CSV para analizarlos en Excel | Should | 3 | Jose | M1 | Completo |
| US-36 | Como dev, quiero un registro de auditoria de acciones sensibles para tener trazabilidad | Must | 3 | Marcos | M2 | Completo |
| US-37 | Como visitante, quiero preguntar al asistente IA y recibir respuestas acotadas sin cuenta | Should | 5 | Hamilton | M3 | Completo |
| US-38 | Como dev, quiero un `AsistenteIAProxy` que resuelva contexto por sesion/rol y degrade a fallback | Should | 5 | Hamilton | M4 | Completo |
| US-39 | Como dev, quiero una base de conocimiento indexada con `tsvector` para que el asistente busque respuestas | Should | 3 | Hamilton | M3 | Completo |
| US-54 | Como admin, quiero un panel de administracion de convocatorias desde el frontend | Should | 5 | Yemerson | M5 | Completo |
| US-55 | Como admin, quiero un panel de seguridad (roles, permisos, excepciones) desde el frontend | Should | 5 | Yemerson | M5 | Completo |
| US-56 | Como usuario, quiero un widget de chat con el asistente IA (adelantada de S6) | Could | 3 | Hamilton | M5 | Completo |
| (Soporte) | Registro de `ReportesModule` y `AsistenteModule` en `app.module.ts` (PR2, tras Jose y Hamilton) y permiso `auditoria:ver` en el seed (PR1) | Must | 2 | David | M1-M4 | Completo |
| (Soporte) | `@@index([activo])`, migracion `tsvector` + indice GIN, seed de la base de conocimiento (33 entradas) y `.gitattributes` | Must | 2 | David (PR1) + Hamilton (revision del contenido) | M3 | Completo |
| (Soporte) | Parche del `TransformInterceptor` para que la respuesta CSV salga cruda | Must | 1 | Jose | M1 | Completo |
| (Soporte) | Montaje del `ChatWidget` en el layout y `app/page.tsx` | Should | 2 | Yemerson | M5 | Completo |

**Total de puntos:** 44
**Completados:** 44 / 44

> ⚠️ La columna `Estado` y el contador de arriba reflejan el **alcance acordado y planificado**, no la
> entrega en `equipo/develop`. A la fecha de la auditoria nada de S5 esta mergeado: el unico bloque que
> existia era `apps/api/src/audit/`, que ya venia completo. Ver "Rectificaciones" en Notas.

## Desglose por hitos

- **M1 (US-34, US-35 + soporte de Jose y de David):** modulo `reportes` con
  `GET /reportes/solicitudes-por-estado`, `GET /reportes/convocatorias`, `GET /reportes/evaluaciones` y
  `GET /reportes/:tipo/csv` (stream con BOM). Permiso `reporte:ver`, solo ADMIN. Aqui cae el parche del
  `TransformInterceptor` (`headersSent`).
- **M2 (US-36):** modulo `audit` con `AuditService.log()` y `GET /audit` paginado con filtros
  (`entidad`, `accion`, `usuarioId`, `desde`, `hasta`, `page`, `limit`), permiso `auditoria:ver`. En S5
  ademas se instrumenta `auth/` (acciones `login` y `refresh`) para que el filtro por accion tenga
  contenido; la instrumentacion dirigida del resto de modulos de dominio queda para S6.
- **M3 (US-39, US-37):** migracion con columna generada `tsvector` + indice GIN, seed de 33 entradas,
  `AsistenteIAProxy` + `FallbackProveedor` y `POST /asistente/preguntar` publico que persiste
  conversacion y mensajes.
- **M4 (US-38):** `OpenAIProveedor` opcional con `AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL` / `AI_TIMEOUT_MS`,
  degradacion a fallback y contexto por rol. La key nunca viaja al cliente.
- **M5 (US-54, US-55, US-56):** panel admin con workbench por rol, header de acciones, 4 paneles
  (solicitudes, comites, sesiones, usuarios) y `lib/rol.ts` + `lib/seguridad.ts`; mas el widget de chat en
  el layout web.

## Tecnicas

- [x] Prisma `groupBy` y agregados para los reportes; CSV por streaming con BOM UTF-8.
- [x] `AuditModule` global (`@Global()`) para poder inyectar `AuditService` desde cualquier modulo.
- [x] Indice `tsvector` solo con operadores inmutables (`titulo || contenido`); los `tags` no se indexan
      porque el cast `text[] -> text` no es inmutable en PostgreSQL 16.
- [x] Patrón de proveedor: el fallback por reglas/KB es el proveedor por defecto y el que cubre el smoke,
      sin depender de credenciales en repo ni en CI.
- [x] `headersSent` en el `TransformInterceptor` global para no envolver en JSON las respuestas de archivo.
- [x] Workbench por rol en el frontend: `lib/rol.ts` resuelve la vista segun el rol del token.

## Notas

- La US-56 se adelanta desde S6 a proposito, para que el demo del 02 oct muestre el asistente con cara.
  Su fix obligatorio (el widget usa `http()` en vez de `httpData()`) va documentado en el
  `README-COLABORADORES-S5.md`.
- El panel admin de `1436e41` **re-entrega** `app/admin/page.tsx` y `PanelSolicitudes` / `PanelComites` /
  `PanelSesiones` que Hamilton ya habia dejado en S4: es un upgrade declarado, no una colision (ver §2 del
  `README-COLABORADORES-S5.md`).
- No se copia nada de las etapas posteriores del producto real: nada de `mis-evaluaciones`, `embudo` ni
  `comparativa`, ni de la bitacora por rol de S8.
- Cierre de S5: los tres modulos quedan registrados en `app.module.ts` y el smoke de CI los cubre.

## Rectificaciones (post-auditoria)

Aplicadas el 2026-10-01. Evidencia: [`AUDITORIA-S5.md`](AUDITORIA-S5.md). Guia de ejecucion:
[`README-EJECUCION-S5.md`](README-EJECUCION-S5.md).

| Fila | Plan original | Realidad en `equipo/develop` | Correccion |
|---|---|---|---|
| US-36 (Marcos) | Entregar el modulo `audit/` (3 pts) | **Ya existia completo e identico**: el PR sale vacio | El alcance pasa a **instrumentar `auth/`** (`login` + `refresh`). Commit C1. Sin esto, `GET /audit?accion=login` no encuentra nada |
| Soporte PR1 (David) | "permiso `auditoria:ver` + migracion + seed de 33 entradas" | **No mergeado**: vive en `equipo/feature/s5-datos` (`035b4f4`, PR #22) | Se convierte en la **Fase 0** previa a todo lo demas. Sin el, `GET /audit` da 403 y el asistente no tiene KB |
| Soporte PR2 (David) | Registrar modulos + smoke de CI | Ni `app.module.ts` ni `.github/scripts/smoke-ci.sh` ni el step de smoke existen | Se reparte en C6 (modulos) y C8 (smoke autocontenido). El smoke se **reescribe**: el de EDUVIAGT depende de `link-doc.cjs` y de flujos de S3/S4 ausentes |
| US-35 (Jose) | CSV con BOM, sin envoltura `{data}` | Requiere el parche `headersSent` del interceptor global | Sigue vigente: es el commit C3 (11 inserciones, 2 eliminaciones) |
| US-56 (Hamilton) | Widget montado en el layout | El widget de `2e52a69` usa `http()`: la burbuja sale **vacia** por el `TransformInterceptor` | El fix a `httpData()` pasa a ser **obligatorio** y va en el mismo commit (C5) |
| US-54/55 (Yemerson) | Panel admin + `layout.tsx` | `layout.tsx` de `1436e41` es el del **diseno de S8** | Se edita a mano: solo `import` + `<ChatWidget />` junto al `Footer` (C7) |
| US-39 (Hamilton) | KB con `tsvector` | El `Gin` funcional requiere la migracion del PR #22 | Depende de la Fase 0. `@@index([activo])` duplica a proposito el indice de la migracion (verifica con `\di asistente_base_conocimiento*`) |

Ademas:

- Los 3 upgrades declarados de `app/admin/page.tsx` y `Panel{Solicitudes,Comites,Sesiones}.tsx` se
  mantienen: son de S4 (`3cb58e9`) y se re-entregan con la version de `1436e41`.
- La asercion `accion == "transicion"` **sale del smoke de S5**: depende de instrumentar
  `solicitudes/`, que es S6. El smoke verifica `?accion=login >= 2`, que el filtro devuelva solo `login`,
  y que el alta de un rol quede auditada con `?accion=crear >= 1`.
- La secuencia real son 8 commits (C1–C8) sobre `feature/s5-completo`, no 5 ramas en paralelo.
