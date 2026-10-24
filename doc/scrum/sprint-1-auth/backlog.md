# Sprint 1 — Backlog

## User Stories Asignadas

| ID | Historia | Prioridad | Puntos | Asignado | Estado |
|----|----------|-----------|--------|----------|--------|
| US-05 | Como desarrollador quiero crear módulos NestJS base para tener la arquitectura modular | Alta | 5 | Marcos | Completado |
| US-06 | Como usuario quiero registrarme para tener una cuenta en el sistema | Alta | 5 | Marcos | Completado |
| US-07 | Como usuario quiero iniciar sesión para acceder al sistema | Alta | 8 | Marcos | Completado |
| US-08 | Como usuario autenticado quiero ver mi perfil para verificar mis datos | Alta | 3 | Marcos | Completado |
| US-09 | Como desarrollador quiero crear módulo common para tener utilidades compartidas | Media | 5 | Marcos | Completado |
| US-10 | Como admin quiero gestionar roles para asignar permisos | Media | 5 | Marcos | Completado |

**Total de puntos:** 31

## Técnicas

- [x] Configurar Passport + JWT Strategy
- [x] Implementar bcrypt para hashes
- [x] Crear decoradores personalizados
- [x] Configurar validación con class-validator

## Notas

- Módulos creados: `auth`, `common`, `users` + `prisma` (previo)
- Guards globales (`JwtAuthGuard`, `RolesGuard`) con decorador `@Public()` para rutas públicas
- Endpoints verificados con smoke test (build + lint + curl)
- Fixes de infraestructura: `.eslintrc` (JSON), config eslint por app, `--passWithNoTests`