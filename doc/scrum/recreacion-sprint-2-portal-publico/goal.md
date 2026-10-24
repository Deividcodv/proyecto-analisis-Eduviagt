# Sprint 2 Recreacion - Portal Publico

## Meta del Sprint

**Objetivo:** Entregar el **portal publico** navegable sobre la API de cimientos: layout/Design System, home, convocatorias publicas con filtros, detalle de convocatoria, consulta de beca (US-46), nosotros y footer. Es el primer entregable visual del prototipo (50% del demo).

**Fecha de inicio:** 2026-09-09
**Fecha de fin:** 2026-09-11 (margen sabado 12)
**Duracion:** 3 dias

## Resultado Esperado

- [x] Layout base + Design System (`styles/`, `components/` base) y home conectada al API (US-40)
- [x] Convocatorias publicas con filtro de busqueda (US-44) consumiendo `GET /convocatorias?busqueda=`
- [x] Detalle de convocatoria publica (US-45) con `GET /convocatorias/:id` publico
- [x] Consulta de beca por codigo (US-46) con `GET /solicitudes/consulta/:codigo` (endpoint publico + pagina)
- [x] Paginas institucionales: sobre SIGEB (US-42), como funciona (US-43), nosotros (US-47) y footer (US-48)
- [x] Endpoints publicos de convocatorias y consulta verificados por modulo contra `986fc89`

## Criterios de Aceptacion

- [x] Un visitante puede ver la home y navegar las paginas publicas
- [x] Un visitante puede listar convocatorias y filtrar por texto
- [x] Un visitante puede ver el detalle de una convocatoria
- [x] Un postulante puede consultar el estado de su beca con un codigo
- [x] La consulta publica NO expone datos sensibles (respuesta acotada) y tiene tests
- [x] El smoke del portal pasa en CI

## Participantes

| Rol | Nombre |
|------|--------|
| Product Owner | David |
| Scrum Master | David |
| Desarrollador Principal | Yemerson (frontend portal) |
| Backend | Hector (convocatorias publicas), Jose (consulta publica US-46) |

## Notas

- Se toma el portal del commit fuente `986fc89` (paginas y componentes) y el layout base de `ab66393`.
- El alcance NO incluye panel admin ni login: eso es del Sprint 3 y del 5 en adelante.
- Consulta de beca (US-46) se asigna a Jose en el backend (endpoint publico) y a Yemerson en la pagina.