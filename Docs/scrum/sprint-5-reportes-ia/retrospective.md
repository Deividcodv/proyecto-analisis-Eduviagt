# Sprint 5 - Retrospectiva

## Datos del Sprint

**Fecha:** 2026-08-29
**Participantes:** David (SM), José (Reportes), Hamilton (Asistente IA), Yemerson (Frontend)
**Sprint:** 5 - Reportes + IA

## ¿Qué salió bien?

1. Cierre por hitos M1-M5 con commit + CI verde cada uno (patrón consolidado de S4).
2. Hallazgo temprano de la limitación de inmutabilidad de `concat_ws`/`array_to_string` en PG16 se resolvió con una expresión 100% inmutable, evitando bloquear la migración.
3. La decisión de IA con fallback por KB permitió entregar US-37/US-39 sin depender de credenciales externas y verificar todo en CI.
4. El frontend reutilizó la paleta SIGEB existente y conectó datos reales sin duplicar la lógica de la API.

## ¿Qué salió mal?

1. La migración tsvector tuvo que reescribirse (el `tsvector` no se puede generar en columna por estabilidad de funciones).
2. Mojibake heredado en `apps/web/src/app/{layout,page}.tsx` (codificación no UTF-8); se corrigió al reescribir con el Design System.

## ¿Qué podemos mejorar?

1. Validar las funciones SQL usadas en índices/generados antes de escribir la migración.
2. Estandarizar los archivos nuevos a UTF-8 desde el inicio y detectar códigos de reemplazo en el review.
3. Documentar el flujo de "proveedor de IA" en el ADR cuando se activen credenciales de staging.

## Acciones de mejora

| Acción | Responsable | Fecha límite |
|--------|-------------|--------------|
| ADR IA: activar OpenAIProveedor en staging con credenciales | Hamilton | Inicio Sprint 6 |
| Conectar registro/login y postulación del frontend | Yemerson/José | Inicio Sprint 6 |

## Felicitaciones / Reconocimientos

- José por la estabilidad de reportes/CSV con BOM.
- Hamilton por el fallback escalable del asistente y la migración tsvector.
- Yemerson por levantar el Design System en tiempo récord.

## Notas adicionales

- Sprint 5: 29/29 pts, 7/7 historias, CI verde en cada hito (`00c1d21`, `16f724d`, `0a05250`, `dab4fcd`, `bbbcc7c`).