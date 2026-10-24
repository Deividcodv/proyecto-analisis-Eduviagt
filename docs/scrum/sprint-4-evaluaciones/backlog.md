# Sprint 4 — Backlog

## User Stories Asignadas

| ID | Historia | Prioridad | Puntos | Asignado | Estado |
|----|----------|-----------|--------|----------|--------|
| US-26 | Como evaluador quiero ver mis evaluaciones asignadas para trabajar en ellas | Alta | 5 | José | Hecho (M1) |
| US-27 | Como admin quiero asignar evaluadores para distribuir el trabajo | Alta | 5 | José | Hecho (M1) |
| US-28 | Como evaluador quiero registrar puntajes para evaluar solicitudes | Alta | 8 | José | Hecho (M1) |
| US-29 | Como desarrollador quiero auto-score para calcular puntajes automáticamente | Media | 8 | José | Hecho (M2) |
| US-30 | Como admin quiero gestionar comités para organizar la evaluación | Alta | 5 | José | Hecho (M3) |
| US-31 | Como admin quiero crear sesiones de evaluación para coordinar decisiones | Alta | 5 | José | Hecho (M4) |
| US-32 | Como evaluador quiero votar en sesiones para participar en decisiones | Alta | 5 | José | Hecho (M4) |
| US-33 | Como admin quiero finalizar sesiones para cerrar decisiones | Alta | 3 | José | Hecho (M5) |

**Total de puntos:** 44
**Puntos completados:** 44 (velocidad 44)

## Técnicas

- [x] Implementar patrón Strategy para scoring (auto-score en vuelo ponderado por peso de criterio)
- [x] Crear lógica de votación ponderada (mayoría APROBAR > RECHAZAR, empate → RECHAZADA)
- [ ] Implementar notificaciones de asignación (diferido a Sprint 7, panel de evaluador)
- [ ] Crear reporte de evaluaciones pendientes (diferido a Sprint 5, reportes)

## Add-on (deuda técnica retro Sprint 3)

| ID | Historia | Prioridad | Puntos | Estado |
|----|----------|-----------|--------|--------|
| AD-4.1 | Como admin/coordinador quiero rechazar documentos para que el postulante corrija y el checklist lo refleje | Alta | 0* | Hecho (M5) |

*Sin puntos: incorporado como deuda técnica del Sprint 3 (rechazo de documentos), absorbido por el equipo a velocidad constante. No corresponde a US-34 del product backlog (esa US es el reporte de Sprint 5).

## Notas

- M1: US-26/27/28 · M2: US-29 · M3: US-30 · M4: US-31/32 · M5: US-33 + AD-4.1.
- Commits: `706e7a1` (M1), `adf88fc` (M2), `82d94f5` (M3), `82e75fd` (M4), M5 pendiente de commit al cierre.