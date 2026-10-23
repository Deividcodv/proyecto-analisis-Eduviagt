# Sprint 3 — Retrospectiva

## Datos del Sprint

**Fecha:** 2026-08-27
**Participantes:** José (Dev), David (Scrum Master), Héctor (Soporte)
**Sprint:** 3 — Solicitudes

## ¿Qué salió bien? 

1. Commits por hito (M1–M5) en `feature/solicitudes`, uno por historia agrupada; historial limpio y CI por rama.
2. Smoke test de runtime ANTES de cada commit: destapó bugs que los unit tests no cubren (validación de campos "otro" en catálogos, verificaciones de estado).
3. Los specs unitarios (state machine + service) crecieron con cada hito (27 → 40 tests) sin fricción.

## ¿Qué salió mal? 

1. El smoke de M2 dio un falso negativo de exclusividad: el script envió `generoId: null` (no hay conflicto con null) y se corrigió con la verificación real luego.
2. El `-Form` de PowerShell no mapeó el MIME al subir archivos; hubo que usar `curl.exe` con `;type=`.
3. El CI no cubría ramas `feature/*`, así que los errores de build solo se veían al mergar; se corrigió en M5.

## ¿Qué podemos mejorar? 

1. Validar en local también con el binario de la plataforma esperada (Linux/Docker) antes de confiar en que CI lo detectará.
2. Los scripts de smoke deben asertar el código HTTP de forma explícita (no ramas catch ambiguas).

## Acciones de mejora

| Acción | Responsable | Fecha límite |
|--------|-------------|--------------|
| CI en `feature/*` con smoke HTTP | José | 2026-09-03 |
| Smoke CI cubre flujo de documentos y envío validado | José | 2026-09-03 |
| Repro Linux Docker como paso estándar de verificación de commits | David | 2026-09-10 |

## Felicitaciones / Reconocimientos

- Smoke en CI integrado al flujo de solicitudes (retroacción de Sprint 2 aplicada).
- US-13 implementada dentro de los perfiles sin duplicar lógica de catálogos.

## Notas adicionales

- Pedido ténico para Sprint 4: definición del rechazo de documentos y su efecto en el checklist.

