# Sprint 1 Recreacion - Retrospectiva

## Datos del Sprint

**Fecha:** 2026-09-09
**Participantes:** Marcos (Developer), Hector (Developer), David (Scrum Master / Reviewer)
**Sprint:** 1 - Cimientos

## Que salio bien?

1. Alcance completado al 100% (12/12 historias, 68 puntos)
2. Base monorepo lista desde el dia 1, sin deudas de infraestructura
3. Se decidio a tiempo que el prototipo NO incluye evaluacion/reportes/asistente, evitando trabajo extra

## Que salio mal?

1. El `app.module.ts` se actualizo tarde en el sprint (se acumularon cambios de modulos sin registrar)
2. La CI del prototipo se definio despues de los primeros PRs (se ajusto a ultimo momento el smoke)
3. El seed inicial de catalogos se hizo manual en lugar de aprovechar el seed del origen

## Que podemos mejorar?

1. Definir el `app.module.ts` del prototipo al inicio del sprint (lista explicita de modulos)
2. Configurar la CI base del prototipo antes del primer merge de codigo
3. Reutilizar el seed de `sigeb-prod` adaptado al prototipo para datos de demo

## Acciones de mejora

| Accion | Responsable | Fecha limite |
|--------|-------------|--------------|
| Definir lista de modulos del prototipo en `app.module.ts` antes del primer PR | David | Sprint 2 |
| Configurar CI base del prototipo (smoke de portal) antes del primer merge de S2 | David | Sprint 2 |
| Preparar seed de datos de demo (catalogos + una convocatoria activa) | David | Sprint 2 |

## Felicitaciones / Reconocimientos

- A Marcos y Hector por entregar sus modulos completos y con smoke manual
- Por la decision de mantener el prototipo limpio (sin evaluacion/reportes/asistente)

## Notas adicionales

- Los cimientos equivalen a los commits fuente `4b0795f` (auth) + `85122d2` (convocatorias).
- Sprint 2 (portal publico) arranca con la API lista para datos reales.