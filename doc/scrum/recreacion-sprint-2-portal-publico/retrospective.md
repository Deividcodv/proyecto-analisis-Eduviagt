# Sprint 2 Recreacion - Retrospectiva

## Datos del Sprint

**Fecha:** 2026-09-11
**Participantes:** Yemerson (Developer), Hector (Developer), Jose (Developer), David (Scrum Master / Reviewer)
**Sprint:** 2 - Portal publico

## Que salio bien?

1. Portal publico completo con datos reales en 3 dias
2. Division clara: Yemerson (web), Hector (convocatorias publicas), Jose (consulta) sin pisarse
3. Consulta publica con respuesta acotada (sin datos sensibles) ya validada con tests

## Que salio mal?

1. El seed de demo (solicitud de ejemplo) se necesito a mitad del sprint para probar US-46; se improviso
2. El responsive y los empty states quedaron "aceptables pero mejorables" y se pospusieron a S3
3. El smoke del portal se ajusto durante el sprint (se recordaba de S1 la misma leccion)

## Que podemos mejorar?

1. Dejar el seed de demo definido en el planning (nunca improvisar datos para probar una historia)
2. Incluir responsive/empty states como criterios de aceptacion explicitos cuando la UI lo amerite
3. Fijar el smoke del portal en el arranque del sprint (accion heredada de S1, no repetir)

## Acciones de mejora

| Accion | Responsable | Fecha limite |
|--------|-------------|--------------|
| Planificar seed de demo en el planning de cada sprint donde se pruebe consulta/flujo | David | Sprint 3 |
| Calendarizar pulido responsive + empty states dentro del alcance de S3/US-50 | Yemerson | Sprint 3 |
| No mergear una historia de UI sin su smoke de paginas correspondiente | David | Sprint 3 |

## Felicitaciones / Reconocimientos

- A Yemerson por el portal completo y limpio en 3 dias
- A Hector y Jose por los endpoints publicos verificados fieles a `986fc89`

## Notas adicionales

- El sprint cierra con el 50% del prototipo listo (portal publico). Falta el login (S3) para el hito `v0.1-prototipo-demo`.