# Sprint 2 Recreacion - Backlog

## User Stories Asignadas

| ID | Historia | Prioridad | Puntos | Asignado | Estado |
|----|----------|-----------|--------|----------|--------|
| US-40 | Como dev quiero layout base y Design System para construir paginas consistentes | Alta | 5 | Yemerson | Hecho |
| US-41 | Como visitante quiero ver un Hero atractivo para entender SIGEB | Alta | 3 | Yemerson | Hecho |
| US-42 | Como visitante quiero ver "Sobre SIGEB" para conocer el sistema | Alta | 3 | Yemerson | Hecho |
| US-43 | Como visitante quiero ver "Como funciona" para entender el flujo | Alta | 5 | Yemerson | Hecho |
| US-44 | Como visitante quiero ver convocatorias con filtros para encontrar becas | Alta | 8 | Yemerson + Hector (API) | Hecho |
| US-45 | Como visitante quiero ver detalle de convocatoria para informarme | Alta | 5 | Yemerson + Hector (API) | Hecho |
| US-46 | Como postulante quiero consultar mi beca para ver su estado | Alta | 5 | Jose (API) + Yemerson (pagina) | Hecho |
| US-47 | Como visitante quiero ver "Nosotros" para conocer al equipo | Media | 3 | Yemerson | Hecho |
| US-48 | Como visitante quiero un Footer completo para navegar facilmente | Media | 3 | Yemerson | Hecho |

**Total de puntos:** 40
**Completados:** 40 / 40

## Tecnicas

- [x] `GET /convocatorias` publico con `?busqueda=` (filtro por texto) - fuente `986fc89`
- [x] `GET /convocatorias/:id` publico - fuente `986fc89`
- [x] `GET /solicitudes/consulta/:codigo` publico, respuesta acotada (sin datos sensibles) - fuente `986fc89`
- [x] SSR para SEO en paginas publicas
- [x] Footer migrado a `<Link>` de Next.js

## Notas

- Los endpoints publicos se verifican por modulo contra `986fc89`.
- El layout base se toma de `ab66393`; las paginas y componentes del portal de `986fc89`.
- Jose copia el modulo `solicitudes/` **completo** por fidelidad con `986fc89` (`git diff` vacio); en S2 solo
  la consulta publica (US-46) es funcional. El saldo funcional del modulo se completa en S6 (sistema interno).