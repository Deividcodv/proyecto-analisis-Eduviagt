# EDUVIAGT — Sistema Integral de Gestión de Becas

> Plataforma para administrar el ciclo completo de becas: publicación de convocatorias, postulación de estudiantes, carga y revisión de documentos, evaluación, decisión de comités evaluadores, y consulta de estado.

---

## Estado del proyecto

**Versión:** v1.1 (Sprint 9 en curso)
**Stack:** NestJS + Next.js + PostgreSQL + Prisma + Turborepo
**Tests:** 26 ficheros `.spec.ts` en la API + 8 E2E (Playwright) · cobertura mínima: statements 49 / branches 40 / functions 48 / lines 49
**CI:** GitHub Actions — 6 jobs: `api-tests`, `e2e-web`, `docker-build`, `deploy-staging`, `deploy-production` (deshabilitado), `lint-and-test`
**Rama de integración:** `develop` · **Rama de producción:** `master` (deshabilitada con `PRODUCTION_READY`) · **Rama de trabajo actual:** `fix-deploy-ci-2`

---

## Funcionalidades principales

- **Convocatorias**: Publicación, gestión de documentos requeridos, estados (borrador → abierta → cerrada → en evaluación → resuelta)
- **Solicitudes**: Perfil personal, académico y financiero, carga de documentos, checklist de completitud, envío validado
- **Evaluación**: Asignación de evaluadores, puntajes por criterio ponderado, score automático
- **Comités**: Sesiones, quórum, votación, decisiones
- **Segunda aprobación** (Sprint 8): Solicitudes con monto > Q10,000 requieren firma de una segunda persona
- **Montos flexibles** (Sprint 8): Cálculo de monto otorgable por tramos de ingreso familiar (FIJO / PORCENTAJE / COMPLETO)
- **Bitácora del sistema** (Sprint 8): Registro inmutable de las acciones registradas (actor, fecha, IP, resultado)
- **Eliminación de cuenta** (Sprint 8): Anonimización de datos personales, conservación de trazabilidad
- **Accesibilidad** (Sprint 8): WCAG 2.2 AA — foco visible, skip link, trampa de foco en menú lateral, respeto a `prefers-reduced-motion`
- **Identidad Eduvi**: Asistente de IA con nombre, icono y saludo unificados (modo KB por FTS PostgreSQL, LLM opcional)
- **Páginas legales**: Privacidad, Términos, Cookies (públicas, sin banner de consentimiento — solo `localStorage` para tokens)
- **Reportes**: Agregaciones y exportación CSV (uso interno, permiso `reporte:ver`)
- **Matriz de seguridad**: Permisos por rol + excepciones por usuario individual (Chain of Responsibility, fail-closed)
- **Asistente IA**: Endpoint público con recuperación léxica (FTS PostgreSQL) y LLM opcional sin contexto recuperado — ver `docs/architecture/asistente-ia.md`

---

## Arquitectura

**Monolito modular por capas**, dos aplicaciones independientes que hablan por HTTP/JSON dentro de un monorepo con Turborepo.

```
EDUVIAGT-v1.1/
├── apps/
│   ├── api/     → Backend NestJS, expone REST en /api
│   └── web/     → Frontend Next.js (App Router), consume la API
├── docs/         → Documentación del proyecto
├── scripts/      → deploy-pm2.sh, dev-up.ps1
├── storage/      → Almacenamiento local de documentos (adapter)
├── docker-compose.yml            → PostgreSQL para desarrollo
├── docker-compose.prod.yml       → Stack completo (postgres + api + web) — alternativa
├── turbo.json                    → Pipeline de Turborepo
├── package.json                  → Workspaces + scripts raíz
└── .env.example                  → Variables de entorno (raíz)
```

### Backend (NestJS) — 17 módulos

```
apps/api/src/
├── main.ts
├── app.module.ts
├── common/              guards, decoradores, interceptors, filtros, servicios transversales
├── auth/                registro, login, refresh, perfil, eliminación de cuenta
├── users/               roles, permisos, excepciones por usuario (matriz), configuración
├── catalogos/           género, nivel académico, departamento, municipio, instituciones, tipos de documento
├── convocatorias/       CRUD + máquina de estados + documentos requeridos + montos
├── solicitudes/         solicitud + perfiles + documentos + estados + montos + constancia PDF
├── evaluaciones/        asignación, puntajes, score ponderado
├── comites/             comités y miembros
├── sesiones/            sesiones, votos, quórum, decisiones
├── reportes/            agregaciones + exportación CSV
├── asistente/           proxy de IA (OpenAI/Fallback) + base de conocimiento (FTS)
├── audit/               auditoría de acciones
├── bitacora/            bitácora inmutable del sistema
├── notificaciones/      notificaciones y preferencias de sonido + SSE
├── storage/             adapter de almacenamiento de documentos
├── prisma/              servicio de conexión (PrismaService)
└── (sin módulo health-check dedicado)
```

### Patrones de diseño

| Patrón | Estado | Dónde | Archivo |
|---|---|---|---|
| **Singleton** | Implementado (por DI de NestJS) | Conexión a base de datos | `prisma/prisma.service.ts` |
| **State** | Implementado (FSM por tabla) | Máquinas de estado de convocatoria y solicitud | `convocatoria-state-machine.ts`, `solicitud-state-machine.ts` |
| **Chain of Responsibility** | Implementado (fail-closed) | Resolución de permisos (usuario → rol → denegado) | `common/guards/permission-chain.ts` |
| **Adapter** | Implementado | Almacenamiento de documentos (FS), PDF (Puppeteer), IA (OpenAI/Fallback) | `storage/`, `solicitudes/pdf/`, `asistente/providers/` |
| **Proxy** | Implementado (con degradación) | Enrutamiento y fallback del asistente IA | `asistente/asistente.proxy.ts` |
| **Decorator** | Implementado (4 custom) | `@Public`, `@Roles`, `@Permisos`, `@CurrentUser` | `common/decorators/` |
| **Dependency Injection** | Implementado (tokens custom) | `PERMISSION_SERVICE`, `DOCUMENT_STORAGE`, `PDF_RENDERER` | `common/guards/permission.service.ts`, `storage/`, `solicitudes/pdf/` |
| **Unit of Work** | Implementado (`$transaction`) | Transiciones de estado, asignaciones, eliminación de cuenta | `solicitudes.service.ts`, `sesiones.service.ts`, `auth/eliminar-cuenta.service.ts` |
| **Strategy** | Implementado (solo IA) | Proveedores intercambiables `ProveedorIA` | `asistente/asistente.types.ts`, `asistente.proxy.ts` |
| **Facade** | Implementado (explícita) | Fachada de seguridad (delega en roles/permisos/usuarios) | `users/users.service.ts` |
| **Facade** | Implementado (de facto) | Orquestación del ciclo de vida de la solicitud | `solicitudes/solicitudes.service.ts` |
| **Template Method** | Parcial | Clase base `PermissionHandler` (sin `abstract`, esqueleto duplicado) | `common/guards/permission-chain.ts` |
| **Command** | Parcial | DTO `TransicionSolicitudDto` transporta la intención (sin `CommandBus`) | `solicitudes/dto/solicitud.dto.ts` |
| **Mapper / DTO** | Parcial | `aplanarPerfil()`, `mapearReglas()` | `auth/auth.service.ts`, `convocatorias/convocatorias.service.ts` |
| **Rate Limiting** | Parcial (en memoria) | Login: 5 intentos / 15 min por `ip:email` | `auth/login-attempt.service.ts` |
| **Circuit Breaker / Retry** | Parcial (solo fallback) | Timeout con `AbortController` y degradación a fallback (sin contador de fallos ni retry) | `asistente/providers/openai.provider.ts`, `asistente.proxy.ts` |
| **Saga / Compensación** | Parcial (best-effort) | Eliminación de cuenta borra archivos fuera de la transacción | `auth/eliminar-cuenta.service.ts` |
| **Audit Trail append-only** | Implementado | Bitácora inmutable (no Event Sourcing) | `bitacora/bitacora.service.ts` |
| **Feature Flags** | Parcial (único flag) | Presencia de `AI_API_KEY` define el proveedor IA | `asistente/asistente.proxy.ts` |
| **Builder** | No implementado | Solo `DocumentBuilder` de Swagger | `apps/api/src/main.ts` (Swagger) |
| **Facade `SolicitudLifecycleService`** | No existe | La referencia del README anterior apuntaba a un archivo inexistente | — |
| **Observer / Event Bus** | No implementado | No hay `@nestjs/event-emitter`, ni `EventEmitter`, ni `@OnEvent` | — |
| **Repository** | No implementado | Prisma se usa directamente en los servicios | — |
| **CQRS** | No implementado | Sin `@nestjs/cqrs` ni `CommandBus`/`QueryBus` | — |
| **Cache / Redis** | No implementado | Sin `cache-manager` ni `redis` | — |
| **Middleware** | No implementado | Sin `app.use(...)` ni archivos de middleware | — |
| **Adapter S3** | No implementado | Solo `FilesystemStorageAdapter` (extensión prevista) | `storage/` |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Monorepo | npm workspaces + Turborepo |
| Frontend | Next.js 14 (App Router) + React 18, Tailwind CSS (design system brutalista) |
| Formularios | React Hook Form + Zod (solo login/registro; el resto usa `useState` manual) |
| Backend | NestJS 10 + TypeScript |
| ORM | Prisma 5 (consultas parametrizadas por defecto) |
| Base de datos | PostgreSQL 16 |
| Autenticación | Passport + JWT (access/refresh con secrets distintos) + bcrypt |
| Autorización | Chain of Responsibility sobre rol + excepciones de usuario (fail-closed) |
| Almacenamiento | Filesystem local detrás de `DocumentStorage` (Adapter) |
| IA | Proveedor configurable (OpenAI / Fallback) detrás de `AsistenteIAProxy` — sin RAG |
| PDF | Puppeteer (constancia PDF) |
| Reportes | Consultas agregadas + exportación CSV |
| Testing | Jest + Supertest (API, unit), Playwright (E2E web, incluye axe) |
| CI | GitHub Actions: lint + unit + build + smoke + E2E + docker build + deploy |
| Infra local | Docker Compose (PostgreSQL) |
| Infra producción | PM2 + nginx (job `deploy-staging` vía SSH) |

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
- Docker Desktop
- PowerShell 7+ (Windows) o bash (Linux/macOS)

### 1. Instalar dependencias
```bash
npm ci
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus valores (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, etc.)
```

### 3. Base de datos + desarrollo (Docker)
```bash
npm run up        # levanta PostgreSQL + API + Web (scripts/dev-up.ps1)
# o
npm run dev       # turbo run dev (API watch + Web)
```

### 4. Migraciones y seed
```bash
cd apps/api
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### 5. Ejecutar tests
```bash
npm run test:api                      # unitarios API
cd apps/web && npm run test:e2e       # E2E Playwright
cd apps/api && npm run test:cov       # cobertura
```

### 6. Build
```bash
npm run build
```

---

## Documentación

Toda la documentación detallada está en la carpeta `docs/`:

| Sección | Carpeta / Archivo |
|---|---|
| Arquitectura (ADR, diagramas, SOLID, schema DB) | `docs/architecture/` |
| **Arquitectura real verificada (backend)** | `docs/architecture/ARQUITECTURA-REAL.md` |
| **Datos de demostración** | `docs/architecture/datos-demostracion.md` |
| **Arquitectura del asistente IA** | `docs/architecture/asistente-ia.md` |
| **Arquitectura del frontend** | `docs/architecture/frontend.md` |
| **Contrato API ↔ Web** | `docs/architecture/api-web-contrato.md` |
| **Arquitectura técnica detallada (monorepo, API, Web, BD, despliegue, IA, JWT)** | `docs/architecture/ARQUITECTURA_TECNICA_DETALLADA_SIGEB_v1.1.md` |
| Estándares (código, Git, testing, seguridad, accesibilidad, secretos) | `docs/standards/` |
| Operaciones (setup, deployment, troubleshooting, despliegue Docker) | `docs/operations/` |
| Manuales de usuario por rol | `docs/manual-usuario/` |
| Scrum (sprints, backlog, ceremonias) | `docs/scrum/` |
| Equipo (miembros, roles) | `docs/team/` |
| Marca (logos, colores, tipografías) | `docs/marca/` |
| Pruebas (baseline, caja blanca, funcional, a11y) | `docs/pruebas/` |
| Glosario | `docs/glossary.md` |
| Changelog | `docs/changelog.md` |

> El índice completo está en `docs/README.md`. El estado de cada documento (vigente / parcial / desactualizado) se indica ahí.

---

## Convenciones

- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- **Ramas:** `feature/<modulo>-<descripcion>`, `hotfix/<descripcion>`
- **PRs:** Todo entra por Pull Request a `develop` (ramas protegidas)
- **Tests:** Jest (API, unit), Playwright (E2E web, incluye axe)
- **CI:** GitHub Actions en cada PR (lint → unit → build → smoke → E2E → docker build)

---

## Licencia

Ver [LICENSE](LICENSE).