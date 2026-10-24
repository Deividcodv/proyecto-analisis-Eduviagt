# Sprint 4 — Daily Log

> Sprint ejecutado en modo inmersivo (2 días) por hitos M1–M5 en `feature/evaluaciones`.

## Standups

### Día 1 — 2026-08-27

**¿Qué hice ayer?**
- Cierre del Sprint 3 (review cronológica). Se definió el add-on de rechazo de documentos para Sprint 4.

**¿Qué haré hoy?**
- Planificación del Sprint 4: goal, backlog (44 pts), aprobar alcance (US-26..33 + AD-4.1 rechazo de documentos).

**Bloqueos:**
- Ninguno.

---

### Día 2 — 2026-08-28

**¿Qué hice ayer?**
- Sprint 4 planificado y aprobado; rama `feature/evaluaciones` creada y pusheada.

**¿Qué haré hoy?**
- M1..M5 por hitos con commit+CI: evaluaciones, auto-score, comités, sesiones/votos, finalización + rechazo de documentos.

**Bloqueos:**
- `gh` sin autenticar y GitHub API sin rate-limit: la validación CI se hace pusheando la rama.
- `npx prisma migrate dev` falla (EPERM) con el servidor corriendo (DLL `query_engine` bloqueada): detener API antes de migrar/generar.

---

### Detalle de hitos (mismo día)

**M1 (~07:00)**
- Hecho: módulo `evaluaciones` (mis evaluaciones, asignar evaluadores, registrar puntajes 0–100), seed de permisos + usuarios demo + criterios beca 2. 53 tests. Smoke M1 OK.
- Bloqueo: al editar seed en caliente, el guard de permisos era de codigo basado en emanaciones de `rol.permisos` cacheados por el token; requería re-login. Resuelto reutilizando tokens por usuario.

**M2 (~08:20)**
- Hecho: `GET /solicitudes/:id/score` ponderado en vuelo. 57 tests. Smoke M2 OK (score 79).

**M3 (~09:15)**
- Hecho: CRUD de comités y miembros (con `_count`). 69 tests. Smoke M3 OK.

**M4 (~10:10)**
- Hecho: migración `sesion_agenda` (modelo `SesionAgenda`), sesiones + agenda (solo `EVALUADA` misma convocatoria), votos con voto único; fix `MIEMBRO_COMITE` e seed autocorregible. 80 tests. Smoke M4 OK.
- Bloqueo: `prisma migrate dev` EPERM por DLL del servidor en uso → detener PID antes de migrar (quedó como procedimiento estándar).

**M5 (~11:30)**
- Hecho (en progreso al cierre del log): `finalizarSesion` (quórum, mayoría, decisiones + historial, convocatoria → `RESUELTA`), `PATCH` de estado de documentos (`RECHAZADO`, permiso `documento:editar`) y checklist con `RECHAZADO` como pendiente.
- Bloqueo inicial de smoke: duplicados por creador "una solicitud por usuario por convocatoria"; se corrigió reutilizando solicitudes `EVALUADA` existentes y llevando la convocatoria a `EN_EVALUACION` antes de finalizar.

---

### Día 2 (cierre) — 2026-08-29

**SMOKE CI Roto** · run `33225017714` (job `99026815717`, paso 11) en `feature/evaluaciones` falló **después** de pushear `d0326a3`.
- Diagnóstico: los logs del job requieren admin (403) y el HTML del run no trae logs → se **reprodujó localmente** montando una BD fresca (`sigeb_test`) con la API en el puerto 3001 (`sigeb-postgres`).
- **Causa raíz**: en `smoke-ci.sh` el bloque AD-4.1 (rechazo/re-subir) corría **después** de `enviar`; como `subirDocumento` solo permite editar en `BORRADOR` (`obtainEditable`), el re-subir daba 400 y el checklist quedaba incompleto → smoke en rojo. No era bug de la app: sobre BD fresca se validó de punta a punta (rechazo → checklist pendiente → enviar 400 → re-subir → checklist completo → enviar → ENVIADA → evaluación → sesión → decisión APROBADA → conv `RESUELTA`).
- Fix: `a545849` reordena AD-4.1 **antes** de `enviar` (con assert `enviar`→400 tras el rechazo) y parametriza `BASE_URL` en `smoke-ci.sh`. CI verde (`33226288439`).
- Integración: merge `--no-ff` a `develop` (`41285d4`) con CI verde (`33226405596`). **Sprint 4 completado y desplegado en `develop`.**

---