# Sprint 2 — Backlog

## User Stories Asignadas

| ID | Historia | Prioridad | Puntos | Asignado | Estado |
|----|----------|-----------|--------|----------|--------|
| US-11 | Como admin quiero un guard de permisos para controlar acceso por roles | Alta | 5 | Héctor | Hecho |
| US-12 | Como admin quiero gestionar catálogos para mantener datos maestros | Alta | 5 | Héctor | Hecho |
| US-13 | Como usuario quiero la opción "otro" en catálogos para valores personalizados | Media | 3 | Héctor | Pendiente |
| US-14 | Como admin quiero CRUD de convocatorias para gestionar becas | Alta | 8 | Héctor | Hecho |
| US-15 | Como admin quiero máquina de estados para controlar flujo de convocatorias | Alta | 8 | Héctor | Hecho |
| US-16 | Como admin quiero definir documentos requeridos por convocatoria | Alta | 5 | Héctor | Hecho |
| US-17 | Como desarrollador quiero un storage adapter para abstraer proveedores de archivos | Media | 5 | Héctor | Hecho |

**Total de puntos:** 39
**Completados:** 31 / 39

## Técnicas

- [x] Implementar patrón State para máquina de estados
- [ ] Crear interceptors para logging
- [x] Implementar DTOs con validación
- [ ] Configurar Multer para uploads

## Notas

- US-13 (opción "otro") queda pendiente: requiere capa de solicitudes (Sprint 3) donde se consumen los catálogos con valores personalizados.
- US-17 se entrega como adapter base (filesystem) sin endpoint de upload; el upload se integra en Sprint 3 (US-22 en adelante).