# Diagramas — SIGEB / EDUVIAGT v1.1

> Diagramas en Mermaid. Fuente de verdad versionable. Si un diagrama contradice el código, el código manda y el diagrama debe corregirse.

## 1. Arquitectura general

```mermaid
graph TB
  subgraph MONO[Monorepo — npm workspaces + Turborepo]
    subgraph API[apps/api — NestJS 10]
      MW[Guards globales: JwtAuthGuard -> RolesGuard -> PermissionsGuard]
      CTRL[Controllers — 14 routers]
      SVC[Services — 17 módulos]
      PRIS[PrismaService -> PostgreSQL 16]
      TRANS[Transversales: AuthzService, AuditService, BitacoraService, NotificacionesService]
    end
    subgraph WEB[apps/web — Next.js 14 App Router]
      SSR[Server Components — fetch público sin token]
      CSR[Client Components — fetch autenticado]
      PROXY[NEXT_PUBLIC_API_PROXY -> rewrite /api/:path*]
    end
  end
  DB[(PostgreSQL — 36 entidades)]
  STORAGE[(Storage en disco — adapter FS)]
  LLM[(LLM externo opcional — OpenAI-compatible)]

  MW --> CTRL --> SVC --> PRIS --> DB
  SVC --> TRANS
  SVC --> STORAGE
  SVC --> LLM
  WEB -->|/api/*| PROXY -->|NEXT_PUBLIC_API_PROXY| API
  SSR -->|API_INTERNAL_URL| API
```

**Notas verificadas:**
- No existe capa Repository: Prisma se usa directamente en los servicios.
- No hay throttling global: el único rate limit es `LoginAttemptService` (en memoria, 5/15 min por `ip:email`).
- Los transversales se invocan por **llamada directa**, dentro o fuera de la transacción (no hay bus de eventos).
- 36 entidades (no 31): ver `docs/architecture/database-schema.md`.

## 2. Monorepo — Turborepo

```mermaid
graph LR
  ROOT[package.json raíz<br/>workspaces: apps/*, packages/*] --> TURBO[turbo.json]
  TURBO --> BUILD[build: dependsOn ^build<br/>outputs dist/**, .next/**]
  TURBO --> DEV[dev: cache false, persistent true]
  TURBO --> LINT[lint: dependsOn ^build]
  TURBO --> TEST[test: dependsOn build]
  BUILD --> API[apps/api -> nest build -> dist/]
  BUILD --> WEB[apps/web -> next build -> .next/]
```

## 3. Flujo de autenticación

```mermaid
sequenceDiagram
  participant U as Usuario (web)
  participant API as API NestJS
  participant LA as LoginAttemptService
  participant DB as PostgreSQL
  participant AU as AuditService / Bitacora

  U->>API: POST /api/auth/registro (RegisterDto)
  API->>DB: verificar CUI/email (case-insensitive)
  API->>DB: hash bcrypt (salt 10) + crear usuario (rol POSTULANTE)
  API->>AU: audit.log + bitacora.registrar
  API-->>U: 201 { data: { id, cui, nombres, email, rol:{id,nombre}, createdAt } }

  U->>API: POST /api/auth/login (LoginDto)
  API->>LA: estado(clave = ip:email)
  alt bloqueado
    API-->>U: 429 "Demasiados intentos fallidos. Intenta de nuevo en N segundos."
  end
  API->>DB: buscar usuario por email (case-insensitive)
  alt no existe o estado != ACTIVO
    API->>LA: registrarFallo(clave)
    API-->>U: 401 "Credenciales inválidas" / "Usuario inactivo"
  end
  API->>API: bcrypt.compare
  alt password inválido
    API->>LA: registrarFallo(clave)
    API-->>U: 401 "Credenciales inválidas"
  end
  API->>LA: registrarExito(clave)
  API->>API: generateTokens (access 15m + refresh 7d, secrets distintos)
  API->>AU: audit.log + bitacora.registrar (ip, origen WEB)
  API-->>U: 200 { data: { accessToken, refreshToken, user } }

  U->>API: POST /api/auth/refresh (RefreshTokenDto)
  API->>API: jwtService.verify(refreshToken, JWT_REFRESH_SECRET)
  API->>DB: usuario ACTIVO
  API->>API: sign accessToken (JWT_ACCESS_EXPIRATION)
  API->>AU: audit.log
  API-->>U: 200 { data: { accessToken } }

  U->>API: GET /api/auth/perfil (Authorization: Bearer access)
  API->>API: JwtStrategy.validate (carga usuario + rol)
  API->>DB: findUnique con include rol/genero/departamento/municipio
  API-->>U: 200 { data: { ...aplanarPerfil } }
```

## 4. Flujo de solicitud (FSM corregida)

```mermaid
stateDiagram-v2
  [*] --> BORRADOR
  BORRADOR --> ENVIADA: enviar
  ENVIADA --> EN_REVISION: iniciar_revision
  EN_REVISION --> CORRECCION: solicitar_correccion
  EN_REVISION --> EVALUADA: evaluar
  CORRECCION --> BORRADOR: corregir
  EVALUADA --> APROBADA: aprobar (monto <= Q10.000)
  EVALUADA --> PENDIENTE_SEGUNDA_APROBACION: solicitar_segunda_aprobacion (monto > Q10.000)
  EVALUADA --> RECHAZADA: rechazar
  PENDIENTE_SEGUNDA_APROBACION --> APROBADA: aprobar_segunda
  PENDIENTE_SEGUNDA_APROBACION --> RECHAZADA: rechazar
  PENDIENTE_SEGUNDA_APROBACION --> EN_REVISION: devolver_a_revision
  APROBADA --> [*]
  RECHAZADA --> [*]
```

**Nota:** la acción `aprobar` se remapea automáticamente a `solicitar_segunda_aprobacion` cuando `montoOtorgable > UMBRAL_SEGUNDA_APROBACION_GTQ (10000)` (`common/constants/roles.ts:28`).

## 5. Segunda aprobación

```mermaid
sequenceDiagram
  participant J as JEFE_BECAS
  participant API as API
  participant AUTHZ as AuthzService
  participant DB as PostgreSQL
  participant AU as Audit / Bitacora

  J->>API: POST /api/solicitudes/:id/segunda-aprobacion {decision, comentario}
  API->>AUTHZ: assertSegundaAprobacion(usuario) — lanza 403 si no es ADMIN/JEFE_BECAS o si es la misma persona
  API->>DB: transaction { solicitud.update(estado), solicitudAprobacion.create(nivel=2), historialEstado.create }
  API->>AU: audit.log + bitacora.registrar
  API-->>J: 200 { data: { ... } }
```

## 6. Eliminación de cuenta

```mermaid
sequenceDiagram
  participant U as Usuario
  participant API as API
  participant DB as PostgreSQL
  participant FS as FilesystemStorage

  U->>API: POST /api/auth/eliminar-cuenta {contrasena, confirmacion, motivo?}
  API->>API: validar confirmacion === "ELIMINAR" (toUpperCase)
  API->>DB: verificar password (bcrypt.compare)
  API->>DB: $transaction { anonimizar usuario (nombres->"Usuario eliminado", email->null, passwordHash->null, eliminadoAt=now), historialEstado, bitacora }
  API->>FS: borrar archivos fuera de la transacción (best-effort, try/catch vacío)
  API-->>U: 200 { data: { ok: true } }
```

## 7. Cadena de permisos (Chain of Responsibility)

```mermaid
graph LR
  G[PermissionsGuard] --> PS[PermissionService]
  PS --> CH[buildPermissionChain]
  CH --> UH[UsuarioPermisoHandler]
  UH -->|si usuarioPermiso existe| DEC{efecto}
  DEC -->|PERMITIR| ALLOW[ALLOW]
  DEC -->|DENY| DENY[DENY]
  UH -->|no existe| RH[RolPermisoHandler]
  RH -->|rolPermiso existe| ALLOW2[ALLOW]
  RH -->|no existe| DD[DefaultDenyHandler]
  DD --> DENY2[DENY]
```

**Fail-closed:** `PermissionsGuard` con `@Permisos([])` deniega (no relaja). Orden global: `JwtAuthGuard → RolesGuard → PermissionsGuard`.

## 8. Asistente IA — flujo real (2 modos excluyentes)

```mermaid
sequenceDiagram
  participant W as Web (ChatWidget / MiniAsistente)
  participant C as AsistenteController (PUBLIC)
  participant S as AsistenteService
  participant P as AsistenteIAProxy
  participant KB as PostgreSQL FTS (asistente_base_conocimiento)
  participant LLM as Proveedor LLM (OpenAI-compatible)

  W->>C: POST /api/asistente/preguntar { pregunta }
  C->>S: preguntar(pregunta)  [sin usuario -> rol=null, usuarioId=null]
  S->>P: responder(pregunta, {rol:null, sesionId:null})
  P->>P: obtenerProveedor() -> 'openai' si AI_API_KEY, sino 'fallback-kb'

  alt modo fallback-kb (sin AI_API_KEY)
    P->>KB: SELECT ... ts_rank(to_tsvector('spanish', titulo||' '||contenido), websearch_to_tsquery('spanish', REPLACE($1,' ',' OR '))) WHERE activo=true ORDER BY rank DESC, titulo ASC LIMIT 3
    KB-->>P: hasta 3 filas
    P-->>S: { respuesta: "Aquí tienes lo que sé:\n1. ...", fuentes: [titulos] }
  else modo openai (con AI_API_KEY)
    P->>LLM: POST {AI_BASE_URL}/chat/completions {model, messages:[system (variante "NO autenticado"), user], temperature:0.3, max_tokens:500} (timeout AbortController AI_TIMEOUT_MS)
    alt éxito
      LLM-->>P: choices[0].message.content
      P-->>S: { respuesta: texto, fuentes: [] }
    else error/timeout
      P->>P: logger.warn(...)
      P->>KB: fallback (mismo SELECT FTS)
      P-->>S: { respuesta: "Aquí tienes lo que sé:...", fuentes: [titulos] }
    end
  end

  S->>DB: INSERT asistente_conversacion (usuarioId=null, sesionId=null) + 2 INSERT asistente_mensaje (sin transacción)
  S-->>C: { respuesta, fuentes }
  C-->>W: 201 { data: { respuesta, fuentes } }
```

**⚠️ Esto NO es RAG:** no hay embeddings, vector store, chunking ni re-ranking. El LLM nunca recibe el contexto recuperado de la KB. `fuentes` solo se llena en modo fallback.

**⚠️ Bug documentado:** el controller es `@Public()` sin `@CurrentUser()` → `rol` siempre `null` y `usuarioId` siempre `null`. La "respuesta acotada por rol y sesión" del README no está operativa.

## 9. API ↔ Web con reverse-proxy

```mermaid
sequenceDiagram
  participant B as Browser
  participant N as Next.js server (rewrites)
  participant A as API NestJS

  Note over B,N: Cliente llama a /api/* (relativo)
  B->>N: GET /api/convocatorias
  N->>N: rewrite /api/:path* -> NEXT_PUBLIC_API_PROXY/:path*
  N->>A: GET http://api:3000/api/convocatorias
  A-->>N: { data: { data:[...], total, page, limit } }
  N-->>B: mismo JSON

  Note over B,N: SSR (Server Component) usa URL absoluta
  N->>A: GET API_INTERNAL_URL/convocatorias (sin token)
  A-->>N: { data: ... }

  Note over B,N: SSE de notificaciones
  B->>N: EventSource /api/notificaciones/stream?token=JWT
  N->>A: GET .../notificaciones/stream (estrategia sse-jwt)
  A-->>B: text/event-stream (heartbeat 25s)
```

## 10. Transacción de transición de estado

```mermaid
sequenceDiagram
  participant C as Controller
  participant S as SolicitudesService
  participant DB as PostgreSQL
  participant AU as Audit / Bitacora / Notificaciones

  C->>S: transicion(id, {accion, comentario})
  S->>S: SolicitudStateMachine.next(estado, accion) — lanza 400 si inválida
  S->>DB: $transaction {
  S->>DB:   solicitud.update(estado, montoOtorgable?, ...)
  S->>DB:   historialEstado.create(accion, comentario, usuarioId)
  S->>DB:   solicitudAprobacion.create (si segunda aprobación)
  S->>AU:   audit.log (dentro de tx)
  S->>AU:   bitacora.registrar (dentro de tx, fail-safe)
  S->>DB: }
  S->>AU: notificarTransicion (FUERA de la transacción)
  S-->>C: { data: { ... } }
```

## 11. SSE de notificaciones

```mermaid
sequenceDiagram
  participant W as Web
  participant API as API
  participant SVC as NotificacionesService

  W->>API: GET /api/notificaciones/stream?token=JWT (EventSource)
  API->>API: AuthGuard('sse-jwt') valida token
  API->>SVC: suscribir(usuarioId) -> Subject<EventoNotificacion>
  loop heartbeat 25s
    API-->>W: event: hb
  end
  SVC-->>API: next(evento)
  API-->>W: data: {tipo, mensaje, ...}
  Note over W: onerror -> close -> refreshAccessToken -> setTimeout(conectar, 1000)
```

## 12. Subida y descarga segura de documentos

```mermaid
sequenceDiagram
  participant U as Usuario
  participant API as API
  participant M as Multer (memoryStorage)
  participant FS as FilesystemStorageAdapter

  U->>API: POST /api/solicitudes/:id/documentos/:tipoId (multipart, max 5MB, MIME pdf/jpeg/png + extensión)
  API->>M: FileInterceptor (limits: fileSize 5MB, files 1)
  M->>API: fileFilter (MIME + extensión coincidente)
  API->>FS: save(buffer) -> key UUID, resolveKey anti path-traversal
  FS->>FS: fs.promises.writeFile
  API->>DB: solicitudDocumento.create (key, tamaño, estado)
  API-->>U: { data: { url, key, size } }

  U->>API: GET /api/solicitudes/:id/documentos/:tipoId/descargar
  API->>API: verificar dueño o revisor
  API->>FS: read(key) -> Buffer
  API-->>U: 200 (Content-Disposition inline, filename)
```

## 13. Despliegue en VM (PM2 vigente + Docker Compose alternativa)

### 13.1 PM2 (vigente — job `deploy-staging`)

```mermaid
graph TB
  CI[GitHub Actions deploy-staging] -->|SSH appleboy/ssh-action| VM[VM /home/davi/sigeb]
  VM --> GIT[git fetch + checkout develop + git reset --hard origin/develop]
  GIT --> NPM[npm ci]
  NPM --> PRISMA[prisma migrate deploy + generate]
  PRISMA --> BUILD[npm run build]
  BUILD --> COPY[copiar .next/static y public al standalone]
  COPY --> PM2[pm2 startOrRestart sigeb-api,sigeb-web]
  PM2 --> SAVE[pm2 save]
```

**Nombres reales:** `sigeb-api`, `sigeb-web`, `/home/davi/sigeb`, `sigeb.pm2.config.cjs`. Repo canónico: `https://github.com/Deividcodv/proyecto-analisis-Eduviagt.git` (fallback `sigeb-prod.git`).

### 13.2 Docker Compose (alternativa / dev)

```mermaid
graph TB
  subgraph COMPOSE[docker-compose.prod.yml]
    PG[postgres:16-alpine<br/>volumen postgres_data]
    API[api: Dockerfile apps/api<br/>STORAGE_PATH=/data/storage<br/>healthcheck: GET /api/catalogos/generos]
    WEB[web: Dockerfile apps/web<br/>NEXT_PUBLIC_API_PROXY=http://api:3000/api]
  end
  PG --> API --> WEB
  VOL[(storage_data)]
  API --> VOL
```

## 14. Pipeline CI (6 jobs)

```mermaid
graph LR
  AT[api-tests<br/>lint + unit + tsc api/web + build api + smoke bash] --> E2E[e2e-web<br/>Playwright + axe, globalSetup resiembra sigeb_test]
  AT --> DB[docker-build<br/>solo develop/master]
  AT --> DS[deploy-staging<br/>solo develop, SSH inline]
  DB --> DS
  DS --> DP[deploy-production<br/>solo master + PRODUCTION_READY=true]
  LT[lint-and-test<br/>compatibilidad branch protection] --> AT
```

## 15. Estructura de carpetas del backend (real)

```mermaid
graph TB
  SRC[apps/api/src/] --> APP[app.module.ts]
  SRC --> AUTH[auth/]
  SRC --> USERS[users/ — Fachada de seguridad]
  SRC --> CAT[catalogos/]
  SRC --> CONV[convocatorias/ + state-machine]
  SRC --> SOL[solicitudes/ + state-machine + pdf/]
  SRC --> EVAL[evaluaciones/]
  SRC --> COM[comites/]
  SRC --> SES[sesiones/]
  SRC --> REP[reportes/]
  SRC --> ASI[asistente/ — proxy + providers + types]
  SRC --> AUD[audit/]
  SRC --> BIT[bitacora/]
  SRC --> NOT[notificaciones/ + SSE]
  SRC --> STO[storage/ — adapter FS]
  SRC --> PRI[prisma/ — PrismaService]
  SRC --> COMN[common/ — guards, decorators, interceptors, filters]
```

## 16. Modelo de datos (36 entidades)

Entidades por dominio:
- **Auth/Seguridad:** Usuario, Rol, Permiso, RolPermiso, UsuarioPermiso, ConfiguracionUsuario, UsuarioEliminado (anonimización)
- **Catálogos:** Genero, NivelAcademico, Departamento, Municipio, InstitucionEducativa, DocumentoTipo, Beca, CriterioEvaluacion
- **Convocatorias:** Convocatoria, ConvocatoriaDocumentoRequerido, ConvocatoriaReglaMonto
- **Solicitudes:** Solicitud, SolicitudPerfilAcademico, SolicitudPerfilFinanciero, SolicitudDocumento, SolicitudRespuesta, SolicitudAprobacion, HistorialEstado
- **Evaluación:** Evaluacion, EvaluacionCriterio
- **Comités:** Comite, ComiteMiembro, Sesion, SesionAgenda, Voto, Decision
- **Auditoría/Bitácora:** AuditLog, BitacoraSistema, Notificacion
- **Asistente:** AsistenteBaseConocimiento (33 filas), AsistenteConversacion, AsistenteMensaje

Enums (6, coinciden con `schema.prisma`): `ConvocatoriaEstado`, `SolicitudEstado`, `SesionEstado`, `DecisionResultado`, `DocumentoEstado`, `TipoReglaMonto`.

## 17. Machine de estados de convocatoria

```mermaid
stateDiagram-v2
  [*] --> BORRADOR
  BORRADOR --> ABIERTA: publicar
  BORRADOR --> ARCHIVADA: archivar
  ABIERTA --> CERRADA: cerrar
  ABIERTA --> ARCHIVADA: archivar
  CERRADA --> EN_EVALUACION: iniciar_evaluacion
  CERRADA --> ABIERTA: reabrir
  EN_EVALUACION --> RESUELTA: resolver
  EN_EVALUACION --> ARCHIVADA: archivar
  RESUELTA --> ARCHIVADA: archivar
  ARCHIVADA --> ABIERTA: reabrir
  ARCHIVADA --> [*]
  RESUELTA --> [*]
```

---

## 18. Filtrado de convocatorias públicas (server-side)

```mermaid
flowchart TD
  REQ[GET /api/convocatorias?estado=...] --> EST{estado?}
  EST -->|omitido| ALL[abiertas vigentes + cerradas/históricas incluye ABIERTA vencida]
  EST -->|ABIERTA| ABIERTA[Solo vigentes: fechaApertura <= hoy <= fechaCierre]
  EST -->|CERRADA| CERRADA[CERRADA/EN_EVALUACION/RESUELTA/ARCHIVADA + ABIERTA vencida]
  ALL --> SORT[Orden: abiertas primero, luego createdAt desc]
  ABIERTA --> SORT
  CERRADA --> SORT
  SORT --> OUT[Lista de convocatorias]
```

## 19. Cadena de datos de demostración

```mermaid
flowchart LR
  SEED[prisma db seed] --> SEEDTS[seed.ts: roles, permisos, catálogos, 33 docs KB, usuarios demo]
  SEEDTS --> SEMILLA[import ./semilla/escenarios]
  SEMILLA --> DATOS[datos.ts: catálogo canónico + 250 postulantes + 30 evaluadores + 50 miembros]
  SEMILLA --> CICLOS[ciclos.ts: 4 ciclos de ~90 días]
  SEMILLA --> ESC[escenarios.ts: 1000 solicitudes + evaluaciones + comités]
  ESC --> VERIFY[verificar.ts: aserciones, exit 0/1]
```

## Referencias

- `docs/architecture/ARQUITECTURA-REAL.md`
- `docs/architecture/asistente-ia.md`
- `docs/architecture/frontend.md`
- `docs/architecture/api-web-contrato.md`
- `docs/architecture/design-patterns.md`
- `docs/architecture/decisions.md`
- `docs/architecture/database-schema.md`
- `docs/architecture/ARQUITECTURA_TECNICA_DETALLADA_SIGEB_v1.1.md`