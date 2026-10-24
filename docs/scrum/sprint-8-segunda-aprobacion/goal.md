# Goal - Sprint 8: Segunda aprobación, montos flexibles, notificaciones con sonido, bitácora y auditoría comprensible

**Sprint:** 8  
**Rama:** `feature/sprint-8-segunda-aprobacion` (o sobre rama actual según workflow)  
**Duración:** A acordar  
**Fecha inicio:** Pendiente  
**Fecha fin:** Pendiente  
**Estado:** **Completado**  
**Responsable:** Equipo EDUVIAGT

## Objetivo del Sprint

Implementar un flujo completo que garantice el control de autorizaciones por monto, mantenga al postulante informado con notificaciones comprensibles y con sonido configurable, y deje una **trazabilidad completa e inmutable** de todas las acciones relevantes dentro del sistema.

## Objetivos Específicos

1. **Montos flexibles**: Permitir definir `montoBase` por convocatoria, reglas por tramos con base en ingreso familiar (parcialidad), monto completo, y `override` autorizado con justificación.
2. **Segunda aprobación**: Para solicitudes con `montoOtorgable > 10000 GTQ`, exigir **segunda aprobación por un usuario distinto** al que realizó la primera. Permitir también `devolver a revisión` desde la segunda instancia.
3. **Notificaciones comprensibles + sonido configurable**: Notificar **obligatoriamente** al estudiante en **todo** cambio de estado con lenguaje humano. Añadir sonido sutil configurable por usuario, respetando `prefers-reduced-motion`.
4. **Bitácora rigurosa + auditoría humana**: Crear `BitacoraSistema` (inmutable, consultable solo) con registro detallado de cada acción. Humanizar la ventana de Auditoría mostrando **quién (persona, rol, nombre), fecha/hora, acción** con lenguaje claro.
5. **Separación de roles**: Habilitar que personas distintas puedan **crear convocatorias**, **aprobar en primera instancia** y **aprobar en segunda instancia** mediante permisos/roles viables.

## Requisitos rectificados (medibles)

### REQ-01: Segunda aprobación por monto > 10000
- Si `Convocatoria.montoBase` existe y hay reglas o cálculo: usar `montoOtorgable`. 
- Si `montoOtorgable > 10000 GTQ` y estado es `EVALUADA` al ejecutar `aprobar`, el sistema **NO** pasa a `APROBADA`. Debe pasar a `PENDIENTE_SEGUNDA_APROBACION`.
- Si `montoOtorgable <= 10000` o `montoOtorgable` es `null` (sin regla aplicable) y no hay `override` que lo eleve, el flujo mantiene el comportamiento actual (directo a `APROBADA`).
- **Obligatorio**: el segundo aprobador debe ser **distinto** al usuario que realizó la primera aprobación.
- Debe registrarse en `SolicitudAprobacion` con `nivel = 1` y `nivel = 2`.

### REQ-02: Notificación obligatoria al estudiante + sonido configurable
- **Todo** cambio de estado debe generar una notificación al `usuarioId` propietario de la solicitud.
- Mensajes en español claro y entendible (sin jerga técnica de "máquina de estados").
- Sonido sutil configurable desde preferencias del usuario (`sonidoNotificaciones`), persistido en BD. 
- Respetar `prefers-reduced-motion`. 
- Cobertura: `enviar`, `iniciar_revision`, `solicitar_correccion`, `corregir`, `evaluar`, `aprobar`, `rechazar`, `aprobar_segunda`, `devolver_a_revision`, transición a `PENDIENTE_SEGUNDA_APROBACION`.

### REQ-03: Trazabilidad completa (quién, cuándo, qué, resultado)
- **Quién**: `actorId`, `actorNombre`, `actorRol`, `actorCorreo` (snapshot al momento de la acción)
- **Cuándo**: `fechaHora` con precisión + `ip`, `userAgent`
- **Qué operación**: `accionClave` + `accionHumana`
- **Resultado**: `estadoAnterior`/`estadoNuevo`, `resultado` (`EXITOSO`/`RECHAZADO`), `motivo`/`comentario` cuando aplique
- Registrar en: `HistorialEstado`, `SolicitudAprobacion` (para acciones relevantes), `AuditLog` (enriquecido) y **obligatoriamente** en `BitacoraSistema` (inmutable)

## Definición de Listo (DoD) del Sprint

- [x] Migración Prisma aplicada con todas las tablas/campos nuevos
      (`20261022021302_segunda_aprobacion_montos_bitacora_auditoria`)
- [x] Permisos/roles actualizados (incluyendo `JEFE_BECAS`, `solicitud:aprobar-segunda`, `convocatoria:crear/publicar`, `solicitud:montos-override`)
- [x] Flujo de segunda aprobación funcional con validación "distinto usuario"
- [x] `devolver_a_revision` implementado desde `PENDIENTE_SEGUNDA_APROBACION` hacia `EN_REVISION`
- [x] Cálculo de montos con reglas/tramos + override con justificación
- [x] Notificaciones humanas + sonido configurable respetando preferencias/accesibilidad
- [x] `BitacoraSistema` poblándose en todas las acciones sensibles (dentro de transacciones)
- [x] Auditoría UI humanizada mostrando: persona, rol, nombre, fecha/hora, acción + detalles relevantes
- [x] Tests unitarios y E2E pasando
- [x] Documentación Scrum completa y actualizada
- [x] TypeScript sin errores en API y Web
