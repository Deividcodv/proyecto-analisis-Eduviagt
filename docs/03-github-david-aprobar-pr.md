# 03 · Guía de GitHub para David — revisar, probar y aprobar PRs

> Documento **solo para David** (admin del repo y Scrum Master). Explica, paso a paso y desde cero,
> cómo revisar un Pull Request, verificar la CI, probar el código, aprobar y mergear, hacer el release
> semanal y verificar que el proyecto nuevo quede fiel al original (hasta **CI #40 = `a720298`**).
> Además: **al cierre del S3 creas el hito personalizado `v0.1-prototipo-demo`** para el demo ≈ 16 sep.

---

## 1. Tu rol y tus privilegios

- Eres **Owner/admin** del repositorio del equipo `proyecto-analisis-Sigeb`.
- Tienes permiso para: crear el repo, invitar colaboradores, configurar ramas protegidas, **dar revisión y
  aprobar PRs**, hacer merge (squash), y crear releases.
- Los devs tienen permiso **Write** (solo para empujar sus ramas `feature/*` y abrir PRs). No pueden
  mergear a `develop` ni `master` ni saltarse las protecciones (verificado que así esté en Settings).

---

## 2. Antes de empezar: clonar y preparar tu entorno local

```bash
git clone https://github.com/Deividcodv/proyecto-analisis-Sigeb.git
cd proyecto-analisis-Sigeb
npm ci                 # instala dependencias (suele tardar ~1 min)
```

Si lo necesitas, agrega el repo original como referencia de solo lectura:

```bash
git remote add sigeb-prod https://github.com/Deividcodv/sigeb-prod.git
git fetch sigeb-prod
```

Levantar el proyecto para probar:

```bash
# Base de datos local (si usas Docker): levanta Postgres
docker-compose up -d postgres      # o el comando que esté documentado

# API
cd apps/api
npx prisma generate
npx prisma migrate deploy
npx prisma db seed                  # crea usuarios de demo (admin@sigeb.gov.gt / Admin123!)
npm run start:prod                  # levanta la API en http://localhost:3000

# Web (en otra terminal)
cd apps/web
npm run dev                         # levanta la web en http://localhost:3001
```

> Detalles propios del sistema: `doc/operations/setup.md`, `doc/operations/troubleshooting.md`.

---

## 3. Verificar la preparación de una sola vez

En Settings → Branches (repo nuevo), confirma que `master` y `develop` tengan:
- [x] Require a pull request before merging
- [x] Require 1 approving review
- [x] Require status checks (el workflow `CI`)
- [x] No pusheos directos a esas ramas (los devs no deben poder saltarlas)

En Settings → Collaborators: los 5 devs tienen **Write**.

En `.github/workflows/ci.yml`: debe existir el job `lint-and-test` con **lint → tests → build → smoke**
(incluido el smoke con constancia PDF). Referencia esperada actual: **CI #40** (verde).

---

## 4. Revisar un Pull Request (lo que haces cada semana)

### 4.1 Dónde verlos
- Web: pestaña **Pull requests** del repo.
- Terminal: `gh pr list` y `gh pr view <número>`.

### 4.2 Lista de verificación antes de aprobar (Checklist de David)

| # | Pregunta | Cómo se responde |
|---|---|---|
| 1 | ¿El título y mensaje siguen Conventional Commits? (`feat(scope):`, `fix(scope):`, `test:`, `fix(ci):` …) | Revisar título + commits del PR |
| 2 | ¿La rama base es `develop` (no `master`)? | Se ve en la cabecera del PR |
| 3 | ¿La CI está **completamente verde**? (lint, tests, build, smoke) | Pestaña "Checks" del PR |
| 4 | ¿Solo contiene **archivos del módulo del autor**? | Pestaña "Files changed" |
| 5 | ¿No toca archivos compartidos sin permiso? (`schema.prisma`, `migrations/`, `app.module.ts`, `main.ts`, `package.json`, `turbo.json`, `.github/workflows/ci.yml`) | Pestaña "Files changed" |
| 6 | ¿Incluye tests o al menos no los rompe? | Comprobar en "Checks" / "Files changed" |
| 7 | ¿Cubre la historia(s) del sprint planificada? | Contra `doc/scrum/sprint-N/sprint-planning.md` |
| 8 | ¿Lo probaste localmente? | Ver sección 5 |

**Si algo no cumple:** solicita cambios (Review → *Request changes*) con un comentario breve y claro:
*"CI en rojo: falla el test X. Corrige y vuelve a pushear".*

### 4.3 Reglas firmes
- **CI en rojo = NO se aprueba.** Nunca.
- Solo archivos del autor = NO se aprueba si aparecen módulos ajenos (se pide al dev que los quite).
- Orden de merge del sprint (para no pisarse): backend de dominio → evaluación/decisiones →
  reportes/auditoría/IA → frontend → CI/docs (David lo fija; puedes verlo en el planning).

---

## 5. Probar el PR localmente (rápido y concreto)

1. Tráete la rama del PR:
   ```bash
   git checkout develop && git pull origin develop
   git fetch origin pull/<NUM_PR>/head:pr-<NUM_PR>
   git checkout pr-<NUM_PR>
   ```
2. Instala/actualiza dependencias si las cambió: `npm ci`
3. Ejecuta tests y lint:
   ```bash
   npm run lint
   npm run test
   ```
4. Prueba manual (si el PR lo amerita):
   - HTML/API: `npm run start:prod` (API en :3000) — probar endpoints con los usuarios demo del seed.
   - Web: `npm run dev` (:3001) — navegar las pantallas que el PR dice haber tocado.
5. No olvides **regresar a develop** al terminar: `git checkout develop`.

> Tip: el seed crea usuarios demo: `admin@sigeb.gov.gt`, `postulante@demo.gt`, `evaluador@demo.gt`,
> `coordinador@demo.gt`, `miembro@demo.gt` — contraseña `Admin123!`.

---

## 6. Aprobar y mergear (squash)

### Por web
1. En el PR → **Review changes** → **Approve**.
2. Espera a que la CI termine en verde (si no está, no hagas esto).
3. **Merge pull request** → elige **"Squash and merge"**.
4. GitHub te deja editar el mensaje final: usa algo como `feat(auth): login con JWT (#45)`.
5. Confirma que el botón **"Delete branch"** quede activado (borra la rama feature).

### Por terminal (con `gh`)
```bash
gh pr checkout <NUM_PR>
npm run lint && npm run test        # verificación rápida
gh pr review <NUM_PR> --approve
gh pr merge <NUM_PR> --squash --delete-branch
```

Resultado deseado: el PR entra a `develop` como **un solo commit**, CI verde, rama borrada.

---

## 7. Release semanal (después del sprint)

Al cierre de cada sprint, `develop` = incremento del sprint. Para dejar "versión" en `master`:

1. Abre un PR `develop → master` (`gh pr create --base master --head develop ...`).
2. Revisa el resumen del PR (debe ver todo el sprint).
3. Espera CI verde → apruebas y haces **squash merge**.

> Al final del bloque de estabilización (CI #35–40), este release envía el estado **CI #40 = `a720298`**
> a `master` → la simulación queda idéntica al proyecto real.

---

## 8. Verificación de fidelidad contra el original (cada sprint)

Comprueba que la sección de cada dev en `develop` sea **exactamente** la que está en `sigeb-prod` en su
**commit fuente** del sprint (también espejada localmente en `recreacion/sprint-N/<miembro>/repo/`):

```bash
git fetch sigeb-prod
# Ejemplo: sección de Héctor en S2 (convocatorias públicas, entre 85122d2 y 986fc89)
git diff 85122d2..986fc89 -- apps/api/src/convocatorias
```

Compara con lo que hay en `develop` del repo nuevo para esa misma carpeta (o contra
`recreacion/sprint-N/<miembro>/repo/`). Si falta/sobra algo,
manda un PR menor (o `hotfix/`) para corregirlo antes del viernes.

**Prototipo (S1–S3):** en los primeros 3 sprints la verificación es **por módulo** contra el **commit fuente**
(la sección de cada dev debe igualar exactamente el contenido del commit fuente en su carpeta; referencia
local equivalente: `recreacion/sprint-N/<miembro>/repo/`). David además,
al cierre del S3, crea el **hito personalizado `v0.1-prototipo-demo`** en el repo del equipo (tag) con solo los
módulos del prototipo y **sin** `evaluaciones/`, `sesiones/`, `comites/`, `decisiones/`, `reportes/`,
`asistente/`, `audit/` (y sus registros en `app.module.ts`/`prisma`) ni paneles `admin`/`evaluador`. Ese tag
no tiene por qué coincidir con un commit de `sigeb-prod`.

**Cierre final (16-oct):** verificación completa contra **CI #40 = `a720298`**:
```bash
git diff a720298 -- apps/api/src  apps/web/src   # en el contexto de sigeb-prod
```
y revisa que `develop` (y `master`) del repo nuevo contengan exactamente eso.

---

## 9. Actas y documentos por sprint

Antes de cerrar la semana, crea/revisa (con base en los PRs del sprint):

- `doc/scrum/sprint-N/review.md` — demo, historias completadas, puntos cumplidos (ej. 29/29).
- `doc/scrum/sprint-N/retrospective.md` — qué mejorar.
- `doc/scrum/sprint-N/daily-log.md` — avance diario de cada dev.

> En los sprints de la simulación (S1–S3) las carpetas son `doc/scrum/recreacion-sprint-1-cimientos/`,
> `doc/scrum/recreacion-sprint-2-portal-publico/` y `doc/scrum/recreacion-sprint-3-login-dashboard/`.

---

## Próximo documento

`04-pr-paso-a-paso-por-persona.md` (para entregar a cada dev) y
`05-versiones-asignadas-por-persona.md` (para confirmar qué versión corresponde a cada sección).