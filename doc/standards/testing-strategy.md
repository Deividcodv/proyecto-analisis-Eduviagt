# Estrategia de Testing — SIGEB

---

## Niveles de testing

```
┌─────────────────────────────────────┐
│         E2E Tests (Playwright)       │  ← Flujos críticos de usuario
│         ~10% de cobertura           │
├─────────────────────────────────────┤
│     Integration Tests (Supertest)    │  ← Endpoints + servicios + DB
│         ~30% de cobertura           │
├─────────────────────────────────────┤
│       Unit Tests (Jest)              │  ← Servicios, utilidades, lógica pura
│         ~60% de cobertura           │
└─────────────────────────────────────┘
```

---

## Backend (NestJS + Jest + Supertest)

### Unit Tests

**Ubicación:** Junto al archivo que testea, con extensión `.spec.ts`

**Qué testear:**
- Servicios: lógica de negocio pura
- Utilidades: funciones helpers, validadores
- DTOs: validaciones de class-validator
- Máquinas de estado: transiciones válidas/inválidas

**Estructura:**
```typescript
// solicitud.service.spec.ts
describe('SolicitudService', () => {
  describe('crear', () => {
    it('debería crear una solicitud en estado BORRADOR', async () => {
      // Arrange
      const dto = { convocatoriaId: 'uuid', usuarioId: 'uuid' };
      mockRepo.crear.mockResolvedValue(solicitudEsperada);

      // Act
      const resultado = await service.crear(dto);

      // Assert
      expect(resultado.estado).toBe('BORRADOR');
      expect(mockRepo.crear).toHaveBeenCalledWith(dto);
    });

    it('debería lanzar error si la convocatoria no está ABIERTA', async () => {
      // Arrange
      mockConvocatoriaService.obtener.mockResolvedValue({ estado: 'CERRADA' });

      // Act & Assert
      await expect(service.crear(dto)).rejects.toThrow('Convocatoria no está abierta');
    });
  });
});
```

### Integration Tests

**Ubicación:** `*.integration-spec.ts` o en carpeta `__tests__/`

**Qué testear:**
- Endpoints completos (request → controller → service → repository → DB)
- Autenticación y autorización
- Transacciones de DB
- Validaciones de DTOs

**Estructura:**
```typescript
// auth.registro.integration-spec.ts
describe('POST /auth/registro', () => {
  it('debería registrar un postulante con CUI válido', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/registro')
      .send({
        cui: '1234567890123',
        nombres: 'Juan Pérez',
        email: 'juan@test.com',
        password: 'Password123!',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.cui).toBe('1234567890123');
  });

  it('debería rechazar CUI duplicado', async () => {
    // Primero registrar uno
    await request(app.getHttpServer())
      .post('/auth/registro')
      .send({ cui: '1234567890123', ... });

    // Intentar registrar otro con el mismo CUI
    const response = await request(app.getHttpServer())
      .post('/auth/registro')
      .send({ cui: '1234567890123', ... });

    expect(response.status).toBe(409);
  });
});
```

### Cobertura mínima

| Tipo | Cobertura mínima |
|---|---|
| Líneas | 70% |
| Funciones | 70% |
| Branches | 60% |
| Statements | 70% |

---

## Frontend (Playwright para E2E)

**Ubicación:** `apps/web/e2e/`

**Flujos críticos a testear:**

| # | Flujo | Prioridad |
|---|---|---|
| 1 | Registro → Login → Ver dashboard | Alta |
| 2 | Crear solicitud → Subir documentos → Enviar | Alta |
| 3 | Ver convocatorias → Filtrar → Postularme | Alta |
| 4 | Login admin → Gestionar convocatoria → Cambiar estado | Media |
| 5 | Consultar estado de beca (público) | Media |

**Estructura:**
```typescript
// registro.spec.ts
import { test, expect } from '@playwright/test';

test(' flujo completo de registro', async ({ page }) => {
  await page.goto('/registro');
  
  await page.fill('[name="cui"]', '1234567890123');
  await page.fill('[name="nombres"]', 'Juan Pérez');
  await page.fill('[name="email"]', 'juan@test.com');
  await page.fill('[name="password"]', 'Password123!');
  
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/login');
});
```

---

## Ejecución de tests

### Comandos

```bash
# Backend - todos los tests
npm run test

# Backend - tests unitarios
npm run test:unit

# Backend - tests de integración
npm run test:integration

# Backend - cobertura
npm run test:cov

# Frontend - E2E
npm run test:e2e

# Todos
npm run test:all
```

### En CI (GitHub Actions)

```yaml
- name: Run tests
  run: |
    npm run lint
    npm run test:cov
    npm run build
```

---

## Datos de prueba

### Convenciones

- Usar factories o builders para crear datos de prueba
- Nunca depender de datos de producción
- Datos de prueba en `__fixtures__/` o `seed`
- Cada test debe ser independiente (no depender de otros tests)

### Ejemplo de factory

```typescript
// testing/factories/solicitud.factory.ts
export function crearSolicitud(overrides?: Partial<Solicitud>): Solicitud {
  return {
    id: uuid(),
    convocatoriaId: uuid(),
    usuarioId: uuid(),
    estado: 'BORRADOR',
    correccionesCount: 0,
    createdAt: new Date(),
    ...overrides,
  };
}
```

---

*Última actualización: 2026-08-26*
