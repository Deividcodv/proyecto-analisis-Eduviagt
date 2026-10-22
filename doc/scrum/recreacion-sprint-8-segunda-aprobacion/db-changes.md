# Cambios de Base de Datos - Sprint 8

## Nuevos modelos

### ConvocatoriaReglaMonto
```prisma
model ConvocatoriaReglaMonto {
  id             String       @id @default(uuid())
  convocatoriaId String
  nombre         String
  ingresoMin     Decimal?     @db.Decimal(12,2)
  ingresoMax     Decimal?     @db.Decimal(12,2)
  tipo           String       // FIJO | PORCENTAJE | COMPLETO
  montoFijo      Decimal?     @db.Decimal(12,2)
  porcentaje     Float?
  prioridad      Int          @default(0)
  activo         Boolean      @default(true)
  convocatoria   Convocatoria @relation(fields: [convocatoriaId], references: [id], onDelete: Cascade)
  @@index([convocatoriaId])
  @@map("convocatoria_regla_monto")
}
```

### SolicitudAprobacion
```prisma
model SolicitudAprobacion {
  id          String   @id @default(uuid())
  solicitudId String
  usuarioId   String
  rolNombre   String
  nivel       Int      // 1 = primera, 2 = segunda
  accion      String   // aprobar | rechazar | aprobar_segunda | devolver_a_revision
  resultado   String   // APROBADA | RECHAZADA | DEVUELTA_A_REVISION | PENDIENTE_SEGUNDA_APROBACION
  comentario  String?
  ip          String?
  userAgent   String?
  createdAt   DateTime @default(now())
  solicitud   Solicitud @relation(fields: [solicitudId], references: [id], onDelete: Cascade)
  usuario     Usuario   @relation(fields: [usuarioId], references: [id])
  @@index([solicitudId])
  @@index([usuarioId])
  @@index([createdAt])
  @@map("solicitud_aprobacion")
}
```

### BitacoraSistema (inmutable)
```prisma
model BitacoraSistema {
  id                String   @id @default(uuid())
  fechaHora         DateTime @default(now())
  actorId           String?
  actorNombre       String?
  actorRol          String?
  actorCorreo       String?
  modulo            String
  entidad           String
  entidadId         String?
  accionClave       String
  accionHumana      String
  descripcionHumana String
  camposClave       Json?
  datosRelevantes   Json?
  resultado         String   // EXITOSO | RECHAZADO | ERROR
  motivo            String?
  ip                String?
  userAgent         String?
  origen            String   // WEB | API
  correlacionId     String?
  sessionId         String?
  @@index([fechaHora])
  @@index([actorId])
  @@index([entidad, entidadId])
  @@index([accionClave])
  @@index([modulo])
  @@map("bitacora_sistema")
}
```

### ConfiguracionUsuario
```prisma
model ConfiguracionUsuario {
  id                    String   @id @default(uuid())
  usuarioId             String   @unique
  notificacionesActivas Boolean  @default(true)
  sonidoNotificaciones  Boolean  @default(true)
  volumenSonido         Int      @default(40)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  usuario               Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  @@map("configuracion_usuario")
}
```

## Modificaciones a modelos existentes

### Convocatoria
```prisma
moneda           String   @default("GTQ")
montoBase        Decimal? @db.Decimal(12,2)
permiteParcial    Boolean  @default(true)
usarReglasMonto   Boolean  @default(false)
reglasMonto       ConvocatoriaReglaMonto[]
```

### Solicitud
```prisma
montoOtorgable      Decimal? @db.Decimal(12,2)
montoAprobado       Decimal? @db.Decimal(12,2)
montoOrigenCalculo  String?  // 'REGLA' | 'MONTO_BASE' | 'OVERRIDE'
montoCalculadoAt    DateTime?
montoCalculadoPor   String?
aprobaciones        SolicitudAprobacion[]
```

### HistorialEstado
```prisma
accion    String?
resultado String?
ip        String?
```

### Usuario (relaciones)
Añadir: `aprobacionesHechas SolicitudAprobacion[]`, `configuracion ConfiguracionUsuario?`

### SolicitudEstado (tipo)
Añadir: `'PENDIENTE_SEGUNDA_APROBACION'`

## Migración
Generar migración única descriptiva: `YYYYMMDDHHMMSS_segunda_aprobacion_montos_bitacora_auditoria.sql`
- Crear tablas nuevas
- Alter tables existentes
- Crear índices
- Actualizar seed (roles/permisos)
- Sin datos destructivos
- Compatible con datos existentes (`montoOtorgable` null)
