# Plan de Aseguramiento de Calidad Ágil (QAP)

> **Proyecto:** EDUVIAGT — Sistema Integral de Gestión de Becas
> **Curso:** 0910-037 · Análisis de Sistemas II · 8.º Ciclo
> **Responsable de calidad:** Todo el equipo Scrum
> **Versión:** 1.0 · **Fecha de creación:** 2026-08-26 · **Última revisión:** 2026-10-28
> **Base:** Anexo 6 del documento del proyecto final

---

## 1. Propósito y alcance

### 1.1 Propósito

Este documento define las actividades, estándares y responsabilidades que el equipo adopta para asegurar que
cada incremento de producto entregado al final de cada Sprint sea de alta calidad, funcional y que cumpla las
expectativas del Product Owner y de los stakeholders.

El enfoque de calidad del equipo es **preventivo y continuo**, no una fase final de pruebas. La calidad se
construye en cada incremento; no se añade al final.

### 1.2 Alcance

Este plan aplica a **todos los artefactos y procesos** del proyecto, desde la concepción de las Historias de
Usuario hasta la entrega del software funcional. Cubre:

- Los documentos del proyecto (visión, backlog, historias, criterios de aceptación, diseño).
- El código de la aplicación y los scripts de base de datos.
- El código de pruebas (unitarias, de integración y E2E).
- El incremento de producto entregado en cada Sprint.
- El repositorio Git y su historial.
- La documentación de usuario y técnica.

### 1.3 Principios que guían la calidad

| # | Principio | Aplicación concreta en el proyecto |
|---|---|---|
| 1 | **La calidad es responsabilidad de todo el equipo**, no de una persona ni de una fase | Todo el equipo es "responsable de calidad"; el autor de cada historia es responsable de sus pruebas |
| 2 | **Prevención antes que detección** | El TDD y el refinamiento previo evitan la mayoría de los defectos |
| 3 | **El código revisado por pares es la norma** | Todo PR requiere al menos una aprobación de otro miembro |
| 4 | **Trazabilidad total de los cambios** | Commit + PR + bitácora + historial de estados |
| 5 | **Honestidad sobre el estado real** | Lo no implementado se declara `[NO IMPLEMENTADO]`; lo no verificado se declara pendiente |
| 6 | **La accesibilidad y la seguridad son parte de la calidad**, no extras | Criterios de aceptación y pruebas de axe en el pipeline |

---

## 2. Productos de trabajo (work products) sobre los que se mide la calidad

| # | Producto | Criterio de calidad | Cómo se verifica |
|---|---|---|---|
| 1 | **Documento de Visión y Product Backlog** | Claridad, consistencia y completitud | Revisión del equipo en el refinamiento; el PO prioriza con MoSCoW |
| 2 | **Historias de Usuario** | Claridad, concisión y testeabilidad (criterios INVEST) | Checklist INVEST en el refinamiento; todo criterio de aceptación debe ser verificable |
| 3 | **Criterios de aceptación** | Verificables automáticamente o por pasos objetivos | Cada historia tiene al menos un criterio observable y comprobable |
| 4 | **Documento de Diseño de Sistema** | Coherencia con la arquitectura y utilidad para el desarrollo | Revisión cruzada por dos integrantes antes de publicarlo |
| 5 | **Justificación de Arquitectura y Patrones** | Argumentación con evidencia verificable en el código | Cada afirmación cita `archivo:línea` |
| 6 | **Código de la aplicación** | Limpio, mantenible, legible, con guía de estilo acordada | ESLint + Prettier en el pipeline; code review |
| 7 | **Scripts de base de datos** | Versionados, idempotentes y probados | Migraciones Prisma en `apps/api/prisma/migrations/`; `migrate deploy` en CI |
| 8 | **Código de pruebas** | Existe y ofrece cobertura adecuada de la lógica de negocio | Jest con umbral mínimo; Playwright para los flujos críticos |
| 9 | **Documentación técnica** | Actualizada en el mismo PR que el código | Checklist del DoD; revisión en el PR |
| 10 | **Manuales de usuario** | Claros, con pasos numerados y por rol | `docs/manual-usuario/` — 6 roles cubiertos |
| 11 | **Incremento del producto** | Usable, estable y conforme a la Definition of Done | Checklist del DoD + verificación del PO en staging |
| 12 | **Repositorio Git** | Historial ordenado, ramas protegidas, PRs revisados | Reglas de protección de rama; Conventional Commits |

---

## 3. Normas y prácticas aplicables

### 3.1 Guía de estilo de código

| Elemento | Norma | Evidencia |
|---|---|---|
| **Lenguaje y framework** | TypeScript estricto con NestJS 10 (API) y Next.js 14 (web) | `tsconfig.base.json` |
| **Linter** | ESLint 8 con `eslint-config-prettier` | `.eslintrc.json` en la raíz |
| **Formateador** | Prettier 3 (`npm run format`) | `.prettierrc` |
| **Estilo** | 2 espacios, comillas simples, punto y coma, línea máxima 100 | `.prettierrc` |
| **Nombres** | `camelCase` para variables y funciones, `PascalCase` para clases, `SCREAMING_SNAKE` para constantes | `docs/standards/code-conventions.md` |
| **Archivos** | `kebab-case.ts`; las pruebas van junto al código con sufijo `.spec.ts` | `apps/api/src/**/*.spec.ts` |
| **Sin `any` implícito** | `strict` activado; los `any` explícitos requieren justificación en el PR | `tsconfig.base.json` |

### 3.2 Convenciones de nomenclatura

| Elemento | Norma |
|---|---|
| **Ramas** | `feature/<modulo>-<descripcion-corta>`, `hotfix/<descripcion>`, `fix/<descripcion>` |
| **Commits** | Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `build:`, `ci:` — en español |
| **PR** | Título = tipo + alcance + descripción; cuerpo con *Descripción*, *Cambios*, *Pruebas*, *Checklist* |
| **Merge** | Squash merge en `develop` para mantener el historial legible |
| **Migraciones** | `npx prisma migrate dev --name <descripcion>`; nunca se edita a mano una migración aplicada |
| **Documentos** | `NN-nombre-del-documento.md` dentro de la carpeta temática correspondiente |

### 3.3 Estándar de documentación

- Todo método público de un servicio debe documentar su propósito, sus parámetros y su valor de retorno.
- Todo endpoint debe tener: descripción, permiso requerido, DTO de entrada y ejemplo de respuesta (OpenAPI/Swagger
  generado en `main.ts`).
- Toda regla de negocio debe estar **en el código** (tabla de transiciones, tabla de permisos) o **en el
  documento de diseño**, nunca solo en la cabeza de alguien.
- Los diagramas en Mermaid son la fuente de verdad versionable: si un diagrama contradice al código, **el código
  manda** y el diagrama se corrige.

### 3.4 Definición de "Hecho" (DoD) — estándar principal de calidad

Ninguna Historia de Usuario se considera completa si no cumple **todos** los puntos:

- [ ] El código está subido a una rama de trabajo (`feature/*` o `hotfix/*`); nunca directamente a `develop`/`master`.
- [ ] El PR está abierto contra `develop` y cuenta con **al menos una aprobación** de otro miembro del equipo.
- [ ] Existen pruebas unitarias y de integración para la funcionalidad y **todas pasan**.
- [ ] `npm run lint` termina sin errores y la compilación de TypeScript no reporta errores.
- [ ] Se cumplen **todos** los criterios de aceptación de la historia.
- [ ] No se han introducido bugs nuevos: la suite completa del pipeline está en verde.
- [ ] La documentación técnica necesaria (API, diagramas, README del módulo) se creó o actualizó **en el mismo PR**.
- [ ] Las migraciones de base de datos, si las hay, están versionadas y son idempotentes.
- [ ] La funcionalidad está desplegada en el entorno de pruebas/staging y **verificada por el Product Owner**.
- [ ] Las acciones sensibles quedan registradas en la bitácora y la auditoría.

### 3.5 Criterios de calidad de un PR

| Dimensión | Umbral |
|---|---|
| Tamaño del PR | Preferiblemente < 400 líneas modificadas; si se supera, se documenta la razón |
| Funcionalidad | Un PR = una historia o un grupo cohesivo de historias |
| Cobertura | La lógica de negocio nueva debe tener prueba; se mantiene el umbral global de cobertura |
| Commits | Sin commits de formato ("wip", "fix", "cambios") |
| Mezclas | Sin conflictos sin resolver; sin archivos de build ni `.env` versionados |
| Documentación | Sin cambios de comportamiento sin actualizar la documentación correspondiente |

---

## 4. Acciones y tareas de calidad

### 4.1 Revisiones técnicas (peer reviews)

#### 4.1.1 Revisión de código (code review)

**Obligatoria.** Toda nueva pieza de código debe ser revisada y aprobada por **al menos un otro miembro del
equipo** antes de integrarse a la rama de integración. Se usa la funcionalidad de Pull/Merge Requests de
GitHub.

**Qué revisa el revisor**

| Aspecto | Pregunta que se hace el revisor |
|---|---|
| **Correctitud** | ¿La implementación resuelve lo que dice el criterio de aceptación? |
| **Reglas de negocio** | ¿Se respeta la FSM, la regla de quórum, la regla de umbral o el *fail-closed*? |
| **Seguridad** | ¿Se valida la entrada? ¿Se filtra la salida? ¿Se registra la acción sensible? |
| **Diseño** | ¿Se mantiene el OCP/DIP? ¿Se introduce un acoplamiento nuevo? ¿Se duplica lógica que ya existe? |
| **Pruebas** | ¿Las pruebas cubren el caso feliz y los casos límite y de error? |
| **Legibilidad** | ¿Los nombres son explícitos? ¿El método hace una sola cosa? |
| **Base de datos** | ¿La migración es idempotente y reversible en lo posible? |

**Formato del review.** Comentarios en el PR clasificados como:
- 🔴 **Bloqueante** — debe corregirse antes de aprobar.
- 🟡 **Sugerencia** — se puede aprobar y se anota como deuda.
- 🟢 **Nit** — comentario menor, sin Blocking.

**Tiempo de respuesta.** El autor responde a los comentarios en un plazo máximo de **24 horas hábiles**; la
revisión de un PR no bloquea más de 48 horas desde su apertura. Si nadie puede revisar en un periodo
superior a 48 horas, el Scrum Master reasigna el revisor.

#### 4.1.2 Revisión de documentación

Los documentos clave (visión, arquitectura, patrones, manuales, plan de pruebas) son revisados por **dos
integrantes distintos del autor** antes de publicarse en `docs/`. La revisión se evidencia con la aprobación
del PR de documentación.

### 4.2 Pruebas

| Tipo | Quién | Cuándo | Qué cubre | Herramienta |
|---|---|---|---|---|
| **Unitarias** | El desarrollador que escribe el código | Continuamente, durante la escritura | Piezas pequeñas: servicios, funciones puras, DTOs, máquinas de estado, cálculo de montos | Jest (`*.spec.ts`) |
| **Integración** | El desarrollador que escribe el código | Tras las unitarias | Interacción entre módulos, servicios y base de datos; autenticación y autorización; transacciones | Supertest |
| **E2E** | Todo el equipo (rotativo) · Playwright | Cuando la historia está lista para validación | Flujos completos de usuario, desde la interfaz | Playwright (+ axe) |
| **Aceptación de usuario (UAT)** | Product Owner | Al final del desarrollo de la historia | Que la funcionalidad cumple el criterio de aceptación y la necesidad de negocio | Checklist del PO en staging |
| **Regresión** | Automatizada + manual exploratoria | Antes de cada Sprint Review | Que lo nuevo no rompió lo existente | Suite completa + exploración manual |
| **Usabilidad exploratoria** | Todo el equipo | Un bloque de tiempo por sprint | Fallos de uso y propuestas de mejora desde la perspectiva del usuario final | Recorrido manual |
| **Accesibilidad** | Automatizada | En cada PR que toca la UI | Cumplimiento WCAG 2.2 AA | axe en Playwright + revisión manual |

### 4.3 Auditorías de proceso

La **Sprint Retrospective** es la principal herramienta de auditoría y mejora. En cada retrospectiva se analiza:

1. ¿Qué salió bien en términos de calidad?
2. ¿Qué problemas de calidad encontramos?
3. ¿Cómo podemos mejorar nuestro proceso para evitar estos problemas en el futuro?

Cada retrospectiva produce **al menos una acción con responsable y fecha**, y esa acción se revisa en la
retrospectiva siguiente.

### 4.4 Pipeline de integración continua (6 jobs)

| Job | Qué valida | Cuándo se ejecuta |
|---|---|---|
| `api-tests` | lint + pruebas unitarias + `tsc` en API y web + build de la API + smoke de arranque | En cada PR y en `develop` |
| `e2e-web` | Suite Playwright completa (incluye axe) sobre la base de datos de prueba, con resiembra | En cada PR y en `develop` |
| `docker-build` | Construcción de las imágenes Docker de API y web | Solo en `develop` y `master` |
| `deploy-staging` | Despliegue por SSH a la VM de staging, con `prisma migrate deploy` | Solo en `develop` |
| `deploy-production` | Despliegue a producción | Solo en `master` con `PRODUCTION_READY=true` (deshabilitado en el semestre) |
| `lint-and-test` | Linter sobre todo el monorepo | En cada PR (job de compatibilidad con la protección de rama) |

**Regla:** ningún PR se mergea a `develop` si el pipeline está en rojo.

### 4.5 Revisión de accesibilidad

| Criterio | Verificación |
|---|---|
| Foco visible en todos los elementos interactivos | Manual + axe |
| Skip link al contenido principal | Manual |
| Trampa de foco en el menú lateral (drawer) | Manual + axe |
| `prefers-reduced-motion` respetado | Manual (animaciones desactivadas) |
| Contraste de color AA | axe |
| Etiquetas accesibles en formularios | axe |
| Navegación por teclado completa | Manual |

Detalle y evidencia en [`docs/pruebas/50-a11y-visual.md`](../pruebas/50-a11y-visual.md).

---

## 5. Herramientas y métodos

| Categoría | Herramienta / método | Uso en el proyecto |
|---|---|---|
| **Gestión de proyectos** | GitHub Projects | Tablero Scrum por sprint, columnas To Do / In Progress / In Review / Done |
| **Control de versiones** | Git + GitHub | Branches, PRs, code review, historial, protección de ramas |
| **Pruebas unitarias y de integración** | Jest + Supertest | 26 ficheros `.spec.ts` en la API |
| **Pruebas E2E** | Playwright (+ `@axe-core/playwright`) | 8 suites E2E, flujos críticos y accesibilidad |
| **Integración continua** | GitHub Actions | 6 jobs; ejecución en cada PR |
| **Análisis estático de código** | ESLint + Prettier + `tsc --noEmit` | Detección automática de problemas de estilo y de tipos |
| **Análisis de cobertura** | Jest `--coverage` con umbral | Statements 49 % · Branches 40 % · Functions 48 % · Lines 49 % |
| **Gestión de dependencias** | npm workspaces + Turborepo | Monorepo con caché de tareas |
| **Base de datos** | Prisma Migrate + Prisma Studio | Migraciones versionadas; inspección de datos |
| **Documentación técnica** | Markdown en `docs/` + Mermaid + Swagger/OpenAPI | Diagramas versionables y contrato de la API |
| **Despliegue** | PM2 + nginx + Docker Compose | PM2 como vía vigente; Compose como alternativa |

---

## 6. Procedimientos para la administración de la configuración

### 6.1 Control de versiones

- **Todo** el código fuente, scripts de base de datos y documentación técnica están bajo control de versiones
  en el repositorio Git.
- La rama `master` (y `develop`) siempre representa una versión estable y potencialmente desplegable.
- Ningún fichero de entorno (`.env`), clave o credencial se versiona. `.gitignore` lo bloquea y el CI ejecuta
  un escaneo de secretos.
- La documentación vive en el mismo repositorio que el código: así, un cambio de comportamiento y su
  documentación se versionan juntos.

### 6.2 Estrategia de ramas

Se utiliza un **GitFlow simplificado**:

| Rama | Propósito | Origen | Destino |
|---|---|---|---|
| `master` | Producción | `develop` (tras revisión) | — |
| `develop` | Integración; siempre desplegable | `feature/*`, `hotfix/*` | `master` |
| `feature/<modulo>-<descripcion>` | Desarrollo de una historia | `develop` | `develop` (PR + squash) |
| `hotfix/<descripcion>` | Corrección urgente en producción | `master` | `master` y `develop` |

**Reglas adicionales**

- No se trabaja nunca directamente sobre `master` ni sobre `develop`.
- Una rama de feature se elimina tras el merge.
- El squash merge mantiene el historial de `develop` legible: un commit por historia completada.

### 6.3 Gestión de entornos

| Entorno | Propósito | Configuración |
|---|---|---|
| **Desarrollo local** | Trabajo individual | `npm run up` (Docker Compose con PostgreSQL) o `npm run dev` |
| **Integración / pruebas (staging)** | Pruebas de integración y UAT del PO | VM de staging, desplegada por el job `deploy-staging` |
| **Producción** | Operación institucional | `master` + `PRODUCTION_READY=true` (deshabilitado en el semestre) |

Cada entorno tiene su propio `.env` y su propia base de datos. Los datos de prueba nunca se mezclan con datos
reales: la suite E2E resiembra la base `sigeb_test` de forma determinista.

### 6.4 Gestión de la base de datos

- Toda modificación de esquema se hace con `prisma migrate dev` y se versiona en
  `apps/api/prisma/migrations/`.
- Las migraciones aplicadas **no se editan**; se crea una migración correctiva.
- `prisma migrate deploy` se ejecuta automáticamente en el despliegue de staging.
- Los datos de demostración se generan con `prisma db seed` (idempotente) a partir de
  `apps/api/prisma/semilla/`.

---

## 7. Métodos para unificar y mantener los registros

### 7.1 Registro de defectos (bugs)

- Los defectos identificados se registran como ítems en el **Product Backlog** (GitHub Projects) con la
  etiqueta `Bug`.
- Son priorizados por el Product Owner como cualquier otra historia.
- Cada reporte de defecto incluye:
  - Título descriptivo.
  - Pasos para reproducirlo.
  - Resultado esperado vs. resultado obtenido.
  - Capturas de pantalla o vídeo (si aplica).
  - Nivel de severidad (**Crítico**, **Alto**, **Medio**, **Bajo**).
  - **Entorno** (versión, navegador, ambiente) y **commit** donde se reproduce.

### 7.2 Resultados de revisiones

- El feedback de las revisiones de código se registra **directamente en el Pull Request** (con los emoji
  🔴 🟡 🟢 para clasificar la gravedad).
- Las decisiones importantes de las revisiones de documentos se registran en la minuta de la ceremonia o en el
  propio documento, en la sección de decisiones.

### 7.3 Minutas de retrospectiva

- Las acciones de mejora relacionadas con la calidad identificadas en la retrospectiva se registran en
  `docs/scrum/sprint-N/retrospective.md` con responsable y fecha.
- Se revisan en la retrospectiva siguiente: si la acción no se completó, se escala a la prioridad de la
  retrospectiva en curso.

### 7.4 Unificación de los cuatro registros de trazabilidad

El sistema mantiene **cuatro registros independientes** que, juntos, permiten reconstruir cualquier decisión:

| Registro | Contenido | Quién lo escribe |
|---|---|---|
| `HistorialEstado` | Cambio de estado de la solicitud: anterior, nuevo, acción, comentario, actor | Automático (dentro de la transacción) |
| `AuditLog` | Acción sensible: actor, módulo, acción, resultado, IP, fecha | Automático (interceptor y llamadas explícitas) |
| `BitacoraSistema` | Bitácora **append-only** de todas las acciones registradas con `correlacionId` | Automático (`BitacoraService`) |
| `SolicitudAprobacion` | Firma de aprobación: nivel (1 o 2), usuario, decisión, comentario | Automático (al aprobar) |

El equipo no usa una de estas fuentes como sustituto de las otras: cada una responde a una pregunta distinta y
la **correlación por `correlacionId` y `solicitudId`** permite reconstruir la historia completa de un expediente.

---

## 8. Roles y responsabilidades

La calidad es una responsabilidad compartida de todo el equipo.

### 8.1 Product Owner

- Asegurar que las Historias de Usuario y sus Criterios de Aceptación sean claros y aporten valor.
- Realizar las Pruebas de Aceptación (UAT) para validar que la funcionalidad cumple la necesidad.
- Priorizar la resolución de defectos en el Product Backlog.
- Verificar el incremento desplegado en staging antes de cerrar el sprint.

### 8.2 Development Team

- Construir un incremento de producto de alta calidad que cumpla el DoD.
- Escribir código limpio y mantenible, siguiendo las convenciones del proyecto.
- Crear y mantener las pruebas unitarias y de integración de su código.
- Realizar revisiones de código entre pares de manera constructiva.
- Documentar el código y las decisiones junto al cambio.
- Reportar los defectos encontrados y participar en su análisis.

### 8.3 Scrum Master

- Asegurar que el equipo siga las prácticas y procesos de calidad definidos en este plan.
- Facilitar las Sprint Retrospectives para identificar oportunidades de mejora en la calidad.
- Eliminar impedimentos que puedan afectar la capacidad del equipo para producir trabajo de calidad
  (por ejemplo, un pipeline lento, un entorno caído, un bloqueo de despliegue).
- Garantizar que las acciones de mejora de la retrospectiva se ejecuten.

### 8.4 Catedrático / Product Owner real del curso

- Emitir los cambios de requerimientos (memorandos, oficios, políticas nuevas).
- Evaluar el proyecto con los criterios de evaluación del enunciado.
- Validar los entregables.

---

## 9. Métricas de calidad

El equipo mide la evolución de la calidad con los siguientes indicadores, revisados en cada retrospectiva:

| # | Métrica | Objetivo | Fuente |
|---|---|---|---|
| QM-01 | Cobertura de código | ≥ 49 % statements / 40 % branches / 48 % functions / 49 % lines | Jest coverage |
| QM-02 | Número de suites de prueba | ≥ 26 unitarias + 8 E2E | Repositorio |
| QM-03 | Pruebas E2E en verde | 100 % en cada PR | GitHub Actions |
| QM-04 | Errores de lint | 0 | ESLint |
| QM-05 | Errores de TypeScript | 0 | `tsc --noEmit` |
| QM-06 | Tiempo de revisión de PR | ≤ 48 h | GitHub |
| QM-07 | Tiempo de entrega (lead time) | ≤ 48 h desde el merge a `develop` hasta staging | Job `deploy-staging` |
| QM-08 | Bugs abiertos de severidad Crítica o Alta | 0 al cierre de cada sprint | Tablero |
| QM-09 | Historias con el DoD completo | 100 % | Checklist de cierre de sprint |
| QM-10 | Violaciones de accesibilidad detectadas | 0 al cierre de cada sprint | axe + revisión manual |
| QM-11 | Documentos de `docs/` con fecha de última revisión vigente | 100 % | Revisión documental del sprint |
| QM-12 | Acciones de retrospectiva completadas | ≥ 80 % | `retrospective.md` |

---

## 10. Conclusiones

El plan de calidad de EDUVIAGT es **preventivo, continuo y verificable**:

1. **Preventivo:** el TDD, el refinamiento con criterios verificables y el code review previenen los defectos
   en lugar de buscarlos al final.
2. **Continuo:** la calidad se revisa en cada PR, en cada Sprint Review y en cada Retrospective, no en una
   fase de pruebas al cierre.
3. **Verificable:** cada afirmación de calidad tiene un artefacto que la respalda — un PR aprobado, un job
   en verde, un informe de cobertura, una métrica del tablero, una minuta firmada.
4. **Colectivo:** la responsabilidad de calidad está repartida; el Scrum Master la habilita y el Product Owner
   la verifica en la aceptación.

---

## 11. Referencias

- [Plan de Pruebas Ágil](09-plan-pruebas-agil.md) — estrategia, niveles, entorno y defecto log
- [Documento de Visión](03-documento-vision.md) §8 — Definition of Done
- [`docs/standards/code-conventions.md`](../standards/code-conventions.md) — convenciones de código
- [`docs/standards/testing-strategy.md`](../standards/testing-strategy.md) — estrategia de testing
- [`docs/standards/security-guidelines.md`](../standards/security-guidelines.md) — directrices de seguridad
- [`docs/standards/git-conventions.md`](../standards/git-conventions.md) — convenciones de Git
- [`docs/pruebas/`](../pruebas/) — baseline, caja blanca, funcional, a11y e informe de hallazgos

---

*Última actualización: 2026-10-28*
