# AUDITORÍA — Instrucciones del Sprint 5

> Alcance: verificar que los comandos de `README-COLABORADORES-S5.md` son ejecutables y que cada
> collaborator puede producir su PR. Ejecutado contra `equipo/develop` (`proyecto-analisis-Eduviagt`).
> Para ejecutar el sprint: [`README-EJECUCION-S5.md`](README-EJECUCION-S5.md).

---

## §0 Resumen ejecutivo

La guía se validó contra el **estado del producto terminado** (`origin/develop` = `EDUVIAGT-prod`, Sprint 9)
pero se ejecuta contra el `develop` del repo de trabajo, que está **77 commits atrás** (S1–S4):

```
equipo/develop...develop
77	77
```

Todo lo que la guía afirma como "ya existe", "ya va mergeado" o "es deuda" hay que reverificarlo en
`equipo/develop`. Ocho instrucciones no son ejecutables tal cual; dos de ellas rompen el producto.

| Ref | Destino | Fuente |
|---|---|---|
| `equipo/develop` = `c8ef725` | `proyecto-analisis-Eduviagt` (S1–S4 + #21) | **Aquí se trabaja** |
| `origin/develop` = `b62070b` | EDUVIAGT / producto real (Sprint 9) | Solo referencia |

---

## §1 Matriz de estado real

Comparación blob a blob entre los espejos de `recreacion/sprint-5/` y `equipo/develop`:

```powershell
$dest = 'equipo/develop'
git rev-parse --verify --quiet "$dest`:apps/api/src/reportes/reportes.service.ts"
```

| Persona | Ruta | Idénticos | Diferentes | Ausentes | Resultado del `git checkout` |
|---|---|---|---|---|---|
| Marcos | `apps/api/src/audit/` | 4 | 0 | 0 | **PR vacío** |
| José | `apps/api/src/reportes/` | 0 | 0 | 4 | 4 archivos nuevos |
| José | `common/interceptors/transform.interceptor.ts` | — | — | falta `headersSent` | Parche de 9 líneas |
| Hamilton | `apps/api/src/asistente/` | 0 | 0 | 10 | 10 archivos nuevos |
| Hamilton | `apps/web/src/components/chat/ChatWidget.tsx` | 0 | 0 | 1 | 1 archivo nuevo |
| Yemerson | `apps/web/src/app/admin/` | 0 | 1 | 0 | Upgrade de `page.tsx` |
| Yemerson | `apps/web/src/app/perfil/` | 0 | 0 | 1 | Nuevo |
| Yemerson | `apps/web/src/components/admin/` | 0 | 3 | 1 | 3 upgrades + `PanelUsuarios` nuevo |
| Yemerson | `apps/web/src/components/home/` | 0 | 1 | 3 | 1 upgrade + 3 nuevos |
| Yemerson | `apps/web/src/lib/rol.ts` | 0 | 0 | 1 | Nuevo |
| Yemerson | `apps/web/src/lib/seguridad.ts` | 0 | 0 | 1 | Nuevo |

Infraestructura:

| Elemento | `equipo/develop` | Acción |
|---|---|---|
| `.gitattributes` | **ausente** | PR #22 |
| `migrations/20260829061028_asistente_tsvector/` | **ausente** | PR #22 |
| `@@index([activo])` en el schema | **ausente** | PR #22 |
| Permiso `auditoria:ver` en el seed | **ausente** | PR #22 |
| 33 entradas de la KB en el seed | **ausente** (403 líneas de seed) | PR #22 |
| `ReportesModule` en `app.module.ts` | ausente | C6 |
| `AsistenteModule` en `app.module.ts` | ausente | C6 |
| `AuditModule` en `app.module.ts` | **ya está** | — |
| `.github/scripts/smoke-ci.sh` | **ausente** | C8 |
| Step de smoke en `ci.yml` | **ausente** | C8 |
| `prisma db seed` en CI | ausente | C8 (necesario) |
| Permiso `reporte:ver` en el seed | **ya está** | — |
| `apps/web/src/components/ui/InternalPageHeader.tsx` | **ya está** | — |
| `apps/api/.env.example` con `AI_*` | **ya está** | — |
| `apps/web/src/lib/api.ts` con `httpData` | **ya está** | — |
| Tokens `brutal` en Tailwind | **ausente** (y son de S8) | — |
| Referencias a `brutal-*` en los archivos de S5 | **291**, sin definir | Limitación declarada |

---

## §2 Los 8 hallazgos

### H1 — Dos nombres para el remoto del producto

- §0 (`:16-22`): `git remote add EDUVIAGT-prod …` / `git fetch EDUVIAGT-prod`
- §5 (`:335`): `git fetch equipo`

En el clon del simulador el remoto del producto es `origin` y el del equipo es `equipo`. Quien copie §0
literalmente crea un remoto duplicado o falla.

### H2 — "El seed ya va mergeado" es falso

§2 (`:152`) y §3 (`:220-221`) dicen que el seed ya está. No lo está:

```
$ git cat-file -e equipo/develop:.gitattributes          → no existe
$ git ls-tree --name-only equipo/develop:apps/api/prisma/migrations/
  20260827053511_init
  20260828052309_sesion_agenda
  migration_lock.toml
$ git show equipo/develop:apps/api/prisma/seed.ts | grep auditoria
  (solo un tag de la KB: 'seguridad', 'datos', 'privacidad', 'auditoria')
```

Consecuencia: sin `auditoria:ver`, `AuditController` (`@Permisos('auditoria:ver')`) responde **403 a
todos**, incluido el admin. Hamilton depende de este merge para que su módulo sea demostrable.

### H3 — `layout.tsx` rompe el portal (severidad alta)

§4 (`:265`) y el README de Yemerson (`:42`) mandan copiar el archivo entero:

```bash
git checkout 1436e41 -- apps/web/src/app/layout.tsx
```

Ese archivo es el del rediseño de **S8**: fuentes `Archivo` / `Space_Mono` / `Instrument_Sans` y clase
`brut-body`. El destino no tiene esos tokens:

```
$ git show equipo/develop:apps/web/tailwind.config.js | grep brutal     → 0 coincidencias
$ git show equipo/develop:apps/web/src/styles/globals.css | grep brutal → 0 coincidencias
```

Y en `origin/develop` sí están (`b62070b:apps/web/tailwind.config.js:22`), lo que explica por qué pasó
desapercibido: allí sí funcionaba.

Efecto real de la copia completa: el portal entero cambia de tipografía (las 3 fuentes de Google más
`brut-body` en el `<body>`). Y, por separado, los archivos de panel de S5 hacen 291 referencias a clases
`brutal-*` que tampoco están definidas en el destino, así que el panel compila pero renderiza sin estilos.
Eso último es una limitación declarada de S5, no un defecto de la copia.

La propia guía se contradice: §5 (`:354`) exige "edición quirúrgica, no copiar el archivo" para
`app.module.ts`. La misma regla aplica aquí.

### H4 — Los espejos de referencia están incompletos

`recreacion/sprint-5/jose/repo/` no contiene `transform.interceptor.ts` y
`recreacion/sprint-5/yemerson/repo/` no contiene `app/layout.tsx`, aunque §1 y §4 mandan copiarlos.
Quien use la "Opción A" de `docs/05-versiones-asignadas-por-persona.md:96` no los tiene.

### H5 — El smoke de auditoría no puede pasar

`smoke-ci.sh:240-255` exige:

```bash
AUDIT_LOGINS=$(… "$BASE/audit?accion=login" … | jq -r '.data.items | length')
[ "$AUDIT_LOGINS" -ge 5 ] || … exit 1
AUDIT_ACCIONES=$(… | jq -r '[.data.items[].accion] | index("transicion") != null')
[ "$AUDIT_ACCIONES" = "true" ] || … exit 1
```

En el destino, lo único que escribe en la bitácora es `users.service.ts`:

```
$ git grep -n "AuditService" equipo/develop -- apps/api/src
equipo/develop:apps/api/src/users/users.service.ts:7:  import { AuditService } …
equipo/develop:apps/api/src/users/users.service.ts:17: private audit: AuditService,

$ git grep -n "accion: '" equipo/develop -- apps/api/src/apps 2>/dev/null
equipo/develop:apps/api/src/users/users.service.ts:65:  accion: 'crear',
equipo/develop:apps/api/src/users/users.service.ts:94:  accion: 'editar',
equipo/develop:apps/api/src/users/users.service.ts:120: accion: 'eliminar',
equipo/develop:apps/api/src/users/users.service.ts:150: accion: 'asignar-permisos',
```

Ni un `login`, ni una `transicion`. Y el CI del destino **no corre `db seed`**, así que tampoco hay
entradas sembradas: `total` sería 0.

### H6 — El guion de demo de §6 es inválido

`:413-415` prueba `?accion=login`, que devolverá 0 filas por lo mismo que H5.

### H7 — La instrucción de PR1 no es re-ejecutable

§5 (`:329`) dice "PR #22, ya abierta", y `:336` da:

```bash
git worktree add -b feature/s5-datos ../equipo-s5 equipo/develop
```

La rama ya existe en el remoto (`equipo/feature/s5-datos`, commit `035b4f4`): el comando falla.

### H8 — La verificación de fidelidad no detecta colisiones

§7.B (`:469-478`) prescribe cuatro `git diff` contra el commit fuente. Eso verifica que la **copia** fue
fiel, pero no si la ruta de destino ya traía algo. Falta una comprobación previa contra `equipo/develop`
por ruta.

Por eso el PR vacío de Marcos pasó la verificación sin que nadie lo notara:
`git diff ab66393^1 ab66393 -- apps/api/src/audit` sale vacío porque el commit fuente no cambió ese
módulo, no porque el destino lo tenga.

Falta una comprobación previa contra `equipo/develop` por ruta.

---

## §3 Reasignación

El Sprint 5 lo ejecuta **una sola persona (Marcos)**; los demás colaboradores no participan por PTO.

| Persona | Módulo | Qué queda de eso |
|---|---|---|
| Marcos | `apps/api/src/audit/` | Ya estaba en el destino → **C1**: instrumentar `auth/` |
| José | `reportes/` + interceptor | **C2, C3** |
| Hamilton | `asistente/` + `ChatWidget` | **C4, C5** |
| Yemerson | Panel admin + `layout.tsx` | **C7** |
| David | Datos + integración + CI | **Fase 0, C6, C8** |

La división PR1/PR2 se conserva, pero por **dependencia**, no por paralelismo: PR1 (datos) debe aterrizar
antes que el resto porque el asistente lee de la KB sembrada y `GET /audit` exige el permiso. Ver la
tabla de commits en `README-EJECUCION-S5.md` §3.

### C1: por qué instrumentar `auth/`

Es lo que hace falta para que US-36 sea cierto. Su criterio de aceptación dice que
`GET /audit?accion=login` debe encontrar accesos (`goal.md:33-34`), y nada en el destino produce un
`login`. `auth/` es módulo de Marcos desde S1, así que no se rompe la regla de "un módulo = un dueño", y
`AuditModule` es `@Global()`, así que no hay que tocar `auth.module.ts`.

Contratos verificados en el destino:

- `AuditService.log({ usuarioId, accion, entidad, entidadId?, detalle?, ip? })`
- `AuditModule` es `@Global()` y exporta `AuditService` → inyectable en `auth/` sin tocar su módulo
- `auth.controller.ts` ya usa `@Req`-compatible (`@CurrentUser`, `@Public`, `JwtAuthGuard` disponibles)
- `JWT_REFRESH_SECRET` ya tiene fallback (`auth.service.ts:110`), no hace falta definirlo para el login

---

## §4 Lo que S5 deja explícitamente para S6

1. Instrumentación dirigida del resto de módulos (`convocatorias`, `solicitudes`, `evaluaciones`,
   `comites`, `sesiones`, `users`) — en el producto real fue el commit `16f724d`.
2. Backend de `/seguridad/usuarios` (`POST/GET/PATCH/DELETE`) y `PATCH /auth/perfil`, más la migración
   `20260902024700_usuario_datos_perfil`.
3. `app/page.tsx` que activa `HomeShell`.
4. `@CurrentUser()` en `AsistenteController`, para cerrar el contexto por rol de US-38.
5. La aserción `accion == "transicion"` del smoke.

---

## §5 Correcciones incorporadas

| Hallazgo | Corrección en `README-EJECUCION-S5.md` |
|---|---|
| H1 | §0.1 documenta los dos remotos y cómo obtener el del producto |
| H2 | §1.1 verifica qué falta; Fase 0 exige el merge antes de C4 |
| H3 | §10.3 da el diff exacto de 2 líneas y prohíbe copiar el archivo |
| H4 | §5 y §10 dan el `git checkout` del commit fuente, que sí trae los archivos |
| H5 | §11.1 usa `?accion=login >= 2` + `all(. == "login")` + `?accion=crear`, generado por `POST /seguridad/roles` |
| H6 | §14.4 consulta `?accion=login` y `?accion=crear`, que sí devuelven filas |
| H7 | Fase 0 da `gh pr merge` y la verificación del merge |
| H8 | §1.2 y §1.3 obligan a verificar el destino antes de crear la rama |

---

## §6 Comandos de referencia

```bash
# Estado de una ruta en el destino (sin falso positivo)
git ls-tree -r --name-only equipo/develop -- apps/api/src/reportes   # vacío = no existe

# Un archivo del destino
git show equipo/develop:apps/api/src/app.module.ts

# ¿Existe una ruta en un commit?
git cat-file -e equipo/develop:.gitattributes && echo existe || echo no

# Fidelidad de una copia (OJO: contra ^1, ab66393 es merge de 3 padres)
git diff ab66393^1 ab66393 -- apps/api/src/reportes     # debe salir VACÍO

# Diferencia real entre lo copiado y lo que hay en el destino
git diff equipo/develop -- apps/api/src/audit           # vacío = ya estaba
```