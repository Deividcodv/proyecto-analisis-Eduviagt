# Sprint 6 — Review

## Resumen del Sprint

**Fecha de review:** 2026-08-31
**Participantes:** Yemerson (Developer principal), Hamilton (Soporte), David (Scrum Master / Reviewer)

## Lo que se completó

- [x] US-41 — Hero con "Oportunidades que transforman vidas" (ya existía en home)
- [x] US-42 — Sección "Sobre SIGEB" en home
- [x] US-43 — Sección "Cómo funciona" con 6 pasos en home
- [x] US-44 — Página `/convocatorias` con filtros y listado de convocatorias
- [x] US-45 — Página `/convocatorias/[id]` con detalle, documentos y criterios
- [x] US-46 — Página `/consulta` con consulta de estado de beca por código
- [x] US-47 — Página `/nosotros` con misión, visión, objetivos, programas y contacto
- [x] US-48 — Footer completo con navegación SPA (migrado a `<Link>`)

## Lo que NO se completó

- [x] Lazy loading de imágenes (diferido; relevante con assets reales en Sprint 7)

## Demo

**Funcionalidades demostradas:**
1. Listado público de convocatorias con filtro por búsqueda de texto y tipo de beca
2. Detalle de convocatoria con documentos requeridos y criterios de evaluación
3. Consulta pública del estado de una solicitud por código (endpoint nuevo)
4. Página institucional "Nosotros"
5. Menú hamburguesa responsive para mobile

**Feedback del Product Owner:**
- Sin feedback pendiente por parte del PO

## Métricas

| Métrica | Valor |
|---------|-------|
| Puntos planificados | 35 |
| Puntos completados | 35 |
| Velocidad | 20 (alcance propio del sprint) |
| Historias completadas | 8/8 |

## Decisiones tomadas

1. Filtro de convocatorias por **búsqueda de texto** (nombre convocatoria/beca) en lugar de nivel/departamento, porque el modelo `Beca` no posee campos de nivel/departamento (estos viven en el perfil académico del postulante, no en las convocatorias).
2. Endpoint de consulta pública **acotado**: no expone datos sensibles del postulante (sin usuario, documentos ni perfiles), solo estado, convocatoria, beca e historial.
3. Nuevos componentes UI (`Input`, `Select`, `Spinner`, `EmptyState`) reutilizables para el resto de sprints.

## Acciones para el siguiente sprint

1. Enlazar autenticación real en `/login` y `/registro` (Sprint 7)
2. Botón "Postularme" del detalle debe crear la solicitud cuando el usuario esté autenticado
3. Lazy loading de imágenes cuando se integren assets de convocatorias
