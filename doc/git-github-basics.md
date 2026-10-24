# 02 · Git y GitHub desde cero (para principiantes totales)

> Este documento explica, sin asumir ningún conocimiento previo, qué son Git y GitHub, cómo instalarlos
> en Windows, el vocabulario mínimo y los primeros comandos. Al final sabrás clonar un repositorio,
> crear una rama, hacer commits y entender un Pull Request. La guía específica de tus PRs está en
> `04-pr-paso-a-paso-por-persona.md`.

---

## 1. Qué es Git (explicación sencilla)

Git es un programa que **guarda el historial de cambios de tu código**, como si fuera un videojuego con
**puntos de guardado**. Cada vez que haces un **commit** (guardas), Git toma una foto del estado de tus
archivos en ese momento. Si algo se rompe, puedes volver a cualquier foto anterior.

Los 3 estados de tu trabajo en Git:

```
TU DISCO (working tree)  -->  ZONA DE PREPARADO (staging area)  -->  HISTORIAL (commits)
   (modificas archivos)        (git add = marcas qué entra)         (git commit = guardas)
```

Flujo mental: **editas → `git add` (marcas) → `git commit` (guardas) → `git push` (subes a GitHub)**.

---

## 2. Qué es GitHub

GitHub es una **página web para guardar repositorios Git en la nube** y trabajar en equipo. En GitHub:
- el **repo** vive (con su historial completo);
- cada persona hace **PRs** (Pull Requests = peticiones de cambio) para aportar su parte;
- la **CI** (Continuous Integration) corre automáticamente cuando alguien hace un PR para verificar
  que el código funciona (lint, tests, build, smoke).

**Diferencia clave:**
| Término | Qué es |
|---|---|
| **Git** | Programa local: historial de versiones (está en tu PC) |
| **GitHub** | Sitio web: guarda el repo y permite colaborar (está en internet) |

---

## 3. Instalación (Windows, paso a paso)

### 3.1 Instalar Git
1. Ve a https://git-scm.com/download/win
2. Descarga e instala (siguiente–siguiente con las opciones por defecto; **usa las opciones por defecto**).
3. Durante la instalación asegúrate de dejar activado **"Git Bash Here"** (context menu entry).

### 3.2 Instalar Node.js 20
1. Ve a https://nodejs.org (versión LTS 20.x).
2. Instala con las opciones por defecto. Node ya incluye **npm**.

### 3.3 Instalar GitHub CLI (recomendado para hacer PRs desde la terminal)
1. Ve a https://cli.github.com → descarga el instalador de Windows.
2. Instala con opciones por defecto.

### 3.4 Verificar (abre "Git Bash")
```bash
git --version      # debe mostrar algo como git version 2.4x.x.windows.x
node --version     # debe mostrar v20.x.x
npm --version      # debe mostrar 10.x.x
gh --version       # debe mostrar la versión de GitHub CLI
```

---

## 4. Crear tu cuenta de GitHub y configurar tu identidad

1. Crea tu cuenta en https://github.com/join
2. En Git Bash, dile a Git quién eres (importante: usa el **mismo nombre y email** de tu cuenta GitHub,
   así los commits se ven correctos en el historial):
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-usuario@users.noreply.github.com"
```
3. Conecta GitHub CLI con tu cuenta:
```bash
gh auth login
```
   Elige: *GitHub.com → HTTPS → Yes (log in with browser) → abre el navegador y autoriza*.

---

## 5. Vocabulario mínimo (glosario en orden de uso)

| Término | Significado | Comando típico |
|---|---|---|
| **repo / repositorio** | La carpeta del proyecto con su historial | — |
| **clone / clonar** | Copiar el repo de GitHub a tu PC por primera vez | `git clone <url>` |
| **remote** | Direcciones de servidores remotos (ej. el origin) | `git remote -v` |
| **branch / rama** | Versión paralela del código | `git checkout -b <rama>` |
| **checkout** | Moverse entre ramas | `git checkout <rama>` |
| **status** | Ver qué archivos cambiaste | `git status` |
| **add** | Marcar archivos para el commit | `git add <ruta>` |
| **commit** | Guardar el cambio con un mensaje | `git commit -m "mensaje"` |
| **push** | Subir tus commits a GitHub | `git push -u origin <rama>` |
| **pull** | Bajar los cambios de GitHub a tu PC | `git pull origin develop` |
| **fetch** | Bajar información de un remote sin mezclarla | `git fetch` |
| **PR (pull request)** | Pedir que mezclen tu rama con otra | `gh pr create` |
| **merge** | Mezclar una rama dentro de otra | (se hace en GitHub) |
| **squash** | Juntar todos tus commits en uno solo al mergear | (se hace en GitHub) |
| **rebase** | Reacomodar tus commits sobre la versión más nueva de develop | `git rebase develop` |
| **conflicto** | Dos personas tocaron las mismas líneas: Git pide decidir | (Guía en sección 9) |

---

## 6. Tu primer clon (ejemplo con el repo del equipo `proyecto-analisis-Sigeb`)

Abre **Git Bash** donde quieras trabajar (crea una carpeta `C:\proyectos`):

```bash
cd /c/proyectos
git clone https://github.com/Deividcodv/proyecto-analisis-Sigeb.git
cd proyecto-analisis-Sigeb
git branch -a          # verás develop y main (integración y producción)
git remote -v          # verás: origin → el repo del equipo
```

> En el repo del equipo **no se permite push directo a `develop`/`main`**: todo entra por Pull Request.

Si en algún momento necesitas *ver* el código del proyecto original (solo lectura), agrega un segundo remote:

```bash
git remote add sigeb-prod https://github.com/Deividcodv/sigeb-prod.git
git fetch sigeb-prod        # baja todo el historial original a tu PC (no lo mezcla)
```

> Con `sigeb-prod` agregado y actualizado (`git fetch sigeb-prod`), puedes "descargar" la versión exacta
> de código que te toca. Cómo hacerlo: `05-versiones-asignadas-por-persona.md`.

---

## 7. Implementar un cambio (flujo minuto a minuto)

```bash
# 1) Ir a la versión integrada y traer lo más reciente
git checkout develop
git pull origin develop

# 2) Crear tu rama de trabajo
git checkout -b feature/auth-login

# 3) NO olvides saber qué tienes modificado
git status

# 4) Marcar SOLO tus archivos (¡nunca git add . a ciegas!)
git add apps/api/src/auth

# 5) Guardar con mensaje claro
git commit -m "feat(auth): login con JWT y roles"

# 6) Subir al repo remoto
git push -u origin feature/auth-login

# 7) Abrir el Pull Request (gh) o desde la web
gh pr create --base develop --title "feat(auth): ..."
```

---

## 8. Cómo se ve la CI y qué es "verde"

Cuando abres el PR, GitHub muestra abajo la lista de **checks** (verde = pasó, rojo = falló):

```
✅ Lint
✅ Run Tests (128)   ← en CI #40 el conteo de la API es 128
✅ Build
✅ Smoke CI (Sprints 3-5 + S6/S7 + F7 constancia PDF)
```

Si algún check está rojo: corrige en TU misma rama y vuelve a `push`:
```bash
git add apps/api/src/auth
git commit -m "fix(auth): reparar error de test que pedía el CI"
git push
```
El check se vuelve a ejecutar automáticamente.

---

## 9. Conflictos (la situación que más miedo da y cómo resolverla)

Un **conflicto** ocurre cuando dos ramas cambian las mismas líneas del mismo archivo y Git no sabe cuál
dejar. No es un error del sistema: Git pide que **tú decidas**.

¿Cómo evitarlo en este equipo?
- Cada quien trabaja **solo sus módulos** → los conflictos deberían ser rarísimos.
- Antes de que David mergee, actualiza tu rama:
```bash
git checkout develop && git pull origin develop
git checkout feature/<tu-rama>
git rebase develop
git push --force-with-lease        # solo a TU rama feature (¡nunca a develop!)
```

Si aun así hay conflicto, Git muestra los archivos como `Unmerged` y te pide resolverlos (por ejemplo,
dejar ambas cosas). Si no estás seguro, **pide ayuda a David** — nunca apruebes un merge forzado a ciegas.

---

## 10. Errores comunes y qué significan

| Mensaje o síntoma | Qué pasa | Qué hacer |
|---|---|---|
| `src refspec ... does not match any` | Pusheas sin haber hecho commit | `git add` + `git commit` antes |
| `PLEASE REMEMBER YOU ARE TAGGING...` | Configuración de identidad incompleta | `git config --global user.name/user.email` |
| `Permission denied (publickey)` | SSH no conectado | Usa HTTPS o haz `gh auth login` |
| `error: Your local changes would be overwritten` | Tienes cambios sin guardar | `git status`, guarda/descarta primero |
| `fatal: not a git repository` | No estás en la carpeta del repo | `cd` al repo y verifica `git remote -v` |
| La CI está roja | Un test/lint falla | Corrige y `git push` de nuevo en tu rama |
| `git push` a develop/master rechazado | Rama protegida (a propósito) | Nunca se debe resolver: siempre por PR |

> **Regla de seguridad:** si `git push` a `develop` o `master` te falla, **es correcto** — esas ramas
> están protegidas y solo se actualizan por PR aprobado por David.

---

## Próximo documento

`05-versiones-asignadas-por-persona.md` — qué versión de código te toca y cómo descargarla del proyecto original.