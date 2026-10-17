# Guía — Recreación de SIGEB con 6 personas vía PRs (simulación)

> Documento de operación. Describe, desde cero, cómo reconstruir SIGEB en un repositorio nuevo de GitHub
> simulando un equipo Scrum de 6 personas, donde cada persona entrega **su sección** de código vía **PRs**,
> cada uno trabaja en **su propia versión** (rama) sin interferir con los demás, y **David** (admin y Scrum Master)
> revisa, prueba y aprueba los PRs.
>
> **Versión de referencia: CI #40 = commit `a720298`** (estado actual del repositorio `sigeb-prod`).

---

> ### ✋ Primero: ¿qué documentos leer?
>
> Esta guía es el **resumen general**. Antes de ejecutar cualquier paso, lee los documentos dedicados:
>
> | Documento | Para quién |
> |---|---|
> | `docs/00-indice.md` | Todos — orden de lectura recomendado |
> | `docs/01-scrum-como-trabajamos.md` | Todos — cómo se trabajará con Scrum |
> | `docs/02-git-github-conceptos-basicos.md` | Todos — Git y GitHub desde cero |
> | `docs/03-github-david-aprobar-pr.md` | Solo David — revisar, probar y aprobar PRs |
> | `docs/04-pr-paso-a-paso-por-persona.md` | Cada persona — cómo hacer y pushear su PR |
> | `docs/05-versiones-asignadas-por-persona.md` | Todos — la versión exacta que le toca a cada uno |

---

## Índice

- [0. Qué es esto y modelo general](#0-qué-es-esto-y-modelo-general)
- [1. Requisitos previos (desde cero)](#1-requisitos-previos-desde-cero)
- [2. Fase 0 · Preparación del repositorio (solo David)](#2-fase-0--preparación-del-repositorio-solo-david)
- [3. Conectar sigeb-prod como fuente de referencia](#3-conectar-sigeb-prod-como-fuente-de-referencia)
- [4. Propiedad de secciones: la versión de cada persona](#4-propiedad-de-secciones-la-versión-de-cada-persona)
- [5. Cómo descargar la versión de código de cada persona](#5-cómo-descargar-la-versión-de-código-de-cada-persona)
- [6. Ciclo semanal sin interferencias (paso a paso)](#6-ciclo-semanal-sin-interferencias-paso-a-paso)
- [7. Protocolo anti-interferencia (reglas duras)](#7-protocolo-anti-interferencia-reglas-duras)
- [8. Cierre de sprint y release](#8-cierre-de-sprint-y-release)
- [9. Verificación de fidelidad contra los commits fuente](#9-verificación-de-fidelidad-contra-los-commits-fuente)

---

## 0. Qué es esto y modelo general

Vamos a reconstruir SIGEB en un **repositorio nuevo y privado de GitHub**. El código del producto
**ya existe** y vive en el repositorio real `sigeb-prod`; lo que se **simula** es el *proceso*: que el
proyecto haya sido construido por un equipo de 6 personas en 6 sprints, cada quien con su sección,
entregándola mediante Pull Requests que David aprueba después de probarlas.

- El **código de referencia** se toma de `sigeb-prod` en **commits fuente** (el estado exacto de cada módulo
  en su mejor momento). Cada sprint del repo nuevo copia los módulos de esos commits fuente y termina
  equivalente a lo esperado del sprint.
- ⭐ **El código ya está descargado y separado por persona y sprint** en la carpeta local
  `recreacion/sprint-N/<miembro>/repo/` (espejo de rutas del repo con `README.md` y `modulos/` por persona).
  Sirve como la forma rápida de obtener "TU versión"; el commit fuente queda como referencia de fidelidad.
- Meta especial: **en los primeros 2-3 sprints tener un prototipo semi-funcional (portal público + login)**.
  Para el demo (≈ 16 sep) David crea al cierre del S3 el **hito personalizado `v0.1-prototipo-demo`** (tag
  en el repo del equipo), que junta solo los módulos del prototipo (excluye evaluación/reportes/asistente/auditoría
  y sus paneles). Esto NO existe en `sigeb-prod`: el proyecto real puso el portal y el login al final.
- Al terminar la simulación (sup. viernes 16 de octubre) el repositorio nuevo debe equivaler al estado
  actual de `sigeb-prod` (CI #40 = `a720298`).

### 6 personas

| Persona | Rol Scrum | Rol técnico | En esta simulación |
|---|---|---|---|
| David | Scrum Master / Product Owner (dual) | Full-stack, supervisión | Admin del repo, revisa/prueba/aprueba PRs, CI, archivos compartidos, crea el hito personalizado `v0.1-prototipo-demo` |
| Marcos | Development Team | Backend 1 — Seguridad y Autenticación | `auth/`, `users/`, `audit/`, `common/` |
| Héctor | Development Team | Backend 2 — Convocatorias | `catalogos/`, `convocatorias/`, `storage/`, tipos de documento |
| José | Development Team | Backend 3 — Solicitudes y Evaluación | `solicitudes/`, `evaluaciones/`, `comites/`, `sesiones/`, `decisiones/`, `reportes/` |
| Yemerson | Development Team | Frontend 1 — Portal público | Layout/Design System, páginas públicas, panel admin |
| Hamilton | Development Team | Frontend 2 — Sistema interno + IA | Web auth, dashboard, formulario multi-step, chat IA, panel evaluador |

> Detalles oficiales en `doc/team/members.md` y `doc/team/roles.md`.

### Los 6 sprints (y el prototipo)

| Sprint | Semana | Tema | Commits fuente (por módulo) |
|---|---|---|---|
| S1 | 07–09 sep | Cimientos y seguridad (monorepo, auth API, catálogos/convocatorias backend, CI) | `85122d2`, `28ea376` |
| S2 | 09–11/12 sep | **Portal público** (US-41..48) | `986fc89` (+ `ab66393` layout) |
| S3 | 14–16/18 sep | **Login/registro + dashboard postulante** (US-49/50) → `v0.1-prototipo-demo` | `3dfa19a` |
| S4 | 21–25 sep | Evaluación: evaluadores, comités, sesiones, decisiones | `41285d4`, `3cb58e9` |
| S5 | 28 sep–02 oct | Reportes, auditoría, asistente IA, paneles admin | `ab66393`, `1436e41`, `2e52a69` |
| S6 | 05–16 oct | Sistema interno completo + constancia PDF + estabilización → `a720298` (CI #40) | `e36ac2c`, `dcba851` |

### Modelo de versiones (la clave)

- `develop` del repositorio nuevo **siempre equivale a la entrega del sprint anterior**.
- La rama de cada persona = `develop` actualizado **+ únicamente su sección** extraída de su **commit fuente**.
- Al mergear todas las ramas del sprint en el orden correcto, el cierre equivale **exactamente** a lo esperado
  (en el prototipo: por módulo; en S4-S6: contra el commit fuente y finalmente `a720298`).
- Como cada persona solo toca *sus* carpetas, las ramas no se pisan entre sí.
- **Hito personalizado `v0.1-prototipo-demo`:** al cierre del S3 David crea este tag en el repo del equipo con
  SOLO los módulos del prototipo (portal + login + dashboard + auth + catálogos/convocatorias/consulta).
  No tiene por qué coincidir con un commit exacto de `sigeb-prod`; se verifica por módulo contra el commit fuente.

---

## 1. Requisitos previos (desde cero)

Para cada una de las 6 personas:

1. Instalar **Git** (e incluir Git Bash en Windows).
2. Tener cuenta en **GitHub**.
3. Instalar **Node.js 20** + npm (lo incluye Node).
4. (Recomendado) Instalar **GitHub CLI** (`gh`) y hacer login: `gh auth login`.

Verificación inicial:

```bash
git --version
node --version     # v20.x
npm --version
gh --version
```

Configuración única de identidad (cada persona con su propio nombre/email):

```bash
git config --global user.name "Nombre Real"
git config --global user.email "username@usuarios.github.com"
git config --global init.defaultBranch main
```

---

## 2. Fase 0 · Preparación del repositorio (solo David)

**Objetivo:** tener un repo (que en este proyecto está en `proyecto-analisis-Sigeb`) con ramas protegidas y CI, listo para recibir los PRs. **En nuestro caso el repo ya existe** (el del equipo) y ya tiene `develop`/`main` protegidos (todo entra por PR), así que esta fase se reduce a verificar la configuración:

1. Repositorio del equipo: **`https://github.com/Deividcodv/proyecto-analisis-Sigeb`** (default branch: `develop`; rama de producción: `main`).
2. **Collaborators**: las 6 personas con permiso **Write** (pueden empujar `feature/*` y abrir PRs, pero no mergear a `develop`/`main`).
3. **Branch protection / rules** en `develop` y `main`:
   - `Require a pull request before merging` (ya activo; el push directo se rechaza)
   - `Require 1 approving review`
   - `Require status checks to pass` → marcar el workflow de CI
   - Mantener `Do not allow bypassing the above settings`
4. Copiar al repo del equipo (desde `sigeb-prod` / el espejo `recreacion/`):
   - `.github/workflows/ci.yml` → CI en cada PR (lint + tests + build + smoke completo, ya verde)
   - `.github/pull_request_template.md` → checklist de Definition of Done
5. **Base inicial** (Sprint 0): monorepo con NestJS en `apps/api`, Next.js en `apps/web`, Prisma, Docker y la migración base. **Entra por PR** a `develop` (no por push directo):
   ```bash
   git checkout develop && git pull origin develop
   git checkout -b chore/setup-monorepo
   # copiar apps/, package.json, turbo.json, docker-compose.yml, .github/ desde el espejo
   git add . && git commit -m "chore: setup monorepo NestJS + Next.js + Prisma + Docker"
   git push -u origin chore/setup-monorepo
   gh pr create --base develop
   ```
   (CI verde → squash merge.)
6. Cada dev clona:
   ```bash
   git clone https://github.com/Deividcodv/proyecto-analisis-Sigeb.git
   cd proyecto-analisis-Sigeb
   ```

---

## 3. Conectar sigeb-prod como fuente de referencia

Cada persona agrega `sigeb-prod` como *remote* de solo lectura. Así puede inspeccionar y "descargar"
las versiones exactas del código sin modificar el repo original:

```bash
git remote add sigeb-prod https://github.com/Deividcodv/sigeb-prod.git
git fetch sigeb-prod
```

Comprobar que los commits fuente existen:

```bash
git log --oneline sigeb-prod/85122d2 -1
git log --oneline sigeb-prod/986fc89 -1
git log --oneline sigeb-prod/3dfa19a -1
git log --oneline sigeb-prod/41285d4 -1
git log --oneline sigeb-prod/ab66393 -1
git log --oneline sigeb-prod/e36ac2c -1
git log --oneline sigeb-prod/a720298 -1
```

---

## 4. Propiedad de secciones: la versión de cada persona

Cada persona es **dueña única** de sus módulos. Nunca debe modificar archivos de un módulo ajeno.
La columna "Fuente" indica el commit de `sigeb-prod` del que copia **su** código en ese sprint.

### Marcos — Backend Seguridad

| Sprint | Fuente | Qué le toca | Ramas de ejemplo |
|---|---|---|---|
| S1 | `85122d2` | `apps/api/src/auth/`, `apps/api/src/common/` (guards, decoradores, filtros, interceptores, guard de permisos), `apps/api/src/users/`, DTOs y validaciones | `feature/auth-login`, `feature/auth-jwt-roles` |
| S3 | `3dfa19a` | API ajustes para la sesión web (refresh/expiración) solo si el planning lo marca; coordinar con Hamilton | `feature/auth-web` |
| S5 | `ab66393` | Auditoría: `apps/api/src/audit/` (registro dirigido, US-36) | `feature/auditoria-registro` |
| S6 | `a720298` | Auditoría por rol + ajustes de seguridad | `feature/auditoria-por-rol` |

### Héctor — Backend Convocatorias

| Sprint | Fuente | Qué le toca | Ramas de ejemplo |
|---|---|---|---|
| S1 | `85122d2` (+ `28ea376` para `storage/`) | `apps/api/src/catalogos/` (género, nivel académico, departamento, municipio), `apps/api/src/convocatorias/` (CRUD + máquina de estados + documentos requeridos), `apps/api/src/storage/` | `feature/catalogos`, `feature/convocatorias-crud`, `feature/storage-documentos` |
| S2 | `986fc89` | Endpoints **públicos** de convocatorias (US-44/45): `GET /convocatorias` con `?busqueda=`, `GET /convocatorias/:id` público | `feature/convocatorias-publicas` |
| S4 | `41285d4` | Soporte en documentos (solo su parte: tipos de documento) | `feature/tipos-documento` |

### José — Backend Solicitudes y Evaluación

| Sprint | Fuente | Qué le toca | Ramas de ejemplo |
|---|---|---|---|
| S2 | `986fc89` | `apps/api/src/solicitudes/` **solo el endpoint público** `GET /solicitudes/consulta/:codigo` (US-46, respuesta acotada). El resto del módulo se entrega en S6 | `feature/consulta-publica` |
| S4 | `41285d4` | `apps/api/src/evaluaciones/` (asignar evaluadores, puntajes, score ponderado), `apps/api/src/comites/` (CRUD comités), `apps/api/src/sesiones/` (agenda, votos, quórum, finalización), `decisiones/` (mayoría, convocatoria RESUELTA), rechazo de documentos | `feature/evaluaciones-puntajes`, `feature/comites`, `feature/sesiones-quorum` |
| S5 | `ab66393` | `apps/api/src/reportes/` (agregados + CSV con BOM) | `feature/reportes-csv` |
| S6 | `e36ac2c` | Constancia PDF en `apps/api/src/solicitudes/pdf/` + resto de `solicitudes/` | `feature/constancia-pdf` |

### Yemerson — Frontend Portal

| Sprint | Fuente | Qué le toca | Ramas de ejemplo |
|---|---|---|---|
| S2 | `ab66393` (layout) + `986fc89` (portal) | Layout base + Design System + home conectada al API (US-40): `apps/web/src/styles`, `apps/web/src/components` (base), páginas base; portal público (US-41..48): hero, convocatorias públicas con filtros, convocatoria individual, consulta de beca, nosotros, footer. **Sin panel admin** | `feature/layout-base`, `feature/portal-publico`, `feature/convocatorias-publicas` |
| S5 | `1436e41` | Panel admin (workbench por rol, header de acciones) US-54/55 | `feature/panel-admin`, `feature/header-acciones` |
| S6 | `e36ac2c` | Rediseño institucional final, páginas institucionales/footer, responsive (US-57), identidad dual (US-58) | `feature/identidad-dual`, `feature/panel-admin` |

### Hamilton — Frontend Sistema Interno + IA

| Sprint | Fuente | Qué le toca | Ramas de ejemplo |
|---|---|---|---|
| S3 | `3dfa19a` | Web auth conectado al backend (US-49): login/registro, `AuthContext`, `ProtectedRoute`, `UserMenu`, `api-auth`/`lib/auth`, sesión persistente; dashboard postulante (US-50). Script `npm run dev`. **Sin paneles admin/evaluador** | `feature/web-login`, `feature/web-registro`, `feature/dashboard-postulante` |
| S4 | `3cb58e9` | Web flujo de evaluación (asignar evaluadores, comités, sesiones) | `feature/web-evaluacion` |
| S5 | `ab66393` + `2e52a69` | Asistente IA: base de conocimiento US-37/39, proveedor LLM US-38 (`ab66393`). Backend: `apps/api/src/asistente/` + widget web del chat (`2e52a69`) | `feature/asistente-ia`, `feature/asistente-llm` |
| S6 | `e36ac2c` + `dcba851` | Dashboard postulante, formulario multi-step (US-51), gestión documentos (US-52), panel evaluador (US-53), chat IA widget (US-56), identidad dual del sistema interno | `feature/sistema-interno`, `feature/chat-ia` |

### David — Base, CI, hito personalizado y supervisión

| Sprint | Qué hace |
|---|---|
| Base | Scaffold del monorepo (Sprint 0): estructura NestJS/Next.js/Prisma/Docker + migración base |
| S1 | `prisma/schema.prisma` + `migrations/` con los modelos del prototipo; CI base en `.github/workflows/ci.yml` |
| S2 | Registro de módulos del prototipo en `app.module.ts`/`main.ts`; smoke del portal |
| S3 | Script `npm run dev`, CORS y **crea el tag `v0.1-prototipo-demo`** (hito personalizado) |
| S4–S6 | Registro de módulos, revisión final de compartidos, y **aprobar todos los PRs** |

---

## 5. Cómo descargar la versión de código de cada persona

Símbolo usado: **`<FUENTE>`** = tu commit fuente del sprint → `85122d2`, `28ea376`, `986fc89`, `3dfa19a`,
`41285d4`, `ab66393`, `3cb58e9`, `1436e41`, `2e52a69`, `dcba851`, `e36ac2c`, `a720298`.

> ⭐ **Opción rápida:** tu código ya está listo en `recreacion/sprint-N/<tu-nombre>/repo/` (espejo de las
> rutas del repo). Copia el contenido a tu rama de trabajo o usa los comandos exactos de su `README.md`.
> Esta carpeta y el commit fuente `<FUENTE>` son equivalentes; verificas tu PR contra cualquiera de los dos.

### 5.0 Marcar los commits fuente (una vez, en el clon de trabajo)

Cuando tienes `sigeb-prod` como remote (sección 3), el commit fuente del sprint será tu referencia.
Puedes también crear nombres cortos para no repetir SHA:

```bash
# Copia de trabajo del commit fuente como referencia (no toca tu repo)
git worktree add /tmp/ref-<FUENTE> <FUENTE>
```

`/tmp/ref-<FUENTE>` es una carpeta temporal con el proyecto completo en ese estado. De ahí cada quien
copia **solo su carpeta** (la de su módulo).

### 5.1 Listar los archivos que me tocan en el commit fuente

Ejemplo: Marcos, S1 (fuente `85122d2`):

```bash
git ls-tree -r --name-only 85122d2 -- apps/api/src/auth apps/api/src/common
```
> Lo mismo, pero ya resuelto, lo tienes en `recreacion/sprint-1/marcos/` (`repo/` + `modulos/` + `README.md`).

Ejemplo: José, S2 (fuente `986fc89`, solo la consulta pública):

```bash
git ls-tree -r --name-only 986fc89 -- apps/api/src/solicitudes
```

### 5.2 Ver el contenido de un archivo exacto del commit fuente

```bash
git show 85122d2:apps/api/src/auth/auth.service.ts
```

### 5.3 Ver SOLO lo que cambió en mi sección en el sprint

Diff contra el commit fuente anterior. Ejemplo: Héctor en S2 (configura lo público de convocatorias entre
`85122d2` y `986fc89`):

```bash
git diff 85122d2..986fc89 -- apps/api/src/convocatorias
```

### 5.4 Copiar los archivos del commit fuente a mi rama de trabajo

Estando dentro de tu rama `feature/*` en el repo nuevo:

```bash
git checkout <FUENTE> -- apps/api/src/auth      # archivos del commit fuente a mi working tree
```

O copiando desde la carpeta de referencia:

```bash
cp -r /tmp/ref-<FUENTE>/apps/api/src/auth apps/api/src/auth
```

O, más fácil, desde el espejo local `recreacion/`:

```bash
cp -r recreacion/sprint-N/<tu-nombre>/repo/apps/api/src/auth apps/api/src/auth
```

### 5.5 Resumen de la "versión que cada uno debe tener"

> **Tu versión** = `develop` actualizado del repo nuevo + los archivos de *tu módulo* tomados del commit
> fuente `<FUENTE>`. Nunca mezcles archivos de módulos de otros. Si faltan piezas de otros módulos para que
> tu código compile, NO los descargues: se integran con el PR del dueño (ver orden de merge, sección 6 y 7).

---

## 6. Ciclo semanal sin interferencias (paso a paso)

### Lunes · Sprint Planning (David)
- David publica `doc/scrum/sprint-N/sprint-planning.md`: historias del sprint (del `product-backlog.md`),
  quién toma cada historia, metas M1..Mx y el orden de merge.

> En la simulación de los 3 primeros sprints, las carpetas de artefactos son
> `doc/scrum/recreacion-sprint-1-cimientos/`, `doc/scrum/recreacion-sprint-2-portal-publico/` y
> `doc/scrum/recreacion-sprint-3-login-dashboard/` (mismos archivos: `goal.md`, `backlog.md`,
> `daily-log.md`, `review.md`, `retrospective.md`).
- Cada dev pasa su historia a "En progreso".

### Cada dev, antes de empezar a trabajar
```bash
git checkout develop
git pull origin develop          # siempre el develop más reciente
git checkout -b feature/<modulo>-<descripcion>
```

### Implementar (solo sus archivos)
1. Descargar/adaptar su sección del commit fuente (sección 5).
2. Revisar lo que va a commitear:
   ```bash
   git status
   ```
3. Agregar **por ruta**, nunca `git add .` (para no arrastrar módulos ajenos):
   ```bash
   git add apps/api/src/auth
   ```
4. Commit con convención:
   ```bash
   git commit -m "feat(auth): login y registro con JWT y roles"
   ```
5. Subir:
   ```bash
   git push -u origin feature/<modulo>-<descripcion>
   ```

### Abrir el PR
```bash
gh pr create --base develop --title "feat(auth): login y registro con JWT y roles" \
  --body "Historias: US-1, US-2
¿Cómo se probó?: npm run test, npm run lint, pruebas manuales de login
Checklist DoD: [x] tests [x] lint [x] revisión [x] funcional"
```
> Si no usas `gh`, crea el PR desde la web del repo indicando base `develop`.

### Después del PR
- **CI corre solo** (lint → 128 tests → build → smoke). Si está rojo, se corrige en la misma rama:
  ```bash
  git add . && git commit -m "fix(auth): ..." && git push
  ```
- Si mientras tanto `develop` avanzó, actualiza tu rama antes de que David la mergee:
  ```bash
  git pull origin develop
  git rebase develop
  git push --force-with-lease   # sólo a TU rama feature
  ```
- **David revisa**: prueba localmente (`npm run dev` para web, `npm run start:prod` o `npm start` para API),
  da **1 aprobación**, y hace **squash merge** en el orden fijado para el sprint (sección 6).

---

## 7. Protocolo anti-interferencia (reglas duras)

1. **Un módulo = un dueño.** Nadie toca (ni para arreglar una línea) los módulos de otra persona.
   Si se necesita un cambio en módulo ajeno, se coordina con David.
2. **Archivos compartidos y su dueño del sprint** (definido por David en el planning):
   | Archivo | Dueño |
   |---|---|
   | `apps/api/prisma/schema.prisma`, `prisma/migrations/` | David (o el backend dueño del cambio del sprint) |
   | `apps/api/src/app.module.ts`, `main.ts` | El dev cuyo módulo registra el cambio; si tocan varios, David |
   | `package.json`, `turbo.json`, `.github/workflows/ci.yml` | David |
3. **Orden de merge del sprint** (David lo fija en planning; típicamente):
   backend de dominio (catálogos/convocatorias/solicitudes) → evaluación/decisiones → reportes/auditoría/IA → frontend → CI/docs.
   Así cada rama posterior se base en el `develop` ya actualizado y no choca.
4. **Push directo a `develop`/`master` prohibido** (lo impide la protección de ramas).
5. `git add` siempre **por ruta** y revisión de `git status` antes del commit.
6. **Ante conflicto:** nunca force-mergear. `git rebase develop` en tu feature; si el conflicto es en
   archivo compartido, David lo resuelve con el dev afectado durante la review.
7. Branch limpia: cada rama feature se **elimina tras el merge** (lo hace GitHub al hacer squash merge).

---

## 8. Cierre de sprint y release

- **Viernes · Sprint Review**: David prueba el sprint completo (demo guiada), aprueba PRs pendientes
  y llena `doc/scrum/sprint-N/review.md` y `doc/scrum/sprint-N/retrospective.md`.
- **Release semanal (opcional-recomendado)**: PR `develop → master`, lo aprueba David. Así `master`
  acumula una "versión" por sprint.
- **Daily logs**: cada dev deja su avance en `doc/scrum/sprint-N/daily-log.md`.

---

## 8.1 Estabilización y entrega (CI #35–40)

Después del Sprint 6 el repositorio real `sigeb-prod` recibió **arreglos de estabilización** (specs de tests
y fixes de CI/API) detectados al validar el incremento. En la simulación estos entran como **hotfixes**
aprobados por David en la misma semana del cierre (12–16 oct), hasta llegar al estado final **CI #40**

Detalle de cada hotfix y a quién le toca:

| CI | Commit | Qué contiene | Quién lo entrega | Rama de ejemplo |
|---|---|---|---|---|
| #35 | `88e7fc3` | Corrección de specs obsoletos para CI (permissions.guard, asignación de evaluadores, reportes) | Marcos (guards) y José (evaluaciones/reportes), según el módulo del spec | `hotfix/specs-ci`, `hotfix/specs-evaluaciones` |
| #36 | `25a1e8b` | Fix de deps de Chromium en CI (`libasound2t64`) | David | `hotfix/ci-chromium-deps` |
| #37 | `f949500` | Fix del reporte de evaluaciones: conteo de decisiones por convocatoria sin filtrar por estado | José (módulo `reportes/`) | `hotfix/reportes-decisiones` |
| #40 | `a720298` | Fix de CI: variable `JWT_REFRESH_SECRET` para el login del smoke | David | `hotfix/ci-jwt-refresh` |

Reglas del bloque de estabilización (igual que un sprint):
- ramas `hotfix/<desc>` desde `develop` (o desde `master` si ya se soltó release),
- PR → `develop` con CI verde, revisado y aprobado por David, **squash merge**,
- se mergea en el orden de arriba (specs → deps → Api fix → CI env) para no pisarse.

---

## 9. Verificación de fidelidad contra los commits fuente

Al terminar cada sprint (del S1 al S6), David (o quien revise) compara, por sección, el repo nuevo contra el
commit fuente real:

```bash
# En sigeb-prod: qué cambió en esa sección en el sprint
git diff <FUENTE-ANTERIOR>..<FUENTE> -- apps/api/src/<modulo>
```

Y se revisa que el repo nuevo tenga exactamente eso. Si sobra o falta algo, se corrige con un PR
menor en el sprint siguiente.

**En los sprints 1 al 3 (prototipo)** la comparación se hace **por módulo** contra el **commit fuente**
(mientras el trabajo de cada persona sea `git diff <FUENTE> -- <su-modulo>` = vacío en el repo nuevo, el
módulo está fiel). También se puede comparar contra el espejo local `recreacion/sprint-N/<miembro>/repo/`.
El tag `v0.1-prototipo-demo` es un **hito personalizado** del repo del equipo: verifica
que NO incluya los módulos excluidos (`evaluaciones/`, `sesiones/`, `comites/`, `decisiones/`, `reportes/`,
`asistente/`, `audit/` y sus registros en `app.module.ts`/`prisma`, ni paneles admin/evaluador).

**Al cierre del S6 + estabilización (16 de octubre)** el repo nuevo debe equivaler al **estado actual de
`sigeb-prod` = CI #40 = commit `a720298`** (los 6 sprints completos más los hotfixes de la sección 8.1).
La verificación final se hace contra ese commit y no contra `e36ac2c`.

---

*Documento generado para la simulación de equipo: David, Marcos, Héctor, José, Yemerson y Hamilton.*
*Versión de referencia final: CI #40 (`a720298`).*