# Patrones de diseño — SIGEB / EDUVIAGT v1.1

> **Estado:** revisado contra el código real el 2026-10-27. Las rutas de archivo citadas existen en `apps/api/src/`. Los patrones marcados como **[NO IMPLEMENTADO]** o **[INEXISTENTE]** se documentan como tales porque la documentación anterior afirmaba que existían.

## 1. Resumen verificado

| Patrón | Estado | Evidencia (archivo:línea) |
|---|---|---|
| Singleton | Implementado (por DI de NestJS) | `prisma/prisma.service.ts:4-13` |
| State (FSM) | Implementado | `convocatorias/convocatoria-state-machine.ts:19-53`, `solicitudes/solicitud-state-machine.ts:26-82` |
| Chain of Responsibility | Implementado (fail-closed) | `common/guards/permission-chain.ts:5-88` |
| Adapter | Implementado (3 adapters) | `storage/filesystem.adapter.ts`, `solicitudes/pdf/puppeteer-pdf-renderer.ts`, `asistente/providers/*` |
| Proxy | Implementado (con degradación) | `asistente/asistente.proxy.ts:13-53` |
| Decorator | Implementado (4 custom) | `common/decorators/{public,roles,permisos,current-user}.decorator.ts` |
| Dependency Injection | Implementado (tokens custom) | `common/guards/permission.service.ts:8-16`, `storage/storage.interface.ts:17`, `solicitudes/pdf/pdf-renderer.interface.ts:12` |
| Unit of Work | Implementado (`$transaction`) | `solicitudes/solicitudes.service.ts:85,281,704`, `sesiones/sesiones.service.ts:293`, `users/roles.service.ts:143`, `auth/eliminar-cuenta.service.ts:99` |
| Strategy | Implementado (solo IA) | `asistente/asistente.types.ts:11-14`, `asistente.proxy.ts:40-52` |
| Facade (explícita) | Implementado | `users/users.service.ts:13-18` |
| Facade (de facto) | Implementado | `solicitudes/solicitudes.service.ts:29-39` |
| Template Method | Parcial | `common/guards/permission-chain.ts:5-23` (sin `abstract`, esqueleto duplicado) |
| Command | Parcial | `solicitudes/dto/solicitud.dto.ts:37-48` + `solicitudes.service.ts:186-378` (sin `CommandBus`) |
| Mapper / DTO | Parcial | `auth/auth.service.ts:329-364` (`aplanarPerfil`), `convocatorias/convocatorias.service.ts:80-100` (`mapearReglas`) |
| Rate Limiting | Parcial (en memoria) | `auth/login-attempt.service.ts:32-82` |
| Circuit Breaker / Retry | Parcial (solo fallback) | `asistente/asistente.proxy.ts:30-37`, `asistente/providers/openai.provider.ts:25-55` |
| Saga / Compensación | Parcial (best-effort) | `auth/eliminar-cuenta.service.ts:99-168` |
| Audit Trail append-only | Implementado (no Event Sourcing) | `bitacora/bitacora.service.ts:41,141-177` |
| Feature Flags | Parcial (único flag) | `asistente/asistente.proxy.ts:49-52` |
| **Builder** | **No implementado** | Solo `DocumentBuilder` de Swagger en `main.ts:38-43` |
| **Facade `SolicitudLifecycleService`** | **No existe** | Ruta citada en docs anteriores es inexistente |
| **Observer / Event Bus** | **No implementado** | Sin `@nestjs/event-emitter`, sin `EventEmitter`, sin `@OnEvent` |
| **Repository** | **No implementado** | Prisma se usa directamente en los servicios |
| **CQRS** | **No implementado** | Sin `@nestjs/cqrs` |
| **Cache / Redis / LRU** | **No implementado** | Sin `cache-manager` ni `redis` |
| **Middleware** | **No implementado** | Sin `app.use(...)` ni archivos de middleware |
| **Adapter S3** | **No implementado** | Solo `FilesystemStorageAdapter` |
| **Proveedor Gemini** | **No implementado** | Solo `OpenAIProveedor` y `FallbackProveedor` |

---

## 2. Patrones implementados en detalle

### 2.1 Singleton — `PrismaService` (por DI, no por patrón estático)

Archivo: `apps/api/src/prisma/prisma.service.ts` (13 líneas)

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

El singleton **no** se logra con `private static instance` + `getInstance()`. Se logra porque `PrismaModule` es `@Global()` y provee una única instancia de `PrismaService`. Documentos anteriores que mostraban un diagrama con `getInstance()` eran incorrectos.

Otros singletons de estado compartido en proceso:
- `auth/login-attempt.service.ts:33` — `private readonly registros = new Map<string, Registro>()`
- `notificaciones/notificaciones.service.ts:39-40` — `private readonly subjects = new Map<string, Subject<EventoNotificacion>>()`
- `solicitudes/pdf/puppeteer-pdf-renderer.ts:8` — `private browserPromise: Promise<Browser> | null = null`

### 2.2 State — máquinas de estado por tabla

`convocatorias/convocatoria-state-machine.ts` y `solicitudes/solicitud-state-machine.ts`. Implementación con `Record<Estado, Partial<Record<Transicion, Estado>>>`, `next()` que lanza `BadRequestException` si la transición no es válida, e `isAllowed()` para chequeos.

Estados de convocatoria: `BORRADOR | ABIERTA | CERRADA | EN_EVALUACION | RESUELTA | ARCHIVADA`
Estados de solicitud: `BORRADOR | ENVIADA | EN_REVISION | CORRECCION | EVALUADA | PENDIENTE_SEGUNDA_APROBACION | APROBADA | RECHAZADA`

Transiciones verificadas:
- `CORRECCION --corregir--> BORRADOR` (no `ENVIADA`)
- `EN_REVISION --evaluar--> EVALUADA` (no `finalizar_revision`)
- `EVALUADA --aprobar--> APROBADA` **o** `solicitar_segunda_aprobacion` → `PENDIENTE_SEGUNDA_APROBACION` cuando `montoOtorgable > UMBRAL_SEGUNDA_APROBACION_GTQ (10000)`

**Divergencia de fuentes:** `common/constants/estados.ts` define `SOLICITUD_ESTADO` con **7 valores** (sin `PENDIENTE_SEGUNDA_APROBACION`), mientras que la máquina de estados y el enum Prisma sí lo tienen. Los documentos anteriores no lo advertían.

### 2.3 Chain of Responsibility — cadena de permisos

Archivo: `common/guards/permission-chain.ts`

```typescript
export class PermissionHandler {
  protected next: PermissionHandler | null = null;
  setNext(handler: PermissionHandler): PermissionHandler { this.next = handler; return this; }
  handle(_userId, _permisoKey): Promise<PermissionDecision> { throw new Error('Method not implemented'); }
  protected async toNext(userId, permisoKey) {
    if (!this.next) return 'DENY';
    return this.next.handle(userId, permisoKey);
  }
}
```

Tres eslabones:
1. `UsuarioPermisoHandler` — consulta `usuarioPermiso` por `usuarioId` + permiso; si existe devuelve `PERMITIR → ALLOW` o `DENY` (siempre gana, precedencia sobre rol).
2. `RolPermisoHandler` — consulta `rolPermiso` vía `rol.usuarios.some({id: userId})`; si existe → `ALLOW`.
3. `DefaultDenyHandler` — `DENY`.

Construcción: `buildPermissionChain(prisma)` encadena `usuarioHandler → rolHandler → denyHandler`. Consumida por `PermissionService` (token `PERMISSION_SERVICE`) y por `PermissionsGuard`, que es **fail-closed**: `@Permisos([])` deniega (no relaja el acceso).

### 2.4 Adapter — 3 implementaciones

- **Storage** (`storage/storage.interface.ts` + `storage/filesystem.adapter.ts`): interfaz `DocumentStorage {save, read, delete, exists}`; token `DOCUMENT_STORAGE`. `FilesystemStorageAdapter` guarda en `STORAGE_PATH` con keys `randomUUID()`, normaliza paths y previene path traversal (`resolveKey` con `startsWith(root)`). **No existe `S3StorageAdapter`**.
- **PDF** (`solicitudes/pdf/pdf-renderer.interface.ts` + `puppeteer-pdf-renderer.ts`): interfaz `PdfRenderer {render}`; token `PDF_RENDERER`; implementación con Puppeteer (Chromium).
- **IA** (`asistente/asistente.types.ts` + `providers/fallback.provider.ts` + `providers/openai.provider.ts`): contrato `ProveedorIA {responder(pregunta, contexto): Promise<RespuestaIA>; readonly nombre}`.

### 2.5 Proxy — `AsistenteIAProxy`

Archivo: `asistente/asistente.proxy.ts`

```typescript
async responder(pregunta: string, contexto: ContextoIA): Promise<RespuestaIA> {
  const nombre = this.obtenerProveedor();        // 'openai' si AI_API_KEY, sino 'fallback-kb'
  const proveedor = this.resolver(nombre);
  if (nombre === 'fallback-kb') return proveedor.responder(pregunta, contexto);
  try { return await proveedor.responder(pregunta, contexto); }
  catch (e) {
    this.logger.warn(`Proveedor ${nombre} no disponible (${...}), degradando a fallback-kb`);
    return this.fallback.responder(pregunta, contexto);
  }
}
```

Degradación automática con timeout (`AbortController`, `AI_TIMEOUT_MS` default 15000). **Sin retry ni circuit breaker**.

### 2.6 Decorator — 4 custom

- `@Public()` (`common/decorators/public.decorator.ts`) — marca rutas sin JWT.
- `@Roles(...)` (`common/decorators/roles.decorator.ts`) — **registrado globalmente pero sin uso en ningún controller** (código muerto).
- `@Permisos(...)` (`common/decorators/permisos.decorator.ts`) — metadata `permissions`.
- `@CurrentUser()` (`common/decorators/current-user.decorator.ts`) — `createParamDecorator` que extrae `request.user` (o una clave).

### 2.7 Dependency Injection — tokens custom

- `PERMISSION_SERVICE` → `PermissionService` (`common/guards/permission.service.ts`)
- `DOCUMENT_STORAGE` → `FilesystemStorageAdapter` (`storage/storage.module.ts`)
- `PDF_RENDERER` → `PuppeteerPdfRenderer` (`solicitudes/solicitudes.module.ts`)
- `LOGIN_ATTEMPT_SERVICE` — **token muerto** (AuthModule provee con el token-clase `LoginAttemptService`)

### 2.8 Unit of Work — transacciones Prisma

`prisma.$transaction(async tx => ...)` en:
- `solicitudes/solicitudes.service.ts:85` (creación de solicitud + historial de estado)
- `solicitudes/solicitudes.service.ts:281` (transición de estado)
- `solicitudes/solicitudes.service.ts:704` (decisión de segunda aprobación)
- `sesiones/sesiones.service.ts:293`
- `users/roles.service.ts:143`
- `auth/eliminar-cuenta.service.ts:99`

Variante array (solo lectura): `audit/audit.service.ts:59`, `notificaciones/notificaciones.service.ts:149`.

### 2.9 Strategy — solo para IA

El contrato `ProveedorIA` (2 implementaciones: `OpenAIProveedor` y `FallbackProveedor`) es el único Strategy real. La selección es por presencia de `AI_API_KEY` (`asistente.proxy.ts:49-52`).

En montos, el comportamiento Strategy se implementa con `switch` (`solicitudes/montos.service.ts:230-261`, `TIPO_REGLA_MONTO = {FIJO, PORCENTAJE, COMPLETO}`), no con clases polimórficas. El scoring de evaluaciones es inline (`evaluaciones/evaluaciones.service.ts:449-467`).

### 2.10 Facade

- **Explícita:** `users/users.service.ts:13-18` — "Fachada de seguridad: delega cada responsabilidad a un servicio de dominio enfocado (`RolesService`, `PermisosService`, `UsuariosService`)".
- **De facto:** `solicitudes/solicitudes.service.ts:29-39` orquesta estado, historial, auditoría, bitácora, notificaciones y montos dentro de una transacción.

### 2.11 Template Method — parcial

`common/guards/permission-chain.ts:5-23`: clase base `PermissionHandler` con `setNext`/`toNext`, pero **no hay `abstract` en todo `src/`** (grep = 0). Cada handler duplica la comprobación y llama a `toNext`.

### 2.12 Command — parcial

`TransicionSolicitudDto {accion: SolicitudTransicion, comentario?}` transporta la intención; el service decide con un `switch` grande (`solicitudes.service.ts:567-664`). Sin clases Command, `execute()` ni `CommandBus`.

### 2.13 Mapper / DTO — parcial

- `auth/auth.service.ts:329-364` — `aplanarPerfil()` (Prisma → API, aplanando rol/género/departamento/municipio).
- `convocatorias/convocatorias.service.ts:80-100` — `mapearReglas()` (DTO → Prisma con `Prisma.Decimal`).
- Strip de `passwordHash` en `auth/auth.service.ts:114` y `users/usuarios.service.ts:52,101,149`.

No hay Assembler ni capa de mapeo sistemática; la mayoría de servicios devuelve el modelo Prisma crudo con `include`.

### 2.14 Rate Limiting — parcial

`auth/login-attempt.service.ts:32-82`: `Map<string, Registro>` en memoria, clave `ip:email`, 5 intentos / 15 min. **Sin `@nestjs/throttler`**, sin límite global, se pierde al reiniciar y no escala horizontalmente.

### 2.15 Circuit Breaker / Retry — parcial

`asistente/asistente.proxy.ts:30-37`: degradación a fallback con un único intento. `openai.provider.ts:25-28,53-55`: `AbortController` con timeout. **Sin contador de fallos, sin estados abierto/cerrado, sin retry.**

### 2.16 Saga / Compensación — parcial

`auth/eliminar-cuenta.service.ts:99-168`: transacción para anonimización + borrado de archivos **fuera** de la transacción (best-effort, `try/catch` vacío). Sin coordinator ni rollback de archivos.

### 2.17 Audit Trail append-only

`bitacora/bitacora.service.ts:41,141-177`: "registro inmutable y de solo consulta … No existen métodos para modificar ni eliminar entradas." **No es Event Sourcing**: no reconstruye estado, no hay agregados ni proyecciones. `registrar()` nunca propaga el error (try/catch con `logger.warn`).

### 2.18 Feature Flags — parcial

Único flag real: presencia de `AI_API_KEY` define el proveedor IA (`asistente.proxy.ts:49-52`).

---

## 3. Patrones no implementados (documentados como [NO IMPLEMENTADO])

### 3.1 Observer / Event Bus

**No existe.** No hay `@nestjs/event-emitter` en `apps/api/package.json`, ni `EventEmitter`, ni `@OnEvent` en `src/` (grep = 0). `AuditService`, `BitacoraService` y `NotificacionesService` se invocan **por llamada directa** desde el servicio de dominio, dentro o fuera de la transacción.

Lo más próximo: `NotificacionesService` usa un `Subject<EventoNotificacion>` por usuario (RxJS) para el SSE. No es un bus de eventos de dominio.

### 3.2 Builder

**No existe.** No hay `*Builder.ts`, ni método `build()` de dominio. `SolicitudesService` expone `create` + `guardarPerfilAcademico` + `guardarPerfilFinanciero` + `subirDocumento` + `obtenerChecklist` como métodos independientes (construcción incremental por upsert). El único `build()` es `DocumentBuilder` de Swagger en `main.ts:38-43`.

### 3.3 Repository

**No existe.** Grep de `Repository|repository` en `apps/` = 0. Todos los servicios inyectan `PrismaService` y llaman `this.prisma.<modelo>.<op>` directamente. La documentación anterior que exigía "depender de interfaces de repositorio" no se cumple ni se implementa.

### 3.4 CQRS

**No existe.** Sin `@nestjs/cqrs`, sin `CommandBus`/`QueryBus`. Un mismo servicio hace queries y commands (`SolicitudesService`: `findAll`/`findById` + `create`/`transicion`/`overrideMonto`).

### 3.5 Outbox / Event Sourcing

**No existe tabla outbox ni dispatcher.** La bitácora es un audit trail append-only, no event sourcing.

### 3.6 Cache / Redis / LRU

**No existe.** Sin `cache-manager`, sin `redis`, sin `CacheModule`. Grep de `Cache|cache|LRU|redis|Redis` en `src/` = 2 hits irrelevantes.

### 3.7 Middleware

**No existe.** Sin `app.use(...)` ni archivos de middleware. Solo `useGlobalPipes` en `main.ts:25`.

### 3.8 Adapter S3

**No existe.** Solo `FilesystemStorageAdapter`. La extensión a S3/Azure es teórica (ADR-007).

### 3.9 Proveedor Gemini

**No existe.** Solo `OpenAIProveedor` y `FallbackProveedor`. La variable es `AI_API_KEY`/`AI_BASE_URL` (OpenAI-compatible), no `AI_PROVIDER`.

---

## 4. Contrato de respuesta y error transversal

- **Envelope:** `TransformInterceptor` (`common/interceptors/transform.interceptor.ts:15-33`) envuelve toda respuesta JSON en `{ data: ... }`. Respeta `headersSent` (no envuelve CSV/PDF ya enviados).
- **Error:** `AllExceptionsFilter` (`common/filters/http-exception.filter.ts:11-36`) normaliza a `{ statusCode, message, timestamp }`.
- **Validación:** `ValidationPipe` global (`main.ts:25-35`) con `whitelist`, `forbidNonWhitelisted`, `transform`, y `exceptionFactory` que traduce los mensajes de `class-validator` a español (`common/filters/mensajes-error.ts`).

---

## 5. Guards globales y su orden

Registrados en `common/common.module.ts:24-35` (orden de ejecución):
1. `JwtAuthGuard` (`common/guards/jwt-auth.guard.ts`) — respeta `@Public()`.
2. `RolesGuard` (`common/guards/roles.guard.ts`) — **registrado pero sin uso** (código muerto: `@Roles()` no se usa en ningún controller).
3. `PermissionsGuard` (`common/guards/permissions.guard.ts`) — fail-closed con array vacío.

---

## 6. Referencias

- `README.md` — visión general y patrones verificados
- `docs/architecture/ARQUITECTURA-REAL.md` — inventario real del backend
- `docs/architecture/asistente-ia.md` — arquitectura del asistente
- `docs/architecture/frontend.md` — arquitectura del frontend
- `docs/architecture/api-web-contrato.md` — integración entre capas
- `docs/architecture/diagrams.md` — diagramas (Mermaid)
- `docs/architecture/decisions.md` — ADRs (incluye ADR-019 a ADR-022)
- `docs/standards/deuda-tecnica.md` — deuda técnica con evidencia