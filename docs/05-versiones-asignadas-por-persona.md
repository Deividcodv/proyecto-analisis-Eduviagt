# 05 · Versiones de código asignadas por persona

> Este documento responde dos preguntas para cada sprint:
> **1)** ¿de qué versión exacta del proyecto original me toca copiar mi trabajo? (**commit fuente**)
> **2)** ¿qué carpetas/archivos de código le corresponden a cada persona?
>
> Con la combinación **commit fuente + módulos** puedes descargar **exactamente tu versión**
> y subirla en tu rama sin pisar a nadie. Pre-requisitos técnicos:
> `02-git-github-conceptos-basicos.md` y `04-pr-paso-a-paso-por-persona.md`.
>
> ⭐ **Ya hicimos la descarga por ti:** el código de cada persona y sprint está listo en la carpeta
> `recreacion/sprint-N/<tu-nombre>/repo/` (espejo de las rutas del repo, lista para copiar). Los
> commits fuente de abajo son la referencia de fidelidad para verificar tu PR.
>
> **Versión final de referencia: CI #40 = commit `a720298`.**
>
> **Versión del prototipo (demo): hito personalizado `v0.1-prototipo-demo`** (tag en el repo del equipo).

---

## 1. Cómo funciona el modelo de versiones (explicación simple)

En la simulación hay **dos tipos** de referencia:

### Prototipo (S1 – S3): commit fuente + hito personalizado

El proyecto real construyó el portal público y el login **hasta el final** (Sprint 6 y 7), así que **no
existe un hito lineal** en `sigeb-prod` que sea "portal + login sin sistema interno". Para el demo
(≈ 16 sep, presentamos 3 sprints) resolvemos con **2 ideas**:

1. Cada persona copia sus módulos desde el **commit fuente** en el que su módulo está en su mejor estado:
   | Módulo | Commit fuente |
   |---|---|
   | API `auth/`, `users/`, `common/` | `85122d2` |
   | API `catalogos/`, `convocatorias/` | `85122d2` (CRUD) + `986fc89` (público/búsqueda) |
   | API `storage/` (adapter base) | `28ea376` |
   | API `solicitudes/` (SOLO el endpoint de consulta US-46) | `986fc89` |
   | WEB layout base / Design System | `ab66393` |
   | WEB portal público (US-41..48) | `986fc89` |
   | WEB login/registro + dashboard postulante (US-49/50) | `3dfa19a` |

   > **Nota sobre auth:** `4b0795f` (`feat(seguridad): complete Sprint 1`) es el commit puro de auth y
   > `85122d2` (`feat(convocatorias): complete Sprint 2`) ya contiene ese mismo estado de `auth/`. Para
   > verificar el backend de seguridad sirve cualquiera de los dos; la tabla usa `85122d2` porque es el
   > estado completo de cimientos (auth + catálogos/convocatorias).

2. Al cierre del S3, **David crea un hito personalizado**: el tag `v0.1-prototipo-demo` en el repo del equipo,
   que junta solo los módulos del prototipo y **excluye** `evaluaciones/`, `sesiones/`, `comites/`,
   `decisiones/`, `reportes/`, `asistente/`, `audit/` (y sus registros en `app.module.ts` y `prisma`),
   además de los paneles `admin` y `evaluador` de la web.

### Sprints 4 al 6 y estabilización: commit fuente acumulado
A partir del S4 se continúa el camino que sí existe en el original: cada sprint sube un peldaño y la
verificación se hace por módulo (como siempre), terminando en **CI #40 = `a720298`** idéntico al proyecto real.

Resumen de la escalera:

```
S1 → cimientos (auth + catálogos/convocatorias + CI)     fuente: 85122d2, 28ea376
S2 → portal público (US-41..48)                          fuente: 986fc89 (y ab66393 para layout)
S3 → login/registro + dashboard (US-49/50)               fuente: 3dfa19a
      └── Cierre de prototipo: tag v0.1-prototipo-demo (hito personalizado, solo en el repo del equipo)
S4 → evaluación (41285d4, 3cb58e9)
S5 → reportes/auditoría/asistente/paneles (ab66393, 1436e41, 2e52a69)
S6 → sistema interno + constancia PDF (e36ac2c, dcba851)
REMATE → CI #40 = a720298   (hotfixes de estabilización: specs, CI, reportes)
```

- El repo nuevo empieza en un estado base (Sprint 0) y en **cada sprint sube un peldaño** mediante PRs.
- La **rama `develop`** del repo nuevo representa siempre el peldaño anterior.
- Cada persona toma de su commit fuente **solo lo que le toca** (sus módulos) y lo agrega en su rama `feature/*`.
- Al aprobar y mergear todas las ramas, `develop` sube al estado del sprint completo.
- Al final, el bloque de estabilización lleva todo a **CI #40 = `a720298`**.

---

## 2. Comandos "comodín" para descargar tu versión

Primero (una sola vez):
```bash
git remote add sigeb-prod https://github.com/Deividcodv/sigeb-prod.git
git fetch sigeb-prod
```

Luego, en **tu rama** `feature/...` (ver `04` para crear la rama), copia tus carpetas desde el commit fuente:

```bash
# GENÉRICO (cambia <FUENTE> y <tus-modulos> por los valores de tu tabla de abajo)
git checkout <FUENTE> -- apps/api/src/<tu-modulo-1> apps/api/src/<tu-modulo-2>
```

**Opcion A (rápida, recomendada):** ya tienes tu código descargado localmente en `recreacion/`:

```bash
# Copia el contenido de tu carpeta-repo a tu rama de trabajo (mismas rutas del repo)
cp -r ../../recreacion/sprint-N/<tu-nombre>/repo/apps/api/src/<tu-modulo> apps/api/src/
```

> `recreacion/sprint-N/<tu-nombre>/repo/` es un **espejo** de las rutas del repo: puedes copiar su contenido
> directo o usar su `README.md` (lista los comandos `git checkout <FUENTE> -- ...` exactos por persona).
> La referencia de fidelidad siempre es el **commit fuente `<FUENTE>`**.

Extra útil — ver qué cambió en tu sección entre fuentes (por ejemplo, Héctor entre `85122d2` y `986fc89`):
```bash
git diff <FUENTE-ANTERIOR>..<FUENTE> -- apps/api/src/<tu-modulo>
```

---

## 3. Tabla maestra por persona

> `API` = dentro de `apps/api/src/...`. `WEB` = dentro de `apps/web/src/...`.

### Marcos — Backend Seguridad y Autenticación

| Sprint | Fuente | Módulos (rutas) | Rama de ejemplo |
|---|---|---|---|
| S1 | `85122d2` | API `auth/` (registro con CUI único, login JWT access+refresh, `GET /auth/perfil`), `users/`, `common/` (guards, decoradores, filtros, interceptores), guard de permisos (US-11), DTOs | `feature/auth-login`, `feature/auth-roles` |
| S3 | `3dfa19a` | API ajustes para la sesión web: expiración/refresh usados por el login de la web (solo si el planning lo marca; coordinar con Hamilton) | `feature/auth-web` |
| S5 | `ab66393` | API `audit/` (registro de auditoría US-36) | `feature/auditoria-registro` |
| Estab. (CI #35) | `88e7fc3` | API specs de `common/` (permissions.guard.spec) | `hotfix/specs-ci` |
| S6+ | `a720298` | Ajustes de auditoría por rol del estado final | `feature/auditoria-por-rol` |

### Héctor — Backend Convocatorias

| Sprint | Fuente | Módulos (rutas) | Rama de ejemplo |
|---|---|---|---|
| S1 | `85122d2` + `28ea376` | API `catalogos/` (género, nivel académico, departamento, municipio), `convocatorias/` (CRUD + máquina de estados + documentos requeridos), `storage/` (adapter base, `28ea376`) | `feature/catalogos`, `feature/convocatorias-crud`, `feature/storage-documentos` |
| S2 | `986fc89` | API `convocatorias/` público (US-44/45): `GET /convocatorias` con `?busqueda=`, `GET /convocatorias/:id` público | `feature/convocatorias-publicas` |
| S4 | `41285d4` | API `convocatorias/` (soporte de tipos de documento para la evaluación) | `feature/tipos-documento` |

### José — Backend Solicitudes y Evaluación

| Sprint | Fuente | Módulos (rutas) | Rama de ejemplo |
|---|---|---|---|
| S2 | `986fc89` | API `solicitudes/` **solo el endpoint público** `GET /solicitudes/consulta/:codigo` (US-46, respuesta acotada, sin datos sensibles, 2 tests). El resto del módulo se entrega en S6 | `feature/consulta-publica` |
| S4 | `41285d4` | API `evaluaciones/` (asignar evaluadores, puntajes, score ponderado), `comites/`, `sesiones/` (agenda, votos, quórum, finalización), `decisiones/` (mayoría, convocatoria RESUELTA), rechazo de documentos en `solicitudes/` | `feature/evaluaciones-puntajes`, `feature/comites`, `feature/sesiones-quorum` |
| S5 | `ab66393` | API `reportes/` (agregados + CSV US-34/35) | `feature/reportes-csv` |
| S6 | `e36ac2c` | API `solicitudes/pdf/` (constancia PDF US-F7) + completar el resto de `solicitudes/` para el sistema interno | `feature/constancia-pdf` |
| Estab. (CI #35) | `88e7fc3` | Specs de `evaluaciones/` y `reportes/` corregidos para CI | `hotfix/specs-evaluaciones` |
| Estab. (CI #37) | `f949500` | `reportes.service.ts` + spec: conteo de decisiones por convocatoria sin filtrar por estado | `hotfix/reportes-decisiones` |

### Yemerson — Frontend Portal

| Sprint | Fuente | Módulos (rutas) | Rama de ejemplo |
|---|---|---|---|
| S2 | `ab66393` (layout) + `986fc89` (portal) | WEB `styles/` y `components/` base (Layout/Design System, home conectada al API US-40) + portal público US-41..48: hero, "Sobre SIGEB", "Cómo funciona", convocatorias con filtros, convocatoria individual, consulta de beca, nosotros, footer. **Sin panel admin** | `feature/layout-base`, `feature/portal-publico`, `feature/convocatorias-publicas` |
| S5 | `1436e41` | WEB panel admin (workbench por rol, header de acciones) US-54/55 | `feature/panel-admin`, `feature/header-acciones` |
| S6 | `1436e41` / `e36ac2c` | WEB rediseño institucional final, páginas institucionales/footer, responsive total (US-57) e identidad dual (US-58) | `feature/identidad-dual`, `feature/panel-admin` |

### Hamilton — Frontend Sistema Interno + IA

| Sprint | Fuente | Módulos (rutas) | Rama de ejemplo |
|---|---|---|---|
| S3 | `3dfa19a` | WEB auth (US-49): login/registro conectados, `AuthContext`, `ProtectedRoute`, `UserMenu`, `api-auth`/`lib/auth`, sesión persistente + dashboard postulante (US-50). Script `npm run dev`. **Sin paneles admin/evaluador** (van en S5/S6) | `feature/web-login`, `feature/dashboard-postulante` |
| S4 | `3cb58e9` | WEB flujo de evaluación (asignar evaluadores, comités, sesiones) | `feature/web-evaluacion` |
| S5 | `ab66393` + `2e52a69` | API `asistente/` (base de conocimiento US-37/39, proveedor LLM US-38; `ab66393`) + widget web del chat (`2e52a69`) | `feature/asistente-ia`, `feature/asistente-llm` |
| S6 | `e36ac2c` + `dcba851` | WEB sistema interno (estado final en `e36ac2c`, con raíz en `dcba851`): formulario multi-step (US-51), gestión de documentos (US-52), panel evaluador (US-53), chat IA (US-56), identidad dual del sistema interno | `feature/sistema-interno`, `feature/chat-ia` |

### David — Base, CI, hito personalizado y aprobación

| Sprint | Fuente | Qué entrega |
|---|---|---|
| Base | 28356e3 | Scaffold del monorepo (Sprint 0): estructura NestJS/Next.js/Prisma/Docker + migración base |
| S1 | `85122d2` | `prisma/schema.prisma` + `migrations/` con los modelos del prototipo (auth, catálogos, convocatorias, solicitudes mínimas); `.github/workflows/ci.yml` base (smoke del prototipo) |
| S2 | `986fc89` | Registro de módulos del prototipo en `app.module.ts`/`main.ts`; smoke del portal |
| S3 | `3dfa19a` | Archivos compartidos del arranque web (script `npm run dev` `890c423`, CORS) y **crea el tag `v0.1-prototipo-demo`** (hito personalizado) excluyendo evaluaciones/sesiones/comités/decisiones/reportes/asistente/audit y paneles admin/evaluador |
| S6 | `e36ac2c`/`1436e41` | Revisión final de módulos compartidos; paneles y constancia integrados |
| Estab. (CI #36) | `25a1e8b` | Fix deps Chromium en CI (`libasound2t64`) |
| Estab. (CI #40) | `a720298` | Variable `JWT_REFRESH_SECRET` en el smoke de CI |

---

## 4. Archivos compartidos y su dueño (regla anti-conflicto)

| Archivo | Dueño |
|---|---|
| `apps/api/prisma/schema.prisma`, `prisma/migrations/` | David (o backend dueño del cambio del sprint, según planning) |
| `apps/api/src/app.module.ts`, `apps/api/src/main.ts` | El dev cuyo módulo registra el cambio; si son varios, David |
| `package.json`, `turbo.json`, `.github/workflows/ci.yml`, `docker-compose.yml` | David |

> Si tu trabajo necesita tocar un archivo compartido, primero coordina con David; de lo contrario la
> revisión rechazará el PR.
>
> **Importante en el prototipo:** al cierre del S3 David arma `v0.1-prototipo-demo` como **hito personalizado**
> (tag) en el repo del equipo. Nadie más crea tags ni toca el `app.module.ts` para registrar módulos fuera del
> alcance del prototipo.

---

## 5. Bloque de estabilización: CI #35 – CI #40 (asignación de hotfixes)

| CI | Commit | Contenido del hotfix | Quién lo entrega | Rama de ejemplo |
|---|---|---|---|---|
| #35 | `88e7fc3` | Specs corregidos para CI (permissions.guard, asignar evaluadores, reportes) | Marcos (`common`), José (`evaluaciones`/`reportes`) | `hotfix/specs-ci` |
| #36 | `25a1e8b` | Deps de Chromium para CI (`libasound2t64`) | David | `hotfix/ci-chromium-deps` |
| #37 | `f949500` | Fix reporte de evaluaciones (decisiones por convocatoria) | José | `hotfix/reportes-decisiones` |
| #40 | `a720298` | `JWT_REFRESH_SECRET` para el smoke de CI | David | `hotfix/ci-jwt-refresh` |

Orden de merge del remate: **#35 → #36 → #37 → #40** (specs primero, luego deps, luego fix de API,
después env de CI). Todos entran por PR a `develop` (y luego `develop → master`), siempre con CI verde.

**Al terminar este bloque, el repo nuevo = estado del CI #40 (`a720298`) = idéntico al proyecto real.**

---

## 6. Cómo saber si tu versión quedó bien

En tu rama, verificaciones rápidas:

```bash
git status                     # solo tus archivos
git log --oneline -3           # tus commits con mensajes convencionales
git diff develop --name-only   # solo tus rutas respecto a develop
```

Verificación de fidelidad contra el commit fuente (por módulo):

```bash
git diff <FUENTE> -- apps/api/src/<tu-modulo>   # en sigeb-prod: debe salir exactamente lo que enviaste
```

> Puedes confirmar contra la carpeta `recreacion/sprint-N/<tu-nombre>/repo/`: compara que lo que
> enviaste en tu rama sea idéntico a lo que hay en ese espejo local.

En el prototipo (S1–S3) la referencia es tu **commit fuente**; el tag `v0.1-prototipo-demo` solo existe en
el repo del equipo, no tiene que coincidir con ningún commit de `sigeb-prod`. La verificación **final** (S6) sí
se hace contra **`a720298`**: `git diff a720298 -- apps/api/src apps/web/src`.