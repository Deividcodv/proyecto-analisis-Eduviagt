# Schema de Base de Datos — SIGEB

> Documentación completa del schema Prisma.

---

## Resumen de entidades

| Categoría | Entidades |
|---|---|
| Seguridad | `Usuario`, `Rol`, `Permiso`, `RolPermiso`, `UsuarioPermiso` |
| Catálogos | `Genero`, `NivelAcademico`, `Departamento`, `Municipio` |
| Becas | `Beca`, `CriterioEvaluacion` |
| Convocatorias | `Convocatoria`, `ConvocatoriaDocRequerido` |
| Solicitudes | `Solicitud`, `SolicitudPerfilAcademico`, `SolicitudPerfilFinanciero`, `SolicitudDocumento` |
| Evaluaciones | `Evaluacion` |
| Comités | `Comite`, `ComiteMiembro`, `Sesion`, `Voto` |
| Decisiones | `Decision` |
| Auditoría | `AuditLog` |
| IA | `AsistenteBaseConocimiento`, `AsistenteConversacion`, `AsistenteMensaje` |

---

## Enums

```prisma
enum UsuarioEstado {
  ACTIVO
  INACTIVO
}

enum SolicitudEstado {
  BORRADOR
  ENVIADA
  EN_REVISION
  CORRECCION
  EVALUADA
  APROBADA
  RECHAZADA
}

enum ConvocatoriaEstado {
  BORRADOR
  ABIERTA
  CERRADA
  EN_EVALUACION
  RESUELTA
  ARCHIVADA
}

enum PermisoEfecto {
  PERMITIR
  DENEGAR
}

enum SolicitudDocumentoEstado {
  PENDIENTE
  CARGADO
  RECHAZADO
}
```

---

## Seguridad y usuarios

### Usuario

```prisma
model Usuario {
  id           String    @id @default(uuid())
  cui          String    @unique
  nombres      String
  email        String    @unique
  passwordHash String
  rolId        String
  estado       UsuarioEstado @default(ACTIVO)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  rol              Rol
  solicitudes      Solicitud[]
  usuarioPermisos  UsuarioPermiso[]
  comiteMiembros   ComiteMiembro[]
}
```

### Rol

```prisma
model Rol {
  id          String   @id @default(uuid())
  nombre      String   @unique
  descripcion String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  usuarios       Usuario[]
  rolPermisos    RolPermiso[]
}
```

### Permiso

```prisma
model Permiso {
  id        String   @id @default(uuid())
  modulo    String
  accion    String
  createdAt DateTime @default(now())

  @@unique([modulo, accion])

  rolPermisos      RolPermiso[]
  usuarioPermisos  UsuarioPermiso[]
}
```

### RolPermiso

```prisma
model RolPermiso {
  id        String   @id @default(uuid())
  rolId     String
  permisoId String
  createdAt DateTime @default(now())

  rol     Rol     @relation(fields: [rolId], references: [id])
  permiso Permiso @relation(fields: [permisoId], references: [id])

  @@unique([rolId, permisoId])
}
```

### UsuarioPermiso

```prisma
model UsuarioPermiso {
  id         String        @id @default(uuid())
  usuarioId  String
  permisoId  String
  efecto     PermisoEfecto
  createdAt  DateTime      @default(now())

  usuario Usuario @relation(fields: [usuarioId], references: [id])
  permiso Permiso @relation(fields: [permisoId], references: [id])

  @@unique([usuarioId, permisoId])
}
```

---

## Catálogos

```prisma
model Genero {
  id     String @id @default(uuid())
  nombre String @unique
  activo Boolean @default(true)

  perfiles SolicitudPerfilAcademico[]
}

model NivelAcademico {
  id     String @id @default(uuid())
  nombre String @unique
  activo Boolean @default(true)

  perfiles SolicitudPerfilAcademico[]
}

model Departamento {
  id     String @id @default(uuid())
  nombre String @unique
  activo Boolean @default(true)

  municipios Municipio[]
  perfiles   SolicitudPerfilAcademico[]
}

model Municipio {
  id             String @id @default(uuid())
  nombre         String
  departamentoId String
  activo         Boolean @default(true)

  departamento Departamento @relation(fields: [departamentoId], references: [id])
  perfiles     SolicitudPerfilAcademico[]

  @@unique([nombre, departamentoId])
}
```

---

## Becas

```prisma
model Beca {
  id          String   @id @default(uuid())
  nombre      String
  descripcion String?
  activa      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  convocatorias       Convocatoria[]
  criteriosEvaluacion CriterioEvaluacion[]
}

model CriterioEvaluacion {
  id       String @id @default(uuid())
  becaId   String
  nombre   String
  peso     Float
  activo   Boolean @default(true)

  beca        Beca         @relation(fields: [becaId], references: [id])
  evaluaciones Evaluacion[]
}
```

---

## Convocatorias

```prisma
model Convocatoria {
  id              String              @id @default(uuid())
  nombre          String
  descripcion     String?
  becaId          String
  estado          ConvocatoriaEstado  @default(BORRADOR)
  fechaApertura   DateTime?
  fechaCierre     DateTime?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  beca                  Beca
  documentosRequeridos  ConvocatoriaDocRequerido[]
  solicitudes           Solicitud[]
}

model ConvocatoriaDocRequerido {
  id              String   @id @default(uuid())
  convocatoriaId  String
  documentoTipoId String
  obligatorio     Boolean  @default(true)

  convocatoria   Convocatoria
  documentoTipo  DocumentoTipo
}
```

---

## Solicitudes

```prisma
model Solicitud {
  id                String          @id @default(uuid())
  convocatoriaId    String
  usuarioId         String
  estado            SolicitudEstado @default(BORRADOR)
  correccionesCount Int             @default(0)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  convocatoria   Convocatoria
  usuario        Usuario
  perfilAcademico SolicitudPerfilAcademico?
  perfilFinanciero SolicitudPerfilFinanciero?
  documentos     SolicitudDocumento[]
  historial      HistorialEstado[]
  evaluaciones   Evaluacion[]
  votos          Voto[]
  decision       Decision?
}

model SolicitudPerfilAcademico {
  id                  String  @id @default(uuid())
  solicitudId         String  @unique
  nivelAcademicoId    String?
  nivelAcademicoOtro  String?
  institucion         String?
  carrera             String?
  promedio            Float?
  departamentoId      String?
  departamentoOtro    String?
  municipioId         String?
  municipioOtro       String?

  solicitud        Solicitud
  nivelAcademico   NivelAcademico?
  departamento     Departamento?
  municipio        Municipio?
}

model SolicitudPerfilFinanciero {
  id                  String  @id @default(uuid())
  solicitudId         String  @unique
  ingresoFamiliar     Float?
  numeroDependientes  Int?
  becasAnteriores     Boolean @default(false)
  descripcionSituacion String?

  solicitud Solicitud
}

model SolicitudDocumento {
  id              String                    @id @default(uuid())
  solicitudId     String
  documentoTipoId String
  archivoUrl      String
  estado          SolicitudDocumentoEstado  @default(PENDIENTE)
  version         Int                       @default(1)
  createdAt       DateTime                  @default(now())
  updatedAt       DateTime                  @updatedAt

  solicitud      Solicitud
  documentoTipo  DocumentoTipo
}

model HistorialEstado {
  id          String   @id @default(uuid())
  solicitudId String
  estado      String
  comentario  String?
  usuarioId   String
  createdAt   DateTime @default(now())

  solicitud Solicitud
}
```

---

## Documentos tipo

```prisma
model DocumentoTipo {
  id     String @id @default(uuid())
  nombre String @unique
  activo Boolean @default(true)

  convocatoriaDocRequeridos ConvocatoriaDocRequerido[]
  solicitudDocumentos       SolicitudDocumento[]
}
```

---

## Evaluaciones

```prisma
model Evaluacion {
  id                   String  @id @default(uuid())
  solicitudId          String
  criterioEvaluacionId String
  evaluadorId          String
  puntaje              Float?
  observaciones        String?
  completada           Boolean @default(false)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  solicitud          Solicitud
  criterioEvaluacion CriterioEvaluacion
  evaluador          Usuario
}
```

---

## Comités

```prisma
model Comite {
  id          String   @id @default(uuid())
  nombre      String
  descripcion String?
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  miembros  ComiteMiembro[]
  sesiones  Sesion[]
}

model ComiteMiembro {
  id        String   @id @default(uuid())
  comiteId  String
  usuarioId String
  rol       String
  activo    Boolean  @default(true)
  createdAt DateTime @default(now())

  comite  Comite
  usuario Usuario
}

model Sesion {
  id          String   @id @default(uuid())
  comiteId    String
  fecha       DateTime
  lugar       String?
  estado      String   @default('PROGRAMADA')
  quorumMinimo Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  comite    Comite
  votos     Voto[]
  decisiones Decision[]
}

model Voto {
  id          String   @id @default(uuid())
  sesionId    String
  solicitudId String
  usuarioId   String
  voto        String
  observaciones String?
  createdAt   DateTime @default(now())

  sesion    Sesion
  solicitud Solicitud
  usuario   Usuario

  @@unique([sesionId, solicitudId, usuarioId])
}
```

---

## Decisiones

```prisma
model Decision {
  id          String   @id @default(uuid())
  solicitudId String
  sesionId    String
  resultado   String
  observaciones String?
  fecha       DateTime @default(now())

  solicitud Solicitud
  sesion    Sesion
}
```

---

## Auditoría

```prisma
model AuditLog {
  id         String   @id @default(uuid())
  usuarioId  String
  accion     String
  entidad    String
  entidadId  String?
  detalle    Json?
  ip         String?
  createdAt  DateTime @default(now())

  usuario Usuario
}
```

---

## IA

```prisma
model AsistenteBaseConocimiento {
  id       String @id @default(uuid())
  titulo   String
  contenido String
  tags     String[]
  activo   Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AsistenteConversacion {
  id         String   @id @default(uuid())
  usuarioId  String?
  sesionId   String?
  createdAt  DateTime @default(now())

  mensajes AsistenteMensaje[]
}

model AsistenteMensaje {
  id              String   @id @default(uuid())
  conversacionId  String
  rol             String
  contenido       String
  contexto        Json?
  createdAt       DateTime @default(now())

  conversacion AsistenteConversacion
}
```

---

## Índices recomendados

```sql
-- Performance
CREATE INDEX idx_solicitud_estado ON solicitud(estado);
CREATE INDEX idx_solicitud_usuario ON solicitud(usuario_id);
CREATE INDEX idx_solicitud_convocatoria ON solicitud(convocatoria_id);
CREATE INDEX idx_convocatoria_estado ON convocatoria(estado);
CREATE INDEX idx_evaluacion_solicitud ON evaluacion(solicitud_id);
CREATE INDEX idx_voto_sesion ON voto(sesion_id);
CREATE INDEX idx_auditlog_usuario ON audit_log(usuario_id);
CREATE INDEX idx_auditlog_fecha ON audit_log(created_at);

-- Búsqueda de texto completo (IA)
CREATE INDEX idx_bc_titulo ON asistente_base_conocimiento USING gin(to_tsvector('spanish', titulo));
CREATE INDEX idx_bc_contenido ON asistente_base_conocimiento USING gin(to_tsvector('spanish', contenido));
```

---

*Última actualización: 2026-08-26*
