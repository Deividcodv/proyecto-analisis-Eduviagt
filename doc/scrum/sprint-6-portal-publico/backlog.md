# Sprint 6 — Backlog

## User Stories Asignadas

| ID | Historia | Prioridad | Puntos | Asignado | Estado |
|----|----------|-----------|--------|----------|--------|
| US-41 | Como visitante quiero ver un Hero atractivo para entender SIGEB | Alta | 3 | Yemerson | Completado |
| US-42 | Como visitante quiero ver "Sobre SIGEB" para conocer el sistema | Alta | 3 | Yemerson | Completado |
| US-43 | Como visitante quiero ver "Cómo funciona" para entender el flujo | Alta | 5 | Yemerson | Completado |
| US-44 | Como visitante quiero ver convocatorias con filtros para encontrar becas | Alta | 8 | Yemerson | Completado |
| US-45 | Como visitante quiero ver detalle de convocatoria para informarme | Alta | 5 | Yemerson | Completado |
| US-46 | Como postulante quiero consultar mi beca para ver su estado | Alta | 5 | Yemerson | Completado |
| US-47 | Como visitante quiero ver "Nosotros" para conocer al equipo | Media | 3 | Yemerson | Completado |
| US-48 | Como visitante quiero un Footer completo para navegar fácilmente | Media | 3 | Yemerson | Completado |

**Total de puntos:** 35

## Técnicas

- [x] Implementar SSR para SEO
- [x] Crear componentes reutilizables del Design System
- [ ] Implementar lazy loading de imágenes
- [x] Configurar meta tags para redes sociales

## Notas

- Nuevo endpoint público `GET /solicitudes/consulta/:codigo` (US-46) con respuesta acotada (sin datos sensibles del postulante) y 2 tests.
- Filtro de convocatorias por búsqueda de texto (`GET /convocatorias?busqueda=`).
- 4 páginas nuevas en `apps/web`: `/convocatorias`, `/convocatorias/[id]`, `/consulta`, `/nosotros`.
- Nuevos componentes UI: `Input`, `Select`, `Spinner`, `EmptyState`; menú mobile (`MobileMenu`) y `ConvocatoriaCard`.
- Footer migrado de `<a>` a `<Link>` de Next.js.
