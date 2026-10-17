# Sprint 3 Recreacion - Review

## Resumen del Sprint

**Fecha de review:** 2026-09-16
**Participantes:** Hamilton (Developer), Marcos (Developer), Yemerson (Developer), David (Scrum Master / Reviewer)

## Lo que se completo

- [x] US-49 - Login/registro web conectado al backend (AuthContext, ProtectedRoute, api-auth)
- [x] US-50 - Dashboard del postulante (perfil + estado de solicitudes)
- [x] Script `npm run dev` para API + web juntas
- [x] Coordinacion CORS/auth para el flujo web (el CORS lo aplica David en `main.ts`; Marcos coordina expiracion/refresh)
- [x] UserMenu e integracion de sesion en el header del portal
- [x] Tag `v0.1-prototipo-demo` (hito personalizado) creado al cierre

## Lo que NO se completo

- [x] Nada pendiente dentro del alcance del prototipo (multi-step, paneles, chat IA se programan para S5-S6)

## Demo

**Funcionalidades demostradas (demo ≈ 16 sep, 3 sprints simulados):**
1. Portal publico: home, convocatorias con filtro, detalle de convocatoria, consulta de beca, nosotros, footer
2. Registro de postulante (CUI unico)
3. Login con sesion persistente (refresh de tokens)
4. Dashboard del postulante: perfil + estado de solicitudes
5. Cierre de sesion -> vuelve al portal publico

**Feedback del Product Owner (David):**
- Prototipo semi-funcional cumplido: el demo muestra portal publico + login con datos reales de la API.
- Aprobado para presentar el 16 sep; la simulacion queda en "3 sprints avanzados".

## Metricas

| Metrica | Valor |
|---------|-------|
| Puntos planificados | 20 |
| Puntos completados | 20 |
| Velocidad | 20 |
| Historias completadas | 5/5 |

## Decisiones tomadas

1. Se crea el tag `v0.1-prototipo-demo` con solo los modulos del prototipo (sin evaluaciones/ sesiones/
   comites/ decisiones/ reportes/ asistente/ audit ni paneles admin/evaluador).
2. El `app.module.ts` del prototipo registra: Prisma, Common, Storage, Auth, Users, Catalogos, Convocatorias,
   Solicitudes (solo consulta). Verificado que los modulos excluidos no estan registrados.
3. Verificacion por modulo: web auth y dashboard contra `3dfa19a`; ajustes de auth contra `3dfa19a`; portal
   contra `986fc89`; cimientos contra `4b0795f` y `85122d2`.

## Acciones para el siguiente sprint

1. Continuar a S4 (evaluacion: evaluadores, puntajes, comites, sesiones, decisiones) con fuentes `41285d4` y `3cb58e9`.
2. Mantener el tag `v0.1-prototipo-demo` como referencia del demo; los sprints siguientes avanzan al estado final `a720298`.