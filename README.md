# SIGEB — Sistema Integral de Gestión de Becas

> Plataforma para administrar el ciclo completo de becas: publicación de convocatorias, postulación de estudiantes, carga y revisión de documentos, evaluación, decisión de comités evaluadores, y consulta de estado.

---

## Estado del proyecto

**Versión:** v1.1 (Sprint 8 completo)
**Stack:** NestJS + Next.js + PostgreSQL + Prisma
**Tests:** 261 unitarios + 66 E2E en verde
**CI:** GitHub Actions (lint + test + build + smoke)

---

## Funcionalidades principales

- **Convocatorias**: Publicación, gestión de documentos requeridos, estados (borrador → abierta → cerrada → en evaluación → resuelta)
- **Solicitudes**: Perfil personal, académico y financiero, carga de documentos, checklist de completitud, envío validado
- **Evaluación**: Asignación de evaluadores, puntajes por criterio ponderado, score automático
- **Comités**: Sesiones, quórum, votación, decisiones
- **Segunda aprobación** (Sprint 8): Solicitudes con monto > Q10,000 requieren firma de una segunda persona
- **Montos flexibles** (Sprint 8): Cálculo de monto otorgable por tramos de ingreso familiar (FIJO / PORCENTAJE / COMPLETO)
- **Bitácora del sistema** (Sprint 8): Registro inmutable de todas las acciones con actor, fecha, IP y resultado
- **Eliminación de cuenta** (Sprint 8): Anonimización de datos personales, conservación de trazabilidad
- **Accesibilidad** (Sprint 8): WCAG 2.2 AA — foco visible, skip link, trampa de foco en menú lateral, respeto a `prefers-reduced-motion`
- **Identidad Eduvi**: Asistente de IA con nombre, icono y saludo unificados
- **Páginas legales**: Privacidad, Términos, Cookies (públicas, sin banner de consentimiento — solo `localStorage` para tokens)
- **Reportes**: Agregaciones y exportación CSV (uso interno, permiso `reporte:ver`)
- **Matriz de seguridad**: Permisos por rol + excepciones por usuario individual (Chain of Responsibility)
- **Asistente IA**: Respuestas acotadas por sesión y rol (Proxy pattern)

---

## Arquitectura

**Monolito modular por capas**, dos aplicaciones independientes que hablan por HTTP/JSON.

```
Sigeb-v1.1/
├── apps/
│   ├── api/     → Backend NestJS, expone REST en /api
│   └── web/     → Frontend Next.js (App Router), consume la API
├── doc/         → Documentación del proyecto
├── docs/        → Superpowers y pruebas
├── .github/     → CI/CD workflows
├── prisma/      → (en apps/api/prisma/)
├── docker-compose.yml
└── package.json
```

### Backend (NestJS)

```
apps/api/src/
├── main.ts
├── app.module.ts
├── common/              guards, decoradores, interceptors, servicios transversales
├── auth/                registro, login, refresh, perfil, eliminación de cuenta
├── seguridad/           roles, permisos, excepciones por usuario (matriz)
├── catalogos/           género, nivel académico, departamento, municipio, instituciones
├── becas/               catálogo de becas y criterios de evaluación
├── convocatorias/       CRUD + máquina de estados + documentos requeridos + montos
├── solicitudes/         solicitud + perfiles + documentos + estados + montos
├── documentos/          tipos de documento + storage (adapter fs)
├── evaluaciones/        asignación, puntajes, score ponderado
├── comites/             comités, sesiones, votos, quórum
├── decisiones/          aprobación/rechazo
├── reportes/            agregaciones + export CSV
├── asistente/           proxy de IA + base de conocimiento
├── auditoria/           log de acciones sensibles
├── bitacora/            bitácora inmutable del sistema
├── notificaciones/      notificaciones y preferencias de sonido
├── storage/             adapter de almacenamiento de documentos
├── prisma/              servicio de conexión (singleton)
└── salud/               health check
```

### Patrones de diseño

| Patrón | Dónde | Archivo |
|---|---|---|
| **Singleton** | Conexión a base de datos | `prisma/prisma.service.ts` |
| **Builder** | Construcción de solicitud multi-sección | `solicitudes/` |
| **Facade** | Orquestación de ciclo de vida de solicitud | `solicitudes/solicitud-lifecycle.service.ts` |
| **Adapter** | Almacenamiento de documentos, PDF, IA | `storage/`, `solicitudes/pdf/`, `asistente/providers/` |
| **Proxy** | Control de acceso del asistente IA | `asistente/asistente-ia-proxy.ts` |
| **State** | Máquinas de estado de convocatoria y solicitud | `convocatoria-state-machine.ts`, `solicitud-state-machine.ts` |
| **Observer** | Eventos de dominio (notificaciones, auditoría) | Eventos de dominio |
| **Chain of Responsibility** | Resolución de permisos (usuario → rol → denegado) | `common/guards/permissions.guard.ts` |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js (App Router) + React, Tailwind CSS (design system brutalista) |
| Formularios | React Hook Form + Zod |
| Backend | NestJS + TypeScript |
| ORM | Prisma (consultas parametrizadas por defecto) |
| Base de datos | PostgreSQL |
| Autenticación | Passport + JWT (access/refresh) + bcrypt |
| Autorización | Chain of Responsibility sobre rol + excepciones de usuario |
| Almacenamiento | Filesystem local detrás de `DocumentStorage` (Adapter) |
| IA | Proveedor configurable (Gemini/OpenAI) detrás de `AsistenteIAProxy` |
| Reportes | Consultas agregadas + exportación CSV |
| Testing | Jest + Supertest (API), Playwright (E2E web) |
| CI | GitHub Actions: lint + test + build + smoke en cada PR |
| Infra local | Docker Compose (PostgreSQL) |

---

## Roles del sistema

| Rol | Descripción |
|---|---|
| `ADMIN` | Acceso total, incluida la matriz de seguridad |
| `POSTULANTE` | Crea y gestiona su propia solicitud |
| `EVALUADOR` | Evalúa solicitudes asignadas |
| `COORDINADOR_COMITE` | Convoca sesiones, registra decisiones |
| `MIEMBRO_COMITE` | Vota en sesiones |
| `JEFE_BECAS` | Aprueba solicitudes de alto monto (segunda instancia) |
| `STAFF` | Rol base para personal administrativo |

---

## Inicio rápido

### Prerrequisitos
- Node.js 20+
- PostgreSQL 16+
- npm

### 1. Instalar dependencias

```bash
npm ci
```

### 2. Configurar base de datos

```bash
# Crear base de datos
createdb sigeb

# Configurar .env
cp apps/api/.env.example apps/api/.env
# Editar apps/api/.env con tus valores
```

### 3. Migraciones y seed

```bash
cd apps/api
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### 4. Iniciar desarrollo

```bash
# En la raíz del proyecto
npm run dev
```

- **API:** http://localhost:3000
- **Web:** http://localhost:3001
- **Swagger:** http://localhost:3000/api/docs

### 5. Ejecutar tests

```bash
# Tests unitarios del API
npm run test:api

# Tests E2E web
npm run test:e2e

# Type check
cd apps/api && npx tsc --noEmit
cd apps/web && npx tsc --noEmit
```

---

## Documentación

Toda la documentación detallada está en la carpeta `doc/`:

| Sección | Carpeta |
|---|---|
| Arquitectura (ADR, diagramas, SOLID, schema DB) | `doc/architecture/` |
| Estándares (código, Git, testing, seguridad) | `doc/standards/` |
| Operaciones (setup, deployment, troubleshooting) | `doc/operations/` |
| Manuales de usuario por rol | `doc/manual-usuario/` |
| Scrum (sprints, backlog, ceremonias) | `doc/scrum/` |
| Equipo (miembros, roles) | `doc/team/` |
| Marca (logos, colores, tipografías) | `doc/marca/` |
| Glosario | `doc/glossary.md` |
| Changelog | `doc/changelog.md` |

---

## Convenciones

- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- **Ramas:** `feature/<modulo>-<descripcion>`, `hotfix/<descripcion>`
- **PRs:** Todo entra por Pull Request a `develop` (ramas protegidas)
- **Tests:** Jest + Supertest (API), Playwright (E2E)
- **CI:** GitHub Actions en cada PR (lint → test → build → smoke)

---

## Licencia

Ver [LICENSE](LICENSE).