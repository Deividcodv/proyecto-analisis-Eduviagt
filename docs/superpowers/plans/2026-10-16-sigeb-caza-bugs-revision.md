# EDUVIAGT — Caza de bugs y revisión (API + Web) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Descubrir y corregir errores no detectados (comportamiento, contenido/idioma, visual/accesibilidad) en API y web de EDUVIAGT, y entregar sugerencias de mejora priorizadas.

**Architecture:** Investigación por frentes. Primero caja blanca y funcional del API contra la BD `EDUVIAGT_test`; luego funcional del front con Playwright; después revisión de contenido y accesibilidad; finalmente triaje, corrección y verificación. Cobertura antes/después como métrica de apoyo, no como fin.

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL 16, Jest, Supertest, Next.js 14, React 18, Playwright, axe-core.

**Spec:** `docs/superpowers/specs/2026-10-16-EDUVIAGT-caza-bugs-revision-design.md`

## Global Constraints

- Idioma de contenido y mensajes: **español (Guatemala)**, entendible de niño a adulto.
- Pruebas funcionales solo contra `EDUVIAGT_test` (`postgresql://EDUVIAGT:EDUVIAGT123@localhost:5432/EDUVIAGT_test`), vía `apps/api/.env.test`.
- Unit tests: `.spec.ts` junto al código. Integración: `*.integration-spec.ts` + Supertest. E2E front: `apps/web/e2e/`.
- Cobertura mínima: líneas 70%, funciones 70%, statements 70%, branches 60%.
- Rama de trabajo: `test/bug-hunt-revision`. Committear solo archivos relevantes (el árbol tiene ruido LF→CRLF).
- Cada hallazgo se registra con severidad, `archivo:línea`, reproducción y arreglo.
- Bug → corregir; mejora → sugerir.

## Review Focus

Las clases de entrada/condición que el spec implica pero que ninguna prueba actual ejercita, y que más probablemente rompan a un usuario real:

1. **Rol sin permiso que igual accede** a un endpoint protegido (fuga de autorización).
2. **Transición de estado inválida** en `Solicitud`/`Convocatoria` (p. ej. evaluar una solicitud en `BORRADOR`).
3. **Datos límite/ausentes** (CUI o teléfono vacíos, textos larguísimos, campos nulos) mostrados en la UI.
4. **Mensajes de error/validación** en lenguaje técnico o incomprensible para un niño.
5. **Contraste/etiquetas/foco** insuficientes en formularios y navegación (accesibilidad).

---

### Task 1: Preparación y baseline

**Files:**
- Create: rama `test/bug-hunt-revision`
- Create: `docs/pruebas/00-baseline.md`
- Modify (si aplica): `apps/api/package.json` (scripts `test:unit`/`test:integration`/`test:cov` según estrategia)

**Interfaces:**
- Produces: reporte de cobertura baseline; confirmación de que las E2E existentes corren contra `EDUVIAGT_test`.

- [ ] **Step 1:** Crear rama y baseline de cobertura
  Run: `cd apps/api && npx jest --coverage`
  Expected: 18 suites / 155 tests PASS + tabla de cobertura.
- [ ] **Step 2:** Generar cliente Prisma y correr E2E existentes
  Run: `cd apps/api && npx prisma generate && $env:DATABASE_URL="postgresql://EDUVIAGT:EDUVIAGT123@localhost:5432/EDUVIAGT_test"; npm run test:e2e`
  Expected: registrar qué pasa y qué falla (línea base de fallas reales).
- [ ] **Step 3:** Volcar resultados a `docs/pruebas/00-baseline.md`
- [ ] **Step 4:** Commit del baseline
  Run: `git add docs/pruebas/00-baseline.md && git commit -m "test(bug-hunt): baseline de cobertura y E2E"`

### Task 2: Caja blanca del API (cobertura dirigida a ramas)

**Files:**
- Read: reporte `apps/api/coverage`
- Modify/Create: `apps/api/src/**/**.spec.ts` (nuevos casos)
- Create: `docs/pruebas/10-caja-blanca.md`

**Interfaces:**
- Consumes: cobertura baseline (Task 1).
- Produces: lista de bugs encontrados por ramas no cubiertas; specs nuevos.

- [ ] **Step 1:** Identificar las ramas/condiciones en 0% de mayor riesgo (máquinas de estado `solicitudes`/`convocatorias`, guards `jwt-auth`/`roles`, `common/filters`, `common/interceptors`, caminos de error de servicios).
- [ ] **Step 2:** Por cada hueco, escribir el caso que fuerza la rama (límites, nulos, estados inválidos, errores).
- [ ] **Step 3:** Correr `npx jest <archivo>` y registrar PASS/FAIL.
- [ ] **Step 4:** Registrar hallazgos (bugs) en `docs/pruebas/10-caja-blanca.md`.

### Task 3: Funcionamiento del API (caja negra, RBAC y flujos)

**Files:**
- Create: `apps/api/test/*.integration-spec.ts` (nuevos) o extender los E2E existentes
- Create: `docs/pruebas/20-funcional-api.md`

**Interfaces:**
- Consumes: `EDUVIAGT_test` migrada + seed.
- Produces: matriz de autorización por rol; bugs de validación/RBAC/flujo.

- [ ] **Step 1:** Asegurar migración + seed en `EDUVIAGT_test`.
- [ ] **Step 2:** Matriz RBAC: cada rol (POSTULANTE, EVALUADOR, COMITE, COORDINADOR, ADMIN) contra endpoints protegidos → esperar 401/403 donde corresponda.
- [ ] **Step 3:** Validación de DTOs (campos faltantes/ inválidos → 400) y transiciones de estado inválidas → 409/400.
- [ ] **Step 4:** Flujo completo de beca (reusar/extender `flujo-beca.e2e-spec.ts`).
- [ ] **Step 5:** Registrar hallazgos en `docs/pruebas/20-funcional-api.md`.

### Task 4: Funcionamiento del frontend (Playwright)

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/*.spec.ts`
- Modify: `apps/web/package.json` (devDeps + script `test:e2e`)
- Create: `docs/pruebas/30-funcional-web.md`

**Interfaces:**
- Consumes: API corriendo (puerto 3100 o 3000) + web (`next dev -p 3001`).
- Produces: bugs de comportamiento del front; capturas.

- [ ] **Step 1:** Instalar Playwright + `@axe-core/playwright`; `npx playwright install chromium`.
- [ ] **Step 2:** Escribir el flujo crítico #1: Registro → Login → Dashboard.
- [ ] **Step 3:** Flujo #3: Ver convocatorias → Filtrar → Postularme.
- [ ] **Step 4:** Flujo #5: Consultar estado (público) y flujo admin #4.
- [ ] **Step 5:** Registrar hallazgos en `docs/pruebas/30-funcional-web.md`.

### Task 5: Contenido e idioma

**Files:**
- Read: `apps/web/src/**/*.tsx`
- Create: `docs/pruebas/40-contenido.md`

**Interfaces:**
- Produces: lista de errores ortográficos/gramaticales/tono, por severidad.

- [ ] **Step 1:** Extraer todos los textos visibles de las páginas públicas y de los formularios.
- [ ] **Step 2:** Revisar ortografía, tildes, concordancia, mayúsculas, textos placeholder/lorem y mensajes técnicos/en inglés.
- [ ] **Step 3:** Marcar los textos por encima del nivel de lectura objetivo (niño → adulto).
- [ ] **Step 4:** Registrar en `docs/pruebas/40-contenido.md`.

### Task 6: Visual y accesibilidad

**Files:**
- Create: `apps/web/e2e/a11y.spec.ts`
- Create: `docs/pruebas/50-a11y-visual.md`
- Create: `apps/web/e2e/__screenshots__/` (capturas)

**Interfaces:**
- Consumes: Playwright + axe (Task 4).
- Produces: hallazgos de contraste, `alt`, `label`, foco, responsive.

- [ ] **Step 1:** Escanear con axe (WCAG AA) las páginas principales (home, convocatorias, registro, login, consulta, ayuda).
- [ ] **Step 2:** Capturas en desktop y móvil (375px) para detectar desbordes/layout roto.
- [ ] **Step 3:** Revisar foco/teclado, `alt` de imágenes y `label` de formularios.
- [ ] **Step 4:** Registrar en `docs/pruebas/50-a11y-visual.md`.

### Task 7: Triaje y corrección

**Files:**
- Modify: archivos con bugs
- Create: `docs/pruebas/60-informe-hallazgos.md`

**Interfaces:**
- Consumes: hallazgos de Tasks 2–6.
- Produces: bugs corregidos + informe consolidado + sugerencias.

- [ ] **Step 1:** Consolidar hallazgos y clasificar por severidad.
- [ ] **Step 2:** Corregir los bugs (uno por uno), con su prueba.
- [ ] **Step 3:** Re-ejecutar la suite tras cada corrección.
- [ ] **Step 4:** Consolidar informe + sugerencias priorizadas en `docs/pruebas/60-informe-hallazgos.md`.

### Task 8: Verificación y cierre

- [ ] **Step 1:** Correr suite completa: `cd apps/api && npx jest --coverage` + Playwright.
  Expected: todo verde, cobertura ≥ mínimos.
- [ ] **Step 2:** Comparar cobertura antes/después.
- [ ] **Step 3:** Commit final y PR.

---

## Self-Review (cobertura del spec)

- Objetivos 1–5 → Tasks 2,3,4 (comportamiento), 5 (contenido), 6 (a11y/visual), 7 (mejoras), 8 (métricas). ✔
- Regla bug/mejora → Task 7. ✔
- Restricciones (BD de prueba, idioma, convenciones) → Global Constraints + Tasks 1,3,5. ✔
- Fase 2 (logo) queda **fuera** de este plan a propósito (proyecto independiente). ✔
