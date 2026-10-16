# SIGEB — Informe consolidado de hallazgos y correcciones (Task 7)

Rama: `test/bug-hunt-revision` · Fecha: 2026-10-16 · Base: `b62070b`
Alcance: API (`apps/api`) y web (`apps/web`) — correctitud, contenido e idioma,
accesibilidad y revisión visual.

Este documento consolida **todo** lo hallado en los Tasks 1–6, indica qué se
corrigió y qué queda abierto, y deja constancia del estado final de las pruebas.

## 1. Resumen de la campaña

| Técnica | Alcance | Resultado |
|---|---|---|
| Unitarias (Jest) | `apps/api` | 20 suites / 182 tests |
| Caja blanca (lectura + unit) | servicios, guards, filters | 12 hallazgos |
| E2E de API (Supertest) | RBAC y validación | 6 suites / 90 tests |
| E2E de navegador (Playwright) | flujos públicos + auth + admin + convocatorias | 4 suites / 20 tests |
| Contenido e idioma | 12+ páginas y componentes | revisión línea por línea |
| Accesibilidad (axe) + visual | 12 páginas públicas, 2 viewports | 20 tests |

### Hallazgos por tipo

| Prefijo | Tipo | Cantidad | Corregidos | Abiertos |
|---|---|---|---|---|
| `F-xxx` | Bugs | 14 | 11 | 3 |
| `S-xxx` | Sugerencias | 18 | 0 | 18 (a decisión) |
| `C-xxx` | Contenido: defectos | 14 | 14 | 0 |
| `C-xxx` | Contenido: sugerencias | 10 | 0 | 10 (a decisión) |
| `A-xxx` | Accesibilidad | 4 (3 defectos + 1 sugerencia) | 3 | 1 (a decisión) |
| `O-xxx` | Observaciones | 4 | — | informativas |

Ningún hallazgo de severidad **Crítica** queda abierto.

## 2. Bugs corregidos

Todas las correcciones se hicieron **con prueba** (unit o E2E) y la suite se
re-ejecutó después de cada cambio.

| ID | Sev. | Título | Dónde | Commit |
|---|---|---|---|---|
| F-006 | Alta | `assignPermisos` no era atómico (borraba y recreaba sin transacción) | `roles.service.ts` | `5f01c74` |
| F-007 | **Crítica** | Postulaciones y listado ignoraban la ventana de fechas de la convocatoria | `convocatorias.service.ts` | `a10424a` |
| F-008 | Media | Se podía guardar `fechaCierre < fechaApertura` | `convocatorias.service.ts` | `a10424a` |
| F-009 | Media | Mensaje engañoso al subir un documento repetido | `documentos.*` | `a10424a` |
| F-010 | Alta | El correo distinguía mayúsculas al iniciar sesión | `auth.service.ts` | `4b7de39` |
| F-011 | Media | Registro duplicado concurrente devolvía 500 | `auth.service.ts` | `4b7de39` |
| F-012 | Media | Fechas nulas se mostraban como «1 de enero de 1970» en la web | `apps/web` | `b785c7d` |
| F-013 | Alta | El tope de subsanaciones (`maxCorrecciones`) se podía burlar | `solicitudes.service.ts` | `8d3d034` |
| F-014 | Alta | El listado público de convocatorias se servía desde el Data Cache de Next.js y quedaba congelado (llegó a mostrar datos de **otra base de datos**) | `apps/web/src/lib/api.ts` | `65ec8a2` |
| F-003 | Media | `apps/web` tenía `test: jest --passWithNoTests` sin Jest → `npm test` daba «verde» sin probar nada | `apps/web/package.json` | Task 7 |
| C-001..C-014 | Media/Baja | 14 defectos de texto (ver §3) | varias páginas | Task 7 |
| A-001..A-003 | Grave | 3 fallos de contraste WCAG AA (ver §4) | portada, soporte | Task 7 |

### 2.1 Detalle de los defectos de contenido (C-001..C-014)

| ID | Antes → después |
|---|---|
| C-001 | «procesos auditable y verificables» → «procesos **auditables** y verificables» |
| C-002 | «convocatoria(s) abierta(s)» → singular/plural real («convocatoria abierta» / «convocatorias abiertas») |
| C-003 | «votante(s)», «miembro(s)», «voto(s)» → singular/plural real |
| C-004 | «v1.1 — brutal edition» (footer) → «Versión 1.1» |
| C-005 | «Score promedio / Evals completadas / Score global» → «Puntaje / Evaluaciones / Puntaje global» |
| C-006 | «el score / Ver score / Actualizar score» → «el puntaje / Ver puntaje / Actualizar puntaje» |
| C-007 | «marcada como EVALUADA» → «marcada como evaluada» |
| C-008 | «rol EVALUADOR» → «rol Evaluador» |
| C-009 | Gráfico de convocatorias mostraba el enum crudo (ABIERTA/CERRADA) → usa `etiquetaEstado()` |
| C-010 | Placeholder «Acción (ej. create)» → «Acción (ej. crear)» |
| C-011 | Tabla de auditoría mostraba acciones crudas (create/update/delete) → «Crear/Actualizar/Eliminar» |
| C-012 | «Volver al dashboard» (×2) → «Volver a mi panel» |
| C-013 | «La API respondió con estado N» (×4 en 3 archivos) → «No pudimos completar la solicitud. Intenta de nuevo.» |
| C-014 | Etiqueta «// FAQ» → «// Preguntas frecuentes» |

## 3. Contenido: sugerencias abiertas (C-015..C-024)

Mejoras de redacción para el público objetivo (estudiantes desde niños hasta
adultos). **No se aplicaron** para no imponer decisiones de estilo; se recomienda
revisarlas con el equipo.

| ID | Sugerencia |
|---|---|
| C-015 | «expediente» → «postulación» (portada y botón de postular) |
| C-016 | «guatemalteco(a)» → «guatemalteco o guatemalteca» |
| C-017 | En transparencia: «Trazabilidad» / «mutación ... e IP» → «Seguimiento» / texto llano |
| C-018 | Portada: «Seguimiento auditable» → «Seguimiento claro» |
| C-019 | Reportes: «métricas» / «vs» / «Embudo de conversión» → lenguaje llano |
| C-020 | Evaluador: «Puntaje ponderado» / «conflicto de interés» → «Puntaje final» / «relación con la persona postulante» |
| C-021 | Auditoría: encabezados «ID» / «IP» → «Identificador» / «Dirección IP» |
| C-022 | Botones «↓ CSV Solicitudes» → «↓ Descargar solicitudes (CSV)» |
| C-023 | Unificar «...» (tres puntos) con «…» |
| C-024 | Unificar «Cancelar» / «Cerrar» / «Volver» cuando cierran un panel |

## 4. Accesibilidad: hallazgos y corrección (A-001..A-004)

| ID | Sev. | Hallazgo | Estado |
|---|---|---|---|
| A-001 | Grave | Texto dorado `#D4A72C` sobre fondo claro: 2,08–2,24:1 (mínimo 4,5:1) en portada y soporte | **Corregido**: nuevo token `brutal-gold-dark` `#7A5F17` (≥5,6:1 sobre blanco/papel) usado solo para texto sobre fondo claro |
| A-002 | Grave | Párrafo secundario `text-brutal-tinta/60` (`#747B89`, 4,25:1) en portada | **Corregido**: subida la opacidad a `/80` (8,2:1) |
| A-003 | Grave | Enlace dentro del bloque dorado (3,14:1) | **Corregido**: opacidad a `/80` (4,8:1) |
| A-004 | Media | El escaneo axe solo cubre páginas públicas | **Sugerencia**: ampliarlo a las páginas con sesión (panel, admin, reportes, evaluador, comité) |

Después de la corrección, **axe no reporta ninguna violación grave en las 12
páginas** (ver §6).

## 5. Bugs abiertos (no corregidos) y por qué

| ID | Sev. | Título | Motivo / recomendación |
|---|---|---|---|
| F-001 | Media | Cobertura global bajo los mínimos propios (43% vs 70%) y sin `coverageThreshold` | Elevar la cobertura es un trabajo aparte y grande. **Recomendación:** fijar `coverageThreshold` en el valor actual y subirlo de forma incremental (evita que siga bajando sin bloquear hoy). |
| F-002 | Alta | Las E2E **no reinician** `sigeb_test` → no idempotentes | Requiere una base efímera por corrida (ver S-015). Cambio de infraestructura, fuera del alcance de esta campaña. |
| F-005 | Baja | 53 archivos con ruido LF→CRLF; `.gitattributes` incompleto | Es una particularidad del entorno Windows; normalizarlo genera un diff masivo. Recomendación: añadir `* text=auto eol=lf` en un PR dedicado. |

> **Nota (S-012, Media):** hay una **autorización incoherente** entre
> `solicitarCorreccion` (ADMIN + COORDINADOR_COMITE) y `transicion` (solo ADMIN).
> No se tocó **a propósito**: cambiar autorizaciones por conjetura es riesgoso.
> Requiere una decisión de producto explícita.

## 6. Sugerencias priorizadas (muestra)

| ID | Sev. | Sugerencia |
|---|---|---|
| S-002 | Media | `login` sin límite de intentos → añadir rate limiting / bloqueo |
| S-004 | Media | `register` devuelve `rol` como texto y `getProfile` como objeto: unificar forma |
| S-005 | Media | `@Roles([])` deniega a todos pero `@Permisos([])` permite a todos: unificar |
| S-007 | Media | El filtro de excepciones propaga mensajes de Nest **en inglés** |
| S-010 | Alta | Sin `coverageThreshold` → la CI nunca falla por cobertura |
| S-011 | Media | Controllers de `solicitudes`, `users` y `convocatorias` sin unit tests |
| S-015 | Media | Añadir E2E a la CI con base de datos efímera (resuelve F-002) |
| S-016 | Media | Que el seed incluya al menos una convocatoria `ABIERTA` |
| A-004 | Media | Ampliar el escaneo axe a las páginas con sesión |

Sugerencias menores (S-001, S-003, S-006, S-008, S-009, S-013, S-014, S-017,
S-018) están detalladas en `10-caja-blanca.md`, `20-funcional-api.md` y
`30-funcional-web.md`.

## 7. Estado final de las pruebas

| Suite | Comando | Resultado |
|---|---|---|
| Unit `apps/api` | `run-tests.ps1` | 20/20 suites, 182/182 tests (rc=0) |
| E2E API | `run-tests.ps1 -E2E` | 6/6 suites, 90/90 tests (rc=0) |
| E2E web | `npx playwright test` | **40/40** (20 funcionales + 20 a11y) |
| Tipos web | `npx tsc --noEmit` | rc=0 |
| Tipos API | `npx tsc --noEmit` | rc=0 |

## 8. Trazabilidad de commits

```
65ec8a2  F-014 (listado congelado) + arnés Playwright
8d3d034  F-013 (tope de subsanaciones) + RBAC/validación E2E
4b7de39  F-010/F-011 (correo y registro duplicado)
b785c7d  F-012 (fechas nulas en la web)
a10424a  F-007/F-008/F-009 (ventana de fechas)
5f01c74  F-006 (assignPermisos)
a05dd4f  baseline (F-001..F-005)
```

Los Tasks 5, 6 y 7 añaden los informes `40-contenido.md`, `50-a11y-visual.md` y
este `60-informe-hallazgos.md`, más las correcciones de contenido y de contraste.
