# Retrospectiva — Sprint 9 · Mejoras Transversales

## Qué salió bien

- Agrupar mejoras transversales como **Unplanned Work** permitió organizar el
  entregado sin tocar sprints cerrados ni reescribir historial.
- Un único commit por ronda mantuvo el historial legible y el remoto sincronizado.
- Se preservó la identidad del producto (sin i18n, unión, patrón EDUVIAGT).

## Qué mejorar

- **Macro-commits vs. PRs atómicos:** los bloques se entregaron en commits grandes
  integrados. Para próximos sprints, preferir **PRs/commits atómicos por US** para
  facilitar revisión y blame.
- **Material de colaboración:** el material de recreación/quías entró stageado por
  accidente en rondas previas; se retiró del tracking. Evitar `git add -A` sin
  verificar rutas excluidas (`.opencode/`, `recreacion/`, `opencode.json`).

## Acciones futuras

- Commitear por unidad de funcionalidad (una US = un commit).
- Validar el staged con `git diff --cached --name-only` antes de cada commit.
