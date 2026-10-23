# Sprint 2 — Convocatorias

## Meta del Sprint

**Objetivo:** Implementar catálogos y convocatorias con máquina de estados

**Fecha de inicio:** 2026-08-27
**Fecha de fin:** 2026-08-27
**Duración:** 2 semanas

## Resultado Esperado

- Catálogos CRUD funcionando (estados, tipos, categorías)
- CRUD de convocatorias completo
- Máquina de estados para convocatorias
- Gestión de documentos requeridos
- Storage adapter para archivos

## Criterios de Aceptación

- [x] Catálogos se pueden crear, editar y eliminar
- [x] Convocatorias siguen flujo de estados (Borrador → Publicada → Cerrada → Evaluación → Resuelta → Archivada)
- [x] Se pueden asignar documentos requeridos a convocatorias
- [x] Storage adapter funciona (filesystem) con interface para otros proveedores
- [x] Guard de permisos restringe acceso por roles (Chain of Responsibility)

## Participantes

| Rol | Nombre |
|------|--------|
| Product Owner | |
| Scrum Master | David |
| Desarrollador Principal | Héctor |
| Soporte | Marcos |

## Notas

- US-13 (opción "otro" en catálogos) queda pendiente, se implementará en Sprint 3 junto con la capa de solicitudes.