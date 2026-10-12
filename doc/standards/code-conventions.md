# Convenciones de Código — SIGEB

---

## Estructura de archivos

### Backend (NestJS)

```
apps/api/src/
├── <modulo>/
│   ├── <modulo>.module.ts
│   ├── <modulo>.controller.ts
│   ├── <modulo>.service.ts
│   ├── <modulo>.repository.ts
│   ├── <modulo>.repository.interface.ts
│   ├── dto/
│   │   ├── create-<entidad>.dto.ts
│   │   ├── update-<entidad>.dto.ts
│   │   └── index.ts
│   ├── entities/
│   │   └── <entidad>.entity.ts
│   └── <modulo>.constants.ts
```

### Frontend (Next.js)

```
apps/web/src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── convocatorias/
│   │   └── nosotros/
│   ├── (auth)/
│   │   ├── login/
│   │   └── registro/
│   ├── (dashboard)/
│   │   ├── solicitudes/
│   │   └── documentos/
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── forms/
│   └── layout/
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── utils.ts
├── hooks/
├── types/
└── styles/
```

---

## Naming conventions

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos | `kebab-case` | `solicitud.service.ts` |
| Clases | `PascalCase` | `SolicitudService` |
| Interfaces | `PascalCase` con prefijo `I` | `ISolicitudRepository` |
| DTOs | `PascalCase` + `.dto.ts` | `CreateSolicitudDto` |
| Variables | `camelCase` | `solicitudId` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE` |
| Enums | `PascalCase` | `SolicitudEstado` |
| Tablas DB | `snake_case` | `solicitud_documento` |
| Columnas DB | `snake_case` | `created_at` |
| Endpoints | `kebab-case` | `/solicitudes/:id/perfil-academico` |
| Branches | `feature/<modulo>-<desc>` | `feature/auth-login` |
| Commits | Conventional Commits | `feat(auth): add login endpoint` |

---

## Convenciones NestJS

### Módulos
- Un módulo por dominio de negocio
- Importar módulos compartidos vía `imports`
- Exportar servicios que otros módulos necesiten vía `exports`

### Controllers
- Un controller por módulo
- Usar `@Controller('prefijo')` para agrupar rutas
- Validar con `@UsePipes(new ValidationPipe())`
- Documentar con `@ApiTags` y `@ApiOperation` (Swagger)

### Services
- Un servicio por módulo
- Depender de **interfaces** de repositorio, no de Prisma directamente
- Usar `@Injectable()` y constructor para DI
- Lógica de negocio pura, sin HTTP

### Repositories
- Interfaz en `<modulo>.repository.interface.ts`
- Implementación en `<modulo>.repository.ts`
- Usar Prisma para queries, nunca `$queryRawUnsafe`
- Retornar entidades del dominio, no modelos Prisma directamente

### DTOs
- Usar `class-validator` para validación
- Whitelist: `forbidNonWhitelisted: true`
- Tipos correctos, longitudes máximas, emails válidos
- Cada campo obligatorio con `@IsNotEmpty()`

---

## Convenciones Frontend

### Componentes
- Un componente por archivo
- Componentes de UI en `components/ui/`
- Componentes de página en `app/` (Next.js App Router)
- Props tipadas con TypeScript

### Formularios
- React Hook Form para manejo de estado
- Zod para validación de schemas
- Reutilizar schemas entre frontend y backend

### Estilos
- Tailwind CSS exclusivamente
- Sistema de diseño propio en `styles/`
- Clases utilitarias, no CSS modules
- Responsive: `sm:`, `md:`, `lg:` breakpoints

### State Management
- React hooks locales para estado de componente
- SWR o React Query para cache de API
- Context solo para auth/global state

---

## Convenciones de Testing

### Backend
```typescript
// Nombre: <entidad>.<metodo>.spec.ts
// Ejemplo: solicitud.crear.spec.ts
describe('SolicitudService', () => {
  describe('crear', () => {
    it('debería crear una solicitud en BORRADOR', () => {});
    it('debería rechazar si la convocatoria no está ABIERTA', () => {});
  });
});
```

### Frontend
```typescript
// Nombre: <Componente>.test.tsx
// Ejemplo: LoginForm.test.tsx
describe('LoginForm', () => {
  it('debería mostrar errores de validación', () => {});
  it('debería llamar a la API al enviar', () => {});
});
```

---

## Convenciones de Git

### Branches
- `master` → producción
- `develop` → integración
- `feature/<modulo>-<descripcion>` → features
- `hotfix/<descripcion>` → fixes urgentes

### Commits (Conventional Commits)
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: nueva funcionalidad
- `fix`: bug fix
- `docs`: documentación
- `refactor`: refactorización sin cambio de comportamiento
- `test`: agregar/modificar tests
- `chore`: tareas de mantenimiento
- `style`: cambios de formato (no afectan lógica)

Ejemplos:
```
feat(auth): add login endpoint with JWT
fix(solicitud): prevent duplicate document upload
docs(api): add endpoint documentation for convocatorias
refactor(evaluaciones): extract score calculation to service
test(auth): add unit tests for registration validation
```

---

*Última actualización: 2026-08-26*
