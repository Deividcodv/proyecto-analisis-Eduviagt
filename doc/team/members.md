# Miembros del Equipo — SIGEB

---

## David

| Campo | Detalle |
|---|---|
| **Rol Scrum** | Scrum Master / Tech Lead |
| **Rol técnico** | Full-stack, supervisión general |
| **Módulos** | Todos (code review, decisiones arquitectónicas) |
| **Responsabilidades** | Facilitar ceremonias, remover bloqueos, revisar PRs, aprobar merge a develop/master, definir ADR |
| **Sprints** | Todos (supervisión) |

### Tareas típicas
- Sprint Planning: priorizar y seleccionar historias
- Code Review: revisar PRs del equipo
- Daily: resolver bloqueos
- Retrospective: proponer mejoras de proceso

---

## Marcos

| Campo | Detalle |
|---|---|
| **Rol Scrum** | Development Team |
| **Rol técnico** | Backend Dev 1 — Seguridad y Autenticación |
| **Módulos** | `auth/`, `seguridad/`, `auditoria/`, `common/` |
| **Responsabilidades** | Login, registro, JWT, guard de permisos, audit log, DTOs, validaciones |
| **Sprints** | S0 (schema), S1 (auth completa), S5 (audit refactor) |

### Módulos a cargo
- `auth/` — Registro, login, refresh, perfil
- `seguridad/` — Roles, permisos, excepciones por usuario
- `auditoria/` — AuditLog interceptor
- `common/` — Guards globales, decoradores, interceptores

---

## Héctor

| Campo | Detalle |
|---|---|
| **Rol Scrum** | Development Team |
| **Rol técnico** | Backend Dev 2 — Dominio de Convocatorias |
| **Módulos** | `catalogos/`, `convocatorias/`, `documentos/`, `becas/` |
| **Responsabilidades** | CRUD convocatorias, máquina de estados, catálogos, storage adapter, tipos de documento |
| **Sprints** | S0 (schema), S2 (convocatorias completa), S3 (soporte en documentos) |

### Módulos a cargo
- `catalogos/` — Género, nivel académico, departamento, municipio
- `convocatorias/` — CRUD + máquina de estados + documentos requeridos
- `documentos/` — Tipos de documento + storage adapter
- `becas/` — Catálogo de becas y criterios de evaluación

---

## José

| Campo | Detalle |
|---|---|
| **Rol Scrum** | Development Team |
| **Rol técnico** | Backend Dev 3 — Dominio de Solicitudes |
| **Módulos** | `solicitudes/`, `evaluaciones/`, `comites/`, `decisiones/`, `reportes/` |
| **Responsabilidades** | Crear solicitud, perfil, documentos, checklist, evaluaciones, comités, votos, quórum, reportes |
| **Sprints** | S0 (schema), S3 (solicitudes), S4 (evaluaciones + comités), S5 (reportes) |

### Módulos a cargo
- `solicitudes/` — Crear solicitud, perfil académico/financiero, documentos, checklist, enviar
- `evaluaciones/` — Asignar evaluadores, puntajes, score ponderado
- `comites/` — CRUD comités, sesiones, votos, quórum
- `decisiones/` — Aprobación/rechazo + registro
- `reportes/` — Agregaciones + export CSV

---

## Yemerson

| Campo | Detalle |
|---|---|
| **Rol Scrum** | Development Team |
| **Rol técnico** | Frontend Dev 1 — Portal Público |
| **Módulos** | Layout, Design System, páginas públicas |
| **Responsabilidades** | Hero, convocatorias públicas, filtros, nosotros, contacto, footer, responsive |
| **Sprints** | S5 (Layout base), S6 (portal completo), S7 (panel admin) |

### Páginas a cargo
- Layout base + Design System + Tailwind
- Hero + "Sobre SIGEB"
- Convocatorias públicas + filtros
- Página individual de convocatoria
- "Consulta tu beca" (público)
- Nosotros + Contacto
- Footer institucional
- Panel admin (convocatorias, seguridad)

---

## Hamilton

| Campo | Detalle |
|---|---|
| **Rol Scrum** | Development Team |
| **Rol técnico** | Frontend Dev 2 — Sistema Interno + IA |
| **Módulos** | Dashboard, formularios, asistente IA |
| **Responsabilidades** | Login/Register frontend, dashboard postulante, formulario multi-step, gestión documentos, chat IA |
| **Sprints** | S5 (asistente IA proxy), S7 (sistema interno completo) |

### Páginas a cargo
- Login + Registro frontend (React Hook Form + Zod)
- Dashboard postulante
- Formulario multi-step de solicitud
- Gestión documentos frontend
- Widget chat IA
- Panel evaluador

---

## Matriz de participación por sprint

| Sprint | David | Marcos | Héctor | José | Yemerson | Hamilton |
|---|---|---|---|---|---|---|
| S0 Setup | SM | Schema + Common | Schema | Schema | Setup | Setup |
| S1 Auth | Review | **Auth completa** | — | — | — | — |
| S2 Convocatorias | Review | Soporte | **Convocatorias** | — | — | — |
| S3 Solicitudes | Review | — | Soporte | **Solicitudes** | — | — |
| S4 Evaluaciones | Review | — | — | **Evaluaciones + Comités** | — | — |
| S5 Reportes+IA | Review | Audit refactor | — | **Reportes** | **Layout base** | **IA proxy** |
| S6 Portal público | Review | — | — | — | **Portal completo** | Soporte |
| S7 Sistema interno | Review | — | — | — | **Admin** | **Postulante + IA** |

---

*Última actualización: 2026-08-26*
