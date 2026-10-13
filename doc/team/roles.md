# Roles y Responsabilidades — SIGEB

---

## Roles Scrum

### Scrum Master

**Asignado:** David

| Responsabilidad | Descripción |
|---|---|
| Facilitar ceremonias | Sprint Planning, Daily, Review, Retrospective |
| Remover bloqueos | Identificar y resolver impedimentos del equipo |
| Proteger al equipo | Evitar cambios de alcance durante el sprint |
| Mejorar procesos | Proponer ajustes en retrospectiva |
| Code Review | Aprobar PRs antes del merge a develop |

### Product Owner (simulado)

**Asignado:** David (dual role en esta simulación)

| Responsabilidad | Descripción |
|---|---|
| Priorizar backlog | Decidir qué historias se trabajan en cada sprint |
| Definir criterios de aceptación | Asegurar que cada historia sea verificable |
| Representar al usuario | Tomar decisiones de negocio basadas en el README |
| Aceptar entregables | Validar que lo construido cumple el alcance |

### Development Team

**Asignados:** Marcos, Héctor, José, Yemerson, Hamilton

| Responsabilidad | Descripción |
|---|---|
| Estimar historias | Asignar puntos de Fibonacci a cada historia |
| Implementar | Escribir código, tests, documentación técnica |
| Auto-organizarse | Distribuir trabajo sin dependencia del Scrum Master |
| Hacer Definition of Done | Asegurar que cada historia cumple los criterios |
| Participar en review | Demostrar el trabajo completado al equipo |

---

## Definition of Done (DoD)

Una historia de usuario está "lista" cuando:

- [ ] Código implementado y funcionando
- [ ] Tests unitarios escritos y pasando
- [ ] Tests de integración escritos y pasando (si aplica)
- [ ] Code review aprobado por al menos 1 persona
- [ ] Sin errores de lint
- [ ] Sin errores de TypeScript
- [ ] Documentación técnica actualizada (si aplica)
- [ ] Merge a `develop` sin conflictos
- [ ] Feature branch eliminado después del merge

---

## Reglas de branching

| Regla | Detalle |
|---|---|
| `master` protegido | Nunca se hace push directo; solo recibe merge desde `develop` o `hotfix/*` |
| `develop` | Rama de integración; recibe merge desde `feature/*` vía PR |
| `feature/*` | Se crea desde `develop`; se mergea de vuelta vía PR |
| Naming | `feature/<modulo>-<descripcion>` (ej. `feature/auth-login`) |
| Commits | Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:` |
| PR mínimo | Descripción + cambios + tests + checklist |
| Squash merge | Para historial limpio en develop |

---

## Ceremonias Scrum

| Ceremonia | Frecuencia | Duración | Participantes | Salida |
|---|---|---|---|---|
| **Sprint Planning** | Inicio de sprint | 2 horas | Todos | `sprint-backlog.md` |
| **Daily Standup** | Diario | 15 min | Cada persona | `daily-log.md` |
| **Sprint Review** | Fin de sprint | 1 hora | Todos + stakeholders | `review.md` + demo |
| **Sprint Retrospective** | Fin de sprint | 1 hora | Solo equipo | `retrospective.md` |
| **Backlog Refinement** | Mitad de sprint | 1 hora | SM + devs | Historias refinadas |

---

## Escala de estimación (Fibonacci)

| Puntos | Complejidad | Ejemplo |
|---|---|---|
| **1** | Trivial | Cambiar un texto, agregar un campo |
| **2** | Simple | Endpoint CRUD básico sin lógica compleja |
| **3** | Moderada | Endpoint con validaciones y un par de reglas |
| **5** | Media | Módulo completo con 2-3 endpoints y lógica |
| **8** | Alta | Módulo con máquina de estados o múltiples integraciones |
| **13** | Muy alta | Dividir en sub-historias o refinar más |

---

## Priorización MoSCoW

| Prioridad | Significado | Porcentaje del sprint |
|---|---|---|
| **Must** | Obligatorio para esta versión | ~60% |
| **Should** | Importante pero no bloqueante | ~20% |
| **Could** | Deseable si hay tiempo | ~15% |
| **Won't** | No esta versión (backlog futuro) | ~5% |

---

*Última actualización: 2026-08-26*
