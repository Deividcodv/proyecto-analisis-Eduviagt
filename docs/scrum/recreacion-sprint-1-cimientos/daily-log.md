# Sprint 1 Recreacion - Daily Log

## Standups

### Dia 1 - 2026-09-07

**Que hice ayer?**
- (Inicio del sprint) Revision de la documentacion del prototipo y del plan S1.

**Que hare hoy?**
- David: preparar monorepo base (scaffold NestJS/Next.js/Prisma/Docker) y CI base.
- Marcos: crear rama `feature/auth-login` y modulos NestJS `auth`, `common`, `users`.
- Hector: crear rama `feature/catalogos` y modulos `catalogos`, `convocatorias`, `storage`.

**Bloqueos:**
- Ninguno

---

### Dia 2 - 2026-09-08

**Que hice ayer?**
- David: monorepo base listo (workspaces `apps/api`, `apps/web`, prisma, docker-compose).
- Marcos: estructura de `auth/`, `common/` y `users/` creada con guards y decoradores base.
- Hector: estructura de `catalogos/`, `convocatorias/` y `storage/` creada.

**Que hare hoy?**
- Marcos: registro (CUI unico, bcrypt), login JWT (access+refresh), `/auth/perfil`.
- Hector: CRUD de catalogos y CRUD de convocatorias con maquina de estados.
- David: migraciones Prisma iniciales y seed de catalagos.

**Bloqueos:**
- David reporta que el `app.module.ts` todavia no registra todos los modulos del prototipo.

---

### Dia 3 - 2026-09-09

**Que hice ayer?**
- Marcos: registro y login JWT completos con rol `ADMIN`/`POSTULANTE`; `/auth/perfil` operativo.
- Hector: CRUD de catalogos y convocatorias listo; storage adapter base.
- David: migraciones y seed aplicados; seguridad de rutas verificada.

**Que hare hoy?**
- Marcos: CRUD de roles (US-10) y guard de permisos (US-11).
- Hector: documentos requeridos por convocatoria (US-16).
- David: revisar PRs, dejar CI base en verde (lint + tests + build + smoke del prototipo).

**Bloqueos:**
- Ninguno

---

### Dia 4 - 2026-09-09 (cierre)

**Que hice ayer?**
- Marcos: roles y permisos completos con smoke manual (403 para no-admin).
- Hector: documentos requeridos por convocatoria integrados.
- David: PRs de Marcos y Hector aprobados y mergeados con squash.

**Que hare hoy?**
- David: verificar que `develop` equivale a los cimientos (por modulo contra `4b0795f` y `85122d2`).
- Preparar el planning del Sprint 2 (portal publico).

**Bloqueos:**
- Ninguno