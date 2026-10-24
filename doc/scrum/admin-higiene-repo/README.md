# Higiene administrativa del repositorio Eduviagt

Guía para limpiar y verificar la parte administrativa del repo `Deividcodv/proyecto-analisis-Eduviagt` (no toca código de la aplicación).

El trabajo está dividido entre **David (`@Deividcodv`, owner/admin)** y **Marcos (`@TitosDoritos18`, colaborador)**.

---

## Contexto de permisos (importante)

El repositorio es de **cuenta personal**, no de organización. GitHub solo permite dos niveles en repos personales: **owner** y **collaborator (read/write)**. Por eso:

- **David** (owner) puede: cambiar settings, rulesets/protección de ramas y aprobar mergeos.
- **Marcos** (colaborador `write`) puede: crear labels, milestones, releases, ramas y Pull Requests. **No** puede cambiar settings, rulesets ni protección de ramas.
- No es posible dar rol `admin` a Marcos (falla con `422 Cannot assign ... permission of admin`). Solo se lograría **transfiriendo el repo a una organización**.

Prerrequisitos para ambos:

```pwsh
gh auth status
git remote -v   # equipo -> https://github.com/Deividcodv/proyecto-analisis-Eduviagt.git
```

Rama por defecto: `develop` (protegida: PR + 1 aprobación + check `lint-and-test`).

---

# Parte A - David (owner/admin)

## A.1 Settings del repo (squash-only + auto-borrado de ramas)

```pwsh
gh api -X PATCH repos/Deividcodv/proyecto-analisis-Eduviagt `
  -F allow_merge_commit=false `
  -F allow_rebase_merge=false `
  -F allow_squash_merge=true `
  -F delete_branch_on_merge=true
```

Verificación:

```pwsh
gh api repos/Deividcodv/proyecto-analisis-Eduviagt |
  ConvertFrom-Json |
  Select-Object allow_merge_commit, allow_rebase_merge, allow_squash_merge, delete_branch_on_merge
```

Esperado: `False False True True`.

## A.2 Rulesets

Elimina el ruleset **deshabilitado y mal configurado** "Protect master" (id `22494080`): apunta a la rama por defecto y exige un check (`ci`) que no existe. Conserva el ruleset **"Protect develop"** (activo y correcto).

```pwsh
gh api -X DELETE repos/Deividcodv/proyecto-analisis-Eduviagt/rulesets/22494080
```

Verificación (debe quedar solo "Protect develop"):

```pwsh
gh api repos/Deividcodv/proyecto-analisis-Eduviagt/rulesets |
  ConvertFrom-Json |
  Select-Object id, name, enforcement
```

## A.3 Aprobar y mergear el PR de higiene de Marcos

Cuando Marcos abra el PR `chore/admin-hygiene`, `develop` exige **1 aprobación** (Marcos no puede autoaprobar). David revisa, aprueba y mergea con **squash** una vez pase el check `lint-and-test`:

```pwsh
gh pr view --repo Deividcodv/proyecto-analisis-Eduviagt chore/admin-hygiene
gh pr review --repo Deividcodv/proyecto-analisis-Eduviagt chore/admin-hygiene --approve
gh pr merge --repo Deividcodv/proyecto-analisis-Eduviagt chore/admin-hygiene --squash
```

## A.4 Notas (David)

- **No borrar ramas**: por decisión del equipo, las ramas stale se conservan (solo se documentan).
- **Workspace local**: eliminar `recreacion/` y el archivo `s` corresponde a la máquina de David (`rm -r recreacion; rm s`). El sistema se levanta con `scripts/dev-up.ps1`.

---

# Parte B - Marcos (@TitosDoritos18, colaborador)

## B.1 PR de higiene: `chore/admin-hygiene`

Como `develop` está protegida, estos archivos entran por Pull Request.

### B.1.1 Crear la rama desde `develop`

```pwsh
git fetch equipo
git switch -c chore/admin-hygiene equipo/develop
```

### B.1.2 Archivos a agregar

Crea `.github/pull_request_template.md`:

```md
## Qué cambia

<!-- Describe brevemente el cambio -->

## Historia / issue

- US-xxx / #issue

## Checklist

- [ ] Pasa `npm run lint` y `npm run test`
- [ ] Documentación actualizada
- [ ] Sin secretos ni credenciales
- [ ] Capturas si hay cambios de UI
```

Crea `.github/ISSUE_TEMPLATE/bug.yml`:

```yaml
name: Bug
description: Reportar un fallo
title: "bug: "
labels: ["type: feat"]
body:
  - type: textarea
    id: pasos
    attributes:
      label: Pasos para reproducir
    validations:
      required: true
  - type: textarea
    id: esperado
    attributes:
      label: Resultado esperado
    validations:
      required: true
  - type: textarea
    id: real
    attributes:
      label: Resultado actual
    validations:
      required: true
```

Crea `.github/ISSUE_TEMPLATE/feature.yml`:

```yaml
name: Funcionalidad
description: Nueva funcionalidad
title: "feat: "
labels: ["type: feat"]
body:
  - type: textarea
    id: historia
    attributes:
      label: Historia de usuario (US-xxx)
    validations:
      required: true
  - type: textarea
    id: criterios
    attributes:
      label: Criterios de aceptación
    validations:
      required: true
```

Crea `.github/ISSUE_TEMPLATE/tarea.yml`:

```yaml
name: Tarea
description: Trabajo de mantenimiento o configuración
title: "chore: "
labels: ["type: chore"]
body:
  - type: textarea
    id: descripcion
    attributes:
      label: Descripción
    validations:
      required: true
  - type: textarea
    id: pasos
    attributes:
      label: Pasos
    validations:
      required: true
```

Crea `CONTRIBUTING.md`:

```md
# Contribuir

## Ramas

- `develop` es la rama de integración (rama por defecto).
- Trabaja en ramas `feature/...`, `chore/...`, `docs/...`, `ci/...`.

## Commits

Usa Conventional Commits: `feat(api): ...`, `fix(web): ...`, `docs(scrum): ...`.

## Pull Requests

- Todo cambio entra por PR contra `develop`.
- `develop` requiere 1 aprobación y que pase el check `lint-and-test`.
- Solo se usa **squash merge**; la rama se borra automáticamente al mergear.

## Calidad

- Ejecuta `npm run lint`, `npm run test` y `npm run build` antes de abrir el PR.
```

Reemplaza `SECURITY.md` (el actual es el placeholder por defecto de GitHub):

```md
# Política de seguridad

## Reportar una vulnerabilidad

Escribe a `soporte@sigeb.gov.gt` con:
- Descripción del problema y pasos para reproducirlo.
- Impacto potencial.
- Versión o commit afectado.

No abras issues públicos para vulnerabilidades. Responderemos en un plazo de 5 días hábiles.

## Alcance

Este repositorio es el proyecto académico EDUVIAGT GT. Aplica a `apps/api` y `apps/web`.
```

### B.1.3 Commit, push y PR

```pwsh
git add .github CONTRIBUTING.md SECURITY.md
git commit -m "chore(admin): plantillas de issue/PR, CONTRIBUTING y SECURITY"
git push -u equipo chore/admin-hygiene
gh pr create --repo Deividcodv/proyecto-analisis-Eduviagt `
  --base develop --head chore/admin-hygiene `
  --title "chore(admin): plantillas, CONTRIBUTING y SECURITY" `
  --body "Higiene administrativa: plantillas de issue/PR, CONTRIBUTING.md y SECURITY.md propio."
```

Luego avisa a David para que apruebe y mergee (Parte A.3).

## B.2 Labels

```pwsh
$repo = "Deividcodv/proyecto-analisis-Eduviagt"

# Tipo
gh label create "type: feat"  --repo $repo --color 0E8A16 --description "Nueva funcionalidad" --force
gh label create "type: chore" --repo $repo --color FBCA04 --description "Mantenimiento/configuración" --force
gh label create "type: docs"  --repo $repo --color 0075CA --description "Documentación" --force
gh label create "type: ci"    --repo $repo --color 5319E7 --description "Integración continua" --force

# Prioridad
gh label create "priority: alta"  --repo $repo --color B60205 --description "Prioridad alta" --force
gh label create "priority: media" --repo $repo --color D93F0B --description "Prioridad media" --force
gh label create "priority: baja"  --repo $repo --color FEF2C0 --description "Prioridad baja" --force

# Área
gh label create "area: api" --repo $repo --color 1D76DB --description "Backend NestJS" --force
gh label create "area: web" --repo $repo --color 0E8A16 --description "Frontend Next.js" --force
gh label create "area: db"  --repo $repo --color 5319E7 --description "Base de datos/Prisma" --force

# Sprint
gh label create "sprint: s1" --repo $repo --color C5DEF5 --force
gh label create "sprint: s2" --repo $repo --color C5DEF5 --force
gh label create "sprint: s3" --repo $repo --color C5DEF5 --force
gh label create "sprint: s4" --repo $repo --color C5DEF5 --force
gh label create "sprint: s5" --repo $repo --color C5DEF5 --force
gh label create "sprint: s6" --repo $repo --color C5DEF5 --force
gh label create "sprint: s7" --repo $repo --color C5DEF5 --force
```

Verificación:

```pwsh
gh label list --repo $repo --limit 100
```

## B.3 Milestones

```pwsh
$repo = "Deividcodv/proyecto-analisis-Eduviagt"
1..7 | ForEach-Object {
  $title = "S$_"
  gh api "repos/$repo/milestones" -f title=$title | Out-Null
  Write-Host "Milestone creado: $title"
}
```

Verificación:

```pwsh
gh api "repos/$repo/milestones?state=all&per_page=100" |
  ConvertFrom-Json |
  Select-Object title, state
```

## B.4 Releases de tags existentes

Ya existen los tags `v0.1-prototipo-demo` y `v0.2-s4-evaluacion` pero sin release:

```pwsh
$repo = "Deividcodv/proyecto-analisis-Eduviagt"

gh release create v0.1-prototipo-demo `
  --repo $repo `
  --title "v0.1 - Prototipo demo" `
  --notes "Primer prototipo funcional: autenticación, portal público y convocatorias."

gh release create v0.2-s4-evaluacion `
  --repo $repo `
  --title "v0.2 - Sprint 4 Evaluación" `
  --notes "Flujo de evaluación: evaluaciones, comités, sesiones y rechazo de documentos."
```

Verificación:

```pwsh
gh release list --repo $repo
```

---

# Verificación final

## David (settings y rulesets)

```pwsh
$repo = "Deividcodv/proyecto-analisis-Eduviagt"
echo "=== Settings ==="
gh api "repos/$repo" | ConvertFrom-Json |
  Select-Object allow_merge_commit, allow_rebase_merge, allow_squash_merge, delete_branch_on_merge
echo "=== Rulesets (solo 'Protect develop') ==="
gh api "repos/$repo/rulesets" | ConvertFrom-Json | Select-Object id, name, enforcement
```

Checklist David:
- [ ] Solo squash merge; `delete_branch_on_merge` activo.
- [ ] Ruleset "Protect master" eliminado; "Protect develop" intacto.
- [ ] PR `chore/admin-hygiene` aprobado y mergeado.

## Marcos (artefactos)

```pwsh
$repo = "Deividcodv/proyecto-analisis-Eduviagt"
echo "=== Labels ==="
gh label list --repo $repo --limit 100
echo "=== Milestones ==="
gh api "repos/$repo/milestones?state=all&per_page=100" | ConvertFrom-Json | Select-Object title, state
echo "=== Releases ==="
gh release list --repo $repo
echo "=== PR ==="
gh pr view --repo $repo chore/admin-hygiene
```

Checklist Marcos:
- [ ] PR `chore/admin-hygiene` abierto (plantillas, CONTRIBUTING, SECURITY).
- [ ] Labels de tipo/prioridad/área/sprint creados.
- [ ] Milestones `S1`…`S7` creados.
- [ ] Releases `v0.1-prototipo-demo` y `v0.2-s4-evaluacion` creados.

---

# Fuera de alcance

- **No borrar ramas**: las ramas stale se conservan (solo se documentan).
- **CI `master` / environment `production`**: el workflow referencia `refs/heads/master` y un environment `production` que no existen. Se reporta; corregirlo es un cambio de CI aparte.
