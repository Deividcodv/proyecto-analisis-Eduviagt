# Matriz de Trazabilidad - Sprint 8

## Requisitos -> US -> Tareas -> Archivos -> Tests

| Requisito | US | Tareas | Archivos Clave | Tests (a crear/actualizar) | Estado |
|---|---|---|---|---|---|
| **REQ-01: Segunda aprobación > 10,000 GTQ** | US-801, US-802 | T-801,T-803,T-804,T-806 | `prisma/schema.prisma`, `solicitud-state-machine.ts`, `solicitudes.service.ts`, `solicitudes.controller.ts`, `authz.service.ts` | `solicitud-state-machine.spec.ts`, `solicitudes.service.spec.ts`, `montos.service.spec.ts` | **Hecho** |
| **REQ-02: Notificaciones obligatorias + sonido configurable** | US-804 | T-805,T-807 | `notificaciones.service.ts`, `campana-notificaciones`/hook, `configuracion.service.ts`, `configuracion.controller.ts` | `notificaciones*.spec.ts` | **Hecho** |
| **REQ-03: Trazabilidad completa (quién/cuándo/qué/resultado)** | US-805, US-806 | T-801,T-805,T-808 | `bitacora/bitacora.service.ts`, `historial_estado`, `solicitud_aprobacion`, `audit.service.ts`, `admin/auditoria/page.tsx` | `bitacora.service.spec.ts` | **Hecho** |
| **Montos flexibles (tramos/override)** | US-801 | T-801,T-803,T-808 | `solicitudes/montos.service.ts`, `convocatorias.service.ts`, `convocatorias.controller.ts`, UI convocatorias | `montos.service.spec.ts` | **Hecho** |
| **Devolver a revisión** | US-803 | T-804,T-805,T-806 | `solicitudes.service.ts` (devolver_a_revision), `solicitud-state-machine.ts` | `solicitud-state-machine.spec.ts`, `solicitudes.service.spec.ts` | **Hecho** |
| **Separación roles/permisos** | US-806 | T-802,T-806 | `prisma/seed.ts`, `permissions.guard.ts`, `authz.service.ts` | Guard/RBAC tests | **Hecho** |

## Mapeo de eventos -> Registros

| Acción | HistorialEstado | SolicitudAprobacion | AuditLog | BitacoraSistema |
|---|---|---|---|---|
| `enviar`/`corregir` | Sí | No (normalmente) | Sí (detalle enriquecido) | Sí |
| `iniciar_revision`/`solicitar_correccion`/`evaluar` | Sí | Según corresponda | Sí | Sí |
| `aprobar` (1ª instancia) | Sí | Sí (nivel=1) | Sí (monto, requiereSegunda) | Sí |
| `transición a PENDIENTE_SEGUNDA_APROBACION` | Sí | Opcional/referencial | Sí | Sí |
| `aprobar_segunda` (2ª instancia) | Sí | Sí (nivel=2) | Sí | Sí |
| `rechazar` (1ª/2ª) | Sí | Sí | Sí | Sí |
| `devolver_a_revision` (2ª instancia) | Sí | Sí (accion devolver) | Sí | Sí |
| Crear/editar/publicar convocatoria | Sí (opcional) | No | Sí | Sí |
| Override de monto con justificación | Sí | No | Sí | Sí |
| Cambios permisos/roles | No necesariamente | No | Sí | Sí |

## Validaciones críticas
- Segunda aprobación **distinta** a primera: `actorId != primerAprobadorId` (bloquear con 403/400 claro) → `AuthzService.assertSegundaAprobacion()`
- Comentario obligatorio en `rechazar` y `devolver_a_revision` → validado en `SolicitudesService.transicion`
- Justificación obligatoria en `monto:override` → `OverrideMontoDto` (mínimo 10 caracteres)
- Sonido configurable + respeta `prefers-reduced-motion` → `ConfiguracionUsuario` + `use-notificaciones-sonido`
- `BitacoraSistema` **inmutable** (sin UPDATE/DELETE desde UI/API operativa)
- Auditoría UI muestra **persona, rol, nombre, fecha/hora (DD/MM/YYYY HH:mm:ss), acción** → `/admin/auditoria`
- Lenguaje humano en notificaciones y en auditoría UI
- Umbral `> 10000 GTQ` → `UMBRAL_SEGUNDA_APROBACION_GTQ` (estricto: 10 000 exactos NO lo exige)
- Compatibilidad con datos existentes (`montoOtorgable` null → sin regla aplicable, se aprueba en una sola instancia)
