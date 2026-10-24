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

