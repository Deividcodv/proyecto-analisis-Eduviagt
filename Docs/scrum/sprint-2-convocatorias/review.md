# Sprint 2 — Review

## Resumen del Sprint

**Fecha de review:** 2026-08-27
**Participantes:** Héctor (Developer), David (Scrum Master / Reviewer), Marcos (Soporte)

## Lo que se completó

- [x] US-11 — Guard de permisos con Chain of Responsibility (`@Permisos`, `PermissionsGuard`)
- [x] US-12 — Catálogos CRUD con endpoints públicos en `/api/catalogos`
- [x] US-14 — CRUD de convocatorias en `/api/convocatorias`
- [x] US-15 — Máquina de estados de convocatoria (6 estados, transiciones validadas)
- [x] US-16 — Configuración de documentos requeridos por convocatoria
- [x] US-17 — DocumentStorage adapter (filesystem) con protección path-traversal

## Lo que NO se completó

- [ ] US-13 — Opción "otro" en catálogos (queda para Sprint 3 con la capa de solicitudes)

## Demo

**Funcionalidades demostradas:**
1. `GET /api/catalogos/*` públicos (géneros, niveles, departamentos, municipios, documentos-tipo)
2. `POST/PATCH/DELETE` de catálogos protegidos con `@Permisos`
3. CRUD de convocatorias + transiciones de estado (`publicar`, `cerrar`, `reabrir`, ...)
4. `PATCH /api/convocatorias/:id/documentos` para definir documentos requeridos
5. `GET /api/convocatorias` público filtra solo convocatorias `ABIERTA`

**Feedback del Product Owner:**
- Sin feedback pendiente por parte del PO

## Métricas

| Métrica | Valor |
|---------|-------|
| Puntos planificados | 39 |
| Puntos completados | 31 |
| Velocidad | 31 |
| Historias completadas | 6/7 |

## Decisiones tomadas

1. El guard de permisos reemplaza a `@Roles` en los endpoints de seguridad: la cadena evalúa override por usuario (PERMITIR/DENEGAR) → permiso por rol → DENY por defecto.
2. Los listados públicos exponen solo registros `activo: true` y convocatorias en estado `ABIERTA`.
3. Los borrados de catálogos son desactivaciones lógicas (`activo: false`).
4. Los documentos requeridos solo se pueden configurar en estado `BORRADOR`.

## Acciones para el siguiente sprint

1. Consumir catálogos y convocatorias desde la capa de solicitudes (Sprint 3)
2. Integrar el storage adapter con endpoint de upload (Multer) en Sprint 3
3. Implementar opción "otro" (US-13) junto con los perfiles de solicitud

---

## Actualización del equipo (2026)

> Sprint ejecutado en el ciclo de recreación del equipo (repo `Deividcodv/proyecto-analisis-Eduviagt`), tomando como fuente los commits del producto `85122d2` y `986fc89`.

### Recreación S1 — Convocatorias y catálogos (US-11..US-17)

- **US-11** guard de permisos por roles; **US-12** gestión de catálogos (género, nivel académico, departamento, municipio); **US-14** CRUD de convocatorias; **US-15** máquina de estados; **US-16** documentos requeridos por convocatoria; **US-17** storage adapter base.
- **US-13** ("otro" en catálogos) se completó en S3 junto con los perfiles de solicitud.
- **PRs del equipo:** `feature/convocatorias-crud` (#5, `46c2ddd`, merge 2026-09-07); endpoints públicos US-44/45 (#7, `f64b5a7`, 2026-09-10); base de auditoría + interface autenticado (#8, `0e740e1`).
- **S4 — tipos de documento:** soporte de tipos de documento en convocatorias (#18, `22a0ed7`, 2026-09-23).
- **Fechas:** 2026-09-07 → 2026-09-09 · **Review:** 2026-09-09.
- **Participantes:** Marcos (Developer), Héctor (Developer), David (Scrum Master / Reviewer).