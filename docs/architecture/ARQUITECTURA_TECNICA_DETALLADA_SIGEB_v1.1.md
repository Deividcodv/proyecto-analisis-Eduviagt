# ARQUITECTURA TÉCNICA DETALLADA - SIGEB / EDUVIAGT v1.1

## 1. Propósito
Este documento describe la arquitectura técnica real del proyecto SIGEB (EDUVIAGT) tal como se encuentra implementada en este repositorio. Se centra en: monorepo con Turborepo, API NestJS, web Next.js, ORM/BD con Prisma + PostgreSQL, despliegue en VM con Docker Compose, arquitectura del asistente IA, autenticación JWT y flujos end-to-end.

## 2. Monorepo con Turborepo
El proyecto es un **monorepo** gestionado con [Turborepo](https://turbo.build/). Las dependencias se comparten vía npm workspaces.

### 2.1 Estructura de workspaces
```json
{
  "workspaces": ["apps/*", "packages/*"],
  "packageManager": "npm@10.0.0",
  "engines": { "node": ">=20" }
}
```

Aplicaciones principales:
- `apps/api` - Backend NestJS (REST)
- `apps/web` - Frontend Next.js (App Router)
- `packages/*` - Paquetes compartidos (si existen)

### 2.2 Configuración Turborepo (`turbo.json`)
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

- `dependsOn: ["^build"]` - Las tareas hijo se construyen antes que la padre.
- `cache: false` para `dev` - Evita cachear servidores de desarrollo persistentes.
- `persistent: true` - Marca tareas de larga ejecución (watch/dev).
- `outputs` - Define qué artefactos cachear (`dist/` API, `.next/` web).

### 2.3 Scripts raíz
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "dev:api": "turbo run dev --filter=api",
    "dev:web": "turbo run dev --filter=web",
    "build": "turbo run build",
    "build:api": "turbo run build --filter=api",
    "build:web": "turbo run build --filter=web",
    "test": "turbo run test",
    "test:api": "turbo run test --filter=api",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\""
  }
}
```

**Flujo típico:** `npm ci` -> `turbo run dev` levanta API (watch) y Web en paralelo con orquestación y caché incremental.

## 3. API - NestJS
### 3.1 Bootstrap (`apps/api/src/main.ts`)
- Prefijo global: `app.setGlobalPrefix('api')` -> rutas bajo `/api/...`
- CORS: `origin: process.env.CORS_ORIGIN || 'http://localhost:3001'`, `credentials: true`
- Validación global: `ValidationPipe` con `whitelist`, `forbidNonWhitelisted`, `transform: true`. Los errores de `class-validator` se formatean a español vía `formatearErroresValidacion`.
- Swagger: `DocumentBuilder` con `addBearerAuth()`, expuesto en `/api/docs`
- Escucha: `app.listen(port, host)` (por defecto `0.0.0.0:3000`)

### 3.2 Arquitectura modular por dominios
Módulos principales en `apps/api/src/`:
- `auth/` - Registro, login, refresh, perfil, eliminación de cuenta
- `seguridad/` - Matriz de permisos (roles + excepciones por usuario)
- `catalogos/` - Género, nivel académico, departamento, municipio, instituciones
- `becas/` - Catálogo y criterios
- `convocatorias/` - CRUD + State Machine + documentos requeridos
- `solicitudes/` - Solicitud multi-sección, documentos, estados, montos
- `documentos/` - Tipos + almacenamiento
- `evaluaciones/` - Asignación, puntajes, score ponderado
- `comites/` - Comités, sesiones, votos, quórum
- `decisiones/` - Aprobación/rechazo
- `reportes/` - Agregaciones + CSV
- `asistente/` - Proxy IA + KB
- `auditoria/` - Auditoría de acciones
- `bitacora/` - Bitácora inmutable
- `notificaciones/` - Notificaciones y preferencias
- `storage/` - Adapter de almacenamiento
- `prisma/` - `PrismaService`
- `salud/` - Health check
- `common/` - Guards, decorators, interceptors, filtros, servicios transversales

### 3.3 Guards, Decorators, Seguridad
- `JwtAuthGuard` + `JwtStrategy` (Passport JWT)
- `@Public()` para rutas sin autenticación
- `@CurrentUser()` para extraer usuario del request
- `PermissionsGuard` + `Chain of Responsibility` para autorización por permisos
- `ValidationPipe` global
- Prefijo `/api` unificado

## 4. Web - Next.js App Router
### 4.1 Configuración
- Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- Puerto dev: `3001` (`next dev -p 3001`)
- Formularios: React Hook Form + Zod
- Data fetching: SWR/Axios según página
- E2E: Playwright

### 4.2 Comunicación con API
- En desarrollo: el cliente llama a `http://localhost:3000/api/*` o vía proxy configurado
- En producción/VM: `NEXT_PUBLIC_API_PROXY=http://api:3000/api` usado por `next.config.js` (rewrites) para enrutar `/api` hacia el servicio `api` interno
- Tokens JWT almacenados en `localStorage` (access/refresh). Se envían como `Authorization: Bearer <token>`

## 5. ORM + Base de Datos (Prisma + PostgreSQL)
### 5.1 PrismaService (Singleton)
```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```
Se provee globalmente vía `PrismaModule`/inyección. Garantiza única instancia del `PrismaClient`.

### 5.2 Esquema, migraciones, seed
- Esquema: `apps/api/prisma/schema.prisma`
- Migraciones: `prisma migrate dev/deploy`
- Seed: `prisma db seed` (configurado en `package.json`)
- Cliente: `prisma generate`

### 5.3 Buenas prácticas
- Consultas parametrizadas por defecto (Prisma)
- Relaciones con `include/select`
- Transacciones cuando hay múltiples escrituras
- Validación en DTOs + reglas de negocio en servicios

## 6. Despliegue en VM / Arquitectura en la nube
### 6.1 Arquitecturas del sistema

El proyecto combina 4 arquitecturas que conviene distinguir:

1. **Monolito modular por capas (backend):** 17 módulos NestJS dentro de un solo proceso, con capas controller → service → Prisma. No hay microservicios.
2. **Split API / Web con reverse-proxy (BFF-like):** dos aplicaciones independientes (NestJS REST + Next.js) que se comunican por HTTP/JSON. En producción la web proxea `/api/*` al backend vía `rewrites()` de Next (`NEXT_PUBLIC_API_PROXY`); en SSR se usa `API_INTERNAL_URL`.
3. **Asistente IA con dos modos excluyentes:** recuperación léxica (FTS PostgreSQL) o LLM genista sin contexto recuperado. Ver `docs/architecture/asistente-ia.md`.
4. **Despliegue en VM con PM2 (vigente) + Docker Compose (alternativa).**

### 6.2 Local (desarrollo)
`docker-compose.yml` levanta solo PostgreSQL:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck: ...
```
API y Web corren con `npm run dev` (Turbo) o `npm run up` (`scripts/dev-up.ps1`).

### 6.3 Producción (PM2 — camino vigente)

El job `deploy-staging` del CI ejecuta por SSH (inline, no copia `deploy-pm2.sh`):

1. `git fetch` + `git checkout develop` + `git reset --hard origin/develop`
2. `npm ci`
3. `npx prisma migrate deploy` + `npx prisma generate`
4. `npm run build`
5. Copiar `.next/static` y `public` al árbol standalone (`apps/web/.next/standalone/apps/web`)
6. `pm2 startOrRestart sigeb-api,sigeb-web` + `pm2 save`

Nombres reales: `sigeb-api`, `sigeb-web`, `/home/davi/sigeb`, `sigeb.pm2.config.cjs`. Repo canónico: `https://github.com/Deividcodv/proyecto-analisis-Eduviagt.git` (fallback `sigeb-prod.git`).

### 6.4 Alternativa (Docker Compose)

`docker-compose.prod.yml` levanta 3 servicios (`postgres`, `api`, `web`) + volúmenes `postgres_data` y `storage_data`, con healthchecks (la API se verifica con `GET /api/catalogos/generos`). La web usa `NEXT_PUBLIC_API_PROXY=http://api:3000/api`.

### 6.5 CI/CD (GitHub Actions) — 6 jobs

- `api-tests`: instala deps, `prisma generate`, `migrate deploy`, `prisma db seed`, lint, unit tests, `tsc --noEmit` (api y web), build api, instalación de Chromium, smoke de integración (`.github/scripts/smoke-ci.sh`)
- `e2e-web`: Playwright con PostgreSQL efímero, `globalSetup` resiembra `sigeb_test`, levanta servidores vía config
- `docker-build`: solo en `develop`/`master`, build de imágenes Docker
- `deploy-staging`: solo en `develop`, SSH inline (PM2)
- `deploy-production`: solo en `master` + `PRODUCTION_READY=true` (deshabilitado)
- `lint-and-test`: compatibilidad con branch protection

### 6.4 CI/CD (GitHub Actions)
Ver `.github/workflows/ci.yml`:
- `api-tests`: instala deps, `prisma generate`, `migrate deploy`, `prisma db seed`, lint, unit tests, `tsc --noEmit` (api/web), build api, smoke tests con PostgreSQL efímero
- `e2e-web`: Playwright con PostgreSQL efímero, `globalSetup` resetea/siembra, levanta servidores vía config
- `docker-build`: solo en `develop`/`master`, build de imágenes Docker (check/push según configuración)

## 7. Arquitectura del Asistente IA (sin RAG)
### 7.1 Patrones: Proxy + Adapter + Fallback
Ubicación: `apps/api/src/asistente/`
- `asistente.proxy.ts` - **Proxy**: selecciona proveedor por `AI_API_KEY` y degrada a fallback si falla
- `providers/openai.provider.ts` - **Adapter** hacia OpenAI-compatible (sin inyección de contexto)
- `providers/fallback.provider.ts` - **Fallback** con Full-Text Search en PostgreSQL (tsvector)
- `asistente.types.ts` - Contrato `ProveedorIA { responder(pregunta, contexto): Promise<RespuestaIA> }`
- `asistente.service.ts` - Orquesta proxy + persiste conversación/mensajes
- `asistente.controller.ts` - Endpoint REST `POST /asistente/preguntar`, `@Public()`, sin `@CurrentUser()` (bug documentado)

### 7.2 Los dos modos son excluyentes (NO es RAG)

| Modo | Recuperación | Semántica | Citas |
|---|---|---|---|
| `fallback-kb` (default, sin `AI_API_KEY`) | FTS PostgreSQL top-3 | Léxica (tsvector) | ✅ títulos |
| `openai` (con `AI_API_KEY`) | Ninguna | ❌ LLM genista | ❌ `fuentes: []` |

No hay embeddings, vector store, chunking ni re-ranking. El LLM nunca recibe la KB recuperada.

### 7.3 Flujo del modo fallback-kb
1. `soloTerminos(pregunta)`: normaliza (lowercase + NFD + quita acentos + puntuación), filtra stopwords y términos ≤ 2 chars.
2. Si la consulta queda vacía → respuesta genérica.
3. Query FTS: `ts_rank(to_tsvector('spanish', titulo||' '||contenido), websearch_to_tsquery('spanish', REPLACE($1,' ',' OR ')))`, `activo=true`, `ORDER BY rank DESC, titulo ASC`, `LIMIT 3`.
4. Si no hay filas → "No encontré información específica...".
5. Si hay filas → respuesta numerada con la primera línea de cada `contenido` + nota por rol (solo si `rol !== 'POSTULANTE'`).
6. `fuentes = filas.map(f => f.titulo)`.

### 7.4 Flujo del modo openai
- `POST {AI_BASE_URL}/chat/completions`, modelo `AI_MODEL` (default `gpt-4o-mini`).
- `temperature: 0.3`, `max_tokens: 500` (hardcodeados).
- Timeout `AI_TIMEOUT_MS` (default 15000) vía `AbortController`.
- System prompt con 2 variantes (autenticado / no autenticado), instrucción de acotamiento y no-revelación.
- **Mensajes: exactamente 2** (`system` + `user`). Sin historial, sin contexto de KB.
- `fuentes: []` siempre.

### 7.5 Bug documentado: acotado por rol no operativo
El controller es `@Public()` sin `@CurrentUser()` → `rol` siempre `null`, `usuarioId` siempre `null`, `sesionId` siempre `null`. La "respuesta acotada por sesión y rol" del README no está implementada. Ver `docs/architecture/asistente-ia.md` §4 y `docs/standards/deuda-tecnica.md` §4.1.

## 8. Autenticación, JWT y flujos
### 8.1 Componentes
- `AuthService` - registro/login/refresh/perfil/actualización
- `AuthController` - endpoints `/api/auth/*`
- `JwtStrategy` (Passport) - valida token Bearer, carga usuario activo con rol
- `JwtAuthGuard` - protege rutas
- `@Public()` - marca rutas públicas
- `LoginAttemptService` - rate limiting por `ip:email` con bloqueo temporal
- `bcrypt` - hash de contraseñas (salt 10)
- `@nestjs/jwt` - firma/verificación

### 8.2 Ciclo de autenticación
**Registro (`POST /api/auth/registro`)**
- Normaliza email a minúsculas, verifica unicidad CUI/email (case-insensitive)
- Asigna rol `POSTULANTE` por defecto
- Hash bcrypt, crea usuario, registra en `audit` y `bitacora`

**Login (`POST /api/auth/login`)**
- Rate limit por IP+email. Si bloqueado -> 429
- Busca usuario por email (case-insensitive), verifica estado ACTIVO
- Compara bcrypt. Si falla -> registra intento fallido, 401
- Si éxito -> `generateTokens()` (access + refresh), registra login en audit/bitacora, retorna tokens + user

**Refresh (`POST /api/auth/refresh`)**
- Verifica `refreshToken` con `JWT_REFRESH_SECRET`
- Valida usuario ACTIVO, genera nuevo `accessToken` con `JWT_ACCESS_EXPIRATION` (default 15m)
- Registra en auditoría

**Perfil (`GET/PATCH /api/auth/perfil`)**
- Requiere `JwtAuthGuard`, obtiene usuario vía `@CurrentUser('id')`
- Valida catálogos (género/departamento/municipio) y pertenencia municipio-departamento

### 8.3 Configuración JWT
Variables típicas:
```env
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

### 8.4 Envío/recepción API ↔ Web
- **Cliente (browser)**: envía `Authorization: Bearer <accessToken>`. Ante 401 puede usar refresh token
- **Servidor Next.js**: puede usar proxy interno
- **CORS** configurado en API
- Tokens en `localStorage` (implementación actual). Refresh flow manejado desde cliente/servicios

## 9. Ciclos de negocio (técnico)
### 9.1 Convocatorias - State Machine
Estados: `BORRADOR | ABIERTA | CERRADA | EN_EVALUACION | RESUELTA | ARCHIVADA`  
Transiciones validadas por `ConvocatoriaStateMachine.next()`. Lanza excepción si inválida.

### 9.2 Solicitudes - State Machine
Estados incluyen `BORRADOR, ENVIADA, EN_REVISION, CORRECCION, EVALUADA, PENDIENTE_SEGUNDA_APROBACION, APROBADA, RECHAZADA`  
Soporta `solicitar_segunda_aprobacion`, `aprobar_segunda`, `devolver_a_revision` (Sprint 8).  
Validación centralizada en máquina de estados.

### 9.3 Otros ciclos
- **Evaluación**: asignación, puntajes por criterio ponderado, cálculo de score
- **Comités**: sesiones, quórum, votación
- **Decisiones**: aprobación/rechazo con reglas
- **Segunda aprobación**: monto > Q10,000 requiere `JEFE_BECAS`
- **Montos flexibles**: tramos FIJO/PORCENTAJE/COMPLETO
- **Bitácora inmutable**: registro con actor, fecha, IP, resultado
- **Eliminación de cuenta**: anonimización conservando trazabilidad

## 10. Patrones verificados
| Patrón | Estado | Ubicación/Evidencia |
|---|---|---|
| Singleton | Implementado (por DI) | `prisma/prisma.service.ts` |
| State | Implementado (FSM por tabla) | `convocatoria-state-machine.ts`, `solicitud-state-machine.ts` |
| Chain of Responsibility | Implementado (fail-closed) | `common/guards/permission-chain.ts` (3 eslabones) |
| Proxy | Implementado (con degradación) | `asistente/asistente.proxy.ts` |
| Adapter | Implementado (3 adapters) | `storage/filesystem.adapter.ts`, `solicitudes/pdf/puppeteer-pdf-renderer.ts`, `asistente/providers/*` |
| Decorator | Implementado (4 custom) | `common/decorators/*` |
| Dependency Injection | Implementado (tokens custom) | `PERMISSION_SERVICE`, `DOCUMENT_STORAGE`, `PDF_RENDERER` |
| Unit of Work | Implementado (`$transaction`) | `solicitudes.service.ts`, `sesiones.service.ts`, `auth/eliminar-cuenta.service.ts` |
| Strategy | Implementado (solo IA) | `asistente/asistente.types.ts`, `asistente.proxy.ts` |
| Facade (explícita) | Implementado | `users/users.service.ts` ("Fachada de seguridad") |
| Facade (de facto) | Implementado | `solicitudes/solicitudes.service.ts` |
| Template Method | Parcial | `permission-chain.ts` (sin `abstract`) |
| Command | Parcial | `TransicionSolicitudDto` (sin `CommandBus`) |
| Mapper / DTO | Parcial | `auth.service.ts` (`aplanarPerfil`), `convocatorias.service.ts` (`mapearReglas`) |
| Rate Limiting | Parcial (en memoria) | `login-attempt.service.ts` (5/15 min por ip:email) |
| Circuit Breaker / Retry | Parcial (solo fallback) | `openai.provider.ts`, `asistente.proxy.ts` |
| Saga / Compensación | Parcial (best-effort) | `eliminar-cuenta.service.ts` |
| Audit Trail append-only | Implementado (no Event Sourcing) | `bitacora/bitacora.service.ts` |
| Feature Flags | Parcial (único flag) | `asistente.proxy.ts` (`AI_API_KEY`) |
| Builder | No implementado | Solo `DocumentBuilder` de Swagger |
| Facade `SolicitudLifecycleService` | No existe | Ruta citada en docs anteriores es inexistente |
| Observer / Event Bus | No implementado | Sin `@nestjs/event-emitter`, sin `EventEmitter` |
| Repository | No implementado | Prisma directo en los servicios |
| CQRS | No implementado | Sin `@nestjs/cqrs` |
| Cache / Redis | No implementado | Sin `cache-manager` ni `redis` |
| Middleware | No implementado | Sin `app.use(...)` |
| Adapter S3 | No implementado | Solo `FilesystemStorageAdapter` |
| Proveedor Gemini | No implementado | Solo `OpenAIProveedor` y `FallbackProveedor` |

## 11. Seguridad y trazabilidad
- Autenticación JWT (access/refresh)
- Autorización por permisos con excepciones por usuario (fail-closed)
- Rate limiting en login
- Validación global con class-validator
- Hash bcrypt
- Auditoría (`auditoria/`) y bitácora inmutable (`bitacora/`)
- Almacenamiento de documentos con control de acceso
- CORS restringido

## 12. Comandos útiles
```bash
# Desarrollo
npm ci
npm run dev

# Base de datos
cd apps/api
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npx prisma studio

# Tests
npm run test:api
npm run test:e2e  # desde apps/web

# Build
npm run build

# Producción VM
docker compose -f docker-compose.prod.yml up -d --build
```

## 13. Referencias
- `README.md` - Visión general
- `apps/api/src/main.ts`, `apps/api/src/app.module.ts`
- `apps/api/src/auth/*`
- `apps/api/src/common/guards/*`
- `apps/api/src/convocatorias/*`, `apps/api/src/solicitudes/*`
- `apps/api/src/asistente/*`, `apps/api/src/storage/*`
- `apps/api/prisma/schema.prisma`
- `turbo.json`, `package.json` (root/apps)
- `docker-compose*.yml`, `.github/workflows/ci.yml`
