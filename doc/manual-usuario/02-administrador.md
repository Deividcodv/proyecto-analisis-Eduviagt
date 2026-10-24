# Manual del Administrador

Rol: **administrador**. Correo demo: `admin@sigeb.gov.gt` (contraseña `Admin123!`).

## 1. Convocatorias

1. Abre **Administración → Convocatorias**.
2. **Crear/editar** una convocatoria con su información básica (nombre, beca, fechas, descripción).
3. **Monto base**: define el monto base de la beca y la moneda (GTQ por defecto).
4. **Reglas de monto** (Sprint 8): configura tramos por ingreso familiar (FIJO, PORCENTAJE, COMPLETO) para calcular el monto otorgable automáticamente.
5. **Máquina de estados**: `BORRADOR → ABIERTA → CERRADA → EN_EVALUACION → RESUELTA → ARCHIVADA`. Usa las acciones de transición (`publicar`, `cerrar`, `reabrir`, avanzar, etc.); el sistema valida las transiciones permitidas.
6. **Documentos requeridos**: defínelos por convocatoria (solo permitido en estado **BORRADOR**).
7. **Formulario dinámico**: configura campos adicionales del formulario de postulación.

> El portal público solo muestra convocatorias en estado **ABIERTA**.

## 2. Catálogos

- Gestiona los datos maestros: géneros, niveles académicos, departamentos, municipios y tipos de documento.
- Las **desactivaciones son lógicas** (`activo: false`): no se borran registros.
- Los listados públicos exponen solo registros activos.

## 3. Evaluación

- **Asignar evaluadores** a una solicitud que esté en **EN_REVISION**.
- Cambia la solicitud a **EN_REVISION** para habilitar la evaluación.

## 4. Reportes y auditoría

- **Reportes**: resumen de solicitudes por estado, convocatorias y evaluaciones. Incluye **exportación a CSV** (con BOM, compatible con Excel) y filtros por rango de fechas.
- **Auditoría** (`/audit`, admin): rastro de acciones sensibles (login, transiciones, votos).
- **Bitácora del sistema** (`/bitacora`, Sprint 8): registro inmutable de todas las acciones con actor (persona, rol, correo), fecha y hora, acción técnica y humana, resultado, IP y datos relevantes. Acceso de solo lectura.

## 5. Usuarios, roles y seguridad

1. **Usuarios**: crea usuarios/empleados desde el listado y asígnales un rol.
2. **Roles y permisos**: CRUD de roles y asignación de permisos.
3. **Roles del sistema** (Sprint 8): ADMIN, POSTULANTE, EVALUADOR, COORDINADOR_COMITE, MIEMBRO_COMITE, JEFE_BECAS, STAFF.
4. **Matriz de seguridad**: define excepciones por usuario con tres modos:
   - **Heredar** (usa el permiso del rol),
   - **PERMITIR** (concede),
   - **DENEGAR** (bloquea).

El orden de resolución de permisos es: **excepción por usuario → permiso por rol → DENEGAR por defecto**.

## 6. Aprobación de solicitudes (Sprint 8)

1. **Primera aprobación**: aprueba, rechaza o devuelve a revisión una solicitud en estado EVALUADA.
2. **Segunda aprobación**: toda postulación con monto superior a Q10,000 pasa a `PENDIENTE_SEGUNDA_APROBACION`. La segunda firma la hace **obligatoriamente otra persona** (ADMIN o JEFE_BECAS).
3. Desde la segunda instancia se puede aprobar, rechazar o devolver a revisión (con motivo obligatorio).
4. Cada firma queda registrada en `SolicitudAprobacion`.

## 7. Eliminación de cuenta (Sprint 8)

- **POST `/auth/eliminar-cuenta`**: exige contraseña y confirmación escrita.
- Anonimiza datos personales (nombres, email, CUI, etc.).
- Borra documentos y sus archivos.
- Conserva con seudónimo lo necesario para trazabilidad (solicitudes, evaluaciones, votos, decisiones, historial, auditoría).
- El detalle de auditoría se sanea para no conservar CUI ni correo.

## 8. Páginas legales y accesibilidad (Sprint 8)

- **Páginas públicas**: `/privacidad`, `/terminos`, `/cookies` (enlazadas desde el pie).
- Describen el funcionamiento real: solo `localStorage` para tokens, sin cookies, analítica ni rastreadores.
- **Accesibilidad WCAG 2.2 AA**: foco visible, skip link, trampa de foco en menú lateral, respeto a `prefers-reduced-motion`.

## 9. Producción / operación

- Construcción de imágenes Docker (API + web) y despliegue por SSH a staging/producción.
- Ver [../operations/deployment.md](../operations/deployment.md) y [../operations/setup-guide.md](../operations/setup-guide.md).

## 6. Producción / operación

- Construcción de imágenes Docker (API + web) y despliegue por SSH a staging/producción.
- Ver [../operations/deployment.md](../operations/deployment.md) y [../operations/setup-guide.md](../operations/setup-guide.md).
