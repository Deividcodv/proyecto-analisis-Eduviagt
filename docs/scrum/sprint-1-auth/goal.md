# Sprint 1 — Auth

## Meta del Sprint

**Objetivo:** Implementar autenticación completa y estructura base de seguridad

**Fecha de inicio:** 2026-08-26
**Fecha de fin:** 2026-08-27
**Duración:** 2 semanas

## Resultado Esperado

- [x] Módulos NestJS configurados (Auth, Users, Common)
- [x] Registro de usuarios funcionando
- [x] Login con JWT operativo
- [x] Endpoints de perfil protegidos
- [x] CRUD de roles implementado

## Criterios de Aceptación

- [x] Registro crea usuario con password hasheado
- [x] Login retorna JWT válido
- [x] Endpoint /profile requiere token válido
- [x] Roles se pueden crear, leer, actualizar y eliminar
- [x] Guards de permisos funcionando

## Participantes

| Rol | Nombre |
|------|--------|
| Product Owner | |
| Scrum Master | David |
| Desarrollador Principal | Marcos |
| Reviewer | David |

## Notas

- Se corrigió un bug encontrado en la revisión: el guard JWT global bloqueaba rutas públicas
  (`registro`, `login`, `refresh`); se agregó el decorador `@Public()`.
- Smoke test manual completo de auth y seguridad aprobado (17 casos).