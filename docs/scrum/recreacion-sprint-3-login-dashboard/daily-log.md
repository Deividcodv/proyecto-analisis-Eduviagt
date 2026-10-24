# Sprint 3 Recreacion - Daily Log

## Standups

### Dia 1 - 2026-09-14

**Que hice ayer?**
- (Cierre de S2) Portal publico listo: convocatorias publicas, detalle, consulta, nosotros, footer.

**Que hare hoy?**
- Hamilton: rama `feature/web-login`; `AuthContext`, `ProtectedRoute`, pagina de login/registro conectada a `/auth/login` y `/auth/register`.
- Marcos: rama `feature/auth-web`; coordinacion del CORS y de la expiracion/refresh que usara el login web (el CORS se aplica en `main.ts`, PR de David).
- David: script raiz `npm run dev`.

**Bloqueos:**
- Ninguno

---

### Dia 2 - 2026-09-15

**Que hice ayer?**
- Hamilton: login/registro funcional con sesion persistente y `api-auth`/`lib/auth` (refresh).
- Marcos: coordinacion de auth/CORS cerrada (sin archivos nuevos); el CORS queda en `main.ts` del PR de David.
- David: `npm run dev` operativo (API :3000 + web :3001).

**Que hare hoy?**
- Hamilton: dashboard del postulante (US-50): perfil + estado de solicitudes.
- Yemerson: UserMenu en el header del portal (sesion / logout).
- David: probar el flujo completo registro -> login -> dashboard.

**Bloqueos:**
- Ninguno

---

### Dia 3 - 2026-09-16 (demo)

**Que hice ayer?**
- Hamilton: dashboard listo (perfil + estado de solicitudes).
- Yemerson: UserMenu integrado y logout correcto.
- David: flujo completo verificado en local y en CI.

**Que hare hoy?**
- David: aprobar PRs (squash), correr CI final del prototipo.
- Crear el tag `v0.1-prototipo-demo` (hito personalizado): portal publico + login + dashboard, sin evaluacion/reportes/asistente/auditoria.
- Guion del demo ≈ 16 sep y ensayo.

**Bloqueos:**
- Ninguno