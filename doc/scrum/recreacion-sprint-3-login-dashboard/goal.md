# Sprint 3 Recreacion - Login y Dashboard

## Meta del Sprint

**Objetivo:** Completar el prototipo semi-funcional para el demo ≈ 16 sep: **login/registro web** conectado a la API de auth (sesion persistente) y **dashboard del postulante** (US-49/50). En el cierre, David crea el **hito personalizado `v0.1-prototipo-demo`** (portal publico + login + dashboard).

**Fecha de inicio:** 2026-09-14
**Fecha de fin:** 2026-09-16 (demo el 16)
**Duracion:** 3 dias

## Resultado Esperado

- [x] Login web conectado al backend (US-49) con `AuthContext`, `ProtectedRoute`, `UserMenu`
- [x] Registro web (CUI unico, validaciones) conectado al backend
- [x] Sesion persistente (access + refresh) manejada en el frontend
- [x] Dashboard del postulante (US-50): perfil y estado de solicitudes
- [x] Script `npm run dev` para levantar API + web juntas
- [x] CORS y ajustes de auth habilitando el flujo web
- [x] Tag `v0.1-prototipo-demo` creado al cierre del sprint

## Criterios de Aceptacion

- [x] Un postulante se registra, inicia sesion y quedan en una sesion persistente
- [x] Rutas protegidas redirigen al login si no hay sesion
- [x] El dashboard del postulante muestra su perfil y el estado de sus solicitudes
- [x] Cerrar sesion devuelve al usuario al portal publico
- [x] El prototipo se puede demostrar con la API y la web corriendo con `npm run dev`
- [x] Verificacion por modulo: web auth contra `3dfa19a`; ajustes de auth contra `3dfa19a`

## Participantes

| Rol | Nombre |
|------|--------|
| Product Owner | David |
| Scrum Master | David |
| Desarrollador Principal | Hamilton (login, dashboard) |
| Backend | Marcos (ajustes de auth web) |
| Frontend | Yemerson (UserMenu / integracion del header) |

## Notas

- Alcance del prototipo: portal publico + login/registro + dashboard. NO incluye panel admin ni evaluador ni sistema interno multi-step (van en S5/S6).
- Al cierre: David crea el tag `v0.1-prototipo-demo` (hito personalizado) en `sigeb-equipo`.