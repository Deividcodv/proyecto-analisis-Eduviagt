# Entregables del Proyecto Final — EDUVIAGT

> Sistema Integral de Gestión de Becas — Ministerio de Educación de Guatemala
> Curso: 0910-037 · Análisis de Sistemas II · 8.º Ciclo
> Catedrático / Product Owner: Ing. Mario Fuentes
> Equipo: 6 integrantes · Metodología: Scrum (2 semanas por sprint)

Esta carpeta consolida los **entregables formales** exigidos por el documento del proyecto
("Plataforma Nacional para la Gestión Integral de Becas", v0.3) y sus anexos (Anexos 1 a 7).
Cada documento es un entregable autónomo, listo para ser entregado y evaluado, y referencia
la documentación técnica de `docs/architecture/`, `docs/scrum/`, `docs/standards/`,
`docs/operations/` y `docs/pruebas/` como evidencia de respaldo.

---

## 1. Inventario de entregables

| # | Entregable | Documento | Anexo de referencia | Estado |
|---|---|---|---|---|
| 01 | Acta de Constitución del Equipo | [01-acta-constitucion-equipo.md](01-acta-constitucion-equipo.md) | Anexo 1 | Completo |
| 02 | Política de Trabajo en Grupo | [02-politica-trabajo-grupo.md](02-politica-trabajo-grupo.md) | Anexo 3 | Completo |
| 03 | Documento de Visión y Product Backlog Inicial | [03-documento-vision.md](03-documento-vision.md) | Anexo 4 | Completo |
| 04 | Documento de Arquitectura | [04-documento-arquitectura.md](04-documento-arquitectura.md) | Anexo 5 §2 | Completo |
| 05 | Justificación de la Arquitectura | [05-justificacion-arquitectura.md](05-justificacion-arquitectura.md) | Anexo 5 §2.2 | Completo |
| 06 | Justificación de Patrones de Diseño | [06-justificacion-patrones-de-diseno.md](06-justificacion-patrones-de-diseno.md) | Cuerpo principal | Completo |
| 07 | Documento de Diseño del Sistema | [07-documento-diseno.md](07-documento-diseno.md) | Anexo 5 §3 | Completo |
| 08 | Plan de Aseguramiento de Calidad Ágil (QAP) | [08-plan-aseguramiento-calidad.md](08-plan-aseguramiento-calidad.md) | Anexo 6 | Completo |
| 09 | Plan de Pruebas Ágil | [09-plan-pruebas-agil.md](09-plan-pruebas-agil.md) | Anexo 7 | Completo |
| 10 | Manual Técnico | [10-manual-tecnico.md](10-manual-tecnico.md) | Entregables | Completo |
| 11 | Plantilla de Minuta de Sprint Review | [11-plantilla-minuta-sprint-review.md](11-plantilla-minuta-sprint-review.md) | Anexo 2 | Completo |
| 12 | Guion de la Presentación Final | [12-guion-presentacion-final.md](12-guion-presentacion-final.md) | Entregables | Completo |

### Documentos ya existentes que también son entregables

| Entregable | Ubicación |
|---|---|
| Product Backlog (actualizado por sprint) | [`docs/scrum/product-backlog.md`](../scrum/product-backlog.md) |
| Casos de uso y diagramas UML | [`docs/architecture/diagrams.md`](../architecture/diagrams.md) y [`07-documento-diseno.md`](07-documento-diseno.md) |
| Manual de Usuario (6 roles) | [`docs/manual-usuario/`](../manual-usuario/README.md) |
| Código fuente | [`apps/api/`](../../apps/api) · [`apps/web/`](../../apps/web) |
| Repositorio Git | Historial completo en la rama `develop` |
| Evidencias de Sprint (goal, backlog, daily, review, retrospective) | [`docs/scrum/`](../scrum/) |

---

## 2. Trazabilidad: requisito del proyecto → evidencia

### 2.1 Requisitos funcionales mínimos

| Requisito del proyecto | Módulo / artefacto | Evidencia en el repositorio | Entregable que lo documenta |
|---|---|---|---|
| Administrar convocatorias | `apps/api/src/convocatorias/` | `convocatoria-state-machine.ts`, `convocatorias.controller.ts` | [04](04-documento-arquitectura.md) §4.1 |
| Registrar estudiantes | `apps/api/src/auth/` + `users/` | `auth.controller.ts` (`POST /auth/registro`), rol `POSTULANTE` | [03](03-documento-vision.md) §5 |
| Gestionar solicitudes | `apps/api/src/solicitudes/` | `solicitudes.service.ts`, `solicitud-state-machine.ts` | [04](04-documento-arquitectura.md) §4.2 |
| Cargar documentación | `apps/api/src/storage/` + `solicitudes/` | `DocumentStorage` + `FilesystemStorageAdapter`, `SolicitudDocumentoService` | [07](07-documento-diseno.md) §4.3 |
| Administrar evaluaciones | `apps/api/src/evaluaciones/` | `evaluaciones.controller.ts`, score ponderado | [04](04-documento-arquitectura.md) §4.3 |
| Gestionar comités evaluadores | `apps/api/src/comites/` + `sesiones/` | `comites.controller.ts`, `sesiones.controller.ts`, quórum y votación | [04](04-documento-arquitectura.md) §4.4 |
| Aprobar o rechazar solicitudes | `apps/api/src/sesiones/` + `solicitudes/` | `Decision`, `SolicitudAprobacion`, 2ª aprobación > Q10,000 | [07](07-documento-diseno.md) §4.5 |
| Consultar el estado de una beca | `apps/api/src/solicitudes/` + web `/consulta` | `GET /solicitudes/consulta/:codigo` (`@Public()`) | [03](03-documento-vision.md) §5 |
| Generar reportes básicos | `apps/api/src/reportes/` | 11 endpoints de agregación + export CSV | [04](04-documento-arquitectura.md) §4.5 |

### 2.2 Requisitos de proceso (Scrum, Git, Calidad)

| Exigencia | Cómo se cumple | Evidencia |
|---|---|---|
| Scrum con las 6 ceremonias | Planning + backlog + sprint backlog + desarrollo + review + retrospectiva por sprint | [`docs/scrum/sprint-0..9/`](../scrum/) — cada sprint tiene `goal.md`, `backlog.md`, `daily-log.md`, `review.md`, `retrospective.md` |
| Ramas, PR, code review, historial | `develop` como rama de integración; `master` protegida; PR obligatorio con al menos 1 aprobación | [`docs/standards/git-conventions.md`](../standards/git-conventions.md), `docs/team/roles.md` |
| No trabajar sobre `main` | Toda rama de trabajo nace de `develop` y vuelve por PR con squash merge | `docs/standards/git-conventions.md` |
| SOLID | 5 principios con ejemplos reales y archivo:línea | [`docs/architecture/solid-principles.md`](../architecture/solid-principles.md) |
| Patrones de diseño (2C + 2E + 2Co mínimo) | 8 patrones implementados y justificados (2 creacionales, 3 estructurales, 3 de comportamiento) | [06-justificacion-patrones-de-diseno.md](06-justificacion-patrones-de-diseno.md) |
| Pruebas | 26 suites unitarias API + 8 suites E2E Playwright con axe; cobertura mínima 49/40/48/49 % | [09-plan-pruebas-agil.md](09-plan-pruebas-agil.md) |
| Documentación | Arquitectura, SOLID, patrones, ADRs, diagramas, manuales, Scrum, pruebas | `docs/README.md` (índice maestro) |
| Adaptabilidad a cambios | Sprint 8responde a 3 requisitos nuevos sin romper arquitectura | [03](03-documento-vision.md) §7 · [04](04-documento-arquitectura.md) §7 |

---

## 3. Criterios de evaluación del proyecto → dónde se evidencia

| Criterio | Evidencia principal |
|---|---|
| Analizar el problema | [03-documento-vision.md](03-documento-vision.md) §1–§3 (antecedentes, problema, visión) |
| Tomar decisiones de arquitectura | [04](04-documento-arquitectura.md) · [05](05-justificacion-arquitectura.md) · 22 ADR en [`docs/architecture/decisions.md`](../architecture/decisions.md) |
| Justificar técnicamente las elecciones | [05](05-justificacion-arquitectura.md) · [06](06-justificacion-patrones-de-diseno.md) |
| Adaptarse al cambio | [03](03-documento-vision.md) §7 · [04](04-documento-arquitectura.md) §7 · Sprint 8 |
| Aplicar correctamente patrones de diseño | [06-justificacion-patrones-de-diseno.md](06-justificacion-patrones-de-diseno.md) |
| Mantener historial ordenado en Git | Historial Conventional Commits + PRs + `docs/standards/git-conventions.md` |
| Trabajar colaborativamente mediante Scrum | [01](01-acta-constitucion-equipo.md) §6 (WBS) · [02](02-politica-trabajo-grupo.md) · `docs/scrum/` |

---

## 4. Convenciones

- Todos los documentos de esta carpeta usan la misma convención de encabezados y tablas que el
  resto de `docs/`.
- Las referencias a código se escriben como `ruta/archivo.ts:línea` para permitir la verificación directa.
- Cuando un documento afirma algo que el código contradice, **el código manda** y el documento debe corregirse
  (mismo criterio que `docs/architecture/diagrams.md`).
- Los campos marcados con `[PENDIENTE]` requieren confirmación del equipo antes de la entrega final.

---

## 5. Documentos generados (LaTeX, DOCX y PDF)

Cada entregable está disponible en cuatro formatos:

| Formato | Ubicación | Descripción |
|---|---|---|
| **Markdown** | `docs/entregables/*.md` | Fuente versionable (Mermaid, referencias a código) |
| **LaTeX** | `docs/latex/entregables/*.tex` | Fuentes LaTeX con portada branded (logo UMG + EDUVIAGT), índice automático |
| **PDF (LaTeX)** | `docs/latex/entregables/*.pdf` | 13 PDFs compilados con pdflatex (MiKTeX), ~4-16 páginas c/u |
| **DOCX** | `docs/entregables/docx/*.docx` | Documento branded con portada, índice automático, encabezado/pie con número de página |
| **PDF (DOCX)** | `docs/entregables/pdf/*.pdf` | Subset formal: Acta de Constitución y Guion de Presentación |

**Plantillas LaTeX:** `docs/latex/templates/template-manual-tecnico.tex` y `template-manual-usuario.tex`.
**Plantillas DOCX:** `docs/templates/plantilla-manual-tecnico.docx` y `plantilla-manual-usuario.docx`.

**Manuales de usuario en LaTeX/PDF/DOCX:** `docs/latex/manuales/`, `docs/manual-usuario/pdf/`, `docs/manual-usuario/docx/`,
con capturas reales de la plataforma en `docs/manual-usuario/img/` (32 pantallas) y `docs/latex/img/`.

**Diagramas:** 36 diagramas Mermaid renderizados a PNG en `docs/latex/img/`.

**Motor de compilación:** `docs/latex/build.ps1` (compila todos los `.tex` con pdflatex, 2 pasadas para TOC).

---

*Última actualización: 2026-10-29*
