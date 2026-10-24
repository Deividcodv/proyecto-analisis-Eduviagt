# Sprint 4 — Retrospectiva

## Datos del Sprint

**Fecha:** 2026-08-28
**Participantes:** José (Dev), David (Scrum Master)
**Sprint:** 4 — Evaluaciones

## ¿Qué salió bien? 

1. Commits por hito con smoke de runtime antes de cada commit; el smoke M5 destapó que `finalizarSesion` solo resuelve la convocatoria desde `EN_EVALUACION` (flujo correcto del state machine, no un bug), evitando un falso diagnóstico.
2. El seed autocorregible (poda `notIn`) eliminó el sobre-grant de `MIEMBRO_COMITE` (recibía `sesion:crear`) y centralizó el mapeo rol→permisos en un solo lugar.
3. Uso de solicitudes `EVALUADA` existentes para el smoke M5 en vez de re-crear el escenario completo: redujo los pasos y la superficie de fallo.
4. El add-on AD-4.1 (rechazo de documentos) se integró sin tocar la migración: solo DTO + endpoint + permiso + checklist existente.

## ¿Qué salió mal? 

1. Primeros intentos del smoke M5 re-creaban solicitudes por convocatoria y chocaron con la regla "una solicitud por usuario por convocatoria", generando falso 400 de duplicados y lecturas confusas del fallo.
2. El check del smoke usó `GET /solicitudes` (lista) buscando `convocatoriaId` que no expone; se corrigió usando el GET individual.
3. Al validar la convocatoria RESUELTA se asumía que estar en `EN_EVALUACION` era el estado base; faltó cerrar la convocatoria e iniciar evaluación en el escenario de prueba.
4. Hint de infraestructura: dos procesos `node` viejos (npx) sembraban dudas sobre qué servidor respondía; se confirmó por CommandLine que solo `dist/main` servía la API.

## ¿Qué podemos mejorar? 

1. Los smokes deben reutilizar datos/solicitudes existentes en vez de reconstruir el flujo completo (evita colisiones del dominio real).
2. Antes de asumir bug, verificar la máquina de estados y el estado previo del dato (el flujo ABIERTA→CERRADA→EN_EVALUACION es obligatorio para `resolver`).
3. Explorar un script de "reset de smoke" (eliminar convos/solicitudes/sesiones de prueba) para dejar la BD local fuera de la acumulación de runs.

## Acciones de mejora

| Acción | Responsable | Fecha límite |
|--------|-------------|--------------|
| Reutilizar solicitudes existentes en los smokes (patrón smoke-m5-finalizar.ps1) | José | 2026-09-10 |
| Script de limpieza de datos de smoke en la DB local | José | 2026-09-10 |
| Smoke CI del Sprint 4 (flujo evaluación + sesiones + rechazo de docs) | José | 2026-08-31 |

## Felicitaciones / Reconocimientos

- Add-on de retro (AD-4.1 rechazo de documentos) entregado dentro del sprint, sin inflar puntos.
- El auto-score en vuelo se implementó sin migración, manteniendo la velocidad.

## Notas adicionales

- Pendiente para Sprint 5: consumir autonónomo de `/score` en reportes y audit de decisiones.