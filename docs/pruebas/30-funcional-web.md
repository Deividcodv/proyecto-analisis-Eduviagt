# EDUVIAGT — Informe funcional de la web (Task 4)

Rama: `test/bug-hunt-revision` · Fecha: 2026-10-16
Enfoque: caja negra sobre el portal en un navegador real (Chromium) — registro,
inicio de sesión, control de acceso, convocatorias y postulación.

## 1. Qué se hizo

Se montó por primera vez el arnés de pruebas de navegador del portal:

| Archivo | Qué es |
|---|---|
| `apps/web/playwright.config.ts` | Configuración: levanta API (puerto 3000) y web (3001) solos si no están corriendo; la API apunta **siempre** a `EDUVIAGT_test` |
| `apps/web/e2e/publico.spec.ts` | 5 casos — portada, listado, consulta pública, registro |
| `apps/web/e2e/autenticacion.spec.ts` | 8 casos — alta de cuenta, login por rol, control de acceso |
| `apps/web/e2e/admin.spec.ts` | 4 casos — panel de administración y navegación |
| `apps/web/e2e/convocatorias.spec.ts` | 3 casos — convocatoria abierta, invitado y postulante |

Dependencias añadidas a `apps/web/package.json`: `@playwright/test` y
`@axe-core/playwright` (esta última se usa en el Task 6). Scripts nuevos:
`test:e2e` y `test:e2e:ui`.

**Cómo ejecutar**

```powershell
cd apps/web
npx playwright test              # todo (levanta API + web si hace falta)
npx playwright test e2e/publico.spec.ts
npx playwright test --ui         # modo interactivo
```

La API de pruebas se apunta a `EDUVIAGT_test`:
`postgresql://EDUVIAGT:EDUVIAGT123@localhost:5432/EDUVIAGT_test` (configurable con
`E2E_DATABASE_URL`).

| Métrica | Antes (Task 1) | Después |
|---|---|---|
| Suites de navegador | 0 | **4** |
| Casos de navegador | 0 | **20** |

Resultado de la corrida completa: **20/20 en verde** (Chromium, 1 worker).

## 2. Flujos cubiertos

| # | Flujo | Casos |
|---|---|---|
| 1 | Registro → alta de cuenta → login → panel | Registro nuevo, contraseñas distintas, login postulante, login admin |
| 2 | Correo con mayúsculas al iniciar sesión | Regresión del arreglo de correo insensible a mayúsculas |
| 3 | Ver convocatorias → abrir detalle → postularme | Listado público, invitado sin sesión, postulante con sesión |
| 4 | Panel de administración | Encabezado, menú, navegación entre secciones |
| 5 | Consulta pública del estado de una solicitud | Código inexistente → mensaje claro en español |
| 6 | Control de acceso en el cliente | Postulante no entra a `/admin`; ruta privada sin sesión → `/login` |

## 3. Hallazgo corregido

### F-014 — Alta — El listado público de convocatorias se quedaba congelado

**Archivo:** `apps/web/src/lib/api.ts` (`http()`)

**Qué pasaba.** El listado público `/convocatorias` mostraba datos viejos y una
convocatoria **recién publicada no aparecía nunca**. Peor: el contenido servido
era de una base de datos **distinta** (datos de desarrollo del 2026-09-18).

**Cómo se detectó.** La prueba «una convocatoria abierta aparece en el listado
público» falló: el detalle de la convocatoria abría bien, pero el listado no la
mostraba. Al comparar:

- `GET /api/convocatorias` (directo) devolvía **3** convocatorias (las reales de
  `EDUVIAGT_test`).
- `GET /convocatorias` (la página) renderizaba **21** convocatorias de otra base.

La causa estaba en el **Data Cache de Next.js**. `http()` llamaba a `fetch()`
sin `cache: 'no-store'`, así que Next guardaba la respuesta GET durante tiempo
indefinido. En `.next/cache/fetch-cache` quedó una entrada para
`http://localhost:3000/api/convocatorias` con fecha **`Fri, 18 Sep 2026`** cuyo
cuerpo contenía, entre otras, la convocatoria
`c3f2d211-11d6-4139-bf92-048ba472c46c` («SMOKE EMPTY 191418»). Como la clave del
caché es la URL de la API, añadir un parámetro (`?busqueda=...`) sí traía datos
frescos, pero la ruta limpia servía siempre lo cacheado.

**Prueba reproducible (con la caché recién borrada y el código anterior):**

1. `/convocatorias` → 3 convocatorias.
2. Crear y publicar una convocatoria nueva por API.
3. `/convocatorias` otra vez → **siguen 3**; la nueva no aparece.
4. `GET /api/convocatorias` → 4 (la nueva sí está).

**Arreglo.** Se opta por no cachear las respuestas de la API:

```ts
const res = await fetch(`${API_URL}${path}`, {
  method,
  headers,
  // Sin esto, Next.js guarda las respuestas GET en su Data Cache y las sirve
  // para siempre: una convocatoria recién publicada no aparecía en el portal.
  cache: 'no-store',
  body: /* ... */,
});
```

**Verificado tras el arreglo:** la página pasó a mostrar 4 (incluida la creada en
el paso 2) y una convocatoria nueva apareció **de inmediato** (5). Las 20
pruebas de navegador quedan en verde y `npx tsc --noEmit` no reporta errores.

> Nota de alcance: el arreglo es en `http()`, que usan **todas** las páginas que
> leen datos del API. Por eso también protege al resto del portal (portada,
> detalle, reportes) de servir datos viejos.

## 4. Observaciones (no son defectos)

| # | Observación |
|---|---|
| O-014 | `/admin` no es una página: redirige a `/admin/convocatorias` (`app/admin/page.tsx`). Es intencional, pero conviene saberlo al probar. |
| O-015 | El seed de `EDUVIAGT_test` **no crea convocatorias `ABIERTA`**, así que el portal público aparece vacío hasta que alguien publica una. La suite crea y publica una por API para poder probar el flujo. |
| O-016 | El Data Cache servía datos de **otra base de datos** (desarrollo). Es la razón por la que el hallazgo fue tan visible: una caché vieja puede mostrar datos de otro entorno. |
| O-017 | Un `getByLabel('Contraseña')` de Playwright coincide también con «Confirmar contraseña» (subcadena). Se resolvió con `{ exact: true }`. No es un defecto de la app. |

## 5. Sugerencias

| # | Prioridad | Sugerencia |
|---|---|---|
| S-015 | Media | Añadir `npm run test:e2e` (web) y `npm run test:e2e` (API) a la integración continua, con una base de datos efímera por corrida. |
| S-016 | Media | Que el seed incluya **al menos una convocatoria `ABIERTA`** de ejemplo; así el portal público no aparece vacío y los flujos son probables sin datos improvisados. |
| S-017 | Baja | Evaluar `next: { revalidate: N }` para catálogos que casi no cambian (géneros, niveles, departamentos) si en el futuro se busca rendimiento; hoy `no-store` es lo correcto para no volver a servir datos viejos. |
| S-018 | Baja | El E2E no reinicia `EDUVIAGT_test` (ver F-002 del baseline): los datos se acumulan entre corridas. Resolver con el S-015 (base efímera). |
