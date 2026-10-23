# SIGEB — Informe de caja blanca (Task 2)

Rama: `test/bug-hunt-revision` — desde BASE `a05dd4f`.
Fecha: 2026-10-16 · Enfoque: cubrir ramas en 0% y correrlas con tests rojos.

## 1. Qué se hizo

Se escribieron tests **primero** (rojos) contra ramas sin cobertura, se verificó
que fallaban por el motivo correcto y luego se corrigió el código hasta dejarlos
verdes. Cada corrección se revalidó con la suite completa unitaria y la E2E.

| Métrica | Antes | Después |
|---|---|---|
| Suites unitarias | 18 | **20** |
| Tests unitarios | 155 | **179** (+24) |
| Tests E2E | 55 | 55 (sin cambios, ✅) |

**Archivos de prueba nuevos:**
- `apps/api/src/users/roles.service.spec.ts` (6 tests) — antes 19% de cobertura.
- `apps/api/src/convocatorias/convocatorias.service.spec.ts` (8 tests) — antes **0%**.

**Pruebas añadidas a specs existentes:**
- `solicitudes.service.spec.ts` +5 (ventana de postulación).
- `auth.service.spec.ts` +5 (registro y login).

---

## 2. Hallazgos corregidos

### F-006 — Alta — `roles.service.assignPermisos` no era atómico
**Archivo:** `apps/api/src/users/roles.service.ts`
Se borraban los permisos del rol y se recreaban **fuera de transacción**. Si
`createMany` fallaba (ID de permiso inexistente o repetido), el rol se quedaba
con **cero permisos**: un rol ADMIN podía perder todos sus privilegios en una
mala petición.

Además, el DTO no validaba unicidad: los IDs repetidos violaban
`@@unique([rolId, permisoId])` y el error salía como **500** en vez de 400.

**Corrección:** deduplicación de IDs + `prisma.$transaction`; los códigos
P2002/P2003 se traducen a 400 con mensaje claro (otros errores siguen en 500).

### F-007 — Crítica — Postulaciones y listado ignoraban las fechas
**Archivos:** `solicitudes.service.ts`, `convocatorias.service.ts` (+ web)

La convocatoria solo se validaba por `estado === 'ABIERTA'`. Como nada pasaba a
`CERRADA` automáticamente:

- El portal público seguía listando convocatorias **ya vencidas**.
- El estudiante **podía postular después del plazo de cierre** (y el API lo
  aceptaba), aunque el FAQ del propio seed diga *"una vez cerrada no se aceptan
  nuevas solicitudes"*.
- En pantalla la información se contradecía: la ficha mostraba
  **"Cierra en -3 días"** en tarjeta y **"Convocatoria cerrada"** en detalle,
  con el botón **"Postularme ahora" activo**.

**Corrección:**
- `findAllPublic` filtra por la ventana apertura→cierre (fechas nulas = sin
  restricción).
- `solicitudes.create` rechaza fuera de la ventana con mensajes en lenguaje
  simple: *"La convocatoria ya cerró. No se aceptan nuevas postulaciones."*
- Web: helper `convocatoriaAbierta()` alimenta el botón de postular y la
  cuenta regresiva; la tarjeta ya no muestra un contador negativo.

### F-008 — Media — Se podía guardar `fechaCierre < fechaApertura`
**Archivo:** `convocatorias.service.ts`
Ni `create` ni `update` validaban el rango. Al editar **solo una** de las dos
fechas tampoco se comparaba contra la otra ya guardada, así que se podía dejar
una convocatoria donde nadie podría postular nunca.

**Corrección:** `assertFechasCoherentes()` en create y en update (comparando
contra el registro guardado cuando el DTO trae una sola fecha).

### F-009 — Media — Documentos repetidos: mensaje engañoso
**Archivo:** `convocatorias.service.ts`
`reemplazarDocumentosRequeridos` detectaba los IDs duplicados como *"Uno o más
tipos de documento no existen"* (mensaje falso: sí existen, están repetidos).
Además `deleteMany` + `createMany` no iban en transacción.

**Corrección:** validación explícita previa con mensaje accionable: *"Hay tipos
de documento repetidos. Quita los que se repiten e inténtalo de nuevo."*

### F-010 — Alta — El correo distinguía mayúsculas
**Archivos:** `auth.service.ts` (+ web)
El correo se guardaba y comparaba **tal cual** (sin `@Transform`). El teclado
móvil capitaliza el campo de correo, así que un estudiante podía registrarse
con `Juan@Test.com` y luego no entrar con `juan@test.com` recibiendo
*"Credenciales inválidas"* con la contraseña correcta. También se podían crear
dos cuentas con el mismo correo en caja distinta.

**Corrección:** `register` guarda el correo en minúsculas y lo busca con
`mode: 'insensitive'`; `login` busca sin distinguir mayúsculas.

### F-011 — Media — Registro duplicado concurrente → 500
**Archivo:** `auth.service.ts`
Dos registros simultáneos pasan ambas comprobaciones previas y uno choca con el
índice único (P2002) que no se capturaba → **500** en lugar de 409.

**Corrección:** captura de P2002 → `ConflictException`.

### F-012 — Media — Fechas nulas mostraban el 1 de enero de 1970 (web)
**Archivos:** `lib/api.ts`, `CuentaRegresiva.tsx`, `ConvocatoriaCard.tsx`,
`convocatorias/[id]/page.tsx`

`formatearFecha(null)` hacía `new Date(null)` = 1970 → la UI mostraba
**"01 de enero de 1970"** para convocatorias sin fechas (caso perfectamente
válido: `fechaApertura`/`fechaCierre` son opcionales). `CuentaRegresiva` con
fecha nula mostraba *"Convocatoria cerrada"* junto al botón de postular.

**Corrección:** `formatearFecha` devuelve *"Sin fecha"* si no hay valor;
`CuentaRegresiva` no se pinta sin fecha; `diasRestantes` devuelve `null` con
fecha nula.

### Corrección de baseline
`docs/pruebas/00-baseline.md` anotaba **31** tests E2E; era un artefacto del
shell (el mismo bug que enmascaró el reporter de Jest). El número real es
**55**, verificado re-ejecutando: los specs E2E no se tocaron en la campaña.

---

## 3. Sugerencias pendientes (no corregidas)

Priorizadas, para Task 7 de triaje:

| # | Prioridad | Hallazgo | Dónde |
|---|---|---|---|
| S-001 | Media | `refreshToken` envuelve **todo** (incluida `audit.log` y la consulta) en `try/catch` → si la BD falla responde *"Refresh token inválido"*, diagnóstico engañoso. | `auth.service.ts:118-152` |
| S-002 | Media | `login` sin límite de intentos ni bloqueo → permite fuerza bruta. | `auth.service.ts` |
| S-003 | Media | `register` no genera evento de auditoría (login y `updatePerfil` sí). | `auth.service.ts` |
| S-004 | Media | `register` devuelve `rol` como **texto** (`"POSTULANTE"`) y `getProfile` como **objeto** (`{id, nombre}`): forma de respuesta inconsistente que obliga a manejar ambos casos en el cliente. | `auth.service.ts` vs `auth.controller` |
| S-005 | Media | `@Roles([])` vacío **deniega a todos**; `@Permisos([])` vacío **permite a todos**. Reglas incoherentes entre sí. | `roles.guard.ts` / `permissions.guard.ts` |
| S-006 | Baja | `PermissionsGuard` devuelve `false` si no hay usuario → Nest responde **403** cuando correspondería **401** (no autenticado). | `permissions.guard.ts:34` |
| S-007 | Media | `AllExceptionsFilter` propaga los mensajes por defecto de Nest (`"Not Found"`, textos de validación) **en inglés** al usuario hispanohablante. | `http-exception.filter.ts` |
| S-008 | Baja | `updatePerfil` valida que exista el municipio pero **no** que pertenezca al departamento enviado. | `auth.service.ts:199-206` |
| S-009 | Baja | `formatearFecha` de constancias: `.replace(/ de /g, ' de ')` no hace nada (código muerto). | `constancias.service.ts:243` |
| S-010 | Alta | Sin `coverageThreshold` en Jest → la CI **nunca** falla por cobertura (repo pide 70/70/70/60 y está en 43/35/43/43). | `apps/api/package.json` |
| S-011 | Media | `solicitudes.controller`, `users.controller` y `convocatorias.controller` siguen sin unit tests (E2E los cubre parcialmente). | `apps/api/src` |

---

## 4. Qué quedó verificado ✓

- `RolesService.remove` rechaza borrar roles con usuarios asignados.
- `RolesService.create` rechaza nombres duplicados con 409.
- `AuthzService.assertAcceso` impide ver constancias ajenas.
- `formatearFecha(null)` y fechas vencidas ya no llegan a la UI.
- Semilla con correos en minúsculas → la normalización no rompe cuentas existentes.
- Suite completa: **20/20 suites, 179/179 tests** · E2E **4/4, 55/55**.
