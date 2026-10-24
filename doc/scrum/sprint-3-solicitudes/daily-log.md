# Sprint 3 — Daily Log

## Standups

### Día 1 — 2026-08-27

**¿Qué hice ayer?**
- Sprint 2 (convocatorias) cerrado; fix de CI (`.gitignore` ignoraba el módulo `storage/`) en `develop`.

**¿Qué haré hoy?**
- Implementar Sprint 3 completo por hitos (M1–M5) en `feature/solicitudes`:
  - M1: módulo base de solicitudes (US-18 + US-25), seed POSTULANTE.
  - M2: perfiles académico/financiero + US-13 (campos "otro").
  - M3: upload/eliminar documentos con Multer (US-21/US-22) y servido `/storage`.
  - M4: checklist y envío validado (US-23/US-24).
  - M5: CI `feature/*` + smoke en CI y documentación del sprint.

**Bloqueos:** Ninguno.

---

### Día 1 — Cierre de Sprint (2026-08-27)

**¿Qué hice ayer?**
- M1: `solicitudes.module`, state machine + historial, controller/service, seed POSTULANTE. Build + 27 tests + smoke runtime OK. Commit `f2d4a18`.
- M2: DTOs de perfiles, exclusividad `*Id`/`*Otro`, validación de catálogos. Bug detectado en smoke (`assertCatalogosExisten` validaba campos libres como catálogo) y corregido. 33 tests. Commit `ddc36a5`.
- M3: Multer + filtro MIME/tamaño (PDF/JPG/PNG ≤ 5 MB), `POST/DELETE /solicitudes/:id/documentos/:tipoId`, servido estático `/storage`. 36 tests. Commit `78964b2`.
- M4: `GET /solicitudes/:id/checklist` y validación de envío. 40 tests. Smoke end-to-end OK (400 incompleto → completar → ENVIADA). Commit `2c65dc6`.
- M5: CI ampliado a `feature/**` + script de smoke HTTP; documentación del sprint actualizada.

**¿Qué haré hoy?**
- Verificación final (lint/build/test + repro Docker Linux), merge a `develop` y vigilar CI.

**Bloqueos:** Ninguno. 

