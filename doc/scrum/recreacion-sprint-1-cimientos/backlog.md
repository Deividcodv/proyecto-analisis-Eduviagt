# Sprint 1 Recreacion - Backlog

## User Stories Asignadas

| ID | Historia | Prioridad | Puntos | Asignado | Estado |
|----|----------|-----------|--------|----------|--------|
| US-05 | Como dev quiero estructura base de modulos NestJS (auth, common, users) | Alta | 3 | Marcos | Hecho |
| US-06 | Como postulante quiero registrarme con CUI unico y password seguro | Alta | 5 | Marcos | Hecho |
| US-07 | Como usuario quiero login JWT (access + refresh) para autenticarme | Alta | 8 | Marcos | Hecho |
| US-08 | Como usuario autenticado quiero ver mi perfil | Media | 3 | Marcos | Hecho |
| US-09 | Como dev quiero guards, decoradores, filtros e interceptores en common | Alta | 8 | Marcos | Hecho |
| US-10 | Como admin quiero CRUD de roles con asignacion de permisos | Alta | 5 | Marcos | Hecho |
| US-11 | Como admin quiero un guard de permisos por roles | Alta | 5 | Marcos | Hecho |
| US-12 | Como admin quiero gestionar catalogos (datos maestros) | Alta | 5 | Hector | Hecho |
| US-14 | Como admin quiero CRUD de convocatorias | Alta | 8 | Hector | Hecho |
| US-15 | Como admin quiero maquina de estados para el flujo de convocatorias | Alta | 8 | Hector | Hecho |
| US-16 | Como admin quiero definir documentos requeridos por convocatoria | Alta | 5 | Hector | Hecho |
| US-17 | Como dev quiero un storage adapter para archivos | Media | 5 | Hector | Hecho |

**Total de puntos:** 68
**Completados:** 68 / 68

## Tecnicas

- [x] Guard JWT global con decorador `@Public()` para rutas publicas
- [x] Patron State para la maquina de estados de convocatorias
- [x] Migraciones Prisma iniciales (usuarios, roles, permisions, catalogos, convocatorias)
- [x] CI base del prototipo (sin modulos de evaluacion/reportes/asistente)

## Notas

- El alcance de este sprint equivale a los commits fuente `4b0795f` (auth) + `85122d2` (convocatorias).
- Las historias US-13, US-18..30 (solicitudes) se programan para sprints posteriores; no entran al prototipo.
- `app.module.ts` registra solo los modulos del prototipo (auth, users, common, catalogos, convocatorias, storage, prisma).