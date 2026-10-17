# README — Colaboradores Sprint 3 (Login + Dashboard)

Guía paso a paso para David, Hamilton, Marcos y Yemerson. Contiene los comandos y
los cambios de código exactos que debe hacer cada uno, con base en las fuentes
`890c423` (David: arranque + CORS) y `3dfa19a` (Hamilton/Yemerson: web auth +
dashboard, US-49/50) del remote `sigeb-prod`, sobre `develop` del repo de trabajo
`proyecto-analisis-Eduviagt`.

> Cierre del prototipo: al terminar el sprint, David crea el hito personalizado
> `v0.1-prototipo-demo` (portal público + login + dashboard). La simulación
> continúa en S4 (evaluación).

---

## §0 Precondiciones comunes (todos)

Si el remote `sigeb-prod` no existe aún en tu clon:

```bash
cd /c/proyectos/proyecto-analisis-Eduviagt
git remote add sigeb-prod https://github.com/Deividcodv/sigeb-prod.git
git fetch sigeb-prod
```

Antes de **crear tu rama**, siempre:

```bash
git checkout develop
git pull origin develop
```

### Reglas de oro

- La PR va con base **`develop`**, título y commit **convencionales**, CI **verde**.
- Tu PR debe contener **solo tus archivos**.
- **NO** copies imports/archivos de otros miembros (siempre hay fidelidad a la fuente, pero la
  integración de cada archivo la hace su dueño).
- **NO** copies las páginas `admin` ni `evaluador` (van en S5/S6).
- **NO** copies módulos del backend de S4+ (evaluaciones, sesiones, comités, decisiones,
  reportes, asistente, auditoría): el `app.module.ts` del prototipo NO los registra.
- `layout.tsx`, `Header.tsx` y `lib/api.ts` actuales en `develop` (del portal S2) son
  **sobrescritos** por las versiones S3 de la fuente `3dfa19a`: asegúrate de no tener cambios
  locales pendientes en esos archivos.

### Nota de integración frontend–frontend (leer antes de §1 y §2)

En `3dfa19a`, el `Header.tsx` importa `UserMenu` (`@/components/layout/UserMenu`) y el
`layout.tsx` envuelve la app con `AuthProvider`. Esto crea una dependencia cruzada entre los
PR de Hamilton (Header + AuthContext) y de Yemerson (UserMenu). Conocida en la retrospectiva
S3: *"el UserMenu dependía del estado de sesión de Hamilton; se integró un día después del
check-in del dashboard"*.

Para no romper la CI en el PR de Hamilton, el orden de merge fijo es **David → Hamilton →
Yemerson** y, si tu CI ejecuta `next build` (compila todo `apps/web/src`), integra ambos
cambios en la misma ventana de merge buscando que el paquete de archivos final sea idéntico a
`3dfa19a` (ver §5).

---

## §1 HAMILTON — Frontend login/registro (US-49) + dashboard postulante (US-50)

Entregable: módulos de sesión del portal y el dashboard del postulante desde `3dfa19a`.

```bash
git fetch sigeb-prod
git checkout develop && git pull origin develop
git checkout -b feature/web-login

# Páginas de auth y dashboard
git checkout 3dfa19a -- apps/web/src/app/login apps/web/src/app/registro apps/web/src/app/dashboard
# Sesión persistente (context + ruta protegida)
git checkout 3dfa19a -- apps/web/src/context apps/web/src/components/auth/ProtectedRoute.tsx
# Cliente API con interceptor (desempaquetado) + refresh de tokens
git checkout 3dfa19a -- apps/web/src/lib/api-auth.ts apps/web/src/lib/auth.ts apps/web/src/lib/api.ts
# Layout con AuthProvider + Header que consume UserMenu + Badge
git checkout 3dfa19a -- apps/web/src/app/layout.tsx apps/web/src/components/layout/Header.tsx apps/web/src/components/ui/Badge.tsx

git status   # deben salir SOLO apps/web/src (login, registro, dashboard, context, auth, lib, layout, Header, Badge)
git add apps/web/src/app/login apps/web/src/app/registro apps/web/src/app/dashboard apps/web/src/context apps/web/src/components/auth/ProtectedRoute.tsx apps/web/src/lib apps/web/src/app/layout.tsx apps/web/src/components/layout/Header.tsx apps/web/src/components/ui/Badge.tsx
git commit -m "feat(web): login/registro con sesion persistente y dashboard del postulante (US-49/50)"
git push -u origin feature/web-login
```

### Archivos NO incluidos en tu PR

- `apps/web/src/components/layout/UserMenu.tsx` → lo entrega **Yemerson** (§2); tu `Header.tsx`
  ya lo importa, la integración la cierra el merge de Yemerson.
- `apps/web/src/app/admin` y `apps/web/src/app/evaluador` → se excluyen a mano (van en S5/S6).

### Dependencias del portal S2 (ya existen en `develop`)

`Footer.tsx`, `MobileMenu.tsx`, `Button.tsx`, el resto de la UI del portal y `lib/api.ts`
anterior. No los copies: ya están.

### Abrir la PR

```bash
gh pr create --base develop --title "feat(web): S3" --body "login/registro + AuthContext/ProtectedRoute + dashboard postulante desde 3dfa19a (US-49/50); sin paneles admin/evaluador; el UserMenu se integra en el PR de Yemerson; CI verde"
```

### Verificación antes de avisar a David

```bash
git diff 3dfa19a -- apps/web/src/app/login apps/web/src/app/registro apps/web/src/app/dashboard
git diff 3dfa19a -- apps/web/src/context apps/web/src/components/auth/ProtectedRoute.tsx
git diff 3dfa19a -- apps/web/src/lib/api-auth.ts apps/web/src/lib/auth.ts apps/web/src/lib/api.ts
git diff 3dfa19a -- apps/web/src/app/layout.tsx apps/web/src/components/layout/Header.tsx apps/web/src/components/ui/Badge.tsx
# Todas las diferencias deben quedar VACÍAS
git log --oneline -3
```

---

## §2 YEMERSON — UserMenu e integración de sesión en el header del portal

Entregable: `apps/web/src/components/layout/UserMenu.tsx` desde `3dfa19a` (menú de sesión:
nombre/rol, "Mi panel", cerrar sesión).

```bash
git fetch sigeb-prod
git checkout develop && git pull origin develop
git checkout -b feature/portal-usermenu

git checkout 3dfa19a -- apps/web/src/components/layout/UserMenu.tsx

git status   # SOLO apps/web/src/components/layout/UserMenu.tsx
git add apps/web/src/components/layout/UserMenu.tsx
git commit -m "feat(portal): UserMenu de sesion en el header (nombre/rol, mi panel, logout)"
git push -u origin feature/portal-usermenu
```

### Abrir la PR

```bash
gh pr create --base develop --title "feat(portal): S3" --body "UserMenu.tsx desde 3dfa19a; consume AuthContext (PR de Hamilton); integra el logout del prototipo; CI verde"
```

### Nota de dependencia

`UserMenu.tsx` usa `useAuth` (AuthContext, PR de Hamilton) y las rutas `/login`, `/registro`
(login/registro, PR de Hamilton). Se mergea **después** de Hamilton y **antes** del tag
`v0.1-prototipo-demo` para que el logout quede en el demo.

### Verificación

```bash
git diff 3dfa19a -- apps/web/src/components/layout/UserMenu.tsx   # debe quedar VACÍO
```

---

## §3 MARCOS — Coordinación backend de seguridad (sin archivos nuevos)

Entregable: **ninguno** en este sprint. El backend de auth de S1 (`85122d2`) no cambia.

- El **CORS** para `http://localhost:3001` con `credentials` viaja en `apps/api/src/main.ts`
  dentro del PR de **David** (fuente `890c423`).
- Coordina con Hamilton la expiración/refresh que usa el login web (`lib/auth.ts` +
  `/auth/refresh`) y confirma los endpoints consumidos: `POST /auth/registro`,
  `POST /auth/login`, `POST /auth/refresh`, `GET /auth/perfil`.
- Rama de ejemplo `feature/auth-web` **sin archivos**: NO abras PR de código.

### Verificación de que el backend de auth no cambia entre fuentes

```bash
git diff 85122d2 3dfa19a -- apps/api/src/auth apps/api/src/users apps/api/src/common
# Debe quedar VACÍO: auth/, users/ y common/ son los mismos en 85122d2 y 3dfa19a
```

---

## §4 DAVID — Base, CI y cierre del prototipo

Entregables desde `890c423`:

- `scripts/dev-up.ps1` — arranque del sistema completo (`npm run up` / `npm run up:stop`).
- `package.json` (raíz) — scripts `dev`, `dev:api`, `dev:web`, `up`, `up:stop`.
- `turbo.json`, `docker-compose.yml` (PostgreSQL).
- `apps/api/.env.example`, `apps/api/package.json`.
- `apps/web/package.json`.
- `apps/api/src/main.ts` — CORS (`origin: process.env.CORS_ORIGIN || 'http://localhost:3001'`,
  `credentials: true`) + prefijo `api` + Swagger.

```bash
git fetch sigeb-prod
git checkout develop && git pull origin develop
git checkout -b chore/arranque-dev

git checkout 890c423 -- scripts/dev-up.ps1 package.json turbo.json docker-compose.yml apps/api/.env.example
git checkout 890c423 -- apps/api/src/main.ts apps/api/package.json apps/web/package.json

git status   # SOLO scripts/, package.json, turbo.json, docker-compose.yml, apps/api/main.ts/.env.example/package.json, apps/web/package.json
git add scripts/dev-up.ps1 package.json turbo.json docker-compose.yml apps/api/.env.example apps/api/src/main.ts apps/api/package.json apps/web/package.json
git commit -m "chore(dev): arranque API+web con npm run dev y CORS para el login web"
git push -u origin chore/arranque-dev
```

### Abrir la PR

```bash
gh pr create --base develop --title "chore(dev): S3" --body "scripts/dev-up.ps1 (npm run up/up:stop) + CORS en main.ts desde 890c423; arranca API :3000 + web :3001; CI verde"
```

### Verificación

```bash
git diff 890c423 -- scripts/dev-up.ps1 package.json turbo.json docker-compose.yml apps/api/.env.example
git diff 890c423 -- apps/api/src/main.ts apps/api/package.json apps/web/package.json
# Todas las diferencias deben quedar VACÍAS
npm install
npm run up      # (Windows) o: npm run dev
```

### Cierre del sprint — hito `v0.1-prototipo-demo` (después del merge de S3)

```bash
git checkout develop && git pull origin develop
git tag v0.1-prototipo-demo
git push origin v0.1-prototipo-demo
```

El tag junta **solo los módulos del prototipo** (ver §7 Apéndice B para el checklist de
exclusiones).

---

## §5 DAVID — Orden de merge y aprobación

Orden fijo: **David (chore, rama `chore/arranque-dev`) → Hamilton (`feature/web-login`) →
Yemerson (`feature/portal-usermenu`) → tag `v0.1-prototipo-demo`**. Marcos no abre PR.

Por cada PR:

```bash
git checkout develop && git pull origin develop
gh pr list
gh pr checkout <NUM_PR>
npm run lint && npm run test
gh pr review <NUM_PR> --approve
gh pr merge <NUM_PR> --squash --delete-branch
```

> Si la CI de tu repo ejecuta `next build` (compila todo `apps/web/src`), `feature/web-login`
> depende del `UserMenu.tsx` de Yemerson para compilar. En ese caso mergea Hamilton y Yemerson
> dentro de la misma ventana de trabajo (uno tras otro, sin cierre de demo en medio) para que
> la rama `develop` nunca quede en un estado intermedio rojo entre ambos PR.

### Verificación de fidelidad al cierre (diffs VACÍOS contra las fuentes)

```bash
# Web auth y dashboard
git diff 3dfa19a -- apps/web/src/app/login apps/web/src/app/registro apps/web/src/app/dashboard
git diff 3dfa19a -- apps/web/src/context apps/web/src/components/auth/ProtectedRoute.tsx
git diff 3dfa19a -- apps/web/src/lib
git diff 3dfa19a -- apps/web/src/app/layout.tsx apps/web/src/components/layout/Header.tsx apps/web/src/components/layout/UserMenu.tsx apps/web/src/components/ui/Badge.tsx
# Base / arranque / CORS
git diff 890c423 -- scripts/dev-up.ps1 package.json turbo.json docker-compose.yml apps/api/.env.example apps/api/src/main.ts apps/api/package.json apps/web/package.json
```

### Smoke del prototipo

```bash
npm run up      # o npm run dev → API :3000 + web :3001 + DB
# Flujo: registro → login → dashboard → logout (ver §6 Apéndice A)
```

---

## §6 Apéndice A — Guion demo S3 (demo ≈ 16 sep, cierre del prototipo)

1. **Portal público**: home, convocatorias con filtro/búsqueda, detalle de convocatoria,
   consulta de beca por UUID, nosotros y footer.
2. **Registro de postulante**: CUI único + validaciones, conectado a `/auth/registro`.
3. **Login** con sesión persistente (access + refresh): `postulante@demo.gt / Admin123!`
   (seed S2) o el usuario recién registrado.
4. **Dashboard del postulante** (US-50): perfil + estado de sus solicitudes (`/solicitudes/mias`).
5. **Cerrar sesión** → vuelve al portal público.

El seed de S2 ya deja los datos del demo: postulante `postulante@demo.gt`, convocatoria
`ABIERTA` y una solicitud `ENVIADA`, por lo que el S3 **no requiere cambios de seed**.

Recarga de página con sesión activa: probar explícitamente que el refresh de tokens mantiene
la sesión (regresión conocida en la retrospectiva).

---

## §7 Apéndice B — Checklist de exclusiones del prototipo (v0.1-prototipo-demo)

Qué **NO** se copia de las fuentes ni entra al tag:

- `apps/api/src/evaluaciones/`, `sesiones/`, `comites/`, `decisiones/`, `reportes/`,
  `asistente/`, `audit/` (y sus registros en `app.module.ts`/`prisma`).
- `apps/web/src/app/admin/`, `apps/web/src/app/evaluador/`.
- Formulario multi-step (US-51), gestión de documentos (US-52), paneles admin/evaluador
  (US-53..55) y chat IA (US-56) → se programan en S5/S6.

`app.module.ts` del prototipo registra únicamente: `Prisma`, `Common`, `Storage`, `Auth`,
`Users`, `Catalogos`, `Convocatorias`, `Solicitudes`.

### Verificación post-tag

```bash
git show v0.1-prototipo-demo:apps/api/src/app.module.ts | grep -Ei 'evaluacion|sesion|comite|decision|reporte|asistente|audit'
# No debe devolver ningún módulo registrado
git ls-tree -r --name-only v0.1-prototipo-demo | grep -Ei 'src/(evaluaciones|sesiones|comites|decisiones|reportes|asistente|audit)/'
git ls-tree -r --name-only v0.1-prototipo-demo | grep -Ei 'src/app/(admin|evaluador)'
# Ambos grep deben quedar VACÍOS
```