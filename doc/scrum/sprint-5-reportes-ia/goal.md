# Sprint 5 — Reportes + IA

## Meta del Sprint

**Objetivo:** Implementar reportes, asistente IA y base del frontend

**Fecha de inicio:** 2026-08-29
**Fecha de fin:** 2026-09-01 (modo inmersivo, hitos M1–M5)
**Duración:** 2 días corridos

## Resultado Esperado

- Sistema de reportes con exportación CSV
- Audit log completo (acciones sensibles dirigidas)
- Asistente IA funcional (fallback basado en base de conocimiento, con proveedor LLM opcional vía env)
- Proxy IA configurado (credenciales nunca en repo)
- Base de conocimiento para el asistente (tsvector)
- Layout base del frontend con Design System

## Criterios de Aceptación

- [x] Reportes generan datos agregados (solicitudes por estado, convocatorias, evaluaciones + evaluaciones pendientes)
- [x] CSV se exporta correctamente (UTF-8 con BOM para Excel)
- [x] Audit log registra acciones importantes
- [x] Asistente IA responde preguntas sobre becas (acotado al dominio)
- [x] Proxy IA protege credenciales y degrada a fallback sin key
- [x] Layout base del frontend funciona y consume la API

## Participantes

| Rol | Nombre |
|------|--------|
| Product Owner | |
| Scrum Master | David |
| Desarrollador Reportes | José |
| Desarrollador IA | Hamilton |
| Desarrollador Frontend | Yemerson |

## Notas

- Rama: `feature/reportes-ia-frontend` (hitos M1–M5 con commit+CI por hito, merge a `develop` al cierre).
- Sin secretos en el repo: `AI_API_KEY` solo como variable de entorno local; el CI y el smoke usan el fallback.
- La KB y las tablas de auditoría/asistente ya existen en el schema (Sprint 0); se agregan la columna `tsvector` y el seed de conocimiento.