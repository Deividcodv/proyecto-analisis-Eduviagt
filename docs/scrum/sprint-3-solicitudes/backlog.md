# Sprint 3 — Backlog

## User Stories Asignadas

| ID | Historia | Prioridad | Puntos | Asignado | Estado |
|----|----------|-----------|--------|----------|--------|
| US-18 | Como postulante quiero crear una solicitud para postular a una beca | Alta | 8 | José | Hecho |
| US-19 | Como postulante quiero registrar mi perfil académico para sustentar mi solicitud | Alta | 5 | José | Hecho |
| US-20 | Como postulante quiero registrar mi perfil financiero para demostrar necesidad | Alta | 5 | José | Hecho |
| US-21 | Como postulante quiero subir documentos para respaldar mi solicitud | Alta | 8 | José | Hecho |
| US-22 | Como postulante quiero quitar o reemplazar documentos para corregir errores | Media | 5 | José | Hecho |
| US-23 | Como postulante quiero ver un checklist para saber qué documentos faltan | Alta | 3 | José | Hecho |
| US-24 | Como postulante quiero enviar mi solicitud para que sea evaluada | Alta | 5 | José | Hecho |
| US-25 | Como desarrollador quiero máquina de estados para controlar flujo de solicitudes | Alta | 8 | José | Hecho |

**Total de puntos:** 47

## Técnicas

- [x] Implementar transiciones de estado para solicitudes
- [x] Crear endpoint de upload con Multer
- [x] Implementar validación de checklist dinámico
- [x] Crear DTOs de perfil académico y financiero

## Notas

- US-13 (opción "otro" en géneros/niveles/departamentos/municipios) se implementó dentro de los perfiles de solicitud: los campos `*Id` y `*Otro` son mutuamente excluyentes a nivel de DTO y servicio.
- El endpoint de checklist es `GET /api/solicitudes/:id/checklist`; devuelve completitud de perfiles, estado de documentos requeridos y pendientes.
- La transición `enviar` valida el checklist y devuelve 400 con el detalle si falta algún requisito.
- Seed: roles POSTULANTE con permisos `solicitud:crear/editar/ver` y `documento:crear/ver/eliminar`; usuario demo `postulante@demo.gt` / `Admin123!`.

