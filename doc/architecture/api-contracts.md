# Contratos de API — SIGEB

> Especificación de endpoints REST. Todas las rutas bajo `/api`.

---

## Autenticación (`/auth`)

### POST `/auth/registro`
**Público**

Request:
```json
{
  "cui": "1234567890123",
  "nombres": "Juan Pérez",
  "email": "juan@test.com",
  "password": "Password123!"
}
```

Response 201:
```json
{
  "id": "uuid",
  "cui": "1234567890123",
  "nombres": "Juan Pérez",
  "email": "juan@test.com",
  "rol": "POSTULANTE",
  "createdAt": "2026-08-26T00:00:00.000Z"
}
```

Response 409:
```json
{
  "message": "El CUI ya está registrado"
}
```

### POST `/auth/login`
**Público**

Request:
```json
{
  "email": "juan@test.com",
  "password": "Password123!"
}
```

Response 200:
```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "id": "uuid",
    "cui": "1234567890123",
    "nombres": "Juan Pérez",
    "email": "juan@test.com",
    "rol": "POSTULANTE"
  }
}
```

### POST `/auth/refresh`
**Requiere refresh token**

Request:
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

Response 200:
```json
{
  "accessToken": "nuevo-jwt-access-token"
}
```

### GET `/auth/perfil`
**Requiere: autenticado**

Response 200:
```json
{
  "id": "uuid",
  "cui": "1234567890123",
  "nombres": "Juan Pérez",
  "email": "juan@test.com",
  "telefono": "+502 5555 1234",
  "fechaNacimiento": "1998-05-21T00:00:00.000Z",
  "direccion": "Calle 3, zona 8",
  "genero": { "id": "uuid", "nombre": "Masculino" },
  "departamento": { "id": "uuid", "nombre": "Guatemala" },
  "municipio": { "id": "uuid", "nombre": "Guatemala" },
  "rol": {
    "id": "uuid",
    "nombre": "POSTULANTE"
  }
}
```

### PATCH `/auth/perfil`
**Requiere: autenticado**

Actualiza datos del perfil del usuario logueado (todos opcionales). Género/departamento/municipio inexistentes → 404; UUIDs malformados → 400.

```json
{
  "nombres": "Juan Carlos Pérez",
  "telefono": "+502 5555 1234",
  "fechaNacimiento": "1998-05-21",
  "direccion": "Calle 3, zona 8",
  "generoId": "uuid",
  "departamentoId": "uuid",
  "municipioId": "uuid"
}
```

Response 200: mismo shape que `GET /auth/perfil`.

---

## Convocatorias (`/convocatorias`)

### GET `/convocatorias`
**Público** (solo abiertas) / `convocatoria:ver` (todas)

Response 200:
```json
{
  "data": [
    {
      "id": "uuid",
      "nombre": "Beca de Excelencia Académica",
      "descripcion": "...",
      "estado": "ABIERTA",
      "fechaApertura": "2026-08-01",
      "fechaCierre": "2026-09-30",
      "beca": {
        "id": "uuid",
        "nombre": "Excelencia Académica"
      }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10
}
```

### GET `/convocatorias/:id`
**Público** / `convocatoria:ver`

Response 200:
```json
{
  "id": "uuid",
  "nombre": "Beca de Excelencia Académica",
  "descripcion": "...",
  "estado": "ABIERTA",
  "fechaApertura": "2026-08-01",
  "fechaCierre": "2026-09-30",
  "documentosRequeridos": [
    {
      "id": "uuid",
      "documentoTipo": {
        "id": "uuid",
        "nombre": "Certificado académico"
      },
      "obligatorio": true
    }
  ],
  "criteriosEvaluacion": [
    {
      "id": "uuid",
      "nombre": "Rendimiento académico",
      "peso": 0.6
    }
  ]
}
```

### POST `/convocatorias`
**Permiso:** `convocatoria:crear`

Request:
```json
{
  "nombre": "Beca de Excelencia Académica",
  "descripcion": "...",
  "becaId": "uuid",
  "fechaApertura": "2026-08-01",
  "fechaCierre": "2026-09-30"
}
```

### PATCH `/convocatorias/:id`
**Permiso:** `convocatoria:editar`

### POST `/convocatorias/:id/transicion`
**Permiso:** `convocatoria:editar`

Request:
```json
{
  "accion": "publicar"
}
```

---

## Solicitudes (`/solicitudes`)

### POST `/solicitudes`
**Permiso:** `solicitud:crear` (postulante crea la propia)

Request:
```json
{
  "convocatoriaId": "uuid"
}
```

### GET `/solicitudes/mias`
**Requiere:** autenticado (postulante)

### GET `/solicitudes/:id`
**Permiso:** dueño o `solicitud:ver`

### PATCH `/solicitudes/:id/perfil-academico`
**Permiso:** dueño, solo en `BORRADOR`/`CORRECCION`

### PATCH `/solicitudes/:id/perfil-financiero`
**Permiso:** dueño, solo en `BORRADOR`/`CORRECCION`

### POST `/solicitudes/:id/documentos`
**Permiso:** dueño
**Content-Type:** `multipart/form-data`

### DELETE `/solicitudes/:id/documentos/:docId`
**Permiso:** dueño

### GET `/solicitudes/:id/checklist`
**Permiso:** dueño

### GET `/solicitudes/:id/constancia` (US-F7)
**Permiso:** dueño o `solicitud:ver` (admin/coordinador). Solo solicitudes en `APROBADA`; si no está aprobada → 400, sin acceso → 403.

Genera la constancia de beca en PDF con navegador headless (Chromium vía `PuppeteerPdfRenderer`, patrón Adapter detrás de `PdfRenderer`). La respuesta es `application/pdf` con `Content-Disposition: attachment`. El HTML se construye en `constancias.service.ts` con los datos de la solicitud, el postulante y la resolución (XSS mitigado con escape HTML).

### POST `/solicitudes/:id/enviar`
**Permiso:** dueño

---

## Documentos tipo (`/documentos-tipo`)

### GET `/documentos-tipo`
**Permiso:** `documento:ver`

### POST `/documentos-tipo`
**Permiso:** `documento:crear`

---

## Evaluaciones (`/evaluaciones`)

### GET `/evaluaciones/asignadas`
**Requiere:** evaluador autenticado

### POST `/evaluaciones/:solicitudId/asignar`
**Permiso:** `evaluacion:crear`

### PATCH `/evaluaciones/:id/puntajes`
**Permiso:** evaluador dueño de la evaluación

---

## Comités (`/comites`)

### GET `/comites`
**Permiso:** `comite:ver`

### POST `/comites/:id/sesiones`
**Permiso:** `comite:crear`

### POST `/sesiones/:id/votos`
**Permiso:** miembro del comité

### POST `/sesiones/:id/finalizar`
**Permiso:** `comite:editar`

---

## Seguridad (`/seguridad`)

### GET `/seguridad/roles`
**Permiso:** `permiso:editar`

### GET `/seguridad/permisos`
**Permiso:** `permiso:editar`

### PATCH `/seguridad/roles/:id/permisos`
**Permiso:** `permiso:editar`

### GET `/seguridad/usuarios`
**Permiso:** `permiso:editar`

Lista usuarios (opcional `?rol=`). Respuesta sin `passwordHash`.

### POST `/seguridad/usuarios`
**Permiso:** `permiso:editar`

Alta de usuario/empleado. `cui` y `email` únicos al conflictar → 409; rol inexistente → 404.

```json
{ "cui": "1234567890123", "nombres": "Ana López", "email": "ana@demo.gt", "password": "…8+…", "rolId": "…" }
```

### GET `/seguridad/usuarios/:id`
**Permiso:** `permiso:editar`

Detalle con `rol` y excepciones `usuarioPermisos[{ permiso { id, modulo, accion }, efecto: 'PERMITIR'|'DENEGAR' }]`.

### PATCH `/seguridad/usuarios/:id`
**Permiso:** `permiso:editar`

Actualiza `rolId` y/o `estado` (`ACTIVO`/`INACTIVO`). Auto-inactivación del propio usuario → 400.

### PATCH `/seguridad/usuarios/:id/permisos`
**Permiso:** `permiso:editar`

Reemplaza las excepciones individuales (tri-estado). Vaciar `permisos: []` restaura herencia por rol.

```json
{ "permisos": [{ "permisoId": "…", "efecto": "PERMITIR" }] }
```

El log de auditoría se consulta vía `/audit` (sección Auditoría abajo).

---

## Catálogos (`/catalogos`)

### GET `/catalogos/generos`
**Público**

### GET `/catalogos/niveles-academicos`
**Público**

### GET `/catalogos/departamentos`
**Público**

### GET `/catalogos/municipios?departamentoId=`
**Público**

---

## Reportes (`/reportes`)

> Solo ADMIN. Permiso `reporte:ver`. Disponible el blueprint actual en `src/reportes`.

### GET `/reportes/solicitudes-por-estado?convocatoriaId=`
**Permiso:** `reporte:ver`

Response 200:
```json
{
  "data": {
    "total": 3,
    "porEstado": [{ "estado": "APROBADA", "cantidad": 1 }],
    "porConvocatoria": [{ "id": "uuid", "nombre": "Beca CI", "beca": "...", "total": 3, "porEstado": [] }]
  }
}
```

### GET `/reportes/convocatorias`
**Permiso:** `reporte:ver`

Response 200 con `total`, `activas`, `resueltas`, `porEstado` y `detalle` (una fila por convocatoria con `solicitudes`).

### GET `/reportes/evaluaciones`
**Permiso:** `reporte:ver`

Response 200 con `totalConvocatorias`, `totalSolicitudesEvaluadas` y `porConvocatoria` (score promedio, criterios completos, decisiones `aprobadas`/`rechazadas` y `pendientes`).

### GET `/reportes/:tipo/csv`
**Permiso:** `reporte:ver`
**tipo:** `solicitudes-por-estado | convocatorias | evaluaciones`

Descarga `text/csv; charset=utf-8` con `Content-Disposition: attachment` y BOM UTF-8 (abre directo en Excel). `tipo` inválido → 400.

---

## Auditoría (`/audit`)

> Permiso `auditoria:ver`. Log de acciones sensibles (`AuditService.log`) con IP, usuario, entidad y detalle. Persistido en la tabla `audit_log`.

### GET `/audit`
**Permiso:** `auditoria:ver`

Query params (todos opcionales): `entidad`, `accion`, `usuarioId`, `desde`, `hasta` (ISO), `page` (default 1), `limit` (default 50, máx 200).

Response 200:
```json
{
  "data": {
    "total": 14,
    "page": 1,
    "limit": 50,
    "items": [
      {
        "id": "uuid",
        "usuarioId": "uuid",
        "accion": "login",
        "entidad": "usuario",
        "entidadId": "uuid",
        "detalle": null,
        "ip": "127.0.0.1",
        "createdAt": "2026-08-29T03:00:00.000Z",
        "usuario": { "nombres": "Administrador SIGEB", "email": "admin@sigeb.gov.gt", "rol": { "nombre": "ADMIN" } }
      }
    ]
  }
}
```

Acciones auditadas: `login`, `refresh` (auth), `transicion`, `configurar-documentos` (convocatorias/solicitudes), `cambiar-estado-documento`, `asignar-evaluadores`, `crear`/`editar`/`eliminar`/`agregar-miembro`/`eliminar-miembro` (comités), `crear`/`votar`/`finalizar` (sesiones), `crear`/`editar`/`eliminar`/`asignar-permisos` (roles).

---

## Asistente (`/asistente`)

### POST `/asistente/preguntar`
**Público** (respuesta acotada).

El endpoint responde preguntas sobre becas, postulaciones, documentos, convocatorias y evaluación. La respuesta se genera a partir de la base de conocimiento de SIGEB (tabla `asistente_base_conocimiento`) con búsqueda de texto completo en español (PostgreSQL `tsvector`), y cada pregunta se persiste como conversación anónima o vinculada al usuario (token JWT) para trazabilidad.

Request:
```json
{
  "pregunta": "¿Cuáles son los requisitos para la beca de excelencia?"
}
```

Validación: `pregunta` requerida, string, máx. 500 caracteres.

Response `201`:
```json
{
  "respuesta": "Aquí tienes lo que sé: 1. Beca de excelencia académica: ...",
  "fuentes": ["Beca de excelencia académica"]
}
```

Errores: `400` (pregunta vacía o muy larga).

Diseño IA (US-37/38/39): `AsistenteIAProxy` enruta la pregunta al proveedor activo.
- **Por defecto** (sin `AI_API_KEY`): `FallbackProveedor` responde desde la KB (reglas), con `websearch_to_tsquery` OR + `ts_rank` para ordenar, top-3 fuentes. Indexación GIN funcional sobre `to_tsvector('spanish', titulo || ' ' || contenido)` (solo operadores inmutables en PG16).
- **Opcional** (`AI_API_KEY`/`AI_BASE_URL`/`AI_MODEL`/`AI_TIMEOUT_MS`): `OpenAIProveedor` (API compatible OpenAI) con timeout por `AbortController`. Si el LLM falla o expira, el proxy **degradación a fallback** automáticamente (US-38). Contexto por rol: el system prompt acota la respuesta — sin sesión solo información general; autenticado añade el rol sin exponer datos de terceros ni decisiones de comités. Las credenciales nunca se versionan.

---

*Última actualización: 2026-08-29*
