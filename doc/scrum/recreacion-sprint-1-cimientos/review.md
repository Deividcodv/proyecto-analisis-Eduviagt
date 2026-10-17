# Sprint 1 Recreacion - Review

## Resumen del Sprint

**Fecha de review:** 2026-09-09
**Participantes:** Marcos (Developer), Hector (Developer), David (Scrum Master / Reviewer)

## Lo que se completo

- [x] US-05 - Estructura de modulos NestJS (`auth`, `common`, `users`)
- [x] US-06 - Registro de usuario con validacion de CUI unico
- [x] US-07 - Login JWT con access y refresh tokens
- [x] US-08 - Endpoint de perfil autenticado (`GET /auth/perfil`)
- [x] US-09 - Modulo common: guards globales, decoradores, filtros e interceptores
- [x] US-10 - CRUD de roles con asignacion de permisos
- [x] US-11 - Guard de permisos por roles
- [x] US-12 - Gestion de catalogos (datos maestros)
- [x] US-14 - CRUD de convocatorias
- [x] US-15 - Maquina de estados de convocatorias
- [x] US-16 - Documentos requeridos por convocatoria
- [x] US-17 - Storage adapter base

## Lo que NO se completo

- [x] Nada pendiente - todo el alcance planificado se completo

## Demo

**Funcionalidades demostradas:**
1. Registro de postulante (CUI unico, hash bcrypt)
2. Login JWT y refresh de tokens
3. Perfil autenticado con bearer token
4. CRUD de roles y asignacion de permisos
5. CRUD de catalogos (genero, nivel academico, departamento, municipio)
6. CRUD de convocatorias con maquina de estados y documentos requeridos

**Feedback del Product Owner (David):**
- Base solida para el prototipo: la API queda lista para que el portal publico (S2) y el login (S3) se conecten con datos reales.

## Metricas

| Metrica | Valor |
|---------|-------|
| Puntos planificados | 68 |
| Puntos completados | 68 |
| Velocidad | 68 |
| Historias completadas | 12/12 |

## Decisiones tomadas

1. Para el prototipo, `app.module.ts` registra SOLO los modulos de cimientos (auth, users, common, catalogos, convocatorias, storage, prisma). Los modulos de evaluacion/reportes/asistente/auditoria NO se registran hasta S4-S6.
2. Se mantiene el modelo "commit fuente": los cimientos se verifican por modulo contra `4b0795f` y `85122d2`.
3. El hito personalizado `v0.1-prototipo-demo` se creara al cierre del S3 (cuando exista portal + login).

## Acciones para el siguiente sprint

1. Preparar el CI del prototipo para aceptar el flujo web (smoke con navegacion del portal).
2. Planificar S2 (portal publico): asignar Yemerson (frontend), Hector (endpoints publicos de convocatorias), Jose (consulta publica US-46).
3. Confirmar fechas S2: 09-11/12 sep.