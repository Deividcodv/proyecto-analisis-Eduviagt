# Sprint 1 Recreacion - Cimientos

## Meta del Sprint

**Objetivo:** Sentar los cimientos del prototipo: monorepo base, API de autenticacion (JWT/roles), catalagos/convocatorias en backend y CI en verde, para que los sprints 2 y 3 solo agregen capas visuales y de usuario.

**Fecha de inicio:** 2026-09-07
**Fecha de fin:** 2026-09-09
**Duracion:** 3 dias

## Resultado Esperado

- [x] Monorepo NestJS/Next.js/Prisma/Docker preparado (Sprint 0)
- [x] API `auth/`, `users/`, `common/` funcionando (cimientos de seguridad)
- [x] API `catalogos/`, `convocatorias/`, `storage/` funcionando (base del dominio de becas)
- [x] CI base en verde (lint + tests + build + smoke del prototipo)
- [x] `prisma/schema.prisma` + migraciones con los modelos del prototipo

## Criterios de Aceptacion

- [x] Registro crea usuario con password hasheado y CUI unico
- [x] Login retorna JWT (access + refresh) valido
- [x] Endpoint `/auth/perfil` requiere token valido
- [x] CRUD de roles con asignacion de permisos (guard por roles)
- [x] CRUD de catalagos (genero, nivel academico, departamento, municipio)
- [x] CRUD de convocatorias con maquina de estados y documentos requeridos
- [x] CI pasa lint, tests, build y smoke

## Participantes

| Rol | Nombre |
|------|--------|
| Product Owner | David |
| Scrum Master | David |
| Desarrollador Principal | Marcos (auth), Hector (convocatorias) |

## Notas

- Los cimientos se copian de los commits fuente `4b0795f` (auth/seguridad) y `85122d2` (catalogos/convocatorias/storage).
- El portal publico y el login se construyen sobre estos cimientos en los sprints 2 y 3 (meta: demo ≈ 16 sep).
- Se mantiene el modelo de "hito personalizado": al cierre del S3, David crea el tag `v0.1-prototipo-demo`.