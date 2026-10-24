# Sprint 4 — Review

## Resumen del Sprint

**Fecha de review:** 2026-08-28
**Participantes:** José (Dev), David (Scrum Master)

## Lo que se completó

- [x] US-26/27/28 Módulo `evaluaciones`: `GET /evaluaciones/mias`, `POST /solicitudes/:id/evaluadores`, `PUT /solicitudes/:id/criterios/:criterioId` (puntajes 0–100, criterios activos de la beca; asignación solo admin y en `EN_REVISION`)
- [x] US-29 Auto-score en vuelo: `GET /solicitudes/:id/score` con ponderación por `criterio.peso` y bloqueo hasta tener todos los criterios
- [x] US-30 Módulo `comites` (CRUD + miembros, listado con `_count`)
- [x] US-31/32 Módulo `sesiones`: creación con agenda (solo `EVALUADA` de una misma convocatoria) y votos (`voto:crear`; un voto por miembro por solicitud; comité con miembros activos)
- [x] US-33 `POST /sesiones/:id/finalizar`: quórum, decisión por mayoría, transición de solicitudes + historial y convocatoria → `RESUELTA`
- [x] AD-4.1 Add-on rechazo de documentos: `PATCH /solicitudes/:id/documentos/:tipoId/estado` (permiso `documento:editar`), checklist con `RECHAZADO` como pendiente y re-upload que lo completa
- [x] Seed autocorregible de permisos por rol (prune `notIn`) + usuarios demo evaluador/coordinador/miembro y criterios de la beca 2

## Lo que NO se completó

- [ ] Notificaciones de asignación de evaluadores (diferido a Sprint 7, panel evaluador)
- [ ] Reporte de evaluaciones pendientes (cae en Sprint 5, reportes)
- [ ] Auto-score persistido en BD (decisión: cálculo en vuelo, sin migración)

## Demo

**Funcionalidades demostradas (smokes por hito):**
1. Evaluador 1 ve sus solicitudes con criterios y registra puntajes; miembro solo ve (403 de edición).
2. Score = 0.4·socioeconómica + 0.6·trayectoria, p.ej. 79/100; bloqueado si algún criterio está sin puntuar.
3. CRUD de comités y alta de miembros con rol (PRESIDENTE/VOCAL/SECRETARIO).
4. Sesión con agenda de `EVALUADA`; voto único; sprint3→OK.
5. Finalizar: sin quórum → 400; quórum → decisiones APROBADA/RECHAZADA, solicitudes y convocatoria → `RESUELTA`.
6. Rechazo de documento: coordinador → `RECHAZADO`; checklist incompleto blquea `enviar`; postulante re-subir → `CARGADO` y checklist completo; postulante no puede rechazar (403).

**Feedback del Product Owner:**
- Flujo completo de evaluación cumplido; pendiente bajarlo al panel del evaluador (Sprint 7).

## Métricas

| Métrica | Valor |
|---------|-------|
| Puntos planificados | 44 |
| Puntos completados | 44 |
| Velocidad | 44 |
| Historias completadas | 8/8 (US-26..33) + 1 add-on (AD-4.1) |

## Decisiones tomadas

1. Auto-score en vuelo, sin migración de columna de score (calculado al consultar `GET /solicitudes/:id/score`).
2. Asignación de evaluadores: solo admin y solicitud en `EN_REVISION`.
3. Voto de comité: un registro por (sesión, solicitud, miembro); decisión por mayoría `APROBAR > RECHAZAR` (ABSTENCION no suma; empate → `RECHAZADA`).
4. Finalizar exige quórum `quorumMinimo ?? 1` votantes y solo solicitudes `EVALUADA`; la convocatoria pasa a `RESUELTA` cuando no quedan `EVALUADA`.
5. Rechazo de documentos sobre la última versión del tipo; el checklist cuenta solo `CARGADO`.

## Acciones para el siguiente sprint

1. Panel de evaluador en frontend consumiendo `/evaluaciones/mias` y otros endpoints de evaluación (Sprint 7).
2. Crear reporte de evaluaciones pendientes con auto-score (Sprint 5).