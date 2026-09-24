# Sprint 6 — Retrospectiva

## Datos del Sprint

**Fecha:** 2026-08-31
**Participantes:** Yemerson (Developer), Hamilton (Soporte), David (Scrum Master)
**Sprint:** 6 — Portal Público

## ¿Qué salió bien? 

1. Reutilización del Design System existente (Button, Card, Badge) en las nuevas páginas.
2. Descubrimiento temprano del gap: `Beca` no tenía campos de nivel/departamento, lo que evitó una migración innecesaria.
3. El endpoint de consulta pública se diseñó acotado (sin datos sensibles) desde el inicio, cumpliendo seguridad por defecto.
4. Los 2 tests nuevos de la consulta pública validan tanto el caso feliz como el 404.

## ¿Qué salió mal? 

1. Docker Desktop no disponible en el entorno, impidió el smoke test HTTP local contra Postgres.
2. Manejo de encoding en archivos con acentos: la herramienta de edición corrompió un carácter al reescribir el spec de solicitudes (se resolvió restaurando y aplicando cambios por PowerShell preservando bytes).
3. Los tests `.rejects.toThrow(NotFoundException)` con referencia de clase dieron problemas con ts-jest; se resolvió usando matcher de mensaje.

## ¿Qué podemos mejorar? 

1. Documentar la convención de encoding (UTF-8 sin BOM) para los archivos fuente y evitar corrupciones futuras.
2. Para futuros test de excepciones específicas de NestJS, preferir matcher por mensaje cuando la referencia de clase cause problemas.
3. Mantener Postgres/Docker disponibles para validar endpoints públicos antes de cerrar el sprint.

## Acciones de mejora

| Acción | Responsable | Fecha límite |
|--------|-------------|--------------|
| Documentar convención de encoding UTF-8 en `/doc/standards` | David | Inicio S7 |
| Ejecutar smoke test HTTP de los endpoints públicos cuando Docker esté disponible | Yemerson | Fin S7 M1 |
| Evaluar migración para agregar nivel/departamento a `Beca` si el Product Owner lo requiere | Héctor | Planning S7 |

## Felicitaciones / Reconocimientos

- A Yemerson por completar las 8 historias del portal público con SSR y componentes reutilizables.

## Notas adicionales

- El alcance del Sprint 6 (35 pts según backlog) se completó, aunque parte del Hero/Sobre/Cómo funcionaba ya existía del Sprint 5; el alcance efectivo nuevo fue ~20 pts.
