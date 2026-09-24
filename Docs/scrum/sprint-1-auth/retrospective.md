# Sprint 1 — Retrospectiva

## Datos del Sprint

**Fecha:** 2026-08-27
**Participantes:** Marcos (Developer), David (Scrum Master / Reviewer)
**Sprint:** 1 — Auth

## ¿Qué salió bien? 

1. Alcance completado al 100% (6/6 historias, 31 puntos)
2. Arquitectura modular limpia basada en el plan del sprint 0
3. Verificación temprana (build + lint + smoke test) que detectó el bug del guard global antes del merge

## ¿Qué salió mal? 

1. La infraestructura de lint del monorepo heredada del sprint 0 estaba rota (config ESLint inválida, falta `eslint-config-prettier`, paths de tsconfig por workspace)
2. El guard JWT global bloqueaba las rutas públicas (`registro`, `login`, `refresh`) — no había decorador `@Public()`
3. `npm install` generó `package-lock.json` sin trackear, requerido por el CI (`npm ci`)

## ¿Qué podemos mejorar? 

1. Validar en el sprint 0 que el pipeline completo (lint, test, build) pase desde el arranque
2. Hacer smoke test de "feliz camino" para rutas públicas y protegidas a medida que se agregan guards
3. Verificar pre-commit que los archivos generados por el tooling queden versionados

## Acciones de mejora

| Acción | Responsable | Fecha límite |
|--------|-------------|--------------|
| Establecer checklist técnico del sprint 0 (pipeline verde) | David | Sprint 2 |
| Agregar specs unitarios para auth.service y users.service | Marcos | Sprint 2 |
| Documentar uso de `@Public()` en guías de seguridad | David | Sprint 2 |

## Felicitaciones / Reconocimientos

- A Marcos por completar todo el alcance de auth/seguridad
- Por la decisión del `@Public()` que mantiene seguras las rutas por defecto

## Notas adicionales

- Fixes de infraestructura incluidos en este sprint: `.eslintrc.json`, config ESLint por app, `--passWithNoTests`, variables ignoradas con `_`.
- Migración Prisma inicial y seed ya estaban en `develop` (sprint 0).