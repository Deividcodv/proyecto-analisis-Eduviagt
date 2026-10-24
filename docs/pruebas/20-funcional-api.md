# EDUVIAGT — Informe funcional del API (Task 3)

Rama: `test/bug-hunt-revision` · Fecha: 2026-10-16
Enfoque: caja negra contra `EDUVIAGT_test` — autorización por rol, validación de
entrada y máquinas de estado.

## 1. Qué se hizo

Dos suites E2E nuevas que se suman a las 4 existentes:

| Suite | Casos | Qué cubre |
|---|---|---|
| `test/rbac.e2e-spec.ts` | 24 | Matriz de autorización por rol contra rutas protegidas y públicas |
| `test/validacion.e2e-spec.ts` | 11 | Validación de DTOs, `forbidNonWhitelisted`, UUIDs y bordes |

| Métrica | Antes (Task 1) | Después |
|---|---|---|
| Suites E2E | 4 | **6** |
| Casos E2E | 55 | **90** (+35) |
| Suites unitarias | 18 | 20 |
| Casos unitarios | 155 | **182** (+27) |

## 2. Modelo de autorización verificado

El API registra **tres guards globales** en `common/common.module.ts`
(`JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`). Toda ruta requiere JWT salvo
las marcadas `@Public()`, y cada ruta protegida declara `@Permisos('modulo:accion')`.

Mapa rol→permisos (del seed) y resultado comprobado:

| Permiso | ADMIN | POSTULANTE | EVALUADOR | COORDINADOR | MIEMBRO | Verificado |
|---|---|---|---|---|---|---|
| `permiso:editar` (Seguridad) | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ 403 / 200 |
| `auditoria:ver` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ 403 / 200 |
| `reporte:ver` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `convocatoria:crear` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ 403 / 201 |
| `evaluacion:ver` | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ 403 / 200 |
| `comite:ver` | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ 403 / 200 |
| `comite:crear` | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ 403 |
| `solicitud:crear` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ 403 |
| Rutas públicas (convocatorias, catálogos) | — | — | — | — | — | ✅ 200 sin token |
| Ruta protegida sin token | — | — | — | — | — | ✅ 401 |

**Conclusión:** la matriz de autorización se cumple de punta a punta. No se
encontraron huecos (no hay rutas sensibles sin permiso, ni filtraciones de datos
ajenos: `notificaciones` y `mi-solicitud` acotan por el usuario del token).

### Rutas autenticadas sin `@Permisos` (revisadas, correctas)

| Ruta | Por qué está bien |
|---|---|
| `GET/PATCH /api/auth/perfil` | Cada quien ve y edita **su** perfil |
| `GET /api/notificaciones`, `no-leidas`, `PATCH :id/leida`, `POST leer-todas` | Todas usan `@CurrentUser('id')`; `marcarLeida` filtra por `{ id, usuarioId }` → sin IDOR |
| `GET /api/convocatorias/:id/mi-solicitud` | Devuelve la solicitud **del propio** usuario |

## 3. Hallazgo corregido

### F-013 — Alta — El límite de subsanaciones se podía burlar

**Archivo:** `apps/api/src/solicitudes/solicitudes.service.ts`

Existen **dos** caminos para pedir una corrección al postulante:

- `POST /api/solicitudes/:id/solicitar-correccion` → valida
  `correccionesCount < convocatoria.maxCorrecciones`.
- `POST /api/solicitudes/:id/transicion { accion: 'solicitar_correccion' }` →
  **no validaba nada**: la regla del máximo vivía solo en el primer método.

Como ambos son accesibles al ADMIN, el segundo permitía pedir correcciones
**ilimitadas**, saltándose la regla de negocio (configurable por convocatoria,
por defecto 3). La máquina de estados sí era correcta; lo que faltaba era la
regla de negocio.

**Reproducción:** llevar una solicitud a `EN_REVISION` con `correccionesCount`
en el tope y llamar al endpoint genérico con `accion: 'solicitar_correccion'`
→ respondía 201 en lugar de 400.

**Corrección:** se extrajo `assertCorreccionesDisponibles()` y se aplica en
**ambos** caminos (antes duplicado en uno solo).
**Reproducción fallará** en `solicitudes.service.spec.ts`:
*"no permite pedir más correcciones de las permitidas"* (rojo antes del arreglo,
verde después).

## 4. Sugerencias (no corregidas)

| # | Prioridad | Hallazgo | Dónde |
|---|---|---|---|
| S-012 | Media | **Autorización incoherente entre dos endpoints que hacen lo mismo.** `solicitarCorreccion` permite ADMIN **+ COORDINADOR_COMITE**, pero `transicion` exige *solo ADMIN* para las acciones de comité (`iniciar_revision`, `evaluar`, `aprobar`, `rechazar`, `solicitar_correccion`). Además el seed concede `solicitud:*` a COORDINADOR_COMITE, permiso que en la práctica ese endpoint rechaza. La web solo ofrece "Revisar solicitudes" al ADMIN (`/admin` → `roles={['ADMIN']}`), lo que sugiere que el modelo correcto es ADMIN-only y que la concesión al coordinador es la que sobra. **Recomendación:** unificar el criterio en un único helper `esStaff()` y decidir explícitamente si el coordinador revisa o no. *No se tocó para no cambiar autorizaciones por conjetura.* | `solicitudes.service.ts` (`transicion` vs `solicitarCorreccion`) |
| S-013 | Baja | Los permisos de **escritura de catálogos** exigen `permiso:editar` (el permiso del módulo *Seguridad*), no un permiso propio de catálogos. Funciona porque solo ADMIN lo tiene, pero es semánticamente confuso y bloquea a futuros roles de gestión. | `catalogos.controller.ts` |
| S-014 | Baja | Los mensajes 400 por transición inválida exponen nombres técnicos de estado (`"evaluar" no es válida desde estado "BORRADOR"`). Para un estudiante sería mejor texto llano. | `*-state-machine.ts` |

## 5. Confirmado por las pruebas ✓

- Rutas públicas responden 200 sin token; protegidas responden 401 sin token y
  con token inválido.
- Cada rol recibe 403 exactamente donde su permiso lo indica.
- `POST /api/convocatorias` rechaza con 400: sin `becaId`, `becaId` no-UUID,
  campo no declarado, nombre de 2 letras, `evaluadoresMinimos` 0/99, fecha no
  ISO y **cierre anterior a apertura** (arreglo de Task 2, verificado E2E).
- `GET /api/convocatorias/:id` con id no-UUID → 400 (no 500); UUID inexistente → 404.
- `POST /api/solicitudes` con `convocatoriaId` no-UUID → 400 (no 500).
