# SIGEB — Baseline de pruebas (2026-10-16)

Rama: `test/bug-hunt-revision` — BASE `b62070b`.

## 1. Resumen ejecutivo

| Nivel | Suites | Tests | Resultado |
|---|---|---|---|
| Unitario (Jest) | 18 | 155 | ✅ 100% PASS (~14 s, sin BD) |
| E2E API (Supertest) | 4 | 55 | ✅ 100% PASS (contra `sigeb_test`) |
| Web (Playwright) | 0 | 0 | ⬜ no existe (Task 4) |

> **Corregido:** la primera captura anotaba 31 tests E2E; era un artefacto de
> la salida del shell (mismo bug que corrió el reporter de Jest). Los specs E2E
> no se modifican durante esta campaña, así que el baseline real es
> **4 suites / 55 tests**.

## 2. Cobertura unitaria global (`npx jest --coverage`)

| Métrica | Resultado | Mínimo del repo | Estado |
|---|---|---|---|
| Statements | 43.52% | 70% | ❌ por debajo |
| Branches | 35.35% | 60% | ❌ por debajo |
| Functions | 43.11% | 70% | ❌ por debajo |
| Lines | 43.27% | 70% | ❌ por debajo |

No hay `coverageThreshold` configurado en Jest → la CI no falla nunca por cobertura.

## 3. Archivos con lógica en 0% o casi (candidatos Task 2)

| Archivo | % Stmts | Stmts | Observación |
|---|---|---|---|
| `solicitudes.controller.ts` | 0 | ~200 | controller completo sin unit (solo E2E lo toca) |
| `users.controller.ts` | 0 | 164 | controller completo sin unit |
| `auto-assign-evaluadores.service.ts` | 0 | — | lógica de asignación de evaluadores sin unit |
| `committee-notification.service.ts` | 0 | 88 | notificaciones de comité sin unit |
| `reportes.service.ts` | 0 | 90 | generación de reportes sin unit |
| `refresh-token.strategy.ts` | 0 | — | parte del flujo JWT sin unit |
| `roles.service.ts` | 19.51 | — | servicio de roles (seguridad) casi sin cubrir |
| `solicitudes.evaluation.service.ts` | 14.29 | 128 | **servicio de evaluación de becas** casi sin cubrir |
| `constancia.service.ts` | 18.75 | 92 | casi sin cubrir |
| `puppeteer-pdf-renderer.ts` | 0 | 58 | render de PDFs sin cubrir |

Guard/filter sin specs (mencionados en análisis previo): `jwt-auth.guard.ts`,
`roles.guard.ts`, `http-exception.filter.ts`, `transform.interceptor.ts`.

## 4. Hallazgos del baseline (Task 1)

- **F-001 (Media).** Cobertura global por debajo de los mínimos propios del repo
  (43% vs 70% lines; 35% vs 60% branches) y sin `coverageThreshold` en Jest → la CI
  no puede detectar regresiones de cobertura. `apps/api/package.json`.
- **F-002 (Alta).** Las E2E **no resetean** `sigeb_test` entre ejecuciones
  (`test/setup-env.ts` solo fija env vars). Los datos se acumulan y una ejecución
  puede pasar o fallar según el histórico previo → pruebas no idempotentes.
- **F-003 (Media).** `apps/web` declara script `test: jest --passWithNoTests` pero
  **no tiene Jest instalado, ni configuración, ni tests** → el `npm test` del monorepo
  reporta verde sin probar nada en el frontend.
- **F-004 (Baja).** `apps/api/test/` (specs E2E + ~50 PDFs) está **sin versionar**
  (`git status` los marca como `??`) → el equipo podría perder la suite E2E.
- **F-005 (Baja).** 53 archivos modificados en el árbol de trabajo solo por
  fin de línea LF→CRLF; `.gitattributes` solo cubre `*.sh`, `*.bash`, `*.prisma`.

## 5. Cómo reproducir

```powershell
# Unit + cobertura (sin BD)
cd apps/api; npx jest --coverage

# E2E (BD de prueba dedicada sigeb_test)
cd apps/api
$env:DATABASE_URL = "postgresql://sigeb:sigeb123@localhost:5432/sigeb_test"
npx jest --config ./test/jest-e2e.json --runInBand --json --outputFile=e2e.json
```
