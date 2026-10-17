# 04 · Cómo hacer y pushear tu Pull Request (guía paso a paso para cada persona)

> Esta es tu guía personal. Explica, como si nunca hubieras usado Git, todo lo que debes hacer desde
> que te asignan una sección hasta que tu Pull Request queda aprobado y mergeado.
> **Qué versión de código te toca**: lo encuentras en `05-versiones-asignadas-por-persona.md`.
> La teoría básica de Git/GitHub: `02-git-github-conceptos-basicos.md`.

---

## 1. Lo que necesitas antes de empezar (requisitos)

- [ ] Tu cuenta de GitHub creada y Git instalado (guía en `02`).
- [ ] `gh` instalado y con login: `gh auth login`
- [ ] Tu identidad configurada:
  ```bash
  git config --global user.name "Tu Nombre"
  git config --global user.email "tu-usuario@users.noreply.github.com"
  ```
- [ ] David ya te agregó como colaborador del repo del equipo `proyecto-analisis-Sigeb`.
- [ ] Saber tu sección de este sprint (módulos y rama): en `05-versiones-asignadas-por-persona.md`.

---

## 2. Clonar el repositorio (solo la primera vez)

Abre Git Bash y escribe:

```bash
cd /c/proyectos
git clone https://github.com/Deividcodv/proyecto-analisis-Sigeb.git
cd proyecto-analisis-Sigeb
```

Importante: también vamos a conectar el repositorio original para poder descargar de ahí "tu versión"
del código (solo lectura, no lo modificas):

```bash
git remote add sigeb-prod https://github.com/Deividcodv/sigeb-prod.git
git fetch sigeb-prod
```

---

## 3. Cada vez que empieces a trabajar en una sección

### 3.1 Empezar desde la versión más reciente
```bash
git checkout develop
git pull origin develop
```

### 3.2 Crear tu rama con el nombre correcto
El nombre SIEMPRE sigue la convención `feature/<modulo>-<descripcion>`:

| Módulo | Descripción | Rama completa |
|---|---|---|
| auth | login | `feature/auth-login` |
| convocatorias | crud | `feature/convocatorias-crud` |
| solicitudes | core | `feature/solicitudes-core` |
| evaluaciones | puntajes | `feature/evaluaciones-puntajes` |
| reportes | csv | `feature/reportes-csv` |
| portal | publico | `feature/portal-publico` |
| web-login | auth | `feature/web-login` |

```bash
git checkout -b feature/<modulo>-<descripcion>
```
Revisa que estés en tu rama: `git branch` (debe aparecer `* feature/...`).

> Las ramas de arreglos (post-cierre) usan `hotfix/<descripcion>` en vez de `feature/...`.

---

## 4. Obtener TU versión del código (lo más importante)

Ve al documento `05-versiones-asignadas-por-persona.md`, busca **tu persona y tu sprint**, y ahí están:
- el **commit fuente** (`<FUENTE>`) del que copias tu código,
- los **módulos** (carpetas) que te tocan,
- el **comando exacto** para copiar ese código a tu rama.

> ⭐ **Ya tienes tu código descargado en `recreacion/sprint-N/<tu-nombre>/repo/`** (espejo de las rutas
> del repo, con tu `README.md` y la carpeta `modulos/`). Puedes copiar tu sección desde ahí directo.

Ejemplo genérico (los valores exactos están en ese documento):

```bash
# Copiar SOLO tus carpetas desde el commit fuente del sprint hacia tu rama de trabajo
git checkout <FUENTE> -- apps/api/src/<tu-modulo>
```

O desde el espejo local (misma ruta, sin pasar por `sigeb-prod`):

```bash
cp -r recreacion/sprint-N/<tu-nombre>/repo/apps/api/src/<tu-modulo> apps/api/src/
```

Y confirma que no quedaron archivos raros:

```bash
git status
```
Deben aparecer únicamente archivos de **tus módulos**.

> ⚠️ Regla de oro: si necesitas un archivo de OTRO módulo para que compile, NO lo copies tú.
> Se integrará con el PR de su dueño (el orden de merge lo controla David). Tocar módulos ajenos
> provoca conflictos y el PR se rechazará.

---

## 5. Guardar tu trabajo (commit)

1. Mira todo lo que vas a commitear:
   ```bash
   git status
   ```
2. **Agrega SOLO tus rutas** (nunca `git add .` a ciegas):
   ```bash
   git add apps/api/src/<tu-modulo>
   ```
   Si tocas varios módulos tuyos:
   ```bash
   git add apps/api/src/auth apps/api/src/common
   ```
3. Escribe un mensaje con la convención (tipo + módulo + descripción):

| Tipo | Cuándo usarlo | Ejemplo |
|---|---|---|
| `feat` | Nueva funcionalidad | `feat(auth): login y registro con JWT y roles` |
| `fix` | Corrección de bug | `fix(solicitudes): validar tamaño de documentos` |
| `test` | Ajuste de tests | `test(reportes): actualizar mocks para CI` |
| `docs` | Documentación | `docs(scrum): planificacion sprint 2` |
| `chore` | Tareas de herramienta | `chore(dev): script npm para levantar todo` |
| `refactor` | Reorganizar sin cambiar comportamiento | `refactor(evaluaciones): extraer cronometro de score` |

   ```bash
   git commit -m "feat(auth): login con JWT y roles"
   ```

4. Sube tu rama a GitHub (primera vez usa `-u`):
   ```bash
   git push -u origin feature/<modulo>-<descripcion>
   ```

---

## 6. Abrir el Pull Request

### Opción A — con GitHub CLI
```bash
gh pr create --base develop --title "feat(auth): login con JWT y roles" --body "Historias: US-1, US-2
¿Cómo se probó?: npm run test y npm run lint en local, pruebo manual de login
Checklist DoD:
- [x] Tests pasan
- [x] Lint sin errores
- [x] Solo archivos de auth/common
- [x] Funcional probado"
```

### Opción B — desde la web
1. Entra al repo → pestaña **Pull requests** → **New pull request**.
2. Base: `develop` · Compare: `feature/<tu-rama>`.
3. Escribe título + descripción (misma plantilla de arriba) → **Create pull request**.

La URL del PR: pásasela a David y a tu equipo en el canal/daily.

---

## 7. Después de abrir el PR (lo que pasa solo)

- **La CI corre automáticamente** (lint → tests → build → smoke). Mírala en la pestaña **Checks** del PR.
- **Verde** = todo bien → avisa a David que lo revise.
- **Rojo** = corrígelo en tu MISMA rama:
  ```bash
  git add apps/api/src/<tu-modulo>
  git commit -m "fix(auth): corregir test que fallaba en CI"
  git push
  ```

### Si David pidió cambios
- Lee el comentario, corrige, haz commit y push de nuevo.
- La CI vuelve a correr; cuando esté verde, responde el comentario avisando que ya está corregido.

### Si mientras tanto `develop` avanzó (recomendado antes de que mergeen)
```bash
git checkout develop && git pull origin develop
git checkout feature/<tu-rama>
git rebase develop
git push --force-with-lease
```
> `--force-with-lease` solo se usa en TU rama feature, nunca en `develop`/`master`.

---

## 8. Cuando David aprueba y mergea

- El PR se mezcla con **squash** (tus commits pasan a ser **uno solo** en `develop`).
- La rama feature se elimina automáticamente.
- **Para el siguiente sprint**: vuelve a `develop`, `pull`, y crea tu nueva rama. No reutilices la rama borrada.

---

## 9. Checklist "Mi PR está listo" (cópialo en la descripción del PR)

- [ ] Estoy en mi rama `feature/<modulo>-<descripcion>`.
- [ ] `git status` muestra solo archivos de MIS módulos.
- [ ] Commits con mensajes convencionales (`feat(`/`fix(`/`test(`…).
- [ ] CI verde en el PR (Checks).
- [ ] Lo probé localmente según mi runbook (`npm run lint`, `npm run test`, pruebas manuales).
- [ ] La rama está `rebase` sobre el último `develop` antes de avisar a David.
- [ ] Dejé el enlace del PR en el daily log.

---

## 10. Qué NO debo hacer jamás

| Prohibido | Por qué |
|---|---|
| `git push` directo a `develop` o `master` | Ramas protegidas (a propósito); todo entra por PR |
| `git add .` y commitear módulos ajenos | Rompe el aislamiento de secciones y crea conflictos |
| Copiar archivos de módulos que no son míos | Idem anterior |
| Resolver un conflicto "a ciegas" | Si no se entiende, se pregunta a David |
| `--force` sin `--with-lease` | Puede pisar trabajo de otros accidentalmente |
| Ocultar un check rojo | CI en verde es requisito para aprobar |

---

## Próximo documento

`05-versiones-asignadas-por-persona.md` — tu tabla personal con la versión de código exacta que debes
descargar y pushear en cada sprint.