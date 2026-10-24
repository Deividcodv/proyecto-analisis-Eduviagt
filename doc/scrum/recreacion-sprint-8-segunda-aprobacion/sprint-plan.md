# Sprint Plan - Sprint 8: Segunda aprobación, montos flexibles, bitácora y auditoría

## Sprint Goal
Implementar segunda aprobación por monto > 10,000 GTQ con cálculo flexible (base + tramos por ingreso familiar + override), notificaciones comprensibles con sonido configurable, bitácora sistemática e inmutable y auditoría UI humanizada, con separación de roles/permisos.

**Estado:** Completado (T-801 a T-809)

## Capacidad estimada
- T-801 a T-809: P0/P1
- Total aproximado: ~3–4 jornadas con enfoque TDD y tests verdes (mantener 23 suites / 209 tests API, suites web existentes)

## Plan de tareas

| ID | Tarea | Tipo | Prioridad | Responsable | Estimado (h) | Dependencias | DoD | Estado |
|---|---|---|---|---|---|---|---|---|
| **T-801** | Prisma: nuevos modelos (`ConvocatoriaReglaMonto`, `SolicitudAprobacion`, `BitacoraSistema`, `ConfiguracionUsuario`). Ampliar `Convocatoria` (`montoBase`, `moneda`, flags), `Solicitud` (montos), `HistorialEstado` (`accion`, `resultado`, `ip`). Índices y `Decimal(12,2)`. | DB | P0 | Backend | 4 | — | Migración creada, schema coherente, build TypeScript OK | **Hecho** |
| **T-802** | Permisos/roles: añadir `JEFE_BECAS`, permisos (`convocatoria:*`, `solicitud:aprobar-segunda`, `solicitud:aprobar-primera`, `solicitud:montos-override`). Actualizar `seed.ts` y script auxiliar | DB/Backend | P0 | Backend | 1 | T-801 | Seed idempotente, ADMIN+JEFE_BECAS con permisos | **Hecho** |
| **T-803** | Lógica de montos: `SolicitudesService/ConvocatoriasService` cálculo (`montoOtorgable`) por tramos vs ingreso familiar, `montoBase`/fallback, `montoOrigenCalculo`, `montoCalculadoAt/Por`, **override** con justificación obligatoria | Backend | P0 | Backend | 6 | T-801–T-802 | Unit tests, cálculo correcto casos (<=/>10k, null, override) | **Hecho** |
| **T-804** | State machine + autorización segunda aprobación: añadir estados/transiciones (`PENDIENTE_SEGUNDA_APROBACION`, `aprobar_segunda`, `devolver_a_revision`), validar **distinto usuario** entre 1ª y 2ª, `authz.puedeSegundaAprobacion()` | Backend | P0 | Backend | 4 | T-802–T-803 | Tests state machine + service | **Hecho** |
| **T-805** | Bitácora centralizada: `BitacoraService` con registro obligatorio (dentro de `$transaction`), `correlacionId`, `EXITOSO/RECHAZADO`, human-readable. Integrar en todas acciones relevantes | Backend | P0 | Backend | 6 | T-801 | Cobertura acciones sensibles, inmutable, trazabilidad triple (Historial/Audit/Bitácora/Aprobacion) | **Hecho** |
| **T-806** | Controller/guards: extender `transicion` o añadir `POST :id/segunda-aprobacion`. Validaciones, mensajes humanos. | Backend | P0 | Backend | 2 | T-804–T-805 | E2E API OK | **Hecho** |
| **T-807** | Notificaciones humanas + sonido configurable: textos entendibles, `ConfiguracionUsuario` (CRUD + toggle), hook web `useNotificacionesSonido` (detecta incremento no leídas), `prefers-reduced-motion`, audio sutil, persistencia | Backend+Web | P0 | Fullstack | 4 | T-805 | UI campana + preferencias | **Hecho** |
| **T-808** | UI: Convocatorias (formulario con montos + reglas/tramos), Solicitudes (segunda aprobación/devolver a revisión), Auditoría humanizada (Persona, Rol, Nombre/Rol, Fecha y hora DD/MM/YYYY HH:mm:ss, Módulo, Acción, Detalles) + modal | Web | P0 | Frontend | 6 | T-803–T-807 | Visual coherente, tsc 0 errores | **Hecho** |
| **T-809** | Tests + documentación Scrum + limpieza: unit+e2e API/Web, actualizar specs afectados, generar todos artefactos Scrum, matriz trazabilidad, cerrar sprint | QA/Docs | P0 | Equipo | 4 | T-801–T-808 | Suites verdes, docs completos | **Hecho** |

**Total estimado:** ~37h

## Orden de ejecución
T-801 → T-802 → T-803 → T-804 → T-805 → T-806 → T-807 → T-808 → T-809 (en bloque, sin romper tests existentes). TDD en cada capa.
