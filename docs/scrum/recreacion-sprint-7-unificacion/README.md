# README — Colaboradores · Sprint 7

> **Unificación de documentación y paridad (NO definitivo)**
> Referencia: `EDUVIAGT-prod@b62070b` · Repo de trabajo: `proyecto-analisis-Eduviagt`
> **~37 archivos** · **5 PRs** · **2 responsables: José y Yemerson**
>
> Documento autocontenido. Cada persona tiene su sección con los comandos exactos.
> Nadie escribe código a mano: todo es `git checkout` literal desde `b62070b`.

---

## Índice

1. [Contexto y reglas generales](#1-contexto-y-reglas-generales)
2. [Orden de PRs, dependencias y revisiones](#2-orden-de-prs-dependencias-y-revisiones)
3. [JOSÉ — PR 1 y PR 3](#3-josé)
4. [YEMERSON — PR 2, PR 4 y PR 5](#4-yemerson)
5. [Verificación global](#5-verificación-global)
6. [Excepciones declaradas](#6-excepciones-declaradas)
7. [No es el cierre definitivo](#7-no-es-el-cierre-definitivo)
8. [Problemas frecuentes](#8-problemas-frecuentes)

---

## 1. Contexto y reglas generales

El **Sprint 6 (cierre de equivalencia)** ya está mergeado en `develop`: el **código** del repo
del equipo (**252/252 archivos de `apps/`, 10/10 migraciones, config y CI**) es equivalente a
`EDUVIAGT-prod@b62070b`. **No falta nada funcional.**

El **Sprint 7** solo cierra la brecha de **documentación** (que el S6 dejó fuera de alcance) y
normaliza 5 archivos cosméticos. **Nada de código de negocio.** Este sprint **no es el cierre
definitivo** (ver sección 7).

### 1.1 Remotos

Cada clon debe tener dos remotos:

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

Si `git cat-file -t b62070b` falla, repite el fetch del producto antes de continuar.

### 1.3 Preflight de cada PR

Siempre desde `develop` actualizado y en una rama nueva:

```bash
git switch develop
git pull --ff-only equipo develop
git switch -c <rama-del-PR>
```

### 1.4 Reglas de oro

1. **Una rama por PR**, creada desde `develop` actualizado.
2. Restaurar **solo** con `git checkout b62070b -- <rutas>` (salvo la reubicación del PR 3).
3. **No editar** documentos existentes ni borrar nada.
4. `git add` siempre **por ruta** (nunca `git add .` a lo bruto).
5. **No tocar** el código de S0–S6 (ni `apps/`, ni `prisma/`, ni CI).
6. Ningún PR se mergea sin la revisión asignada y sin CI verde.

---

## 2. Orden de PRs, dependencias y revisiones

| Orden | PR | Rama | Dueño | Revisor | Archivos |
|---|---|---|---|---|---|
| 1 | PR 1 | `docs/s7-arquitectura-standards` | José | Yemerson | 16 |
| 2 | PR 2 | `docs/s7-guias-colaboracion` | Yemerson | José | 7 |
| 3 | PR 3 | `docs/s7-scrum-s9` | José | Yemerson | 4 |
| 4 | PR 4 | `chore/s7-normalizacion` | Yemerson | José | 5 |
| 5 | PR 5 | `docs/s7-artefactos` | Yemerson | José | 5 (nuevos) |

**Por qué este orden**

- **PR 1, PR 2 y PR 4** son independientes y pueden ir en paralelo (rutas disjuntas).
- **PR 3** toca `Docs/scrum/`; va después de PR 1 para no chocar con `docs/`.
- **PR 5** va al final: son los artefactos Scrum del S7, que cierran el sprint.
- **David (SM/admin)** aprueba cada merge (squash) tras la review cruzada.

> Los PRs 1–4 son **restauración literal** desde `b62070b`. El PR 5 crea archivos nuevos.

---

## 3. JOSÉ

Total: **20 archivos** (PR 1 + PR 3).

### PR 1 — `docs/s7-arquitectura-standards` (16 archivos)

Documentación técnica del producto: arquitectura, estándares, operaciones, equipo, glosario y
changelog.

```bash
git switch develop
git pull --ff-only equipo develop
git switch -c docs/s7-arquitectura-standards

git checkout b62070b -- \
  docs/README.md \
  docs/architecture \
  docs/standards \
  docs/operations \
  docs/team \
  docs/changelog.md \
  docs/glossary.md
```

Verifica (debe salir vacío):

```bash
git diff --name-only b62070b -- \
  docs/README.md docs/architecture docs/standards docs/operations docs/team \
  docs/changelog.md docs/glossary.md
```

Publica:

```bash
git add -A
git commit -m "docs(s7): portar documentacion tecnica (arquitectura, estandares, operaciones, equipo) desde b62070b"
git push -u equipo docs/s7-arquitectura-standards
gh pr create --base develop --head docs/s7-arquitectura-standards \
  --title "docs(s7): documentacion tecnica" \
  --body "Restauracion literal desde b62070b. Alcance: docs/README.md, docs/architecture, docs/standards, docs/operations, docs/team, docs/changelog.md, docs/glossary.md. Verificado con git diff vacio." \
  --reviewer <handle-Yemerson>
```

### PR 3 — `docs/s7-scrum-s9` (4 archivos)

Artefactos del Sprint 9 del producto, reubicados al layout del equipo (`Docs/scrum/`).

```bash
git switch develop
git pull --ff-only equipo develop
git switch -c docs/s7-scrum-s9

git checkout b62070b -- docs/scrum/sprint-9-mejoras-transversales
mkdir -p Docs/scrum/sprint-9-mejoras-transversales
git mv docs/scrum/sprint-9-mejoras-transversales/* Docs/scrum/sprint-9-mejoras-transversales/
```

Verifica (contenido idéntico por blob):

```bash
for f in goal backlog review retrospective; do
  test "$(git rev-parse b62070b:docs/scrum/sprint-9-mejoras-transversales/$f.md)" \
     = "$(git rev-parse HEAD:Docs/scrum/sprint-9-mejoras-transversales/$f.md)" \
    && echo "OK $f" || echo "DIF $f"
done
```

Publica:

```bash
git add -A
git commit -m "docs(s7): portar artefactos Scrum del Sprint 9 (mejoras transversales) a Docs/scrum"
git push -u equipo docs/s7-scrum-s9
gh pr create --base develop --head docs/s7-scrum-s9 \
  --title "docs(s7): scrum sprint 9" \
  --body "Contenido literal de docs/scrum/sprint-9-mejoras-transversales desde b62070b, reubicado a Docs/scrum/sprint-9-mejoras-transversales (layout del equipo). Verificado por igualdad de blob." \
  --reviewer <handle-Yemerson>
```

---

## 4. YEMERSON

Total: **17 archivos** (PR 2 + PR 4 + PR 5).

### PR 2 — `docs/s7-guias-colaboracion` (7 archivos)

Guías de colaboración del producto.

```bash
git switch develop
git pull --ff-only equipo develop
git switch -c docs/s7-guias-colaboracion

git checkout b62070b -- docs
```

Verifica (debe salir vacío):

```bash
git diff --name-only b62070b -- docs
```

Publica:

```bash
git add -A
git commit -m "docs(s7): portar guias de colaboracion desde b62070b"
git push -u equipo docs/s7-guias-colaboracion
gh pr create --base develop --head docs/s7-guias-colaboracion \
  --title "docs(s7): guias de colaboracion" \
  --body "Restauracion literal de docs/ (00-indice, 01-scrum, 02-git, 03-pr-david, 04-pr-persona, 05-versiones, guia-recreacion-6-personas) desde b62070b." \
  --reviewer <handle-Jose>
```

### PR 4 — `chore/s7-normalizacion` (5 archivos)

Paridad byte a byte de los 5 archivos que difieren solo por salto de línea final.

```bash
git switch develop
git pull --ff-only equipo develop
git switch -c chore/s7-normalizacion

git checkout b62070b -- \
  .gitattributes \
  apps/api/.eslintrc.json \
  apps/web/.eslintrc.json \
  apps/api/tsconfig.build.json \
  apps/api/prisma/migrations/20260829061028_asistente_tsvector/migration.sql
```

Verifica (debe salir vacío):

```bash
git diff --name-only b62070b -- \
  .gitattributes apps/api/.eslintrc.json apps/web/.eslintrc.json \
  apps/api/tsconfig.build.json \
  apps/api/prisma/migrations/20260829061028_asistente_tsvector/migration.sql
```

Publica:

```bash
git add -A
git commit -m "chore(s7): normalizar archivos cosmeticos (salto de linea) para paridad con b62070b"
git push -u equipo chore/s7-normalizacion
gh pr create --base develop --head chore/s7-normalizacion \
  --title "chore(s7): normalizacion cosmetica" \
  --body "Restauracion literal desde b62070b de 5 archivos que solo diferian por salto de linea final. Sin cambios de logica." \
  --reviewer <handle-Jose>
```

> Nota: el producto **no** tiene salto de línea final en estos archivos; con este PR el diff
> vs `b62070b` queda en cero. Si el equipo prefiere conservar el salto, se omite este PR (queda
> como excepción declarada).

### PR 5 — `docs/s7-artefactos` (5 archivos nuevos)

Artefactos Scrum del Sprint 7, marcados explícitamente como **sujetos a cambios**.

Crea `Docs/scrum/sprint-7-unificacion/` con:

- `goal.md` — objetivo del sprint (unificación de documentación, no definitivo).
- `backlog.md` — PRs 1–5 con su estado.
- `daily-log.md` — bitácora de los 2 responsables.
- `review.md` — qué se portó (referencia `b62070b`).
- `retrospective.md` — aprendizajes + follow-up (S8/hotfix).

Publica:

```bash
git add Docs/scrum/sprint-7-unificacion
git commit -m "docs(s7): artefactos Scrum del Sprint 7 (unificacion de documentacion)"
git push -u equipo docs/s7-artefactos
gh pr create --base develop --head docs/s7-artefactos \
  --title "docs(s7): artefactos scrum sprint 7" \
  --body "goal/backlog/daily/review/retrospective del S7. Sprint de documentacion, NO cierre definitivo." \
  --reviewer <handle-Jose>
```

---

## 5. Verificación global

Cuando los 5 PRs estén mergeados en `develop`:

```bash
git switch develop
git pull --ff-only equipo develop
```

### 5.1 Código (debe quedar sin diferencias funcionales)

```bash
git diff --name-status b62070b -- apps
# Esperado: vacío
```

### 5.2 Scopes de código (solo excepciones declaradas del equipo)

```bash
git diff --name-status b62070b -- \
  .gitattributes .env.example .gitignore docker-compose.prod.yml \
  package-lock.json README.md apps .github scripts
```

**Resultado esperado (exactamente estas líneas):**

```
A  .github/CODEOWNERS
M  README.md
A  LICENSE
A  SECURITY.md
```

- `README.md` → título `# EDUVIA-gt` (branding del equipo).
- `CODEOWNERS`, `LICENSE`, `SECURITY.md` → aportes propios del equipo (no existen en el producto).
- Si aparece **cualquier otro** archivo de código → algo se portó mal.

### 5.3 Documentación portada (muestra)

```bash
test -f docs/architecture/decisions.md && echo OK docs/architecture
test -f docs/guia-recreacion-6-personas.md && echo OK docs
test -f Docs/scrum/sprint-9-mejoras-transversales/goal.md && echo OK scrum-s9
test -f Docs/scrum/sprint-7-unificacion/goal.md && echo OK scrum-s7
```

### 5.4 CI

`npm run lint` y `npm run build` verdes en los workspaces + smoke CI del PR.

---

## 6. Excepciones declaradas

| Excepción | Motivo |
|---|---|
| `README.md` (`# EDUVIA-gt`) | identidad del repositorio del equipo |
| `.github/CODEOWNERS`, `LICENSE`, `SECURITY.md` | aportes propios del equipo; no existen en el producto |
| `Docs/` (scrum del equipo + fichas por persona) | layout propio del equipo, en lugar de `docs/scrum` + `docs/` |
| PR 4 omitido (opcional) | si se conserva el salto de línea final; irrelevante funcionalmente |

---

## 7. No es el cierre definitivo

- Este sprint **no** crea tag ni release congelado.
- **No** borra ni reescribe nada de S0–S6.
- Todo es **aditivo y reversible** por PR.
- Los artefactos del PR 5 declaran el trabajo como **en curso / sujeto a cambios**.
- Queda preparado un **seguimiento (S8 o `hotfix/*`)** por si se requieren ajustes posteriores.

---

## 8. Problemas frecuentes

| Síntoma | Causa / solución |
|---|---|
| `fatal: invalid object name 'b62070b'` | falta `git fetch EDUVIAGT-prod`; confirma `git cat-file -t b62070b` |
| `pathspec ... did not match` | ruta inexistente en `b62070b`; revisa la ruta exacta |
| `git diff` global muestra archivos de código extra | un PR cubrió de más; vuelve a correr solo sus `git checkout` |
| El PR 3 deja `docs/scrum` vacío | es correcto: se movió a `Docs/scrum/sprint-9-mejoras-transversales` |
| `git diff` global muestra solo las 4 líneas esperadas | **correcto**: la unificación quedó bien |
| `git fetch` no trae `b62070b` | confirma que el remoto `EDUVIAGT-prod` apunta a `Deividcodv/EDUVIAGT-prod` |
