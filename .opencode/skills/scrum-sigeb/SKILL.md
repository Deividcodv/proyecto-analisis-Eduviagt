---
name: scrum-sigeb
description: Gestión del desarrollo de SIGEB bajo reglas de Scrum usando Notion. Consulta y actualiza el Product Backlog (historias US-xxx), Sprint Tracker, eventos Scrum (Planning/Daily/Review/Retro), tareas y equipo. Úsala para llevar el control del proyecto: leer el backlog y sprint activo antes de trabajar, y actualizar estados/eventos al completar trabajo.
---

# Scrum SIGEB (Notion)

Centro de control del desarrollo del proyecto **SIGEB** en Notion en el workspace **David Space**
(integración "acceso"). Sigue las reglas documentadas en la página **GUIDE** de Notion.

## Workflow de estados del Product Backlog

Cada Product Backlog Item (PBI) pasa por estados con transiciones restringidas:

```
New Issues ──► Ice Box ──► Backlog ──► In Progress ──► In Review ──► Done
   │             │             │
   └─────────────┴─────────────┘ (se puede regresar a estados anteriores)
```

- **New Issues** → Ice Box, Backlog, In Progress
- **Ice Box** → New Issues, Backlog
- **Backlog** → New Issues, Ice Box, In Progress
- **In Progress** → Backlog, In Review
- **In Review** → Backlog, In Progress, Done
- **Done** → Backlog, In Review

### Definition of Ready (DoR) y Definition of Done (DoD)
- **DoR**: el PBI tiene título, descripción, criterios de aceptación, puntos y prioridad antes de entrar a un Sprint.
- **DoD**: solo marcar **Done** si la funcionalidad está implementada, probada y conforme a los criterios de aceptación.

Tipos de PBI: `Feature`, `User Stories`, `Technical Work`, `Bug`, `Epic`, `Knowledge Task`.
Prioridades: `Critical Priority`, `High Priority`, `Medium Priority`, `Low Priority`, `Nice to have`.

## Comandos

El script helper lee el token desde `NOTION_TOKEN` o de `~/.config/opencode/notion.token`.

```
pwsh .opencode/skills/scrum-sigeb/scripts/notion.ps1 backlog [-Filtro termino]
pwsh .opencode/skills/scrum-sigeb/scripts/notion.ps1 historia <US-xxx>
pwsh .opencode/skills/scrum-sigeb/scripts/notion.ps1 crear -Titulo "..." [-Tipo Feature] [-Prioridad Medium] [-Puntos 5] [-Descripcion "..."] [-Criterios "..."] [-Responsable david]
pwsh .opencode/skills/scrum-sigeb/scripts/notion.ps1 mover <US-xxx> <In Progress|In Review|Done|...>
pwsh .opencode/skills/scrum-sigeb/scripts/notion.ps1 sprint
pwsh .opencode/skills/scrum-sigeb/scripts/notion.ps1 evento -EventoTipo daily|planning|review|retro [-Observacion "..."] [-Titulo "..."]
pwsh .opencode/skills/scrum-sigeb/scripts/notion.ps1 equipo
pwsh .opencode/skills/scrum-sigeb/scripts/notion.ps1 reglas
```

## Recursos de Notion (IDs)

| Recurso | ID |
|---|---|
| Product Backlog (recreación: US-05..US-58, 46 items) | `08bea44e-4b7e-836f-9521-01d09c33d308` |
| Sprint Tracker (recreación: Sprint 1..6, Sprint 2 = Current) | `12eea44e-4b7e-82aa-ba54-01f0c193c97a` |
| Sprint Plannings | `0b4ea44e-4b7e-8268-8528-01089d254746` |
| Daily Scrums | `d31ea44e-4b7e-83b4-9db3-018dff69e5ce` |
| Sprint Reviews | `e6bea44e-4b7e-8219-b795-01bad1355d6f` |
| Sprint Retrospectives | `179ea44e-4b7e-8311-9e7a-01f41583671b` |
| Tasks | `758ea44e-4b7e-826f-a1b9-81fcae96913a` |
| Team's Members | `ab1ea44e-4b7e-82ce-95c1-01da9745deaf` |
| Team Member Responsibilities | `ef1ea44e-4b7e-8310-b76b-817824f13009` |
| GUIDE (instrucciones) | `ca2ea44e-4b7e-8263-87c5-012cfda0d15d` |
| Definition of Ready | `2dcea44e-4b7e-8338-ad53-01af3a407c9b` |

El sprint activo se detecta automáticamente (sprint con status `Current` y nombre).
Los PBIs se relacionan al sprint mediante la propiedad `Sprint` (relación → Sprint Tracker).

## Cómo usarla en sesión

1. Antes de trabajar: `sprint` para ver el objetivo y items del sprint activo + `backlog` para el backlog pendiente.
2. Al iniciar un item: `mover <US-xxx> "In Progress"`.
3. Al terminar: verificar DoD, luego `mover <US-xxx> "Done"` y opcionalmente `evento` para registrar Daily/Review/Retro.
4. `historia <US-xxx>` para detalle completo (descripción, criterios, puntos, responsable, sprint).