# EDUVIAGT — Documentación del Proyecto

> Sistema Integral de Gestión de Becas — Ministerio de Educación de Guatemala

Esta carpeta contiene toda la documentación administrativa, técnica y de proceso del proyecto EDUVIAGT v1.1.

---

## Navegación

### Equipo
- [Miembros del equipo](team/members.md) — Perfil de cada integrante
- [Roles y responsabilidades](team/roles.md) — Roles Scrum y asignaciones técnicas

### Scrum
- [Product Backlog](scrum/product-backlog.md) — Todas las historias de usuario priorizadas
- [Cómo trabajamos (Scrum)](scrum/como-trabajamos.md)
- **Sprints:**
  - [Sprint 0 — Setup](scrum/sprint-0-setup/goal.md)
  - [Sprint 1 — Auth](scrum/sprint-1-auth/goal.md)
  - [Sprint 2 — Convocatorias](scrum/sprint-2-convocatorias/goal.md)
  - [Sprint 3 — Solicitudes](scrum/sprint-3-solicitudes/goal.md)
  - [Sprint 4 — Evaluaciones](scrum/sprint-4-evaluaciones/goal.md)
  - [Sprint 5 — Reportes + IA](scrum/sprint-5-reportes-ia/goal.md)
  - [Sprint 6 — Portal Público](scrum/sprint-6-portal-publico/goal.md)
  - [Sprint 7 — Sistema Interno](scrum/sprint-7-sistema-interno/goal.md)
  - [Sprint 8 — Segunda Aprobación, Montos, Bitácora](scrum/sprint-8-segunda-aprobacion/sprint-plan.md)
  - [Sprint 9 — Mejoras Transversales](scrum/sprint-9-mejoras-transversales/goal.md)

### Entregables del curso (Anexos 1–7)
- [Índice de entregables y trazabilidad](entregables/README.md) — mapa requisito → evidencia
- **Versión LaTeX:** [docs/latex/entregables/](latex/entregables/) — fuentes `.tex` + PDFs compilados
- **Plantillas LaTeX:** [docs/latex/templates/](latex/templates/) — plantillas para manuales
- [Acta de Constitución del Equipo](entregables/01-acta-constitucion-equipo.md) — Anexo 1
- [Política de Trabajo en Grupo](entregables/02-politica-trabajo-grupo.md) — Anexo 3
- [Documento de Visión y Product Backlog Inicial](entregables/03-documento-vision.md) — Anexo 4
- [Documento de Arquitectura](entregables/04-documento-arquitectura.md) — Anexo 5
- [Justificación de la Arquitectura](entregables/05-justificacion-arquitectura.md) — 6 criterios del enunciado
- [Justificación de Patrones de Diseño](entregables/06-justificacion-patrones-de-diseno.md) — 8 patrones, 4 preguntas cada uno
- [Documento de Diseño del Sistema](entregables/07-documento-diseno.md) — casos de uso, componentes, clases
- [Plan de Aseguramiento de Calidad Ágil](entregables/08-plan-aseguramiento-calidad.md) — Anexo 6
- [Plan de Pruebas Ágil](entregables/09-plan-pruebas-agil.md) — Anexo 7
- [Manual Técnico](entregables/10-manual-tecnico.md)
- [Plantilla de Minuta de Sprint Review](entregables/11-plantilla-minuta-sprint-review.md) — Anexo 2
- [Guion de la Presentación Final](entregables/12-guion-presentacion-final.md)

### Arquitectura (documentos maestros verificados)
- [Arquitectura real verificada (backend)](architecture/ARQUITECTURA-REAL.md)
- [Arquitectura del asistente IA (sin RAG)](architecture/asistente-ia.md)
- [Arquitectura del frontend](architecture/frontend.md)
- [Contrato de integración API ↔ Web](architecture/api-web-contrato.md)
- [Arquitectura técnica detallada (monorepo, API, Web, BD, despliegue, IA, JWT)](architecture/ARQUITECTURA_TECNICA_DETALLADA_SIGEB_v1.1.md)
- [Patrones de diseño (verificados)](architecture/design-patterns.md)
- [Diagramas (Mermaid)](architecture/diagrams.md)
- [Decisiones arquitectónicas (ADR)](architecture/decisions.md)
- [Esquema de base de datos](architecture/database-schema.md)
- [Contratos de API](architecture/api-contracts.md)
- [Principios SOLID](architecture/solid-principles.md)
- [Diagramas interactivos](architecture/interactive/)

### Estándares
- [Convenciones de código](standards/code-conventions.md)
- [Convenciones de Git](standards/git-conventions.md)
- [Estrategia de testing](standards/testing-strategy.md)
- [Directrices de seguridad](standards/security-guidelines.md)
- [Deuda técnica conocida](standards/deuda-tecnica.md) — lo que se sabe que está pendiente y por qué

### Operaciones
- [Guía de setup](operations/setup-guide.md)
- [Deployment](operations/deployment.md)
- [Troubleshooting](operations/troubleshooting.md)
- [Guía de inicio rápido](operations/guia-inicio-rapido.md)

### Manuales de usuario
- [Manuales por rol (Markdown)](manual-usuario/README.md) — Postulante, Administrador, Evaluador, Coordinador, Miembro de comité, Jefe de becas
- [Manuales en DOCX](manual-usuario/docx/) — con capturas reales de la plataforma y plantilla branded
- [Manuales en PDF](manual-usuario/pdf/) — subset formal

### Marca
- [Manual de marca (SVG)](marca/marca.svg)
- [Logotipo (SVG)](marca/logo.svg)
- [Favicon (SVG)](marca/favicon.svg)

### Referencia
- [Glosario](glossary.md)
- [Changelog](changelog.md)
- [Git y GitHub — conceptos básicos](git-github-basics.md)

---

## Información general

| Campo | Valor |
|---|---|
| Proyecto | EDUVIAGT v1.1 |
| Equipo | 6 personas |
| Metodología | Scrum (2 semanas/sprint) |
| Stack | NestJS + Next.js + PostgreSQL + Prisma |
| Repo | `github.com/<org>/EDUVIAGT-v1.1` |
| Última actualización | 2026-10-28 (Sprint 9 · entregables del curso consolidados) |
