# EDUVIAGT — Caza de bugs y revisión (API + Web) — Diseño

**Fecha:** 2026-10-16
**Autor(es):** sesión de agente + David
**Estado:** aprobado para planificación

---

## 1. Intención y por qué

EDUVIAGT (plataforma EDUVIAGT del Ministerio de Educación de Guatemala) administra el ciclo completo de una beca: convocatorias, postulación, documentos, evaluación, decisión de comités y constancias. Hoy existe una suite de **155 pruebas unitarias** del API que pasa íntegra, pero **no se ha hecho una búsqueda deliberada de errores**.

Este trabajo busca **descubrir y corregir errores que hoy nadie ve** — de comportamiento, de contenido/idioma y visuales/de accesibilidad — y dejar **sugerencias de mejora** priorizadas.

El filtro para juzgar qué es un "error" es la audiencia.

## 2. Audiencia

Estudiantes **desde niños de primaria hasta adultos** (postulantes a becas), además de personal interno (evaluadores, comité, coordinador, admin). Regla de oro: **si un niño no lo entiende, hay que reescribirlo**. Debe funcionar para personas con baja visión, en móvil y con lector de pantalla.

## 3. Objetivos / No-objetivos / Anti-objetivos

**Objetivos**
1. Encontrar y corregir bugs de comportamiento (API + web), con foco en casos límite, seguridad/RBAC y caminos de error.
2. Encontrar y corregir errores de gramática, ortografía y **nivel de lectura**.
3. Encontrar y corregir problemas visuales, de usabilidad y de accesibilidad (WCAG AA).
4. Entregar sugerencias de mejora priorizadas (impacto × esfuerzo), incluida la incorporación de iconos donde ayuden a entender.
5. Medir cobertura antes/después y dejar la suite verde.

**No-objetivos**
- Reescribir el front o el back.
- Rediseñar el logo **(fase 2, independiente)**.
- Optimización de rendimiento profunda.

**Anti-objetivos**
- Romper funcionalidad existente para "mejorar" algo.
- Corregir sin evidencia reproducible.
- Cambiar el diseño visual de forma arbitraria (los cambios deben justificarse por usabilidad/accesibilidad).

## 4. Restricciones

- Idioma: **español (Guatemala)**.
- Stack: `apps/api` NestJS 10 + Prisma 5 + PostgreSQL 16; `apps/web` Next.js 14 (App Router) + React 18 + Tailwind.
- Convenciones del repo (`docs/standards/testing-strategy.md`): unit `.spec.ts` junto al código; integración `*.integration-spec.ts` (Supertest); E2E frontend con **Playwright** en `apps/web/e2e/`; cobertura mínima líneas/funciones/statements **70%**, branches **60%**.
- Pruebas funcionales contra la BD **`EDUVIAGT_test`** (ya migrada en el contenedor `EDUVIAGT-postgres`), **nunca** contra datos de desarrollo/producción.
- El árbol de trabajo tiene ruido LF→CRLF; trabajar en **rama nueva** y committear solo archivos relevantes.

## 5. Enfoques de búsqueda

| # | Frente | Método | Herramienta |
|---|---|---|---|
| A | Caja blanca (API) | Cobertura dirigida a ramas/condiciones en 0% | Jest + `--coverage` |
| B | Funcionamiento (API) | HTTP real: RBAC, validación, transiciones, flujos | Supertest + PostgreSQL `EDUVIAGT_test` |
| C | Funcionamiento (web) | Navegación real por pantallas, formularios, estados, roles | Playwright (`next dev`) |
| D | Contenido e idioma | Ortografía, tildes, concordancia, tono y nivel de lectura | Revisión de textos extraídos |
| E | Visual + accesibilidad | Contraste, `alt`, `label`, foco/teclado, responsive, consistencia | Playwright + axe-core (WCAG AA) |
| F | Mejoras | Sugerencias priorizadas | — |

## 6. Regla de decisión

- **Bug** (no hace lo que promete / rompe / expone) → **se corrige**.
- **Mejora** (funciona, pero puede estar mejor) → **se sugiere**.

## 7. Entregables

1. Informe de hallazgos: severidad (Critical/High/Medium/Low), `archivo:línea`, cómo reproducir, arreglo.
2. Correcciones (diffs) de los bugs.
3. Sugerencias de mejora priorizadas (incl. iconos).
4. Pruebas nuevas + cobertura antes/después + suite completa verde.

## 8. Decisiones tomadas

- Rama nueva `test/bug-hunt-revision`.
- BD de prueba dedicada (`EDUVIAGT_test`); no se tocan datos de dev.
- Deps nuevas solo en `devDependencies`: Playwright + `@axe-core/playwright` en `apps/web`.
- El API reutiliza `supertest` (ya instalado).
- Informe final en `docs/pruebas/`.

## 9. Riesgos

- Ruido LF→CRLF y migración editada → resultados no reproducibles. Mitigación: rama nueva, commit de baseline.
- Playwright descarga navegadores (~cientos de MB) la primera vez.
- E2E dependen de seed/estado de BD; los tests deben ser independientes.
