# Changelog — SIGEB

> Historial de releases y cambios del proyecto.

---

## Formato

Este archivo sigue el formato [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

Las categorías son:
- **Added** — Nuevas funcionalidades
- **Changed** — Cambios en funcionalidades existentes
- **Deprecated** — Funcionalidades que serán removidas
- **Removed** — Funcionalidades removidas
- **Fixed** — Bugs corregidos
- **Security** — Cambios de seguridad

---

## [Unreleased]

### Added
- Estructura completa de documentación `/doc`
- Product Backlog con 58 historias de usuario
- Templates de 8 sprints con goal, backlog, daily-log, review y retrospective
- Guías de setup, deployment y troubleshooting
- ADR (Architecture Decision Records) con 8 decisiones documentadas
- Contratos de API para todos los endpoints
- Diagramas de arquitectura, despliegue y flujos
- Schema de base de datos documentado
- Convenciones de código, git, testing y seguridad
- Equipo asignado: David (SM), Marcos (Auth), Héctor (Convocatorias), José (Solicitudes), Yemerson (Portal), Hamilton (Sistema)

---

## [Sprint 0] — 2026-XX-XX

### Added
- [ ] Monorepo con package.json, workspaces y scripts
- [ ] Docker Compose con PostgreSQL
- [ ] Schema Prisma completo
- [ ] Seed data con catálogos, roles y permisos

### Notas
- Primer sprint del proyecto
- Todos los miembros participan en la configuración

---

## [Sprint 1] — 2026-XX-XX

### Added
- [x] Estructura de módulos NestJS (`app.module.ts`, `main.ts`)
- [x] Registro de postulante con CUI único
- [x] Login con JWT (access + refresh tokens)
- [x] Endpoint de perfil autenticado
- [x] Common/: guards globales, decoradores, filtros de excepción
- [x] CRUD de roles con asignación de permisos

### Fixed
- Guard JWT global bloqueaba rutas públicas; se agregó decorador `@Public()` en `registro`, `login`, `refresh`
- Infraestructura de lint del monorepo: `.eslintrc.json`, `eslint-config-prettier`, config ESLint por workspace
- Script de test sin specs: `--passWithNoTests`

### Notas
- Marcos como developer principal
- David como reviewer
- Smoke test manual aprobado (17 casos)

---

## [Sprint 2] — 2026-08-27

### Added
- [x] Guard de permisos con Chain of Responsibility (`@Permisos`, `PermissionsGuard`)
- [x] CRUD de catálogos (géneros, niveles, departamentos, municipios, tipos de documento) con endpoints públicos
- [ ] Opción "otro" en catálogos (US-13, diferida a Sprint 3)
- [x] CRUD de convocatorias (endpoints públicos + admin)
- [x] Máquina de estados de convocatoria (BORRADOR → ABIERTA → CERRADA → EN_EVALUACION → RESUELTA → ARCHIVADA)
- [x] Configuración de documentos requeridos por convocatoria
- [x] DocumentStorage adapter (filesystem) con protección path-traversal

### Fixed
- Include Prisma inválido de `criteriosEvaluacion` en `Convocatoria` (la relación vive en `Beca`); corregido con include anidado

### Notas
- Héctor como developer principal
- Marcos como soporte en guard de permisos
- Smoke test manual aprobado (catálogos, convocatorias, transiciones, documentos)

---

## [Sprint 3] — 2026-08-27

### Added
- [x] Crear solicitud en BORRADOR (US-18)
- [x] Perfil académico con validación de catálogos y opción "otro" (US-19/US-13)
- [x] Perfil financiero (US-20)
- [x] Upload de documentos con validación MIME/tamaño (PDF/JPG/PNG ≤ 5 MB) (US-21)
- [x] Quitar/reemplazar documentos antes de enviar (US-22)
- [x] Checklist de documentos faltantes (US-23)
- [x] Enviar solicitud con validación de completitud (US-24)
- [x] Máquina de estados de solicitud con historial y `correccionesCount` (US-25)
- [x] CI en ramas `feature/*` y smoke test HTTP en CI

### Fixed
- `assertCatalogosExisten` trataba los campos libres (`*Otro`, institución, carrera) como IDs de catálogo; ahora solo valida propiedades `*Id`
- Seed: el CUI `9876543210987` del postulante demo colisionaba con el usuario smoke de Sprint 2; se usó `9999999999999`
- CI: `.gitignore` con `storage/` sin ancla omitía `apps/api/src/storage/` y rompía el build en Linux; anclado a `/storage/`

### Notas
- José como developer principal
- Héctor como soporte en documentos
- Smoke test manual aireado por hito + smoke automatizado en CI (`.github/scripts/smoke-ci.sh`)

---

## [Sprint 4] — 2026-08-28

### Added
- [x] Evaluaciones asignadas para evaluador (`GET /evaluaciones/mias`)
- [x] Asignación de evaluadores a solicitud solo admin y en `EN_REVISION` (`POST /solicitudes/:id/evaluadores`)
- [x] Puntajes por criterio con pesos (0–100; `PUT /solicitudes/:id/criterios/:criterioId`)
- [x] Auto-cálculo de score ponderado en vuelo (`GET /solicitudes/:id/score`)
- [x] CRUD de comités y miembros (listado con `_count`)
- [x] Creación de sesiones con agenda (solo `EVALUADA` de una misma convocatoria)
- [x] Votos (uno por miembro por solicitud, miembros activos del comité)
- [x] Finalización de sesión con validación de quórum, decisión por mayoría y convocatoria → `RESUELTA` (`POST /sesiones/:id/finalizar`)
- [x] Rechazo de documentos por admin/coordinador con efecto en el checklist (US-34, retro Sprint 3): `PATCH /solicitudes/:id/documentos/:tipoId/estado`
- [x] Seed autocorregible de permisos por rol (prune `notIn`) + usuarios demo evaluador/coordinador/miembro y criterios de la beca 2

### Fixed
- Seed: `MIEMBRO_COMITE` recibía `sesion:crear` (sobre-grant); corregido con poda `notIn` de permisos por rol
- Checklist: al incorporar US-34, `RECHAZADO` se cuenta como documento pendiente y bloquea `enviar`

### Notas
- José como developer principal
- David como reviewer
- Automatizado por hitos M1–M5 en `feature/evaluaciones` (commits `706e7a1`, `adf88fc`, `82d94f5`, `82e75fd` + M5) con smoke HTTP por hito; 90 tests verdes (9 suites)

---

## [Sprint 5] — 2026-08-29

### Added
- [x] Reportes de resumen (solicitudes por estado, convocatorias, evaluaciones)
- [x] Exportación de reportes a CSV
- [x] AuditLog dirigido (`AuditService.log`) con `GET /audit` paginado y filtros (permiso `auditoria:ver`)
- [x] Asistente IA con respuestas acotadas (fallback por base de conocimiento)
- [x] `AsistenteIAProxy` con contexto por sesión/rol y `OpenAIProveedor` opcional vía `AI_API_KEY`/`AI_BASE_URL` (timeouts + degradación a fallback)
- [x] Base de conocimiento indexada con tsvector (GIN funcional, `to_tsvector('spanish', titulo || ' ' || contenido)`)
- [x] Layout base + Design System + Tailwind + paleta en `apps/web` (Header/Footer, `Container`/`Button`/`Card`/`Badge`, home con convocatorias reales vía SWR y proxy `/api` en `next.config`)

### Notas
- Entregado por hitos M1–M5 con CI verde en cada uno: `00c1d21` (M1 reportes), `16f724d` (M2 auditoría), `0a05250` (M3 asistente/KB), `dab4fcd` (M4 proxy LLM opcional), `bbbcc7c` (M5 frontend base).
- 100+ tests de API verdes (13 suites) + build/lint de API y web; smoke CI "Sprints 3-5" cubre s3/s4/s5 (reportes, CSV, auditoría, asistente).
- José en reportes, Hamilton en asistente IA, Yemerson en Layout base.

---

## [Sprint 6] — 2026-08-31

### Added
- [x] Hero con "Oportunidades que transforman vidas" (parte del home, completado)
- [x] Sección "Sobre SIGEB"
- [x] "Cómo funciona" con 6 pasos
- [x] Página `/convocatorias` con filtros (búsqueda de texto + tipo de beca)
- [x] Página individual de convocatoria `/convocatorias/[id]` (documentos requeridos y criterios)
- [x] Consulta de estado de beca por código (`/consulta`) con endpoint público `GET /solicitudes/consulta/:codigo`
- [x] Página "Nosotros" con misión, visión, objetivos, programas y contacto
- [x] Footer institucional con navegación SPA (migrado a `Link`)
- [x] Filtro de búsqueda en `GET /convocatorias?busqueda=`
- [x] Design System extendido: `Input`, `Select`, `Spinner`, `EmptyState`
- [x] Menú hamburguesa responsive (`MobileMenu`) y componente `ConvocatoriaCard`

### Fixed
- Footer usaba `<a>` (recarga completa); migrado a `<Link>` de Next.js
- `Button` ahora soporta `disabled`

### Notas
- Yemerson como developer principal
- Hamilton como soporte
- 105 tests de API verdes (2 nuevos para consulta pública) + build/lint de API y web
- Smoke test HTTP diferido por indisponibilidad de Docker Desktop (Postgres local)

---

## [Sprint 7] — 2026-08-31

### Added
- [x] Login + Registro frontend (React Hook Form + Zod)
- [x] Dashboard postulante con seguimiento
- [x] Formulario multi-step de solicitud
- [x] Gestión de documentos desde frontend
- [x] Panel de evaluador
- [x] Panel de administración de convocatorias
- [x] Panel de administración de seguridad
- [x] Widget de chat IA
- [x] Responsive design (desktop → tablet → mobile)
- [x] Identidad visual dual (público vs admin)

### Notas
- Hamilton en postulante + IA
- Yemerson en admin + responsive

---

## [Sprint 8] — 2026-09-01

### Added (US-F7: constancia de beca en PDF)
- [x] Dependencia `puppeteer` en `apps/api` (Chromium headless)
- [x] Adaptador `PdfRenderer` con implementación `PuppeteerPdfRenderer` (patrón Adapter, runtime usa Chromium del sistema vía `CHROME_EXECUTABLE_PATH`)
- [x] `ConstanciasService` que construye el HTML institucional (MINEDUC/SIGEB) con escape de valores
- [x] `GET /solicitudes/:id/constancia` (solo `APROBADA`; dueño, admin o coordinador) → `application/pdf` adjunto
- [x] Tests unitarios de `ConstanciasService` (6 casos) + smoke CI del PDF real
- [x] Frontend: botón "Descargar constancia" en el dashboard y en el detalle de la solicitud (helper `descargarConstancia` con Bearer token)

### Added (CI/CD y despliegue)
- [x] Dockerfiles multi-stage para API y Web (`apps/api/Dockerfile`, `apps/web/Dockerfile`)
- [x] `output: 'standalone'` en Next.js y `.dockerignore`
- [x] `docker-compose.prod.yml` para despliegue con Postgres + API + Web (healthchecks, volúmenes)
- [x] `.env.example` con todas las variables por entorno
- [x] CI: job `docker-build` que valida ambas imágenes, cache de Chromium (puppeteer) y smoke ampliado (Sprint 3-5 + S6/S7 + PDF)
- [x] CD: jobs `deploy-staging`/`deploy-production` por SSH (PM2) con `environment: staging/production` y secretos documentados
- [x] ADR-009 (PDF headless con Adapter) y documentación de despliegue actualizada

### Added (Sprint 8 — Matriz de seguridad)
- [x] Alta de usuarios/empleados desde el panel (`POST /seguridad/usuarios`) con validación de CUI/email únicos, hash bcrypt y rol obligatorio
- [x] Detalle de usuario con rol y excepciones (`GET /seguridad/usuarios/:id`) y edición de rol/estado (`PATCH /seguridad/usuarios/:id`) con guard de auto-inactivación
- [x] Excepciones individuales de permisos por usuario (tri-estado: heredar / `PERMITIR` / `DENEGAR`) vía `PATCH /seguridad/usuarios/:id/permisos` sin migraciones (modelo `UsuarioPermiso` existente)
- [x] Respuestas y listados sin `passwordHash` + auditoría de crear/editar usuario
- [x] Frontend: `PanelUsuarios` (listado con búsqueda/filtro, alta, cambio de rol/estado) y `MatrizPermisosUsuario` tri-estado agrupado por módulo; sub-tab "Usuarios" en Seguridad
- [x] Smoke CI ampliado con bloque de seguridad (alta → login → PERMITIR/DENEGAR en `reporte:ver` → auto-inactivación 400 → inactivo 401 → ACL)

### Changed (Sprint 8 — Rediseño brutalista/maximalista)
- [x] Nueva identidad visual brutalista en toda la app: paleta `brutal`, bordes 3px, sombras duras (`shadow-brutal*`), esquinas 0px, fondo texturizado `brut-body`, diagonal institucional `brut-cinta` y tipografías Archivo + Instrument Sans + Space Mono
- [x] Design System reescrito (Card, Button, Container, Badge, Input, Select, EmptyState, Spinner, Stepper, InternalPageHeader) y chrome (Header/Footer/UserMenu/MobileMenu) con dark band
- [x] Superficies rediseñadas: home (hero mega + pasos numerados), login/registro, convocatorias + detalle, consulta (timeline brutal), dashboard, solicitudes (nueva + detalle), paneles de roles y admin (tablas/matrices brutales)

### Notas
- Sin migraciones de Prisma: la constancia se genera de forma stateless.
- Para activar los deploys, el equipo debe definir los secretos de GitHub (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_KEY`, `DEPLOY_DATABASE_URL`, `DEPLOY_JWT_SECRET`).

---

## Sprint 8 (continuación) — Workbench por rol y perfil de usuario (S8-bis)

### Added
- [x] Portada auth-aware: con sesión iniciada, `/` muestra el **workbench del rol** (tarjetas de acciones por rol: postulante, evaluador, coordinador, miembro de comité y admin) en lugar del hero público de becas
- [x] Navegación por rol: Header y menú móvil auth-aware (logueado → "Mi panel" + "Cerrar sesión"; anónimo → enlaces públicos + login/registro). Corrige el bug de móvil que mostraba "Iniciar sesión"/"Registrarse" a usuarios logueados
- [x] Página **"Mis datos"** (`/perfil`): teléfono, fecha de nacimiento, género, departamento → municipio (selects en cascada) y dirección; guarda vía el nuevo `PATCH /auth/perfil`
- [x] API: `PATCH /auth/perfil` con validación de FKs (género/departamento/municipio → 404), `getProfile` ampliado y auditoría `update_perfil`
- [x] Migración aditiva `usuario_datos_perfil` sobre `usuario` (telefono, fechaNacimiento, direccion, generoId, departamentoId, municipioId) sin pérdida de datos
- [x] `lib/rol.ts` con `rutaPorRol`/`tienePanel` compartido (elimina duplicación en Header/UserMenu/MobileMenu/ProtectedRoute)
- [x] Armónica: reemplazo de tokens legados `text-gray-*` por la paleta `brutal` en paneles y superficies

### Notas
- La migración es aditiva; conviene destruir/crear el volumen en entornos nuevos.
- `PATCH /auth/perfil` queda disponible para cualquier rol autenticado; el acceso rápido se ofrece desde el workbench del postulante.

---

## [v1.0.0] — 2026-XX-XX

### Added
- Primera versión completa del sistema SIGEB
- Todas las funcionalidades del alcance definido
- Documentación completa del proyecto

### Notas
- Release candidates anteriores
- Testing completo antes del release

---

*Última actualización: 2026-09-01*
