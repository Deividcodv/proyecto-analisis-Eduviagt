# Sprint 3 — Review

## Resumen del Sprint

**Fecha de review:** 2026-08-27
**Participantes:** José (Dev), David (Scrum Master), Héctor (Soporte)

## Lo que se completó

- [x] US-18 Creación de solicitudes (BORRADOR) y US-25 máquina de estados con historial
- [x] US-19/20 Perfil académico (con US-13 "otro") y financiero
- [x] US-21/22 Upload, quitar y reemplazar documentos (PDF/JPG/PNG ≤ 5 MB)
- [x] US-23 Checklist de completitud (perfiles + documentos requeridos)
- [x] US-24 Envío validado (bloquea si falta algún requisito)
- [x] CI en ramas `feature/*` + smoke test HTTP en CI (Sprint 3)

## Lo que NO se completó

- [ ] Nada del alcance pendiente; los 8 US del backlog están Hecho (47 pts)

## Demo

**Funcionalidades demostradas:**
1. Crear solicitud contra convocatoria ABIERTA → BORRADOR (duplicado 400).
2. Guardar perfiles con opción "otro" (US-13) y exclusividad `*Id`/`*Otro`.
3. Subir/eliminar/reemplazar documentos y serving estático en `/storage`.
4. Checklist que refleja faltantes y `enviar` rechazado con detalle hasta completar.
5. Transiciones completas con historial, ownership (403) y `correccionesCount` en correcciones.

**Feedback del Product Owner:**
- Flujo cumplido según backlog; validar en el portal (Sprint 7) cuando se integre el formulario multi-step.

## Métricas

| Métrica | Valor |
|---------|-------|
| Puntos planificados | 47 |
| Puntos completados | 47 |
| Velocidad | 47 |
| Historias completadas | 8/8 |

## Decisiones tomadas

1. Documentos se versionan por carga (nueva fila `version+1` por tipo); el checklist usa la versión más reciente.
2. Completitud académica mínima: género (y nivel académico) definidos; financiera: ingreso familiar.
3. `enviar` reutiliza el checklist para validar; administrador puede transicionar sin validación de completitud.

## Acciones para el siguiente sprint

1. Consumir los endpoints de solicitudes desde el portal postulante (Sprint 7).
2. Definir flujo de RECHAZO de documentos por el comité (estado `DocumentoEstado`). 

---

## Actualización del equipo (2026)

> Estado real del módulo de solicitudes en el repo del equipo (`Deividcodv/proyecto-analisis-Eduviagt`).

### Estado actual (US-18..US-25)

- **Módulo de solicitudes (US-18..US-25):** llega al repo del equipo vía PR `feat(solicitudes)` (#10, `a3932ae`, 2026-09-11): creación y máquina de estados con historial, perfiles académico/financiero con "otro" (US-13), carga/eliminación de documentos (Multer, PDF/JPG/PNG ≤ 5 MB, `/storage`), checklist de completitud y envío validado.
- **S4 — rechazo de documentos:** `PATCH /solicitudes/:id/documentos/:tipoId/estado` (permiso `documento:editar`), checklist con `RECHAZADO` como pendiente y re-upload que lo completa (PR #19, `c97daba`, 2026-09-23).
- **Integración con evaluación:** las solicitudes en `EN_REVISION`/`EVALUADA` alimentan evaluadores, criterios y sesiones (ver sprint-4).
- **Participantes:** José (Dev), David (Scrum Master), Héctor (Soporte). 

