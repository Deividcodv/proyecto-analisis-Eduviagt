# Manual del Administrador

Rol: **administrador**. Correo demo: `admin@sigeb.gov.gt` (contraseña `Admin123!`).

## 1. Convocatorias

1. Abre **Administración → Convocatorias**.
2. **Crear/editar** una convocatoria con su información básica (nombre, beca, fechas, descripción).
3. **Máquina de estados**: `BORRADOR → ABIERTA → CERRADA → EN_EVALUACION → RESUELTA → ARCHIVADA`. Usa las acciones de transición (`publicar`, `cerrar`, `reabrir`, avanzar, etc.); el sistema valida las transiciones permitidas.
4. **Documentos requeridos**: defínelos por convocatoria (solo permitido en estado **BORRADOR**).

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

## 5. Usuarios, roles y seguridad

1. **Usuarios**: crea usuarios/empleados desde el listado y asígnales un rol.
2. **Roles y permisos**: CRUD de roles y asignación de permisos.
3. **Matriz de seguridad**: define excepciones por usuario con tres modos:
   - **Heredar** (usa el permiso del rol),
   - **PERMITIR** (concede),
   - **DENEGAR** (bloquea).

El orden de resolución de permisos es: **excepción por usuario → permiso por rol → DENEGAR por defecto**.

## 6. Producción / operación

- Construcción de imágenes Docker (API + web) y despliegue por SSH a staging/producción.
- Ver [../operations/deployment.md](../operations/deployment.md) y [../operations/setup-guide.md](../operations/setup-guide.md).
