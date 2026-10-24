# README — Colaboradores · Sprint 6

> **Cierre de equivalencia con el producto**
> Referencia: `EDUVIAGT-prod@b62070b` · Repo de trabajo: `proyecto-analisis-Eduviagt`
> **199 archivos** · **8 PRs de código** · **3 responsables**
>
> Documento autocontenido. Cada persona tiene su sección con los comandos exactos.
> Nadie escribe código a mano: todo es `git checkout` literal desde `b62070b`.

---

## Índice

1. [Contexto y reglas generales](#1-contexto-y-reglas-generales)
2. [Orden de PRs, dependencias y revisiones](#2-orden-de-prs-dependencias-y-revisiones)
3. [MARCOS — PR 2 y PR 4](#3-marcos)
4. [HÉCTOR — PR 3, PR 5 y PR 7](#4-héctor)
5. [HAMILTON — PR 1, PR 6 y PR 8](#5-hamilton)
6. [Verificación global](#6-verificación-global)
7. [Excepciones declaradas](#7-excepciones-declaradas)
8. [Lo que NO se debe hacer](#8-lo-que-no-se-debe-hacer)
9. [Problemas frecuentes](#9-problemas-frecuentes)

---

## 1. Contexto y reglas generales

El equipo rehizo el **Sprint 6** en el repositorio `proyecto-analisis-Eduviagt`.
Para cerrarlo, el código debe quedar **idéntico** al del producto `EDUVIAGT-prod` en el
commit **`b62070b`** (rama `develop` del producto en el momento de la medición).

No hay que re-implementar nada: los archivos correctos ya existen en `b62070b`.
El trabajo es **restaurarlos en 8 PRs** y borrar 2 componentes obsoletos.

### 1.1 Remotos

Cada clon debe tener dos remotos: el del equipo y el del producto.

```bash
git remote -v
```

Esperado:

```
equipo      https://github.com/Deividcodv/proyecto-analisis-Eduviagt.git
EDUVIAGT-prod  https://github.com/Deividcodv/EDUVIAGT-prod.git
```

Si faltan:

```bash
git remote add equipo     https://github.com/Deividcodv/proyecto-analisis-Eduviagt.git
git remote add EDUVIAGT-prod https://github.com/Deividcodv/EDUVIAGT-prod.git
```

### 1.2 Traer la referencia

```bash
git fetch equipo
git fetch EDUVIAGT-prod
git cat-file -t b62070b
# debe imprimir exactamente: commit
```

Si `git cat-file -t b62070b` falla, el fetch del producto no se completó: repítelo
antes de continuar.

### 1.3 Preflight de cada PR

Siempre desde `develop` actualizado y en una rama nueva:

```bash
git switch develop
git pull --ff-only equipo develop
git switch -c <rama-del-PR>
```

### 1.4 Reglas de oro

1. **Una rama por PR**, creada desde `develop` actualizado.
2. Restaurar **solo** con `git checkout b62070b -- <rutas>`.
   No editar código a mano (la única excepción es el título del `README.md`).
3. **No mezclar** archivos que pertenecen a otra sección/PR.
4. Cada PR se verifica con `git diff --name-only b62070b -- <rutas del PR>` **vacío**.
5. **No tocar `Docs/`** (es el scrum del equipo).
6. Ningún PR se mergea sin la revisión asignada.

### 1.5 Archivos compartidos y su dueño

Estos archivos son los puntos donde dos PRs podrían pisarse. Respeta el dueño:

| Archivo | Dueño (PR) | Nota |
|---|---|---|
| `README.md` | Hamilton (PR 1) | restaurar y cambiar **solo** el título a `# EDUVIA-gt` |
| `.github/CODEOWNERS` | Hamilton (PR 1) | **no existe en el producto**; el equipo lo crea a mano |
| `.env.example` (raíz) | Hamilton (PR 1) | ejemplo de entorno raíz |
| `apps/api/.env.example` | Marcos (PR 2) | usa `JWT_ACCESS_EXPIRATION` / `JWT_REFRESH_EXPIRATION` |
| `apps/web/tailwind.config.js` | Hamilton (PR 1) | incluye los tokens `brutal` |
| `apps/web/next.config.js` | Hamilton (PR 1) | `output: 'standalone'` + `rewrites` |
| `apps/web/src/app/layout.tsx` | Hamilton (PR 6) | único `.tsx` suelto de `app/` del PR 6 |
| `apps/web/src/app/page.tsx` | Héctor (PR 7) | único `.tsx` suelto de `app/` del PR 7 |
| `apps/web/src/styles/globals.css` | Hamilton (PR 6) | carpeta `styles/` completa |
| `apps/web/src/lib/api.ts`, `lib/api-auth.ts` | Hamilton (PR 6) | |
| `apps/web/src/lib/{acciones,etiquetas,mensajes-error,navegacion,notificaciones-stream,rol}.ts` | Héctor (PR 7) | |
| `apps/api/prisma/schema.prisma`, `prisma/seed.ts` | Marcos (PR 2) | |
| `apps/api/src/app.module.ts`, `main.ts` | Héctor (PR 5) | van solos: registran módulos del PR 3 y del PR 4 |
| `.github/workflows/ci.yml`, `.github/scripts/*` | Hamilton (PR 8) | |

---

## 2. Orden de PRs, dependencias y revisiones

| Orden | PR | Rama | Dueño | Revisor | Archivos |
|---|---|---|---|---|---|
| 1 | PR 1 | `chore/s6-empaquetado` | Hamilton | Marcos | 16 |
| 2 | PR 2 | `feature/s6-seguridad` | Marcos | Héctor | 42 |
| 3 | PR 3 | `feature/s6-negocio` | Héctor | Marcos | 18 |
| 4 | PR 4 | `feature/s6-dominio` | Marcos | Héctor | 19 |
| 5 | PR 5 | `feature/s6-composicion` | Héctor | Marcos | 2 |
| 6 | PR 6 | `feature/s6-web-interna` | Hamilton | Héctor | 53 |
| 7 | PR 7 | `feature/s6-web-portal` | Héctor | Marcos | 46 |
| 8 | PR 8 | `ci/s6-verificacion-deploy` | Hamilton | Héctor | 3 |

**Por qué este orden**

- **PR 1** primero: empaquetado, dependencias (`package-lock.json`), `README.md` y
  configuración base. Es la base de todo.
- **PR 2** antes que PR 3/4: la API de negocio y dominio consume auth, guards,
  `common/constants` y auditoría.
- **PR 3 y PR 4** pueden ir **en paralelo** (Héctor y Marcos respectivamente).
- **PR 5** va **después de PR 3 y PR 4**: `app.module.ts` compone los módulos de
  ambos; por eso no puede mezclarse con ninguno. `main.ts` (bootstrap) importa
  `app.module.ts`.
- **PR 6 y PR 7** pueden ir **en paralelo** (web interna y portal público).
- **PR 8** al final: el workflow y los scripts de smoke recorren flujos que solo
  existen cuando todo lo anterior está mergeado.

**Handles de GitHub**

| Persona | Handle |
|---|---|
| Marcos | `@TitosDoritos18` |
| Héctor | `@hctor2` |
| Hamilton | `@Hamilton313` |

> `.github/CODEOWNERS` solo **solicita** revisores; no impone aprobación.
> No activar protección de rama sin autorización.

---

## 3. MARCOS

Total: **61 archivos** (PR 2 + PR 4).

### PR 2 — `feature/s6-seguridad` (42 archivos)

Seguridad, autenticación, permisos, auditoría, notificaciones, usuarios y el
esquema de base de datos con sus 6 migraciones.

```bash
git switch develop
git pull --ff-only equipo develop
git switch -c feature/s6-seguridad

git checkout b62070b -- \
  apps/api/.env.example \
  apps/api/prisma/schema.prisma \
  apps/api/prisma/seed.ts \
  apps/api/prisma/migrations/20260902024700_usuario_datos_perfil \
  apps/api/prisma/migrations/20260916000000_documento_comentario_rechazo \
  apps/api/prisma/migrations/20260917000000_institucion_educativa \
  apps/api/prisma/migrations/20260917010000_evaluacion_avanzada \
  apps/api/prisma/migrations/20260917020000_notificaciones \
  apps/api/prisma/migrations/20260917052051_convocatoria_formulario \
  apps/api/src/audit \
  apps/api/src/auth \
  apps/api/src/common \
  apps/api/src/notificaciones \
  apps/api/src/users
```

Verifica (debe salir vacío):

```bash
git diff --name-only b62070b -- \
  apps/api/.env.example \
  apps/api/prisma/schema.prisma \
  apps/api/prisma/seed.ts \
  apps/api/prisma/migrations/20260902024700_usuario_datos_perfil \
  apps/api/prisma/migrations/20260916000000_documento_comentario_rechazo \
  apps/api/prisma/migrations/20260917000000_institucion_educativa \
  apps/api/prisma/migrations/20260917010000_evaluacion_avanzada \
  apps/api/prisma/migrations/20260917020000_notificaciones \
  apps/api/prisma/migrations/20260917052051_convocatoria_formulario \
  apps/api/src/audit \
  apps/api/src/auth \
  apps/api/src/common \
  apps/api/src/notificaciones \
  apps/api/src/users
```

Publica:

```bash
git add -A
git commit -m "feat(s6): restaurar seguridad, auth, auditoria y notificaciones desde b62070b"
git push -u equipo feature/s6-seguridad
gh pr create --base develop --head feature/s6-seguridad \
  --title "feat(s6): seguridad, auth, auditoria y notificaciones" \
  --body "Restauracion literal desde b62070b. Alcance: apps/api/prisma (esquema + 6 migraciones), audit, auth, common, notificaciones, users, .env.example. Verificado con git diff vacio." \
  --reviewer hctor2
```

**Incluye:** `apps/api/.env.example`, `apps/api/prisma/{schema.prisma,seed.ts,6 migraciones}`,
`apps/api/src/{audit,auth,common,notificaciones,users}`.
**No incluye:** `app.module.ts` ni `main.ts` (van en PR 5); módulos de negocio/dominio.

> Detalle: `apps/api/.env.example` debe quedar con `JWT_SECRET`,
> `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRATION=15m` y `JWT_REFRESH_EXPIRATION=7d`
> (nombres que ya usa el código). No conservar el `JWT_EXPIRATION` legacy.

### PR 4 — `feature/s6-dominio` (19 archivos)

Catálogos, sesiones, evaluaciones, reportes y asistente.

```bash
git switch develop
git pull --ff-only equipo develop
git switch -c feature/s6-dominio

git checkout b62070b -- \
  apps/api/src/asistente \
  apps/api/src/catalogos \
  apps/api/src/evaluaciones \
  apps/api/src/reportes \
  apps/api/src/sesiones
```

Verifica (debe salir vacío):

```bash
git diff --name-only b62070b -- \
  apps/api/src/asistente \
  apps/api/src/catalogos \
  apps/api/src/evaluaciones \
  apps/api/src/reportes \
  apps/api/src/sesiones
```

Publica:

```bash
git add -A
git commit -m "feat(s6): restaurar dominio (catalogos, sesiones, evaluaciones, reportes, asistente) desde b62070b"
git push -u equipo feature/s6-dominio
gh pr create --base develop --head feature/s6-dominio \
  --title "feat(s6): dominio (catalogos, sesiones, evaluaciones, reportes, asistente)" \
  --body "Restauracion literal desde b62070b. Verificado con git diff vacio." \
  --reviewer hctor2
```

**Incluye:** `apps/api/src/{asistente,catalogos,evaluaciones,reportes,sesiones}`.
**No incluye:** `app.module.ts` (PR 5).

---

## 4. HÉCTOR

Total: **66 archivos** (PR 3 + PR 5 + PR 7).

### PR 3 — `feature/s6-negocio` (18 archivos)

Comités, convocatorias y solicitudes.

```bash
git switch develop
git pull --ff-only equipo develop
git switch -c feature/s6-negocio

git checkout b62070b -- \
  apps/api/src/comites \
  apps/api/src/convocatorias \
  apps/api/src/solicitudes
```

Verifica (debe salir vacío):

```bash
git diff --name-only b62070b -- \
  apps/api/src/comites \
  apps/api/src/convocatorias \
  apps/api/src/solicitudes
```

Publica:

```bash
git add -A
git commit -m "feat(s6): restaurar negocio (comites, convocatorias, solicitudes) desde b62070b"
git push -u equipo feature/s6-negocio
gh pr create --base develop --head feature/s6-negocio \
  --title "feat(s6): negocio (comites, convocatorias, solicitudes)" \
  --body "Restauracion literal desde b62070b. Verificado con git diff vacio." \
  --reviewer TitosDoritos18
```

**Incluye:** `apps/api/src/{comites,convocatorias,solicitudes}`.
**No incluye:** `app.module.ts` (PR 5).

### PR 5 — `feature/s6-composicion` (2 archivos)

`app.module.ts` y `main.ts`. **Va después de PR 3 y PR 4.**

```bash
git switch develop
git pull --ff-only equipo develop
git switch -c feature/s6-composicion

git checkout b62070b -- \
  apps/api/src/app.module.ts \
  apps/api/src/main.ts
```

Verifica (debe salir vacío):

```bash
git diff --name-only b62070b -- \
  apps/api/src/app.module.ts \
  apps/api/src/main.ts
```

Publica:

```bash
git add -A
git commit -m "feat(s6): restaurar composicion de modulos (app.module, main) desde b62070b"
git push -u equipo feature/s6-composicion
gh pr create --base develop --head feature/s6-composicion \
  --title "feat(s6): composicion de modulos (app.module, main)" \
  --body "app.module.ts registra 15 modulos, incluidos los del PR 3 y PR 4; main.ts importa app.module.ts. Restauracion literal desde b62070b." \
  --reviewer TitosDoritos18
```

**Incluye:** solo esos 2 archivos.
**Por qué solo:** `app.module.ts` compone módulos de dos PRs distintos; aislarlo
evita conflictos y deja explícito el punto de integración.

### PR 7 — `feature/s6-web-portal` (46 archivos, incluye 2 borrados)

Portal público: home, páginas informativas, convocatorias públicas, consulta,
reportes y soporte; más el borrado de dos componentes obsoletos.

```bash
git switch develop
git pull --ff-only equipo develop
git switch -c feature/s6-web-portal

git checkout b62070b -- \
  apps/web/src/app/page.tsx \
  apps/web/src/app/ayuda \
  apps/web/src/app/consulta \
  apps/web/src/app/contacto \
  apps/web/src/app/convocatorias \
  apps/web/src/app/faq \
  apps/web/src/app/nosotros \
  apps/web/src/app/reportes \
  apps/web/src/app/requisitos \
  apps/web/src/app/soporte \
  apps/web/src/app/transparencia \
  apps/web/src/components/consulta \
  apps/web/src/components/convocatorias \
  apps/web/src/components/home \
  apps/web/src/components/layout \
  apps/web/src/components/reportes \
  apps/web/src/lib/acciones.ts \
  apps/web/src/lib/etiquetas.ts \
  apps/web/src/lib/mensajes-error.ts \
  apps/web/src/lib/navegacion.ts \
  apps/web/src/lib/notificaciones-stream.ts \
  apps/web/src/lib/rol.ts

git rm apps/web/src/components/home/Workbench.tsx
git rm apps/web/src/components/layout/MobileMenu.tsx
```

Verifica (debe salir vacío para las rutas restauradas; los 2 borrados no aparecen):

```bash
git diff --name-only b62070b -- \
  apps/web/src/app/page.tsx \
  apps/web/src/app/ayuda \
  apps/web/src/app/consulta \
  apps/web/src/app/contacto \
  apps/web/src/app/convocatorias \
  apps/web/src/app/faq \
  apps/web/src/app/nosotros \
  apps/web/src/app/reportes \
  apps/web/src/app/requisitos \
  apps/web/src/app/soporte \
  apps/web/src/app/transparencia \
  apps/web/src/components/consulta \
  apps/web/src/components/convocatorias \
  apps/web/src/components/home \
  apps/web/src/components/layout \
  apps/web/src/components/reportes \
  apps/web/src/lib/acciones.ts \
  apps/web/src/lib/etiquetas.ts \
  apps/web/src/lib/mensajes-error.ts \
  apps/web/src/lib/navegacion.ts \
  apps/web/src/lib/notificaciones-stream.ts \
  apps/web/src/lib/rol.ts
```

Publica:

```bash
git add -A
git commit -m "feat(s6): restaurar portal publico y retirar componentes obsoletos desde b62070b"
git push -u equipo feature/s6-web-portal
gh pr create --base develop --head feature/s6-web-portal \
  --title "feat(s6): portal publico" \
  --body "Restauracion literal desde b62070b. Incluye git rm de Workbench.tsx y MobileMenu.tsx (componentes retirados). Verificado con git diff vacio." \
  --reviewer TitosDoritos18
```

**Incluye:** páginas públicas de `app/`, `components/{consulta,convocatorias,home,layout,reportes}`
y los 6 `lib/*.ts` del portal; **borra** `Workbench.tsx` y `MobileMenu.tsx`.
**No incluye:** web interna (PR 6) ni `app/layout.tsx` (PR 6).

> Importante: no uses `git checkout b62070b -- apps/web/src/app` ni
> `-- apps/web/src/lib` completos; mezclarías archivos del PR 6. Usa las rutas
> específicas de arriba.

---

## 5. HAMILTON

Total: **72 archivos** (PR 1 + PR 6 + PR 8).

### PR 1 — `chore/s6-empaquetado` (16 archivos + 2 acciones manuales)

Empaquetado, dependencias, configuración base y `README.md`.

```bash
git switch develop
git pull --ff-only equipo develop
git switch -c chore/s6-empaquetado

git checkout b62070b -- \
  .dockerignore \
  .env.example \
  .gitignore \
  docker-compose.prod.yml \
  package-lock.json \
  README.md \
  apps/api/Dockerfile \
  apps/api/package.json \
  apps/web/Dockerfile \
  apps/web/next.config.js \
  apps/web/package.json \
  apps/web/tailwind.config.js \
  apps/web/public \
  apps/web/src/app/icon.svg
```

**Acción manual 1 — título del README.** El único cambio no literal autorizado:

```bash
# en README.md, reemplazar la primera linea:
#   # EDUVIAGT
# por:
#   # EDUVIA-gt
```

**Acción manual 2 — crear `.github/CODEOWNERS`** (no existe en el producto):

```text
* @Hamilton313 @hctor2 @TitosDoritos18

/apps/api/src/auth/            @TitosDoritos18
/apps/api/src/common/          @TitosDoritos18
/apps/api/src/audit/           @TitosDoritos18
/apps/api/src/notificaciones/  @TitosDoritos18
/apps/api/src/users/           @TitosDoritos18

/apps/api/src/comites/         @hctor2
/apps/api/src/convocatorias/   @hctor2
/apps/api/src/solicitudes/     @hctor2

/apps/api/src/catalogos/       @TitosDoritos18
/apps/api/src/sesiones/        @TitosDoritos18
/apps/api/src/evaluaciones/    @TitosDoritos18
/apps/api/src/reportes/        @TitosDoritos18
/apps/api/src/asistente/       @TitosDoritos18

/apps/web/src/components/ui/   @Hamilton313
/apps/web/src/app/admin/       @Hamilton313
/apps/web/src/app/             @hctor2
/apps/web/src/components/home/ @hctor2

/.github/                      @Hamilton313
```

Verifica (para los 14 archivos restaurados debe salir vacío; `README.md` mostrará
solo el cambio de título y `CODEOWNERS` no está en el producto por lo que se omite):

```bash
git diff --name-only b62070b -- \
  .dockerignore .env.example .gitignore docker-compose.prod.yml package-lock.json \
  apps/api/Dockerfile apps/api/package.json \
  apps/web/Dockerfile apps/web/next.config.js apps/web/package.json \
  apps/web/tailwind.config.js apps/web/public apps/web/src/app/icon.svg

# README debe mostrar exactamente:
git diff --numstat b62070b -- README.md
#   1  1  README.md
```

Publica:

```bash
git add -A
git commit -m "chore(s6): restaurar empaquetado, dependencias y README desde b62070b"
git push -u equipo chore/s6-empaquetado
gh pr create --base develop --head chore/s6-empaquetado \
  --title "chore(s6): empaquetado y configuracion base" \
  --body "Restauracion literal desde b62070b (16 archivos). Excepciones: titulo del README # EDUVIA-gt y .github/CODEOWNERS creado a mano (no existe en el producto)." \
  --reviewer TitosDoritos18
```

**Incluye:** raíz (`.dockerignore`, `.env.example`, `.gitignore`, `docker-compose.prod.yml`,
`package-lock.json`, `README.md`), `apps/api/{Dockerfile,package.json}`,
`apps/web/{Dockerfile,next.config.js,package.json,tailwind.config.js,public/*,src/app/icon.svg}`.
**No incluye:** código fuente de la API ni páginas de `apps/web/src/app` (PRs 2–7).

### PR 6 — `feature/s6-web-interna` (53 archivos)

Web interna: admin, auditoría, comité, dashboard, evaluador, login, perfil,
registro, solicitudes, componentes UI y `lib` de cliente.

```bash
git switch develop
git pull --ff-only equipo develop
git switch -c feature/s6-web-interna

git checkout b62070b -- \
  apps/web/src/app/admin \
  apps/web/src/app/auditoria \
  apps/web/src/app/comite \
  apps/web/src/app/dashboard \
  apps/web/src/app/evaluador \
  apps/web/src/app/layout.tsx \
  apps/web/src/app/login \
  apps/web/src/app/perfil \
  apps/web/src/app/registro \
  apps/web/src/app/solicitudes \
  apps/web/src/components/admin \
  apps/web/src/components/auth \
  apps/web/src/components/chat \
  apps/web/src/components/solicitud \
  apps/web/src/components/soporte \
  apps/web/src/components/ui \
  apps/web/src/lib/api.ts \
  apps/web/src/lib/api-auth.ts \
  apps/web/src/styles
```

Verifica (debe salir vacío):

```bash
git diff --name-only b62070b -- \
  apps/web/src/app/admin \
  apps/web/src/app/auditoria \
  apps/web/src/app/comite \
  apps/web/src/app/dashboard \
  apps/web/src/app/evaluador \
  apps/web/src/app/layout.tsx \
  apps/web/src/app/login \
  apps/web/src/app/perfil \
  apps/web/src/app/registro \
  apps/web/src/app/solicitudes \
  apps/web/src/components/admin \
  apps/web/src/components/auth \
  apps/web/src/components/chat \
  apps/web/src/components/solicitud \
  apps/web/src/components/soporte \
  apps/web/src/components/ui \
  apps/web/src/lib/api.ts \
  apps/web/src/lib/api-auth.ts \
  apps/web/src/styles
```

Publica:

```bash
git add -A
git commit -m "feat(s6): restaurar web interna (admin, auth, chat, dashboard, solicitudes) desde b62070b"
git push -u equipo feature/s6-web-interna
gh pr create --base develop --head feature/s6-web-interna \
  --title "feat(s6): web interna" \
  --body "Restauracion literal desde b62070b. Incluye app/layout.tsx, styles/globals.css y lib/api.ts + api-auth.ts. Verificado con git diff vacio." \
  --reviewer hctor2
```

**Incluye:** páginas internas de `app/`, `components/{admin,auth,chat,solicitud,soporte,ui}`,
`styles/`, `lib/api.ts`, `lib/api-auth.ts`.
**No incluye:** portal público (PR 7).

> `apps/web/src/lib/` está repartido: aquí van **solo** `api.ts` y `api-auth.ts`.
> El resto de `lib/*.ts` es del PR 7.

### PR 8 — `ci/s6-verificacion-deploy` (3 archivos)

Pipeline de CI y scripts de verificación. **Va al final.**

```bash
git switch develop
git pull --ff-only equipo develop
git switch -c ci/s6-verificacion-deploy

git checkout b62070b -- \
  .github/workflows/ci.yml \
  .github/scripts/smoke-ci.sh \
  .github/scripts/link-doc.cjs
```

Verifica (debe salir vacío):

```bash
git diff --name-only b62070b -- \
  .github/workflows/ci.yml \
  .github/scripts/smoke-ci.sh \
  .github/scripts/link-doc.cjs
```

Publica:

```bash
git add -A
git commit -m "ci(s6): restaurar workflow y scripts de verificacion desde b62070b"
git push -u equipo ci/s6-verificacion-deploy
gh pr create --base develop --head ci/s6-verificacion-deploy \
  --title "ci(s6): verificacion y deploy" \
  --body "Restauracion literal desde b62070b del workflow de CI y los scripts smoke-ci.sh y link-doc.cjs. Cierra el cierre de equivalencia." \
  --reviewer hctor2
```

**Incluye:** `.github/workflows/ci.yml`, `.github/scripts/{smoke-ci.sh,link-doc.cjs}`.
**No incluye:** `CODEOWNERS` (PR 1).

> El workflow requiere secretos de despliegue que administración debe configurar
> (host, usuario, clave, ruta, base de datos y JWT). Sin ellos, el pipeline de
> deploy queda pendiente; el resto de la verificación no depende de esto.

---

## 6. Verificación global

Cuando los 8 PRs estén mergeados en `develop`:

```bash
git switch develop
git pull --ff-only equipo develop

git diff --name-status b62070b -- \
  .gitattributes \
  .dockerignore \
  .env.example \
  .gitignore \
  docker-compose.prod.yml \
  package-lock.json \
  README.md \
  apps \
  .github \
  scripts
```

**Resultado esperado: exactamente estas 7 líneas** (y ninguna más):

```
M  .gitattributes
A  .github/CODEOWNERS
M  apps/api/.eslintrc.json
M  apps/api/prisma/migrations/20260829061028_asistente_tsvector/migration.sql
M  apps/api/tsconfig.build.json
M  apps/web/.eslintrc.json
M  README.md
```

Interpretación:

- `README.md` → título `# EDUVIA-gt` (excepción autorizada).
- `.github/CODEOWNERS` → archivo propio del equipo (`A` = solo en el equipo).
- Los **5 archivos cosméticos** (`M`) → difieren solo por el salto de línea final;
  no afectan la funcionalidad y no se tocan.
- Si aparece **cualquier otro** archivo de código → **faltó restaurarlo** en algún PR.
- Si un archivo esperado **no** aparece, es porque quedó idéntico (mejor).

---

## 7. Excepciones declaradas

| Excepción | Motivo |
|---|---|
| Título de `README.md` (`# EDUVIA-gt`) | identidad del repositorio del equipo |
| `.github/CODEOWNERS` | no existe en el producto; se crea para asignar revisores |
| 5 archivos `COSMETICO` | diferencias de salto de línea final; irrelevantes |
| `Docs/` | documentación scrum del equipo; **fuera de alcance** |

> `git diff b62070b` sobre **todo** el repositorio incluirá además `Docs/` y los
> archivos propios del equipo. Por eso la verificación del punto 6 se limita a los
> scopes de código (`apps`, `.github`, `scripts`, raíz).

---

## 8. Lo que NO se debe hacer

| No hacer | Por qué |
|---|---|
| Editar código a mano | el cierre es restauración literal; cualquier edición rompe la equivalencia |
| Copiar `app.module.ts` / `main.ts` en PR 3 o PR 4 | van **solo** en PR 5 |
| Borrar `Workbench.tsx` / `MobileMenu.tsx` en otro PR | van en PR 7 |
| Usar `git checkout b62070b -- apps/web/src/app` o `-- apps/web/src/lib` | arrastraría archivos de ambos PRs web |
| Tocar `Docs/` | es el scrum del equipo |
| Mezclar archivos de otra sección en un PR | conflicto de propiedad y de revisor |
| Modificar migraciones preexistentes | solo se restauran las 6 del PR 2 |
| Reescribir `develop` (`--force`, rebase de rama compartida) | rompe el historial del equipo |
| Mergear sin la revisión asignada | el flujo lo exige |
| Commitear `.env` reales o secretos | seguridad |

---

## 9. Problemas frecuentes

| Síntoma | Causa / solución |
|---|---|
| `fatal: invalid object name 'b62070b'` | falta el fetch del producto: `git fetch EDUVIAGT-prod` y confirma `git cat-file -t b62070b` |
| `error: pathspec ... did not match` | escribiste una ruta que no existe en `b62070b`; revisa la ruta exacta |
| El `README.md` queda `# EDUVIAGT` | olvidaste la acción manual del PR 1: cambiarlo a `# EDUVIA-gt` |
| Tras el PR 2 la API no arranca | revisa `apps/api/.env.example` (nombres `JWT_ACCESS_EXPIRATION` / `JWT_REFRESH_EXPIRATION`) y que las 6 migraciones estén presentes |
| El PR 5 tiene conflictos | se hicieron PR 3 y PR 4 primero; rebasa el PR 5 sobre `develop` actualizado |
| `git diff` global muestra archivos de código de más | algún PR no cubrió su carpeta; vuelve a correr el `git checkout` de esa sección |
| `git diff` global muestra solo los 5 cosméticos + README + CODEOWNERS | **correcto**: el cierre quedó completo |
| `git fetch` no trae `b62070b` | confirma que el remoto `EDUVIAGT-prod` apunta a `Deividcodv/EDUVIAGT-prod` |
