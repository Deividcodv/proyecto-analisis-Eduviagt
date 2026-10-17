# Índice de documentos — Recreación de SIGEB (6 personas)

> Lee estos documentos **en este orden**. Todo está escrito para personas que parten de **cero**
> (sin conocimientos previos de código, Git, GitHub ni Scrum). Cada documento asume que ya hiciste
> lo que explica el anterior.

---

## Mapa de lectura

| Orden | Documento | Contenido | Para quién |
|---|---|---|---|
| 1 | `01-scrum-como-trabajamos.md` | Qué es Scrum, quién hace qué, ceremonias, artefactos, Definition of Done y el calendario de los 6 sprints | Todos |
| 2 | `02-git-github-conceptos-basicos.md` | Qué son Git y GitHub, instalación desde cero en Windows, vocabulario mínimo y primeros comandos | Todos |
| 3 | `05-versiones-asignadas-por-persona.md` | La versión de código exacta que le toca a cada persona, de dónde descargarla y cómo | Todos |
| 4 | `04-pr-paso-a-paso-por-persona.md` | Cómo cada persona crea su rama, sube su código y abre su Pull Request paso a paso | Cada persona |
| 5 | `03-github-david-aprobar-pr.md` | Cómo David revisa, prueba, aprueba y mergea los PRs, y cómo verifica que todo quede fiel al proyecto original | Solo David |
| 6 | `guia-recreacion-6-personas.md` | Resumen general de toda la simulación (este sí se lee completo al final) | Todos |

---

## Datos clave de referencia (los usas en casi todos los documentos)

| Dato | Valor |
|---|---|
| Repositorio de referencia (tiene el código original) | `https://github.com/Deividcodv/sigeb-prod.git` (alias: `sigeb-prod`) |
| Repositorio del equipo (donde trabajamos y subimos los PRs) | `https://github.com/Deividcodv/proyecto-analisis-Sigeb.git` (repo real, público) |
| **Código local listo por persona y sprint** | **`recreacion/sprint-N/<miembro>/`** (espejo `repo/` + `modulos/` + `README.md` por persona, ya descargado) |
| **Estado final = CI #40 = commit `a720298`** | Es la versión a la que debe llegar el repositorio nuevo al cierre (16 oct) |
| **Prototipo (demo ≈ 16 sep)** | **Hito personalizado `v0.1-prototipo-demo`** (tag en el repo del equipo): portal público + login funcionales en los primeros 3 sprints |
| Commits fuente (de dónde copia cada persona su módulo) | `85122d2` (auth + catálogos/convocatorias), `28ea376` (storage), `986fc89` (portal público + endpoints públicos + consulta US-46), `3dfa19a` (login/registro + dashboard postulante), `ab66393` (layout base + reportes/asistente/auditoría), `1436e41` (panel admin), `2e52a69`/`dcba851`/`e36ac2c` (sistema interno) |
| Rama de integración | `develop` |
| Rama de producción | `master` (protegida) |
| Ramas de trabajo | `feature/<modulo>-<descripcion>` |
| Ramas de arreglos | `hotfix/<descripcion>` |

### Los 6 sprints + demo del prototipo

| Sprint | Fechas | Fuente / hito | Tema |
|---|---|---|---|
| S1 | 07–09 sep | `85122d2`, `28ea376` | Cimientos: monorepo, auth API (JWT/roles), catálogos/convocatorias backend, CI base |
| S2 | 09–11/12 sep | `986fc89` (+ `ab66393` layout) | **Portal público** (US-41..48): layout/Design System, home, convocatorias públicas + filtros, convocatoria individual, consulta de beca, nosotros, footer |
| S3 | 14–16/18 sep | `3dfa19a` → tag `v0.1-prototipo-demo` | **Login/registro web + dashboard postulante + sesión persistente** (US-49/50). Cierre del prototipo: **demo ≈ 16 sep** |
| S4 | 21–25 sep | `41285d4`, `3cb58e9` | Evaluación: evaluadores, puntajes, comités, sesiones, decisiones |
| S5 | 28 sep–02 oct | `ab66393`, `1436e41`, `2e52a69` | Reportes (CSV), auditoría, asistente IA, paneles admin |
| S6 | 05–16 oct | `e36ac2c`, `dcba851` | Sistema interno completo, constancia PDF, rediseño + estabilización → **`a720298` (CI #40)** |

> **Demo del prototipo (meta para el 16 sep):** al cierre del S3 presentamos los **3 primeros sprints**:
> portal público navegable + login/registro funcional + dashboard del postulante, montados sobre datos reales
> de la API (auth y convocatorias). El resto (evaluación, reportes, sistema interno) se completa del S4 al S6.

---

## Terminología rápida (glosario)

- **Repo / repositorio**: carpeta del proyecto con todo su historial de cambios, guardada en GitHub.
- **Clone / clonar**: copiar el repositorio a tu computadora.
- **Branch / rama**: versión paralela del código donde trabajas sin afectar la principal.
- **Commit**: guardar un cambio con un mensaje describiendo qué hiciste.
- **Push**: subir tus commits al repositorio en GitHub.
- **Pull / pull request**: "Pull" = descargar cambios de GitHub a tu PC. "Pull Request (PR)" = pedir que revisen y mezclen tus cambios.
- **Merge**: mezclar una rama con otra.
- **CI**: "Continuous Integration" — un programa que corre automáticamente cuando haces un PR para verificar que el código funciona.
- **`recreacion/`**: carpeta del proyecto (en el repo `sigeb-prod`, clon de referencia) que contiene, separado por `sprint-N/` y por miembro, el **código exacto** que cada persona sube en su PR (`repo/` = espejo de rutas listo para copiar, `modulos/` = lo esencial, `README.md` = instrucciones). Es la forma rápida de obtener "tu versión" del sprint.

*Detalle completo de cada concepto en `02-git-github-conceptos-basicos.md`.*