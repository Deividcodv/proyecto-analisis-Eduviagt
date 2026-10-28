# Arquitectura real verificada — Backend SIGEB / EDUVIAGT v1.1

> Fuente de verdad del backend. Todo lo documentado aquí se verificó contra `apps/api/src/` y `apps/api/prisma/schema.prisma`. Si un nombre de archivo, clase o endpoint no aparece en este documento, probablemente no existe en el código.

## 1. Visión general

- **Tipo:** Monolito modular por capas (NestJS 10), dentro de un monorepo con Turborepo.
- **Comunicación:** REST/JSON sobre HTTP. Prefijo global `/api` (`main.ts:11`).
- **Persistencia:** Prisma 5 + PostgreSQL 16. `PrismaService` es proveedor global (instancia única por DI).
- **Autorización:** Chain of Responsibility (usuario → rol → deny), fail-closed.
- **Transversales:** `AuthzService`, `AuditService`, `BitacoraService`, `NotificacionesService` (todos `@Global`).
- **Respuesta:** envelope `{ data }` global (`TransformInterceptor`); errores normalizados `{ statusCode, message, timestamp }` (`AllExceptionsFilter`).

## 2. Módulos reales (17)

| # | Módulo | Archivo | `@Global` | Imports | Providers | Exports |
|---|---|---|---|---|---|---|
| 1 | AppModule | `app.module.ts` | no | Config, Prisma, Common, Storage, Auth, Users, Catalogos, Convocatorias, Solicitudes, Evaluaciones, Comites, Sesiones, Reportes, Notificaciones, Audit, Bitacora, Asistente | — | — |
| 2 | PrismaModule | `prisma/prisma.module.ts` | **sí** | — | `PrismaService` | `PrismaService` |
| 3 | CommonModule | `common/common.module.ts` | **sí** | PrismaModule | `AuthzService`, token `PERMISSION_SERVICE`→`PermissionService`, 3 `APP_GUARD`, `APP_FILTER`, `APP_INTERCEPTOR` | `AuthzService` |
| 4 | StorageModule | `storage/storage.module.ts` | **sí** | — | token `DOCUMENT_STORAGE`→`FilesystemStorageAdapter` | `DOCUMENT_STORAGE` |
| 5 | AuthModule | `auth/auth.module.ts` | no | Prisma, Bitacora, Passport, Jwt | `AuthService`, `EliminarCuentaService`, `LoginAttemptService` (factory), `JwtStrategy`, `SseJwtStrategy` | `AuthService` |
| 6 | UsersModule | `users/users.module.ts` | no | Prisma | `RolesService`, `PermisosService`, `UsuariosService`, `UsersService` (Facade), `ConfiguracionUsuarioService` | las 5 |
| 7 | CatalogosModule | `catalogos/catalogos.module.ts` | no | Prisma | `CatalogosService` | `CatalogosService` |
| 8 | ConvocatoriasModule | `convocatorias/convocatorias.module.ts` | no | Prisma | `ConvocatoriasService` | `ConvocatoriasService` |
| 9 | SolicitudesModule | `solicitudes/solicitudes.module.ts` | no | Prisma, Notificaciones, Bitacora | `SolicitudesService`, `SolicitudPerfilService`, `SolicitudDocumentoService`, `SolicitudChecklistService`, `MontosService`, `ConstanciasService`, token `PDF_RENDERER`→`PuppeteerPdfRenderer` | las 6 (no `PDF_RENDERER`) |
| 10 | EvaluacionesModule | `evaluaciones/evaluaciones.module.ts` | no | Prisma, Notificaciones | `EvaluacionesService` | `EvaluacionesService` |
| 11 | ComitesModule | `comites/comites.module.ts` | no | Prisma | `ComitesService` | `ComitesService` |
| 12 | SesionesModule | `sesiones/sesiones.module.ts` | no | Prisma | `SesionesService` | `SesionesService` |
| 13 | ReportesModule | `reportes/reportes.module.ts` | no | Prisma | `ReportesService` | **∅ (no exporta)** |
| 14 | NotificacionesModule | `notificaciones/notificaciones.module.ts` | **sí** | Prisma | `NotificacionesService` | `NotificacionesService` |
| 15 | AuditModule | `audit/audit.module.ts` | **sí** | Prisma | `AuditService` | `AuditService` |
| 16 | BitacoraModule | `bitacora/bitacora.module.ts` | **sí** | Prisma | `BitacoraService` | `BitacoraService` |
| 17 | AsistenteModule | `asistente/asistente.module.ts` | no | Prisma | `AsistenteService`, `AsistenteIAProxy`, `FallbackProveedor`, `OpenAIProveedor` | `AsistenteService` |

**No existen** los módulos `seguridad/`, `becas/`, `documentos/`, `decisiones/`, `auditoria/`, `salud/` (la documentación anterior los listaba). Sus responsabilidades viven en `users/`, `catalogos/`, `solicitudes/`, `sesiones/`, `audit/` y no hay health-check dedicado.

## 3. Endpoints (inventario por controller)

### 3.1 Auth — `auth/auth.controller.ts` (`@Controller('auth')`)

| Método | Ruta | Guard | Permiso |
|---|---|---|---|
| POST | `/auth/registro` | `@Public()` | — |
| POST | `/auth/login` | `@Public()` | — |
| POST | `/auth/refresh` | `@Public()` | — |
| GET | `/auth/perfil` | `JwtAuthGuard` | — |
| PATCH | `/auth/perfil` | `JwtAuthGuard` | — |
| POST | `/auth/eliminar-cuenta` | `JwtAuthGuard` | — |

### 3.2 Seguridad — `users/users.controller.ts` (`@Controller('seguridad')`)

Todos los endpoints requieren `permiso:editar` (no `seguridad:ver`/`seguridad:editar`).

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/seguridad/roles` | `permiso:editar` |
| POST | `/seguridad/roles` | `permiso:editar` |
| GET | `/seguridad/roles/:id` | `permiso:editar` |
| PATCH | `/seguridad/roles/:id` | `permiso:editar` |
| DELETE | `/seguridad/roles/:id` | `permiso:editar` |
| GET | `/seguridad/roles/:id/permisos` | `permiso:editar` |
| PATCH | `/seguridad/roles/:id/permisos` | `permiso:editar` |
| GET | `/seguridad/permisos` | `permiso:editar` |
| GET | `/seguridad/usuarios` | `permiso:editar` |
| GET | `/seguridad/usuarios/:id` | `permiso:editar` |
| POST | `/seguridad/usuarios` | `permiso:editar` |
| PATCH | `/seguridad/usuarios/:id` | `permiso:editar` |
| GET | `/seguridad/usuarios/:id/permisos` | `permiso:editar` |
| PATCH | `/seguridad/usuarios/:id/permisos` | `permiso:editar` |

### 3.3 Configuración de usuario — `users/configuracion.controller.ts` (`@Controller('usuarios/me')`)

| Método | Ruta | Guard |
|---|---|---|
| GET | `/usuarios/me/configuracion` | `JwtAuthGuard` |
| PATCH | `/usuarios/me/configuracion` | `JwtAuthGuard` |

### 3.4 Catálogos — `catalogos/catalogos.controller.ts` (`@Controller('catalogos')`)

`GET` públicos (`@Public()`): `/generos`, `/niveles-academicos`, `/departamentos`, `/municipios`, `/instituciones`, `/documentos-tipo`, `/becas`, `/generos/:id`, `/documentos-tipo/:id`.

CRUD (permiso `catalogo:gestionar`): `POST/PATCH/DELETE` de `/generos`, `/niveles-academicos`, `/departamentos`, `/municipios`. `POST /documentos-tipo` usa `documento:crear`; `PATCH /documentos-tipo/:id` usa `catalogo:gestionar`; `DELETE /documentos-tipo/:id` usa `documento:eliminar`.

### 3.5 Convocatorias — `convocatorias/convocatorias.controller.ts` (`@Controller('convocatorias')`)

| Método | Ruta | Permiso / Guard |
|---|---|---|
| GET | `/` | `@Public()` — acepta `?estado=ABIERTA\|CERRADA` (default: abiertas + cerradas, abiertas primero) |
| GET | `/todas` | `convocatoria:ver` |
| GET | `/:id` | `@Public()` |
| GET | `/:id/mi-solicitud` | JWT (sin `@Permisos`) |
| POST | `/` | `convocatoria:crear` |
| PATCH | `/:id` | `convocatoria:editar` |
| PATCH | `/:id/documentos` | `convocatoria:editar` |
| PATCH | `/:id/montos` | `convocatoria:editar` |
| POST | `/:id/transicion` | `convocatoria:editar` |

### 3.6 Solicitudes — `solicitudes/solicitudes.controller.ts` (`@Controller('solicitudes')`)

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/` | `@Permisos('solicitud:ver')` |
| GET | `/consulta/:codigo` | `@Public()` |
| GET | `/:id` | `solicitud:ver` |
| POST | `/` | `solicitud:crear` |
| PUT | `/:id/perfil-academico` | `solicitud:editar` |
| PUT | `/:id/perfil-financiero` | `solicitud:editar` |
| POST | `/:id/documentos/:tipoId` | `documento:crear` |
| DELETE | `/:id/documentos/:tipoId` | `documento:eliminar` |
| PATCH | `/:id/documentos/:tipoId/estado` | `documento:editar` |
| GET | `/:id/documentos/:documentoId/descargar` | `solicitud:ver` |
| GET | `/:id/checklist` | `solicitud:ver` |
| PUT | `/:id/respuestas` | `solicitud:editar` |
| POST | `/:id/transicion` | `solicitud:editar` |
| POST | `/:id/solicitar-correccion` | `solicitud:editar` |
| POST | `/:id/monto` | `solicitud:montos-override` |
| GET | `/:id/constancia` | `solicitud:ver` |
| GET | `/:id/score` | `evaluacion:ver` |
| PATCH | `/:id/imparcialidad` | `evaluacion:editar` |

### 3.7 Evaluaciones — `evaluaciones/evaluaciones.controller.ts` (`@Controller('evaluaciones')`)

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/mias` | `evaluacion:ver` |
| POST | `/solicitudes/:id/evaluadores` | `evaluacion:crear` |
| DELETE | `/solicitudes/:id/evaluadores/:evaluadorId` | `evaluacion:crear` |
| PUT | `/solicitudes/:id/criterios/:criterioId` | `evaluacion:editar` |

### 3.8 Comités — `comites/comites.controller.ts` (`@Controller('comites')`)

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/` | `comite:ver` |
| GET | `/:id` | `comite:ver` |
| POST | `/` | `comite:crear` |
| PATCH | `/:id` | `comite:editar` |
| DELETE | `/:id` | `comite:editar` |
| POST | `/:id/miembros` | `comite:editar` |
| DELETE | `/:id/miembros/:usuarioId` | `comite:editar` |

### 3.9 Sesiones — `sesiones/sesiones.controller.ts` (`@Controller('sesiones')`)

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/` | `sesion:ver` |
| GET | `/:id` | `sesion:ver` |
| POST | `/` | `sesion:crear` |
| POST | `/:id/votos` | `voto:crear` |
| POST | `/:id/finalizar` | `sesion:editar` |

### 3.10 Reportes — `reportes/reportes.controller.ts` (`@Controller('reportes')`)

11 endpoints, todos con permiso `reporte:ver`:

| Método | Ruta |
|---|---|
| GET | `/reportes/solicitudes-por-estado` |
| GET | `/reportes/convocatorias` |
| GET | `/reportes/evaluaciones` |
| GET | `/reportes/general` |
| GET | `/reportes/tendencia` |
| GET | `/reportes/embudo` |
| GET | `/reportes/detalle` |
| GET | `/reportes/mis-evaluaciones` |
| GET | `/reportes/mis-comites` |
| GET | `/reportes/mis-sesiones` |
| GET | `/reportes/:tipo/csv` (con `?desde=&hasta=`) |

### 3.11 Notificaciones — `notificaciones/notificaciones.controller.ts` (`@Controller('notificaciones')`)

| Método | Ruta | Guard / Permiso |
|---|---|---|
| GET | `/` | JWT (sin `@Permisos`) |
| GET | `/no-leidas` | JWT (sin `@Permisos`) |
| GET | `/stream` | `@Public()` + `@UseGuards(AuthGuard('sse-jwt'))` (SSE, heartbeat 25s) |
| PATCH | `/:id/leida` | JWT (sin `@Permisos`) |
| POST | `/leer-todas` | JWT (sin `@Permisos`) |

### 3.12 Bitácora — `bitacora/bitacora.controller.ts` (`@Controller('bitacora')`)

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/` | `auditoria:ver` |

**No existe** `GET /bitacora/:id`. El `actorId` se fuerza al usuario actual para no-ADMIN.

### 3.13 Auditoría — `audit/audit.controller.ts` (`@Controller('audit')`)

`GET /` con permiso `auditoria:ver`.

### 3.14 Asistente — `asistente/asistente.controller.ts` (`@Controller('asistente')`)

| Método | Ruta | Guard |
|---|---|---|
| POST | `/preguntar` | `@Public()` — **sin `@CurrentUser()`** (bug documentado) |

## 4. Inventario de transversales

### 4.1 Guards (`common/guards/`)

| Guard | Archivo | Registrado global | Uso real |
|---|---|---|---|
| `JwtAuthGuard` | `jwt-auth.guard.ts` | sí (APP_GUARD) | Todas las rutas salvo `@Public()` |
| `RolesGuard` | `roles.guard.ts` | sí (APP_GUARD) | **Sin uso** (`@Roles()` nunca se aplica) — código muerto |
| `PermissionsGuard` | `permissions.guard.ts` | sí (APP_GUARD) | Rutas con `@Permisos(...)` |

### 4.2 Interceptors / Filters / Decorators

- `TransformInterceptor` (`common/interceptors/transform.interceptor.ts`) — envelope `{ data }`, respeta `headersSent`.
- `AllExceptionsFilter` (`common/filters/http-exception.filter.ts`) — `{ statusCode, message, timestamp }`.
- Decorators custom: `@Public`, `@Roles`, `@Permisos`, `@CurrentUser`.

### 4.3 Constantes

- `common/constants/estados.ts` — `SOLICITUD_ESTADO` (7 valores, **sin** `PENDIENTE_SEGUNDA_APROBACION`), `CONVOCATORIA_ESTADO`, `SESION_ESTADO`, `DECISION_RESULTADO`, `DOCUMENTO_ESTADO`.
- `common/constants/roles.ts` — `ROL` (6 valores: ADMIN, POSTULANTE, EVALUADOR, COORDINADOR_COMITE, MIEMBRO_COMITE, JEFE_BECAS — **sin STAFF**), `ROLES_REVISORES`, `UMBRAL_SEGUNDA_APROBACION_GTQ = 10000`.

### 4.4 Servicios globales

- `AuthzService` (`common/services/authz.service.ts`) — `esAdmin`, `esStaff`, `esPersonal`, `esRevisor`, `assertAdmin`, `assertAcceso`, `assertPropietario`, `puedeSegundaAprobacion`, `assertSegundaAprobacion`.

## 5. Modelo de datos (36 entidades)

**Datos de demostración sembrados:** 51 convocatorias (35 abiertas = 5×7 niveles, 15 cerradas, 1 borrador), 1000 solicitudes, 24 becas canónicas activas, 33 documentos de KB del asistente, 250 postulantes, 30 evaluadores, 50 miembros de comité, 4 ciclos. Detalle en `docs/architecture/datos-demostracion.md`.

Ver `docs/architecture/database-schema.md` para el detalle completo. Resumen por dominio:

- **Auth/Seguridad:** Usuario, Rol, Permiso, RolPermiso, UsuarioPermiso, ConfiguracionUsuario
- **Catálogos:** Genero, NivelAcademico, Departamento, Municipio, InstitucionEducativa, DocumentoTipo, Beca, CriterioEvaluacion
- **Convocatorias:** Convocatoria, ConvocatoriaDocumentoRequerido, ConvocatoriaReglaMonto
- **Solicitudes:** Solicitud, SolicitudPerfilAcademico, SolicitudPerfilFinanciero, SolicitudDocumento, SolicitudRespuesta, SolicitudAprobacion, HistorialEstado
- **Evaluación:** Evaluacion, EvaluacionCriterio
- **Comités:** Comite, ComiteMiembro, Sesion, SesionAgenda, Voto, Decision
- **Auditoría/Bitácora:** AuditLog, BitacoraSistema, Notificacion
- **Asistente:** AsistenteBaseConocimiento (33 filas estáticas), AsistenteConversacion, AsistenteMensaje

## 6. Código muerto / inconsistencias documentadas

| Elemento | Evidencia | Impacto |
|---|---|---|
| `RolesGuard` + `@Roles()` | Registrados globalmente, 0 usos en controllers | Código muerto |
| Token `LOGIN_ATTEMPT_SERVICE` | Declarado en `auth/login-attempt.service.ts:3`, nunca usado (AuthModule provee con token-clase) | Token huérfano |
| `axios` en `apps/web` | En `package.json`, 0 imports en `src/` | Dependencia muerta |
| `ReportesModule` | No exporta `ReportesService` | Encapsulamiento excesivo |
| `SOLICITUD_ESTADO` sin `PENDIENTE_SEGUNDA_APROBACION` | `common/constants/estados.ts` vs `solicitud-state-machine.ts` | Riesgo de bug por divergencia |
| `STAFF` en seed, ausente de `common/constants/roles.ts` | `prisma/seed.ts` vs `common/constants/roles.ts` | Riesgo de bug |
| `asistente_conversacion.usuarioId` sin FK | `schema.prisma:695` (String?, sin relación) | Sin integridad referencial |
| Sin endpoint `/health` | El healthcheck de Docker consulta `/api/catalogos/generos` | Sin health-check dedicado |

## 7. Sistema de datos de demostración

Capa `apps/api/prisma/semilla/` con 4 archivos + `verificar-counts.ts`. `prisma db seed` termina llamando `generarEscenarios()` (`seed.ts:1432-1433`). Documentación completa en `docs/architecture/datos-demostracion.md`.

## 8. Referencias cruzadas

- `docs/architecture/asistente-ia.md` — arquitectura del asistente
- `docs/architecture/frontend.md` — arquitectura del frontend
- `docs/architecture/api-web-contrato.md` — integración entre capas
- `docs/architecture/diagrams.md` — diagramas (Mermaid)
- `docs/architecture/design-patterns.md` — patrones verificados
- `docs/architecture/decisions.md` — ADRs
- `docs/architecture/database-schema.md` — esquema de BD
- `docs/standards/deuda-tecnica.md` — deuda técnica con evidencia