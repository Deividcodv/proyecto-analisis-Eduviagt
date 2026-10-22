# 01 · Cómo se trabajará con Scrum

> Este documento explica **qué es Scrum** y **cómo aplicaremos Scrum** en la recreación de SIGEB con las
> 6 personas. No hace falta saber programar todavía: aquí se habla de *proceso y organización*.
> La parte técnica (Git, GitHub, código) está en `02-git-github-conceptos-basicos.md` y
> `05-versiones-asignadas-por-persona.md`.

---

## 1. Qué es Scrum (explicación sencilla)

Scrum es una forma de **trabajar en equipo por partes pequeñas y verificables**.

La idea central:
- El trabajo se divide en **historias** (funciones concretas, por ejemplo "el usuario puede iniciar sesión").
- Se agrupan en **sprints** (períodos cortos: aquí, 1 semana).
- Al final de cada sprint debe haber **algo que funciona y que se puede mostrar**.
- Antes de dar algo por terminado se revisa (lo hace David) con una lista de requisitos llamada
  **Definition of Done** (criterios, ¿cuándo está terminado?).

No usamos Scrum "real" con 3 roles separados: aquí David hace de **Scrum Master + Product Owner**
(y admin de GitHub), y los 5 devs forman el **equipo de desarrollo**.

---

## 2. Roles: quién hace qué

| Persona | Rol Scrum | Rol técnico | Qué hace en la práctica |
|---|---|---|---|
| **David** | Scrum Master / Product Owner (dual) | Full-stack, supervisión | Prepara el sprint (planning), revisa y **aprueba los PRs**, prueba el sistema, resuelve bloqueos, define qué se hace (backlog), protege el código (`master`/`develop`) |
| **Marcos** | Development Team | Backend 1 — Seguridad y Autenticación | Entrega sus PRs de `auth/`, `users/`, `audit/`, `common/` |
| **Héctor** | Development Team | Backend 2 — Convocatorias | Entrega sus PRs de `catalogos/`, `convocatorias/`, `storage/` |
| **José** | Development Team | Backend 3 — Solicitudes y Evaluación | Entrega sus PRs de `solicitudes/`, `evaluaciones/`, `comites/`, `sesiones/`, `decisiones/`, `reportes/` |
| **Yemerson** | Development Team | Frontend 1 — Portal público | Entrega sus PRs del Layout/Design System, páginas públicas y panel admin |
| **Hamilton** | Development Team | Frontend 2 — Sistema interno + IA | Entrega sus PRs de web auth, dashboard, formularios, chat IA y paneles |

Regla de oro: **cada módulo tiene un solo dueño**. Nadie toca el módulo de otro.
(Dónde empieza y termina el módulo de cada uno está en `05-versiones-asignadas-por-persona.md`.)

---

## 3. Ceremonias (reuniones) del sprint

| Ceremonia | Cuándo | Duración | Quién | Qué se logra / salida |
|---|---|---|---|---|
| **Sprint Planning** | Lunes al inicio | 1–2 horas | Todos con David | Elegir las historias del sprint y quién hace cada una. Salida: `doc/scrum/sprint-N/sprint-planning.md` |
| **Daily Standup** | Cada día | 15 minutos | Cada persona | Responder 3 preguntas: ¿qué hice ayer?, ¿qué haré hoy?, ¿tengo algún bloqueo?. Salida: `doc/scrum/sprint-N/daily-log.md` |
| **Sprint Review** | Viernes al cierre | 1 hora | Todos | David prueba y demuestra lo hecho en el sprint. Salida: `doc/scrum/sprint-N/review.md` |
| **Sprint Retrospective** | Viernes después del review | 1 hora | Solo equipo | ¿Qué salió bien, qué mejorar, con qué me quedo? Salida: `doc/scrum/sprint-N/retrospective.md` |

> Todas las salidas (archivos) las prepara/revisa David. El código lo entregan los devs vía PRs.
>
> Para la simulación, los 3 primeros sprints se archivan como `doc/scrum/recreacion-sprint-1-cimientos/`,
> `doc/scrum/recreacion-sprint-2-portal-publico/` y `doc/scrum/recreacion-sprint-3-login-dashboard/`
> (con los mismos archivos: `goal.md`, `backlog.md`, `daily-log.md`, `review.md`, `retrospective.md`).

---

## 4. Artefactos (documentos de trabajo)

| Artefacto | Qué es | Dónde se guarda |
|---|---|---|
| **Product Backlog** | Lista de todas las funcionalidades que debe tener SIGEB. Ya existe | `doc/scrum/product-backlog.md` |
| **Sprint Backlog** | Historias elegidas para este sprint, con puntos y dueño | `doc/scrum/sprint-N/sprint-planning.md` |
| **Incremento** | El código que funciona al terminar el sprint (lo que queda en `develop` tras merges) | Repositorio nuevo, rama `develop` |

### Las historias (US)
Las historias se escriben como *"Como [rol], quiero [acción], para [beneficio]"*.
Ejemplo real de SIGEB:
> US-18: Como postulante, quiero crear una solicitud de beca, para poder postular a una convocatoria.

El backlog de SIGEB tiene **58 historias** (US-1 … US-58). En cada planning, David elige las que
corresponden al tema del sprint (su número de US se indica en `05-versiones-asignadas-por-persona.md`).

---

## 5. Definition of Done (DoD) — la lista para dar algo por terminado

Ningún PR se aprueba si no cumple TODO:

- [ ] El código está en una rama `feature/<modulo>-<descripcion>` (o `hotfix/...`).
- [ ] Solo contiene archivos del módulo del autor (nunca de otros).
- [ ] El mensaje de commit sigue Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`).
- [ ] **La CI está en verde** (lint + tests + build + smoke). Se ve en la pestaña "Checks" del PR.
- [ ] David lo probó localmente y confirmó que funciona.
- [ ] David dio **1 aprobación** y lo mergeó con **squash** a `develop`.
- [ ] La rama feature se eliminó después del merge.
- [ ] Al cierre del sprint, `develop` equivale a la entrega esperada del sprint (verificación de fidelidad por módulo).

> Si una casilla no está marcada, el PR NO se aprueba. Así evitamos que cosas a medias entren al sistema.
>
> **En los primeros 3 sprints (prototipo)**, la "entrega esperada" no es un commit del proyecto original:
> cada persona copia sus módulos desde su **commit fuente** y David crea al cierre del S3 el **hito personalizado
> `v0.1-prototipo-demo`** (tag). La fidelidad se verifica **por módulo** contra el commit fuente (detalles en
> `05-versiones-asignadas-por-persona.md`).

---

## 6. Estimación (puntos Fibonacci) y priorización (MoSCoW)

### Fibonacci — cuánto cuesta cada historia
| Puntos | Significado |
|---|---|
| 1 | Trivial (cambiar un texto) |
| 2 | Simple (endpoint CRUD básico) |
| 3 | Moderada (validaciones y reglas) |
| 5 | Media (módulo con 2-3 endpoints) |
| 8 | Alta (máquina de estados, varias integraciones) |
| 13 | Muy alta → dividir en historias más pequeñas |

### MoSCoW — qué tan importante
| Prioridad | En el sprint |
|---|---|
| **Must** | Obligatorio (~60% del sprint) |
| **Should** | Importante, no bloqueante (~20%) |
| **Could** | Deseable (~15%) |
| **Won't** | No en esta versión (~5%) |

David decide los puntos y la prioridad en el planning. Los métricas del cierre (puntos cumplidos
vs. planificados) se registran en `review.md`.

---

## 7. Calendario de los 6 sprints + estabilización + demo

> Meta de la simulación: **en los primeros 2-3 sprints tener un prototipo semi-funcional (portal público +
> login) para el demo ≈ 16 sep**. Por eso los S1-S2 son más cortos y el S3 cierra el prototipo. Del S4 en
> adelante la cadencia es semanal normal.

| Sprint | Semana | Tema principal | Fuente (de dónde copia su módulo) | Quiénes entregan |
|---|---|---|---|---|
| **S1** | 07–09 sep | Cimientos: monorepo, auth API (JWT, roles, permisos), catálogos/convocatorias backend, CI base | `85122d2`, `28ea376` | Marcos, Héctor, David |
| **S2** | 09–11/12 sep | **Portal público** (US-41..48): layout/Design System, home, convocatorias públicas, detalle, consulta, nosotros, footer | `986fc89` (+ `ab66393` layout) | Yemerson, Héctor, José, David |
| **S3** | 14–16/18 sep | **Login/registro web + dashboard postulante** (US-49/50) → cierre del prototipo (`v0.1-prototipo-demo`) | `3dfa19a` | Hamilton, Marcos, Yemerson, David |
| **S4** | 21–25 sep | Evaluación: evaluadores, puntajes, comités, sesiones, decisiones | `41285d4`, `3cb58e9` | José, Marcos, Hamilton, David |
| **S5** | 28 sep–02 oct | Reportes (CSV), auditoría, asistente IA, paneles admin | `ab66393`, `1436e41`, `2e52a69` | José, Marcos, Hamilton, Yemerson |
| **S6** | 05–16 oct | Sistema interno y paneles completos, constancia PDF, rediseño | `e36ac2c`, `dcba851` | Hamilton, Yemerson, José |
| **Estabilización** | 05–16 oct | Hotfixes de specs, CI y reportes (CI #35-40) | **`a720298` (CI #40)** | David, Marcos, José |

> **Recordatorio:** el objetivo final es que el repositorio nuevo llegue al **estado CI #40 (`a720298`)**,
> es decir, idéntico al proyecto real actual. El **prototipo** (demo ≈ 16 sep) es el primer hito de la
> simulación: presentamos los 3 primeros sprints con portal público + login funcionales; el resto de los
> sprints (S4-S6 + estabilización) completa el sistema hasta el estado final.

---

## 8. Comunicación y reglas de convivencia

1. **No tocar módulos ajenos** — aunque "sea una línea", se coordina con el dueño o con David.
2. **Un dev = una rama a la vez** — trabajo en `feature/*`; nunca en `develop` ni `master`.
3. **Preguntar antes de adivinar** — si una historia no se entiende, se pregunta a David de inmediato.
4. **Bloqueos se reportan en el Daily** — no esperar al viernes.
5. **CI en verde o no se mergea** — es innegociable.
6. **Terminar lo empezado** — una historia pasa a "Hecho" solo al cumplir el DoD completo.

---

## Próximo documento

`02-git-github-conceptos-basicos.md` — instalar todo y aprender el vocabulario de Git/GitHub desde cero.