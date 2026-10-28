# Principios SOLID — EDUVIAGT

> Cómo se aplican los principios SOLID en el código de EDUVIAGT, con ejemplos reales del repositorio.

---

## S — Single Responsibility Principle (SRP)

> Una clase/módulo debe tener un solo motivo para cambiar.

### Ejemplos en EDUVIAGT

| Clase | Responsabilidad única | Archivo |
|---|---|---|
| `AuthService` | Registro, login, refresh, perfil | `apps/api/src/auth/auth.service.ts` |
| `EliminarCuentaService` | Anonimización y eliminación de cuenta | `apps/api/src/auth/eliminar-cuenta.service.ts` |
| `LoginAttemptService` | Limitación de intentos de login | `apps/api/src/auth/login-attempt.service.ts` |
| `MontosService` | Cálculo de montos otorgables | `apps/api/src/solicitudes/montos.service.ts` |
| `SolicitudChecklistService` | Validación de completitud de documentos | `apps/api/src/solicitudes/solicitud-checklist.service.ts` |
| `SolicitudDocumentoService` | Carga/eliminación de documentos | `apps/api/src/solicitudes/solicitud-documento.service.ts` |
| `SolicitudStateMachine` | Transiciones de estado de solicitudes | `apps/api/src/solicitudes/solicitud-state-machine.ts` |
| `ConvocatoriaStateMachine` | Transiciones de estado de convocatorias | `apps/api/src/convocatorias/convocatoria-state-machine.ts` |
| `BitacoraService` | Registro inmutable de acciones | `apps/api/src/bitacora/bitacora.service.ts` |
| `ConfiguracionService` | Preferencias de usuario (sonido/notificaciones) | `apps/api/src/users/configuracion.service.ts` |

### Anti-patrón evitado
Un servicio que maneje login **y** registro **y** eliminación de cuenta habría violado SRP. Se separó en `AuthService` + `EliminarCuentaService`.

---

## O — Open/Closed Principle (OCP)

> Abierto para extensión, cerrado para modificación.

### Ejemplos en EDUVIAGT

| Extensión | Cómo se aplica | Archivo |
|---|---|---|
| `DocumentStorage` (interfaz) | Nuevos adaptadores (S3, Azure) se agregan sin modificar servicios | `apps/api/src/storage/storage.interface.ts` |
| `PdfRenderer` (interfaz) | Nuevo motor de PDF sin tocar `ConstanciasService` | `apps/api/src/solicitudes/pdf/pdf-renderer.interface.ts` |
| `ProveedorIA` (Strategy) | Nuevo proveedor de IA sin modificar el proxy | `apps/api/src/asistente/providers/` |
| State Machine (tabla de transiciones) | Nuevos estados/transiciones se agregan a la tabla, no a condicionales | `solicitud-state-machine.ts` |

### Ejemplo concreto: Storage Adapter

```typescript
// Interfaz (cerrada para modificación)
export interface DocumentStorage {
  save(buffer, options): Promise<StoredFile>;
  read(key): Promise<Buffer>;
  delete(key): Promise<void>;
  exists(key): Promise<boolean>;
}

// Implementación actual (filesystem)
export class FilesystemStorageAdapter implements DocumentStorage { ... }

// Futura implementación (sin tocar código existente)
// [NO IMPLEMENTADO] export class S3StorageAdapter implements DocumentStorage { ... }
```

---

## L — Liskov Substitution Principle (LSP)

> Los subtipos deben ser sustituibles por sus tipos base.

### Ejemplos en EDUVIAGT

| Interfaz | Implementaciones sustituibles | Archivo |
|---|---|---|
| `PdfRenderer` | `PuppeteerPdfRenderer` (única, pero intercambiable) | `solicitudes/pdf/` |
| `DocumentStorage` | `FilesystemStorageAdapter` | `storage/` |
| `ProveedorIA` | `FallbackProveedor`, `OpenAIProveedor` | `asistente/providers/` |

### Garantía LSP
El servicio `ConstanciasService` depende de `PdfRenderer` (interfaz), no de `PuppeteerPdfRenderer`. Cualquier implementación de `PdfRenderer` puede sustituirse sin cambiar el servicio.

---

## I — Interface Segregation Principle (ISP)

> Los clientes no deben depender de interfaces que no usan.

### Ejemplos en EDUVIAGT

| Interfaz | Métodos | Por qué segregada |
|---|---|---|
| `DocumentStorage` | `save`, `read`, `delete`, `exists` | Solo operaciones de archivos |
| `PdfRenderer` | `render(html): Buffer` | Solo renderizado de PDF |
| `ProveedorIA` | `preguntar(pregunta, contexto): Respuesta` | Solo interacción con IA |

### Anti-patrón evitado
Una interfaz monolítica `ServicioCompleto` con todos los métodos habría obligado a implementar métodos no usados. Se segregaron en interfaces específicas por dominio.

---

## D — Dependency Inversion Principle (DIP)

> Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de abstracciones.

### Ejemplos en EDUVIAGT

| Servicio (alto nivel) | Depende de | Abstracción | Archivo |
|---|---|---|---|
| `SolicitudesService` | `DocumentStorage` | Interfaz, no `FilesystemStorageAdapter` | `solicitudes/solicitudes.service.ts` |
| `ConstanciasService` | `PdfRenderer` | Interfaz, no `PuppeteerPdfRenderer` | `solicitudes/constancias.service.ts` |
| `AsistenteIAProxy` | `ProveedorIA` | Interfaz, no `OpenAIProveedor` | `asistente/asistente.proxy.ts` |
| `PrismaService` | (singleton) | Inyectado vía NestJS DI | `prisma/prisma.service.ts` |

### Inyección de dependencias (NestJS)

```typescript
// El servicio recibe la interfaz, no la implementación concreta
@Injectable()
export class SolicitudesService {
  constructor(
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorage,
    private readonly prisma: PrismaService,
  ) {}
}
```

El binding de la implementación concreta se hace en el módulo:

```typescript
@Module({
  providers: [
    { provide: DOCUMENT_STORAGE, useClass: FilesystemStorageAdapter },
  ],
})
```

---

## Patrones de diseño complementarios

| Patrón | Principio SOLID relacionado | Dónde |
|---|---|---|
| **Facade** | SRP (orquestación centralizada) | `SolicitudesService` (de facto) + `UsersService` (explícita, "Fachada de seguridad") |
| **Adapter** | OCP + DIP (intercambiable) | `DocumentStorage`, `PdfRenderer` |
| **Proxy** | SRP (control de acceso separado de lógica) | `AsistenteIAProxy` |
| **State** | OCP (transiciones extensibles) | State machines |
| **Chain of Responsibility** | SRP (cada eslabón una responsabilidad) | `PermissionsGuard` |
| **Observer** | [NO IMPLEMENTADO] Sin `@nestjs/event-emitter` ni bus de eventos; integracion directa | — |
| **Builder** | [NO IMPLEMENTADO] Solo `DocumentBuilder` de Swagger | `main.ts` (Swagger) |
| **Singleton** | DIP (una instancia compartida) | `PrismaService` |

---

## Verificación de cumplimiento

| Principio | Estado | Evidencia |
|---|---|---|
| **S** Single Responsibility | ✅ Cumplido | 10+ servicios con responsabilidad única |
| **O** Open/Closed | ✅ Cumplido | 3+ interfaces extensibles sin modificar código |
| **L** Liskov Substitution | ✅ Cumplido | Implementaciones intercambiables vía DI |
| **I** Interface Segregation | ✅ Cumplido | Interfaces específicas por dominio (storage, pdf, ia) |
| **D** Dependency Inversion | ✅ Cumplido | Servicios dependen de interfaces, inyectadas por NestJS |

---

*Última actualización: Sprint 8 (2026-10-23)*