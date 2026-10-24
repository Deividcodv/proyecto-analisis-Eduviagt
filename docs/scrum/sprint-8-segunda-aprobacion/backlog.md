# Backlog - Sprint 8: Segunda aprobación, montos flexibles, notificaciones con sonido, bitácora y auditoría

## US-801: Montos flexibles por convocatoria (base + tramos por ingreso familiar)
**Como** responsable de becas  
**Quisiera** definir el monto de la beca por convocatoria (monto completo o parcial según ingreso familiar), con posibilidad de override autorizado  
**Para** aplicar correctamente la regla de segunda aprobación (> 10,000 GTQ)

### Criterios de Aceptación
- [x] `Convocatoria` cuenta con `montoBase` (Decimal 12,2), `moneda` (GTQ), `permiteParcial`, `usarReglasMonto`
- [x] Existen reglas por tramos (`ConvocatoriaReglaMonto`): ingresoMin, ingresoMax, tipo (FIJO/PORCENTAJE/COMPLETO), montoFijo, porcentaje, prioridad
- [x] Se calcula `montoOtorgable` al momento de evaluación/decisión con base a reglas vs `ingresoFamiliar` del perfil financiero
- [x] Se guarda `montoOrigenCalculo`, `montoCalculadoAt`, `montoCalculadoPor` en `Solicitud`
- [x] `Override` solo para usuarios con `solicitud:montos-override`, con **justificación obligatoria**. Se registra en bitácora/trazabilidad
- [x] Tratar `montoOtorgable` null como "sin regla" (compatibilidad hacia atrás)

## US-802: Segunda aprobación obligatoria > 10,000 GTQ
**Como** sistema  
**Quisiera** que las solicitudes con `montoOtorgable > 10000 GTQ` requieran **segunda aprobación distinta** antes de autorizarse  
**Para** reforzar el control de montos superiores

### Criterios de Aceptación
- [x] Desde `EVALUADA`, al ejecutar `aprobar` con `montoOtorgable > 10000` → pasa a `PENDIENTE_SEGUNDA_APROBACION`
- [x] Si `montoOtorgable <= 10000` o `null` → pasa directamente a `APROBADA`
- [x] El **segundo aprobador debe ser distinto** al usuario que realizó la primera aprobación
- [x] Se registra nivel 1 (primera) y nivel 2 (segunda) en `SolicitudAprobacion`

## US-803: Segunda instancia (aprobar/rechazar/devolver a revisión)
**Como** segundo aprobador autorizado  
**Quisiera** aprobar, rechazar o **devolver a revisión** la solicitud en segunda instancia  
**Para** corregir observaciones sin perder trazabilidad

### Criterios de Aceptación
- [x] Solo usuarios con `solicitud:aprobar-segunda` pueden actuar en `PENDIENTE_SEGUNDA_APROBACION`
- [x] `aprobar_segunda` → `APROBADA`
- [x] `rechazar` → `RECHAZADA` (**comentario obligatorio**)
- [x] `devolver_a_revision` → `EN_REVISION` (**comentario obligatorio**)
- [x] Notificación al postulante con lenguaje entendible
- [x] Registro en `SolicitudAprobacion`, `HistorialEstado`, `AuditLog` y `BitacoraSistema`

## US-804: Notificaciones comprensibles + sonido configurable
**Como** postulante  
**Quisiera** recibir notificaciones claras en todo cambio de estado, con sonido opcional  
**Para** estar informado de inmediato

### Criterios de Aceptación
- [x] Notificación obligatoria al propietario en **todo** cambio de estado
- [x] Lenguaje español claro (sin terminología técnica)
- [x] Preferencia `sonidoNotificaciones` (bool) + `volumenSonido` (0-100) en `ConfiguracionUsuario`
- [x] Sonido sutil, reproducido al recibir notificación nueva (no leída), **respetando** `prefers-reduced-motion`
- [x] Persistido por usuario. Por defecto `true`
- [x] Aplica a todos los casos: enviar, iniciar_revision, solicitar_correccion, corregir, evaluar, aprobar, rechazar, aprobar_segunda, devolver_a_revision, PENDIENTE_SEGUNDA_APROBACION

## US-805: Bitácora rigurosa + Auditoría UI comprensible
**Como** auditor  
**Quisiera** una bitácora completa e inmutable en BD y una pantalla de auditoría fácil de entender  
**Para** garantizar trazabilidad

### Criterios de Aceptación
- [x] `BitacoraSistema` inmutable (consultable). Registra: actor (persona, rol, nombre, correo), módulo, entidad, acción (clave + humana), descripción humana, datos relevantes, IP, userAgent, correlacionId, resultado
- [x] Registros en transacciones (EXITOSO/RECHAZADO si falla)
- [x] `/admin/auditoria` muestra: **Persona (nombre completo), Rol, Nombre/Rol visible, Fecha y hora (DD/MM/YYYY HH:mm:ss), Módulo, Acción (humana), Detalles relevantes**. Modal con IP, userAgent, contexto
- [x] Solo acciones del **personal** en vista operativa (con filtro opcional). Lenguaje normal, no técnico
- [x] Cobertura obligatoria en todas las acciones relevantes

## US-806: Separación de roles y permisos para crear convocatorias/aprobaciones
**Como** institución  
**Quisiera** que distintas personas/roles puedan crear convocatorias y realizar la segunda aprobación  
**Para** evitar concentración de autoridad

### Criterios de Aceptación
- [x] Rol `JEFE_BECAS` creado/gestionado
- [x] Permisos: `convocatoria:crear`, `convocatoria:editar`, `convocatoria:publicar`, `solicitud:aprobar-primera`, `solicitud:aprobar-segunda`, `solicitud:montos-override`
- [x] Asignaciones iniciales a `ADMIN` y `JEFE_BECAS` según corresponda
- [x] Validación: segunda aprobación **distinta** al primer aprobador
- [x] Control centralizado en `AuthzService`
