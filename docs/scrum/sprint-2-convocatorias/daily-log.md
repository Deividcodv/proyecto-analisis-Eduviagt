# Sprint 2 — Daily Log

## Standups

### Día 1 — 2026-08-27

**¿Qué hice ayer?**
- Revisión de la documentación Sprint 2 (backlog, goal) y de la deuda técnica del Sprint 1

**¿Qué haré hoy?**
- Crear rama `feature/convocatorias-core` desde `develop`
- Implementar guard de permisos con Chain of Responsibility (US-11)

**Bloqueos:**
- Ninguno

---

### Día 2 — 2026-08-27

**¿Qué hice ayer?**
- Rama `feature/convocatorias-core` creada
- Guard de permisos (Cadena de Responsabilidad): `permission-chain.ts`, `permissions.guard.ts`, decorador `@Permisos`
- Registro del guard como `APP_GUARD` y migración de `/seguridad` de `@Roles` a `@Permisos`

**¿Qué haré hoy?**
- CRUD de catálogos (US-12) con endpoint público
- CRUD de convocatorias (US-14) y máquina de estados (US-15)

**Bloqueos:**
- Ninguno

---

### Día 3 — 2026-08-27

**¿Qué hice ayer?**
- Catálogos CRUD: géneros, niveles académicos, departamentos, municipios y tipos de documento con endpoints públicos en `/api/catalogos`
- CRUD de convocatorias en `/api/convocatorias`
- Máquina de estados (State Machine) con 6 estados y transiciones validadas

**¿Qué haré hoy?**
- Documentos requeridos por convocatoria (US-16)
- DocumentStorage adapter filesystem (US-17)
- Seed de becas, criterios y ajustes de permisos

**Bloqueos:**
- Ninguno

---

### Día 4 — 2026-08-27

**¿Qué hice ayer?**
- Configuración de documentos requeridos por convocatoria (`PATCH /convocatorias/:id/documentos`) con validación de estado BORRADOR
- `DocumentStorage` interface + `FilesystemStorageAdapter` con protección contra path traversal
- Seed: becas demo, criterio de evaluación y permisos `documento:eliminar`

**¿Qué haré hoy?**
- Especs unitarios: máquina de estados, cadena de permisos y storage adapter
- Build + lint + test + smoke test manual

**Bloqueos:**
- Include `criteriosEvaluacion` dentro de `Convocatoria` era inválido (esa relación vive en `Beca`); corregido anidando `beca: { include: { criteriosEvaluacion: true } }`

---

### Día 5 — 2026-08-27

**¿Qué hice ayer?**
- Specs de máquina de estados, cadena de permisos (CoR), guard de permisos y storage adapter en verde
- Lint, test y build del monorepo en verde
- Smoke test manual: catálogos públicos, CRUD convocatoria, transiciones, documentos requeridos

**¿Qué haré hoy?**
- Actualizar documentación Sprint 2 (backlog, daily-log, review, retrospective, changelog)
- Commitear en `feature/convocatorias-core`
- Merge a `develop`

**Bloqueos:**
- Ninguno