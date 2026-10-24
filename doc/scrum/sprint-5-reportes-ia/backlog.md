# Sprint 5 — Backlog

## User Stories Asignadas

Estimaciones alineadas al product-backlog. Total: **29 puntos** (S4 medía 44 → el equipo sostiene ~40+ pts por sprint; el IA se implementa con fallback para no depender de credenciales).

| ID | Historia | Prioridad | Puntos | Asignado | Hito | Estado |
|----|----------|-----------|--------|----------|------|--------|
| US-34 | Como admin, quiero generar reportes de resumen (solicitudes por estado, convocatorias, evaluaciones) para tener visibilidad | Should | 5 | José | M1 | Completo |
| US-35 | Como admin, quiero exportar reportes a CSV para analizar en Excel | Should | 3 | José | M1 | Completo |
| US-36 | Como admin, quiero un AuditLog de acciones sensibles para trazabilidad | Must | 3 | José | M2 | Completo |
| US-37 | Como visitante, quiero preguntar al asistente IA y recibir respuestas acotadas para obtener información sin cuenta | Should | 5 | Hamilton | M3 | Completo |
| US-38 | Como dev, quiero un `AsistenteIAProxy` que resuelva contexto según sesión y rol para controlar qué ve la IA | Should | 5 | Hamilton | M4 | Completo |
| US-39 | Como dev, quiero una base de conocimiento indexada con `tsvector` para que el asistente busque respuestas | Should | 3 | Hamilton | M3 | Completo |
| US-40 | Como dev, quiero el Layout base + Design System + Tailwind + paleta de colores para empezar el frontend | Must | 5 | Yemerson | M5 | Completo |

**Total de puntos:** 29

## Desglose por hitos

- **M1 (US-34, US-35):** módulo `reportes` — `GET /reportes/solicitudes-por-estado`, `GET /reportes/convocatorias`, `GET /reportes/evaluaciones` (incluye evaluaciones pendientes, pendiente review S4), `GET /reportes/:tipo/csv` (UTF-8 BOM); permiso `reporte:ver` + solo ADMIN.
- **M2 (US-36):** `AuditService.log()` dirigido (auth, transiciones, documentos, evaluadores, votos, finalizar sesión, comités/sesiones, roles/permisos) + `GET /audit` admin paginado con filtros.
- **M3 (US-39, US-37):** migración `tsvector` (columna generada + GIN), seed de base de conocimiento (~30-60 entradas), `AsistenteIAProxy` + `FallbackProveedor`, `POST /asistente/preguntar` público con persistencia de conversación/mensajes.
- **M4 (US-38):** `OpenAIProveedor` opcional vía `AI_API_KEY`/`AI_BASE_URL`, timeouts y degradación a fallback; contexto por sesión/rol; key nunca en el cliente.
- **M5 (US-40):** Design System en `apps/web` (tokens, primitivos UI, RootLayout) + home con fetch real a `/api` (SWR en cliente, proxy en `next.config`).

## Técnicas

- [x] Prisma `groupBy`/agregados para reportes; `csv` por streaming con BOM.
- [x] Modelos `audit_log`, `asistente_base_conocimiento`, `asistente_conversacion`, `asistente_mensaje` ya modelados (Sprint 0).
- [ ] Columna generada `tsvector` + índice GIN (migración raw SQL).
- [ ] Tokens de diseño (colores SIGEB, tipografía, espaciado, radios, sombras) en Tailwind.

## Notas

- Sin credenciales de IA en repo/CI: el fallback por reglas/KB es el proveedor por defecto y cubre el smoke.
- La rama con CI se valida por hito (patrón S4); el smoke de CI se amplía a "Sprints 3-5 (API)".
