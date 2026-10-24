# Diagramas Interactivos — EDUVIAGT

> Diagramas interactivos de arquitectura renderizados con Mermaid.js. Abre el archivo HTML en tu navegador.

---

## Archivos

| Archivo | Descripción |
|---|---|
| `architecture.html` | Diagrama interactivo con 12 vistas: arquitectura general, despliegue, ciclo de vida de solicitud, convocatoria, permisos, montos, segunda aprobación, eliminación de cuenta, Eduvi, bitácora, descarga segura, modelo ER |

## Cómo usar

1. Abre `architecture.html` en tu navegador (doble clic o `open architecture.html`).
2. Selecciona un diagrama de las pestañas superiores.
3. Los diagramas se renderizan automáticamente con Mermaid.js.

## Diagramas disponibles

1. **Arquitectura General** — Monolito modular (Frontend + Backend + PostgreSQL)
2. **Despliegue** — PM2 + nginx en VM Azure
3. **Ciclo de vida de Solicitud** — Máquina de estados (incluye 2da aprobación)
4. **Ciclo de vida de Convocatoria** — Máquina de estados
5. **Cadena de Permisos** — Chain of Responsibility
6. **Montos Flexibles** — Cálculo por tramos de ingreso
7. **Segunda Aprobación** — Flujo de aprobación por monto
8. **Eliminación de Cuenta** — Anonimización y trazabilidad
9. **Asistente Eduvi** — Flujo de pregunta con control de acceso
10. **Bitácora** — Registro inmutable de acciones
11. **Descarga Segura** — Flujo de descarga de documentos
12. **Modelo ER** — Entidades principales y relaciones

## Nota

Los diagramas Mermaid estáticos también están disponibles en:
- `docs/architecture/diagrams.md` — Diagramas Mermaid para GitHub
- `docs/architecture/database-schema.md` — Schema completo con ER diagram
- `docs/architecture/design-patterns.md` — Patrones de diseño con diagramas