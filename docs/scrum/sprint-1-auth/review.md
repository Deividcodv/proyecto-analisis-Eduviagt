# Sprint 1 — Review

## Resumen del Sprint

**Fecha de review:** 2026-08-27
**Participantes:** Marcos (Developer), David (Scrum Master / Reviewer)

## Lo que se completó

- [x] US-05 — Estructura de módulos NestJS (`auth`, `common`, `users`)
- [x] US-06 — Registro de usuario con validación de CUI único
- [x] US-07 — Login JWT con access y refresh tokens
- [x] US-08 — Endpoint de perfil autenticado (`GET /auth/perfil`)
- [x] US-09 — Módulo common: guards globales, decoradores, filtros e interceptor
- [x] US-10 — CRUD de roles con asignación de permisos

## Lo que NO se completó

- [x] Nada pendiente — todo el alcance planificado se completó

## Demo

**Funcionalidades demostradas:**
1. Registro de postulante (CUI único, hash bcrypt)
2. Login JWT y refresh de tokens
3. Perfil autenticado con bearer token
4. CRUD de roles y asignación de permisos como ADMIN

**Feedback del Product Owner:**
- Sin feedback pendiente por parte del PO

## Métricas

| Métrica | Valor |
|---------|-------|
| Puntos planificados | 31 |
| Puntos completados | 31 |
| Velocidad | 31 |
| Historias completadas | 6/6 |

## Decisiones tomadas

1. Guard JWT global con decorador `@Public()` para rutas públicas
2. Roles por nombre en el guard global de roles (expansible a permisos por entidad en Sprint 2)
3. Validación de CUI: 13 dígitos + unicidad en BD (409 en conflicto)

## Acciones para el siguiente sprint

1. Implementar guard de permisos con Chain of Responsibility (Sprint 2)
2. Considerar tests unitarios/e2e para auth y roles en próximos sprints
3. Revisar cobertura de auditoría sobre endpoints de seguridad