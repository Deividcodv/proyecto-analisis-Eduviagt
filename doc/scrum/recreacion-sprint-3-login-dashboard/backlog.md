# Sprint 3 Recreacion - Backlog

## User Stories Asignadas

| ID | Historia | Prioridad | Puntos | Asignado | Estado |
|----|----------|-----------|--------|----------|--------|
| US-49 | Como usuario quiero Login/Register en el frontend para acceder al sistema | Alta | 5 | Hamilton + Marcos (API) | Hecho |
| US-50 | Como postulante quiero un dashboard para ver el estado de mis solicitudes | Alta | 8 | Hamilton | Hecho |
| (Soporte) | Script npm dev para levantar API + web juntas | Alta | 2 | David | Hecho |
| (Soporte) | Coordinacion CORS/auth-web (sin archivos nuevos; el CORS viaja en el PR de David) | Alta | 2 | Marcos + David | Hecho |
| (Soporte) | UserMenu e integracion del estado de sesion en el header del portal | Media | 3 | Yemerson | Hecho |

**Total de puntos:** 20
**Completados:** 20 / 20

## Tecnicas

- [x] `AuthContext` + `ProtectedRoute` para sesion persistente en el frontend
- [x] `api-auth` / `lib/auth` para refresh de tokens
- [x] Interceptor de la API con desempaquetado de respuestas
- [x] UI del dashboard: perfil + estado de solicitudes
- [x] Script raiz `npm run dev` (commit fuente `890c423`)

## Notas

- El alcance del prototipo NO incluye: formulario multi-step (US-51), gestion de documentos (US-52),
  paneles de evaluador/admin (US-53-55) ni chat IA (US-56): se programan en S5/S6.
- El login se copia del commit fuente `3dfa19a` (web auth + dashboard postulante), excluyendo las paginas
  `admin` y `evaluador`.
- Cierre del sprint: tag `v0.1-prototipo-demo` (hito personalizado) creado por David.