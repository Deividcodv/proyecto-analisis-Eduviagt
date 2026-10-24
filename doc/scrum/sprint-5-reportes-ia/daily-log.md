# Sprint 5 — Daily Log

## Standups

### Día 1 — 2026-08-29

**¿Qué hice ayer?**
- Cierre del Sprint 4: fix de orden en smoke CI (AD-4.1 antes de `enviar`), CI verde en `feature/evaluaciones` y `develop`, docs e infraestructure de repro limpia.

**¿Qué haré hoy?**
- Planificar y aprobar Sprint 5 (goal + backlog, 29 pts US-34..40, hitos M1–M5) y arrancar M1 (reportes), M2 (audit) y M3 (base de conocimiento + asistente fallback).

**Bloqueos:**
- Sin credenciales para IA: el proveedor LLM quedó opcional vía `AI_API_KEY`; por defecto fallback por reglas/KB (también para el CI smoke).
- Igual que S3/S4: `prisma migrate dev` EPERM con la API corriendo; detener antes de la migración de `tsvector`. 

---

### Día 2 — 2026-08-29

**¿Qué hice ayer?**
- M1 reportes (US-34/US-35): `GET /reportes/{solicitudes-por-estado,convocatorias,evaluaciones}` y CSV con BOM UTF-8 + `Content-Disposition: attachment`; interceptor no envuelve respuestas con `headersSent`; smoke ampliado en CI; commit `00c1d21` con CI verde.
- M2 auditoría (US-36): `AuditService.log()` dirigido + `GET /audit` (permiso `auditoria:ver`, seed actualizado); integración en auth (login/refresh con IP desde `@Req`), convocatorias, solicitudes, evaluaciones, sesiones, comités y roles. Build/lint OK, 98 tests verdes; smoke local (login→audit, `GET /audit` admin, 403 postulante, 401 anónimo) OK.

**¿Qué haré hoy?**
- M2: commit `16f724d` (audit + smoke CI + docs) con CI verde `33237704482`; 98 tests verdes.
- M3: migración `tsvector` aplicada (GIN funcional con `to_tsvector('spanish', titulo || ' ' || contenido)`), seed de base de conocimiento (33 entradas, US-37/US-39), `AsistenteIAProxy` + `FallbackProveedor` + `POST /asistente/preguntar` público. Build/lint OK, 100 tests verdes; smoke local OK (requisitos/beca/sin-match/400 con fuentes); commit M3 `0a05250` con CI verde.
- M4 (US-38): `OpenAIProveedor` opcional (API compatible OpenAI) con timeout y degradación automática a fallback en el proxy; contexto por rol en el system prompt; `AI_*` documentados en `.env.example` (nunca versionados). Build/lint OK, 103 tests verdes; smoke local OK (sin key → sigue respondiendo desde KB).
- M5 (US-40): en `apps/web`, Design System (Header/Footer en layout, primitivos `Container`/`Button`/`Card`/`Badge`), paleta SIGEB existente en Tailwind, home con sección "Convocatorias abiertas" reales vía SWR (cliente) y proxy `/api` en `next.config`; corregida la codificación (mojibake) de `layout.tsx`/`page.tsx`. Build + lint OK; smoke local: `/` devuelve HTML y `/api/convocatorias` se proxya a la API (18 abiertas).

**Bloqueos:**
- Sin credenciales para IA: el proveedor LLM quedó opcional vía `AI_API_KEY`; por defecto fallback por reglas/KB (también para el CI smoke).
- PG16: `concat_ws` y `array_to_string` son STABLE, así que `tags` (text[]) no se puede incluir en el índice funcional ni en su expresión; el índice usa solo `||` inmutables. Los tags se filtran por coincidencia exacta en la app. 

---

### Día 3 — [Fecha]

**¿Qué hice ayer?**
- 

**¿Qué haré hoy?**
- 

**Bloqueos:**
- 

---

### Día 4 — [Fecha]

**¿Qué hice ayer?**
- 

**¿Qué haré hoy?**
- 

**Bloqueos:**
- 

---

### Día 5 — [Fecha]

**¿Qué hice ayer?**
- 

**¿Qué haré hoy?**
- 

**Bloqueos:**
- 

---

### Día 6 — [Fecha]

**¿Qué hice ayer?**
- 

**¿Qué haré hoy?**
- 

**Bloqueos:**
- 

---

### Día 7 — [Fecha]

**¿Qué hice ayer?**
- 

**¿Qué haré hoy?**
- 

**Bloqueos:**
- 

---

### Día 8 — [Fecha]

**¿Qué hice ayer?**
- 

**¿Qué haré hoy?**
- 

**Bloqueos:**
- 

---

### Día 9 — [Fecha]

**¿Qué hice ayer?**
- 

**¿Qué haré hoy?**
- 

**Bloqueos:**
- 

---

### Día 10 — [Fecha]

**¿Qué hice ayer?**
- 

**¿Qué haré hoy?**
- 

**Bloqueos:**
- 

