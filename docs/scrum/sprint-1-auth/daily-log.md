# Sprint 1 — Daily Log

## Standups

### Día 1 — 2026-08-26

**¿Qué hice ayer?**
- Revisión de la documentación Sprint 1 (backlog, goal) y del product backlog

**¿Qué haré hoy?**
- Crear rama `feature/auth-seguridad` desde `develop`
- Crear módulos NestJS `auth`, `common` y `users`

**Bloqueos:**
- Ninguno

---

### Día 2 — 2026-08-26

**¿Qué hice ayer?**
- Rama `feature/auth-seguridad` creada
- Estructura de módulos NestJS (`auth`, `common`, `users`) con `prisma`
- Guards y decoradores base (`JwtAuthGuard`, `RolesGuard`, `@CurrentUser`, `@Roles`)
- Decorador `@Public()` y ajuste del guard global para rutas públicas

**¿Qué haré hoy?**
- Implementar registro de usuario con validación de CUI único
- Implementar login JWT con access y refresh tokens
- Implementar endpoint de perfil protegido

**Bloqueos:**
- Lint del monorepo roto (config `.eslintrc.js` con contenido JSON, faltaba `eslint-config-prettier`, config por workspace)

---

### Día 3 — 2026-08-26

**¿Qué hice ayer?**
- Registro de postulante con CUI único y hash bcrypt
- Login JWT (access + refresh) y refresh token
- Endpoint `GET /auth/perfil` protegido con `JwtAuthGuard`

**¿Qué haré hoy?**
- Implementar CRUD de roles con asignación de permisos (`/seguridad`)
- Corregir issues de lint y build del monorepo

**Bloqueos:**
- Ninguno

---

### Día 4 — 2026-08-27

**¿Qué hice ayer?**
- CRUD de roles y asignación de permisos por rol (US-10)
- Endpoints `/seguridad/roles`, `/seguridad/permisos` con rol `ADMIN`
- Seed de datos (roles, permisos, admin) verificado

**¿Qué haré hoy?**
- Build y lint del monorepo (api + web)
- Smoke test manual de todos los endpoints contra Postgres local
- Actualizar documentación (backlog, daily-log, review, retrospective, changelog)

**Bloqueos:**
- Ninguno

---

### Día 5 — 2026-08-27

**¿Qué hice ayer?**
- Smoke test completo aprobado (17 casos): registro 201, CUI duplicado 409, login 200/401, refresh 200, perfil 200/401, roles CRUD, permisos, 403 para no-admin
- Lint, test y build del monorepo en verde

**¿Qué haré hoy?**
- Actualizar documentación Sprint 1 (review y retrospective)
- Commitear el trabajo por módulo en `feature/auth-seguridad`
- Mergear a `develop`

**Bloqueos:**
- Ninguno