# Directrices de Seguridad — EDUVIAGT

---

## Prevención de inyección SQL

### Reglas estrictas

| Regla | Detalle |
|---|---|
| **Prisma por defecto** | Todas las queries Prisma son parametrizadas automáticamente |
| **Prohibido `$queryRawUnsafe`** | Nunca usar `$queryRawUnsafe` con interpolación de variables de usuario |
| **Permitido `$queryRaw`** | Solo con template literals parametrizados: `` $queryRaw\`SELECT * FROM usuario WHERE id = ${id}\` `` |
| **IA y SQL** | El modo fallback ejecuta FTS parametrizado con `Prisma.sql` (no `$queryRawUnsafe`); el modo LLM envía la pregunta literal al LLM externo (sin BD). No hay repositorios en el código (Prisma directo). |

### Ejemplo correcto

```typescript
// CORRECTO - parametrizado
const usuario = await prisma.usuario.findUnique({
  where: { cui: '1234567890123' },
});

// CORRECTO - raw query parametrizado
const resultado = await prisma.$queryRaw`
  SELECT * FROM solicitud 
  WHERE estado = ${estado}
  AND convocatoria_id = ${convocatoriaId}
`;

// INCORRECTO - vulnerable a SQL injection
const resultado = await prisma.$queryRawUnsafe(
  `SELECT * FROM solicitud WHERE estado = '${estado}'`
);
```

---

## Validación de entrada

### DTOs con class-validator

```typescript
export class CreateSolicitudDto {
  @IsNotEmpty()
  @IsUUID()
  convocatoriaId: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
```

### Configuración global

```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Eliminar propiedades no decoradas
  forbidNonWhitelisted: true, // Lanzar error si hay propiedades extra
  transform: true,           // Transformar tipos automáticamente
}));
```

---

## Autenticación

### JWT

| Configuración | Valor |
|---|---|
| Access token | 15 minutos |
| Refresh token | 7 días |
| Algoritmo | HS256 (o RS256 para producción) |
| Secret | Variable de entorno, nunca hardcodeada |

### Contraseñas

| Regla | Detalle |
|---|---|
| Hash | bcrypt con 10 rounds |
| Mínimo | 8 caracteres (`@MinLength(8)` + `@MaxLength(128)` en `RegisterDto`). **No hay reglas de complejidad implementadas** — registrado como deuda. |
| Requerido | Solo `MinLength(8)` (sin mayúscula/minúscula/número/símbolo) |
| Throttling | Máximo 5 intentos de login en 15 minutos |

---

## Autorización

### Cadena de permisos (Chain of Responsibility)

```
1. Buscar excepción de usuario (UsuarioPermiso)
   → Si existe y es DENEGAR → Denegado
   → Si existe y es PERMITIR → Permitido
   → Si no existe → siguiente paso

2. Buscar permiso de rol (RolPermiso)
   → Si existe → Permitido
   → Si no existe → siguiente paso

3. Default: Denegado
```

### Autorización por fila

```typescript
// En el servicio, NO solo en el controller
async obtenerSolicitud(id: string, usuarioId: string): Promise<Solicitud> {
  const solicitud = await this.repo.obtenerPorId(id);
  
  if (!solicitud) {
    throw new NotFoundException('Solicitud no encontrada');
  }
  
  // Solo el dueño puede ver su solicitud (o alguien con permiso)
  if (solicitud.usuarioId !== usuarioId) {
    throw new ForbiddenException('No tiene acceso a esta solicitud');
  }
  
  return solicitud;
}
```

---

## Seguridad de archivos

### Reglas de upload

| Regla | Detalle |
|---|---|
| MIME types | Solo: `application/pdf`, `image/jpeg`, `image/png` |
| Tamaño máximo | 5 MB por archivo (`DOCUMENTO_MAX_BYTES = 5 * 1024 * 1024`); 10 MB es el `client_max_body_size` de nginx |
| Nombre | Generado con UUID + extensión original (nunca el nombre del usuario) |
| Storage | Detrás de interfaz `DocumentStorage` (Adapter pattern) |
| Descarga | Solo vía endpoint autenticado, validando permisos |

```typescript
// Validación de MIME type
const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
if (!allowedMimes.includes(file.mimetype)) {
  throw new BadRequestException('Tipo de archivo no permitido');
}

// Nombre generado
const filename = `${uuid()}.${file.originalname.split('.').pop()}`;
```

---

## Cifrado de datos sensibles

### Campos a cifrar en reposo

| Campo | Tabla |
|---|---|
| CUI/DPI | `usuario.cui` |
| Datos financieros | `solicitud_perfil_financiero.*` |

### Implementación

- Usar AES-256 para cifrado simétrico
- Key en variable de entorno
- Cifrar antes de guardar, descifrar al leer
- Nunca mostrar datos cifrados sin descifrar

---

## Auditoría

### Qué auditar

| Evento | Prioridad |
|---|---|
| Login / logout | Alta |
| Crear/editar/eliminar permisos | Alta |
| Cambiar estado de solicitud | Alta |
| Subir/eliminar documentos | Alta |
| Evaluar solicitud | Media |
| Votar en comité | Media |
| Generar reportes | Baja |

### Formato del log

```typescript
{
  usuarioId: string;
  accion: string;       // "CREAR", "EDITAR", "ELIMINAR", "CONSULTAR"
  entidad: string;      // "solicitud", "permiso", "convocatoria"
  entidadId: string;
  detalle: object;      // cambios realizados
  ip: string;
  fecha: Date;
}
```

---

## Variables de entorno

### Requeridas

```env
# Base de datos
DATABASE_URL=postgresql://user:pass@localhost:5432/EDUVIAGT

# JWT
JWT_SECRET=tu-secreto-aqui
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Storage
STORAGE_PATH=./storage

# IA
AI_API_KEY=tu-api-key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_TIMEOUT_MS=15000

# App
PORT=3000
CORS_ORIGIN=http://localhost:3001
```

### Reglas

- Nunca commitear `.env`
- Usar `.env.example` como plantilla
- Secrets en variables de entorno, nunca en código
- Diferentes valores para dev/staging/prod

---

## Headers de seguridad

⚠️ **No implementado en el código.** `helmet` no es dependencia de `apps/api` (grep = 0). Los headers de seguridad los pone nginx en el servidor (`scripts/nginx/EDUVIAGT.conf`, que **no está versionado en este repo**). En desarrollo no se aplican headers de seguridad. Registrado como deuda técnica.

---

## Rate limiting

⚠️ **No hay `@nestjs/throttler`.** El único control es `LoginAttemptService` (`auth/login-attempt.service.ts`): `Map` en memoria, clave `ip:email`, 5 intentos / 15 min. Se pierde al reiniciar y no escala horizontalmente. El endpoint del asistente (`/asistente/preguntar`) es público y sin rate limit (deuda P0).

---

*Última actualización: 2026-08-26*
