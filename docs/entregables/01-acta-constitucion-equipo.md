# Acta de Constitución del Equipo

> **Proyecto:** EDUVIAGT — Sistema Integral de Gestión de Becas
> **Curso:** 0910-037 · Análisis de Sistemas II · 8.º Ciclo
> **Catedrático / Product Owner:** Ing. Mario Fuentes
> **Fecha de constitución:** 2026-08-24
> **Versión del documento:** 1.0
> **Base:** Anexo 1 del documento del proyecto final

---

## 1. Identificación del equipo

| Campo | Detalle |
|---|---|
| **Nombre del equipo** | EDUVIAGT |
| **Nombre corto** | EDUVIAGT (SIGEB v1.1) |
| **Proyecto asignado** | Plataforma Nacional para la Gestión Integral de Becas |
| **Cliente / contexto** | Ministerio de Educación de Guatemala (MINEDUC) |
| **Curso** | 0910-037 · Análisis de Sistemas II · 8.º Ciclo |
| **Catedrático / Product Owner** | Ing. Mario Fuentes |
| **Metodología** | Scrum — sprints de 2 semanas |
| **Repositorio** | `https://github.com/Deividcodv/proyecto-analisis-Eduviagt.git` |
| **Rama de integración** | `develop` · **Rama de producción** | `master` (protegida) |
| **Sprint actual** | Sprint 9 — Mejoras Transversales |

---

## 2. Integrantes del equipo

| # | Nombre completo | Clave / Matrícula | Rol Scrum | Rol técnico | Correo electrónico | Teléfono |
|---|---|---|---|---|---|---|
| 1 | **Hernández González, Héctor Enrique** | 0910-23-8576 | Development Team | Backend Dev 2 — Dominio de Convocatorias | `hhernandezg23@miumg.edu.gt` | `[PENDIENTE]` |
| 2 | **Lemus Meléndrez, Marcos Estuardo** | 0910-23-8572 | Development Team | Backend Dev 1 — Seguridad y Autenticación | `mlemusm8@miumg.edu.gt` | `[PENDIENTE]` |
| 3 | **Chiroy Vásquez, Luis David** | 0910-23-9228 | **Scrum Master** / **Product Owner (simulado)** | Tech Lead / Arquitecto de Software | `davivasquez02@gmail.com` | `[PENDIENTE]` |
| 4 | **Hernández García, José Manuel** | 0910-23-8324 | Development Team | Backend Dev 3 — Dominio de Solicitudes | `jhernandezg76@miumg.edu.gt` | `[PENDIENTE]` |
| 5 | **Par Guerra, Yermerson Geovanny** | 0910-23-6974 | Development Team | Frontend Dev 1 — Portal Público y Panel Admin | `[PENDIENTE]` | `[PENDIENTE]` |
| 6 | **Guzmán Hernández, Hamilton Estuardo** | 0910-23-8270 | Development Team | Frontend Dev 2 — Sistema Interno y Asistente IA | `hamiltonguzmanh@gmail.com` | `[PENDIENTE]` |

> **Nota sobre roles.** El documento del proyecto establece que *el docente asumirá el rol de Product Owner
> durante todo el semestre*. Para poder ejecutar el ciclo completo de Scrum (incluida la definición de
> criterios de aceptación y la validación de incrementos), el rol de Product Owner se **simula** dentro del
> equipo, asumido por el Scrum Master, quien lo ejecuta bajo la supervisión del docente y presenta cada
> entrega para validación.

### 2.1 Distribución demodules por responsable

| Integrante | Módulos / áreas a cargo | Sprints con ownership |
|---|---|---|
| **Marcos** | `auth/`, `users/` (seguridad), `audit/`, `common/` | S0, S1, S5 (refactor audit) |
| **Héctor** | `catalogos/`, `convocatorias/`, `storage/` | S0, S2, S3 (soporte) |
| **José** | `solicitudes/`, `evaluaciones/`, `comites/`, `sesiones/`, `reportes/` | S0, S3, S4, S5 |
| **Yemerson** | Layout, Design System, portal público, panel admin | S5, S6, S7 |
| **Hamilton** | Login/registro web, dashboard postulante, formulario multi-paso, documentos, chat IA | S5, S7 |
| **David** | Supervisión general, code review, ADR, CI/CD, seguridad, UX del asistente | Todos (supervisión) |

Detalle completo en [`docs/team/members.md`](../team/members.md) y [`docs/team/roles.md`](../team/roles.md).

---

## 3. Objetivo General y Específicos (criterios SMART)

### Objetivo General

> **Diseñar e implementar una plataforma web de software que gestione integralmente el ciclo de vida de las
> becas del Ministerio de Educación — desde la publicación de la convocatoria hasta la resolución y la
> entrega de la constancia — aplicando principios de ingeniería de software (SOLID), arquitectura modular
> y patrones de diseño, yaré entregarla en 9 sprints de 2 semanas con evidencia verificable de calidad,
> documentación y control de versiones.**

### Objetivos Específicos

| # | Objetivo específico | Criterio SMART de medición |
|---|---|---|
| **OE-1** | Automatizar la administración de convocatorias con control de ciclo de vida | Antes del 31 de julio de 2026 se tendrá el módulo de convocatorias operativo con máquina de estados de 6 estados, catálogo de documentos requeridos y reglas de monto; cubierto por pruebas unitarias de la máquina de estados y verificado en el Sprint Review del Sprint 2. |
| **OE-2** | Permitir que un estudiante postulante complete y envíe una solicitud en autoservicio | Antes del 21 de agosto de 2026 el 100 % de las solicitudes podrán crearse, completarse (perfiles académico y financiero, documentos y checklist) y enviarse sin intervención manual; flujo validado con pruebas E2E de Playwright en el Sprint Review del Sprint 3. |
| **OE-3** | Garantizar la trazabilidad de todo el proceso de evaluación y decisión | Antes del 4 de septiembre de 2026 cada cambio de estado de una solicitud generará registro en el historial de estados, en la auditoría y en la bitácora inmutable, con actor, fecha, IP y resultado; verificado con el módulo de auditoría y bitácora del Sprint 8. |
| **OE-4** | Separar la autoridad de aprobación mediante control de umbral económico | Antes del 23 de octubre de 2026 toda solicitud con monto otorgable mayor a Q10,000.00 requerirá firma de un segundo aprobador distinto del primero, con registro en `SolicitudAprobacion`; regla verificada con pruebas del Sprint 8. |
| **OE-5** | Proveer estadísticas agregadas para la toma de decisiones del MINEDUC | Antes del 18 de septiembre de 2026 el administrador dispondrá de al menos 8 reportes de agregación (solicitudes por estado, convocatorias, evaluaciones, tendencia, embudo) exportables a CSV; verificado en el Sprint Review del Sprint 5. |
| **OE-6** | Sustituir los procesos manuales por formularios y hojas de cálculo | Antes del 30 de octubre de 2026 el 100 % de las etapas del ciclo de la beca (convocatoria → postulación → evaluación → comité → resolución → constancia) se ejecutarán dentro de la plataforma, sin dependencia de correo electrónico como canal de gestión; cierre verificado en el Sprint 9. |
| **OE-7** | Garantizar la calidad técnica y la mantenibilidad del código | Antes del 30 de octubre de 2026 el repositorio tendrá cobertura mínima de 49 % en statements, 40 % en branches, 48 % en functions y 49 % en lines, lint sin errores, TypeScript sin errores y 6 jobs de CI verdes en cada PR a `develop`. |
| **OE-8** | Documentar la solución de forma auditable por terceros | Antes del 30 de octubre de 2026 estarán publicados el Documento de Arquitectura, el Documento de Diseño, la Justificación de Arquitectura, la Justificación de Patrones, el Plan de Pruebas, el Manual Técnico, el Manual de Usuario y los 15 entregables del curso, todos referenciando archivos y líneas verificables del código. |

---

## 4. Asignación de roles — Esquema RACI

**Leyenda:** R = Responsable (ejecuta) · A = Aprobador (valida y autoriza) · C = Consultado (opina) · I = Informado (se le comunica)

### 4.1 Por actividad del proyecto

| Actividad | David | Marcos | Héctor | José | Yemerson | Hamilton | Docente |
|---|---|---|---|---|---|---|---|
| Definir visión y priorizar backlog | **A/R** | C | C | C | C | C | **A** |
| Sprint Planning | **R** | C | C | C | C | C | I |
| Desarrollo backend | C | **A/R** (auth) | **A/R** (dominio) | **A/R** (dominio) | I | I | I |
| Desarrollo frontend | A | I | I | I | **A/R** (público) | **A/R** (interno) | I |
| Modelado de datos y migraciones | **A** | **R** | C | C | I | I | I |
| Pruebas unitarias de código propio | C | **R** | **R** | **R** | **R** | **R** | I |
| Code Review | **A/R** | R | R | R | R | R | I |
| Pruebas E2E / aceptación | C | C | C | C | **R** | **R** | I |
| Aprobación de incrementos (UAT) | **R** | I | I | I | I | I | **A** |
| Documentación de arquitectura y ADR | **A/R** | C | C | C | I | I | I |
| Documentación de patrones y SOLID | **A/R** | C | C | C | I | I | I |
| Manuales de usuario | A | C | C | C | **R** | **R** | I |
| CI/CD y despliegue | **A/R** | C | I | I | I | I | I |
| Plan de pruebas y calidad | **A/R** | R | R | R | R | R | **A** |
| Retrospectiva y mejora de proceso | **R** | R | R | R | R | R | I |

> **Principio de acuerdo:** *A* no puede ser la misma persona que *R* en actividades de verificación de código.
> En la práctica, el code review lo realiza **siempre otro integrante** distinto del autor del PR
> (requisito explícito del proyecto y de la Definition of Done del equipo).

### 4.2 Responsabilidades transversales

| Rol | Compromisos |
|---|---|
| **Scrum Master** | Facilitar las 5 ceremonias, remover impedimentos, proteger el sprint scope, moderar el code review, mantener el backlog depurado. |
| **Product Owner (simulado)** | Priorizar el backlog con MoSCoW, escribir criterios de aceptación verificables, aceptar o rechazar incrementos, representar al usuario del negocio. |
| **Development Team** | Estimar en Fibonacci, implementar con TDD, escribir pruebas, escribir documentación técnica, participar del review, cumplir el DoD. |

---

## 5. Protocolo de Comunicación Única

| Campo | Detalle |
|---|---|
| **Plataforma de comunicación asíncrona (oficial)** | **WhatsApp — grupo "EDUVIAGT — Análisis de Sistemas II"** |
| **Plataforma de seguimiento técnico** | **GitHub Issues + Pull Requests** (toda conversación de código y revisión queda en el PR) |
| **Herramienta de tablero Scrum** | **GitHub Projects** (tablero por sprint, columnas: To Do / In Progress / In Review / Done) |
| **Reuniones sincrónicas** | **Google Meet** — enlace fijo del grupo, reuniones de 15 min (daily) y 1–2 h (ceremonias) |
| **Reunión de coordinación diaria** | Daily Scrum, 15 min, 09:00 (hora de Guatemala), por Google Meet |
| **Canal de urgencias / bloqueos** | Mensaje directo en WhatsApp con etiqueta `#bloqueo` — respuesta del Scrum Master en máximo 30 min hábiles |
| **Temas de GitHub vs. WhatsApp** | Decisiones técnicas, código y revisión → **GitHub**. Avisos, coordinación, logística → **WhatsApp**. |

### 5.1 Normas de uso

1. **Un solo canal por tipo de conversación.** No se duplican discussions técnicas en WhatsApp: si la decisión
   afecta al código, se toma en el PR o en un Issue para que quede trazada.
2. **Todo acuerdo con impacto en el producto se registra por escrito** en el `backlog.md` del sprint,
   en el PR o en la minuta de review. La memoria oral no es evidencia.
3. **Formato de mensaje en el daily:** qué avancé · qué bloquea · qué haré hoy. Bloqueos explícitos, no implícitos.
4. **Ventana de|no respuesta:** entre las 20:00 y las 07:00 no se exigen respuestas salvo emergencia de
   producción; las urgencias reales se marcan con `#bloqueo`.
5. **Toda incidencia de seguridad o de datos personales se reporta de inmediato** por `#bloqueo`, sin esperar
   al daily.
6. **Asistencia obligatoria** a las cinco ceremonias. La ausencia injustificada a una Review o a una
   Retrospective se escala según la [Política de Trabajo en Grupo](02-politica-trabajo-grupo.md) §6.
7. **Formato de commits y mensajes** según `docs/standards/git-conventions.md` (Conventional Commits,
   español, prefijo de tipo).

---

## 6. Cronograma del proyecto (WBS)

Sprints de 2 semanas. Cada sprint cierra con Planning, Review y Retrospective.

### 6.1 Cronograma macro

| Sprint | Fechas | Objetivo (Sprint Goal) | Hito / Entregable |
|---|---|---|---|
| **S0 — Setup** | 24/08 – 06/09/2026 | Monorepo, base de datos, esquema Prisma y semilla | Base ejecutable + Acta de Constitución |
| **S1 — Auth** | 07/09 – 20/09/2026 | Registro, login JWT, perfil, `common/` transversal | Autenticación funcional + matriz de roles |
| **S2 — Convocatorias** | 21/09 – 04/10/2026 | CRUD de convocatorias con máquina de estados, catálogos y storage adapter | Convocatorias publicadas |
| **S3 — Solicitudes** | 05/10 – 18/10/2026 | Solicitud completa: perfiles, documentos, checklist y envío | Postulación autoservicio |
| **S4 — Evaluaciones** | 19/10 – 01/11/2026 | Asignación, puntajes ponderados, comités, sesiones, quórum y votación | Decisión de comité |
| **S5 — Reportes + IA** | 02/11 – 15/11/2026 | Reportes agregados + export CSV, auditoría y asistente IA; base del frontend | Métricas + Design System |
| **S6 — Portal público** | 16/11 – 29/11/2026 | Hero, convocatorias públicas con filtros, detalle, consulta de beca, páginas institucionales | Portal público usable |
| **S7 — Sistema interno** | 30/11 – 13/12/2026 | Login web, dashboard postulante, formulario multi-paso, panel evaluador y panel admin | Producto navegable de punta a punta |
| **S8 — Segunda aprobación, montos, bitácora y eliminación de cuenta** | 14/12/2026 – 10/01/2027 | Segunda aprobación > Q10,000, montos por tramos, bitácora inmutable, anonimización, WCAG 2.2 AA, identidad Eduvi | Control de separación de poderes |
| **S9 — Mejoras transversales** | 11/01 – 24/01/2027 | Endurecimiento de CI/CD, deuda técnica priorizada, ajustes de despliegue, cierre documental | Entrega final del proyecto |

### 6.2 Hitos de control

| Hito | Fecha | Criterio de aceptación |
|---|---|---|
| H1 — Constitution | 24/08/2026 | Este acta firmada por los 6 integrantes |
| H2 — Sprint 0 cerrado | 06/09/2026 | Monorepo levanta API + Web + PostgreSQL con `npm run up` |
| H3 — MVP de postulación | 18/10/2026 | Un postulante real completa y envía una solicitud por la UI |
| H4 — MVP de decisión | 01/11/2026 | Un comité session con quórum registra decisiones sobre solicitudes evaluadas |
| H5 — Beta institucional | 29/11/2026 | Portal público con consulta de estado operative |
| H6 — Cierre de alcance MVP | 24/01/2027 | Todos los OE de §3 con evidencia; entregables completos |
| H7 — Entrega final | 24/01/2027 | Repositorio, manuales, presentación y plan de pruebas aprobados por el docente |

### 6.3 Tareas recurrentes por sprint (plantilla WBS)

| ID | Tarea | Responsable | Entregable | Estado |
|---|---|---|---|---|
| W-01 | Sprint Planning — selección de historias y actualización del Product Backlog | David (SM) | `sprint-N/goal.md` + `backlog.md` | Repetido por sprint |
| W-02 | Refinamiento del backlog (INVEST) | Equipo | Historias con criterios de aceptación | Repetido por sprint |
| W-03 | Desarrollo con TDD e integración por PR | Dueño del módulo | PR aprobado + tests verdes | Repetido por sprint |
| W-04 | Code Review de cada PR | Revisor ≠ autor | Aprobación en GitHub | Repetido por sprint |
| W-05 | Pipeline CI (lint, unit, build, smoke, E2E, docker build) | David | 6 jobs verdes | Automatizado |
| W-06 | Demo del incremento + feedback del PO | David (PO) | `sprint-N/review.md` | Repetido por sprint |
| W-07 | Retrospectiva y plan de acción | Todo el equipo | `sprint-N/retrospective.md` | Repetido por sprint |
| W-08 | Actualización de documentación técnica y Scrum | Dueño del cambio | PR de documentación | Repetido por sprint |
| W-09 | Publicación de la versión en `develop` y despliegue a staging | David | Deploy de staging | Al cierre de cada sprint |
| W-10 | Consolidación de entregables del curso | David + equipo | `docs/entregables/` | S9 |

---

## 7. Acuerdos de equipo

1. **Compromiso de calidad:** ninguna historia se marca como terminada sin cumplir la Definition of Done
   completa (código, pruebas, code review, documentación, despliegue verificado).
2. **Compromiso de trazabilidad:** todo cambio relevante en el producto deja un registro durable
   (PR, commit, minuta o entrada en el backlog).
3. **Compromiso de documentación:** la documentación se actualiza en el mismo PR que el código que la
   describe; no se difiere a un sprint posterior.
4. **Compromiso de honestidad técnica:** si un patrón no está implementado, la documentación lo declara
   como `[NO IMPLEMENTADO]` en lugar de afirmarlo (ver `docs/architecture/design-patterns.md`).
5. **Compromiso de mejora continua:** cada retrospectiva produce al menos una acción con responsable
   y fecha; la acción se revisa en la retrospectiva siguiente.

---

## 8. Firmas

| # | Nombre completo | Rol asumido | Firma | Fecha |
|---|---|---|---|---|
| 1 | Hernández González, Héctor Enrique | Development Team — Convocatorias | __________________ | ____/____/2026 |
| 2 | Lemus Meléndrez, Marcos Estuardo | Development Team — Seguridad y Autenticación | __________________ | ____/____/2026 |
| 3 | Chiroy Vásquez, Luis David | Scrum Master / Product Owner (simulado) | __________________ | ____/____/2026 |
| 4 | Hernández García, José Manuel | Development Team — Solicitudes y Evaluación | __________________ | ____/____/2026 |
| 5 | Par Guerra, Yermerson Geovanny | Development Team — Portal Público | __________________ | ____/____/2026 |
| 6 | Guzmán Hernández, Hamilton Estuardo | Development Team — Sistema Interno e IA | __________________ | ____/____/2026 |

---

## 9. Referencias

- [Política de Trabajo en Grupo](02-politica-trabajo-grupo.md) — Anexo 3
- [Documento de Visión y Product Backlog Inicial](03-documento-vision.md) — Anexo 4
- [Documento de Arquitectura](04-documento-arquitectura.md) — Anexo 5
- [`docs/team/members.md`](../team/members.md) — perfiles de los integrantes
- [`docs/team/roles.md`](../team/roles.md) — roles Scrum y DoD
- [`docs/scrum/`](../scrum/) — evidencias de las ceremonias por sprint

---

*Última actualización: 2026-10-28*
