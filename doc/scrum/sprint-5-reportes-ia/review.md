# Sprint 5 - Review

## Resumen del Sprint

**Fecha de review:** 2026-08-29
**Participantes:** David (SM), José (Reportes), Hamilton (Asistente IA), Yemerson (Frontend)

## Lo que se completó

- [x] Reportes de resumen y exportación CSV para el admin (US-34, US-35)
- [x] Auditoría dirigida con GET /audit paginado (US-36)
- [x] Asistente IA con respuestas acotadas desde la KB tsvector (US-37, US-39)
- [x] AsistenteIAProxy con contexto por rol y LLM opcional con degradación (US-38)
- [x] Layout base + Design System + Tailwind + home real contra la API (US-40)

## Lo que NO se completó

- [x] Nada: las 7 historias del sprint cerraron dentro del hito planificado.

## Demo

**Funcionalidades demostradas:**
1. GET /reportes/{…} + CSV con BOM (Excel)
2. GET /audit (admin) y rastro de login/transiciones/votos
3. POST /asistente/preguntar (público) con fuentes de la KB
4. Web en :3001 con header/footer, home y convocatorias abiertas vía SWR + proxy /api

**Feedback del Product Owner:**
- Registrar factura en el ADR de IA (fallback por defecto hasta contar con credenciales).

## Métricas

| Métrica | Valor |
|---------|-------|
| Puntos planificados | 29 |
| Puntos completados | 29 |
| Velocidad | 29 |
| Historias completadas | 7/7 |

## Decisiones tomadas

1. IA por fallback KB por defecto; LLM opcional vía `AI_API_KEY`/`AI_BASE_URL` (nunca en repo/CI).
2. Índice tsvector solo con operadores inmutables (`titulo || contenido`); los `tags` no se indexan (cast text[]→text no es inmutable en PG16).
3. El proxy del frontend usa `next.config` rewrites (`/api` → API) con `NEXT_PUBLIC_API_URL` apuntando a mismo origen.

## Acciones para el siguiente sprint

1. Conectar flujos de frontend a la API (registro/login, postulación).
2. Al tener credenciales de IA, activar el `OpenAIProveedor` en staging y validar acotación de respuestas.