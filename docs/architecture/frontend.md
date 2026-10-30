# Arquitectura del frontend — SIGEB / EDUVIAGT v1.1

> Next.js 14.2 (App Router) + React 18.3 + TypeScript 5.5 + Tailwind 3.4. Puerto dev 3001. Consume la API en `/api`.

## 1. Estructura

```
apps/web/
├── next.config.js          # rewrites /api → API, output standalone
├── playwright.config.ts    # E2E
├── Dockerfile              # build standalone, user no-root
├── tailwind.config.js      # tokens "brutalista"
├── e2e/                    # 8 specs + global-setup
├── public/                 # favicon.svg, logo.svg, marca.svg
└── src/
    ├── app/                # 34 páginas + 2 layouts (sin route handlers)
    ├── components/         # 60 componentes, por feature
    ├── context/            # AuthContext (único provider)
    ├── hooks/              # use-notificaciones-sonido
    ├── lib/                # api, api-auth, auth, constantes de dominio
    └── styles/globals.css
```

**No existen:** `middleware.ts`, `route.ts`, `loading.ts`, `error.ts`, `global-error.ts`, `template.ts`, `src/types/`, `src/services/`, `src/store/`.

## 2. next.config.js

```js
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: { domains: ['localhost'] },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
    API_INTERNAL_URL: process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_PROXY || 'http://localhost:3000/api',
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${process.env.NEXT_PUBLIC_API_PROXY || 'http://localhost:3000/api'}/:path*` }];
  },
};
```

- **Rewrites:** `/api/:path*` → `NEXT_PUBLIC_API_PROXY` (leído en **runtime** del server). El navegador siempre llama a `/api/*` (relativo).
- **`output: 'standalone'`**: el `Dockerfile` copia `.next/standalone` y arranca `node apps/web/server.js` como usuario `webapp`.
- ⚠️ **Bug:** `API_INTERNAL_URL` se inlinea en **build time** (bloque `env`). En producción los Server Components de `/convocatorias` apuntan a `http://localhost:3000/api` (el propio web), no a `http://api:3000/api`.

## 3. Capa HTTP (dos implementaciones)

### 3.1 `src/lib/api.ts` — base (sin token, sin refresco)

```typescript
export const API_URL = (typeof window === 'undefined')
  ? (process.env.API_INTERNAL_URL ?? 'http://localhost:3000/api')
  : (process.env.NEXT_PUBLIC_API_URL ?? '/api');

export async function http<T>(path, options = {}): Promise<T> { ... }
export async function httpData<T>(path, options = {}): Promise<T> { ... }  // desenvuelve { data }
export async function fetcher<T>(path): Promise<T> { ... }  // para SWR
```

- `http()` **no adjunta token** salvo `options.token` explícito.
- `http()` **no distingue 401** ni refresca.
- `cache: 'no-store'` siempre (sin caché de Next ni ETags).
- **Sin `AbortController` ni timeouts** en ninguna llamada.

### 3.2 `src/lib/api-auth.ts` — consciente del token

```typescript
export async function fetchConToken<T>(path, options = {}): Promise<T> {
  // usa siempre /api${path} (relativo) → solo cliente
  // adjunta Authorization: Bearer <localStorage>
  // si 401 → refreshAccessToken() + un reintento
  // desenvuelve { data }
}
```

Diferencias clave: siempre relativo, siempre desenvuelve `{data}`, refresca en 401 (un solo reintento), no redirige a `/login` si el refresh falla.

### 3.3 Excepciones manuales

- `app/reportes/page.tsx:114` y `components/reportes/ExportarReporte.tsx:44` hacen `fetch('/api/reportes/.../csv', { headers: { Authorization: ... } })` a mano, sin manejo de 401.

## 4. Sesión y token

- **Almacenamiento:** `localStorage` exclusivamente (ni cookies ni `sessionStorage`).
- **Keys:** `sigeb_access_token`, `sigeb_refresh_token` (`lib/auth.ts:3-4`).
- **`AuthContext`** (`context/AuthContext.tsx`, único provider, montado en `app/layout.tsx`): `{ usuario, cargando, login, logout, getToken }`. Al montar: `refreshAccessToken()` + `cargarPerfil()` (`GET /auth/perfil`).
- **`ProtectedRoute`** (`components/auth/ProtectedRoute.tsx`): guard 100 % cliente; redirige a `/login` si no hay usuario, o a `rutaPorRol(rol)` si el rol no está autorizado.
- **Sin `middleware.ts`** → protección solo en cliente: flash de contenido y URLs privadas en el HTML inicial.

## 5. Manejo de errores en el cliente

- **Sin manejo global:** no hay `error.tsx`, `global-error.tsx`, ErrorBoundary ni `window.onerror`.
- **Normalización:** `src/lib/mensajes-error.ts` — tabla de regex → mensajes en español (`traducirError`).
- **Renderizado local:** `useState<string | null>(null)` + bloque visual con `border-brutal-rojo bg-red-50`, `role="alert"` solo en chat y campana.
- **Sin librería de toasts** (`sonner`, `react-hot-toast`, etc. no instalados). Las "notificaciones" son la campana + sonido (`new Audio('/sounds/notificacion.mp3')` — ⚠️ el archivo no existe en `public/`).

## 6. Formularios

- **RHF + Zod solo en 2 formularios:** `app/login/page.tsx` y `app/registro/page.tsx` (patrón canónico con `zodResolver`).
- El resto usa `useState` manual: `FormularioConvocatoria.tsx` (30 KB, un único `FormState`), los 6 pasos de solicitud (comunicación por callback props), `GestionDeCuenta`, paneles admin.
- **Componentes de formulario reutilizables** (`components/ui/`): `Input`, `Select`, `Textarea` con `forwardRef` + `useId()` + `aria-invalid` + `aria-describedby`. `Button` dual (`href` → `<Link>`, o `onClick`).

## 7. SWR

`swr@^2.2.0` instalado pero **usado en un único componente**: `components/home/Convocatorias.tsx`. El resto hace `fetch` manual. No hay `SWRConfig` global, `useSWRMutation`, `refreshInterval` ni `revalidateOnFocus`.

## 8. Accesibilidad (WCAG 2.2 AA)

- **Skip link** (`app/layout.tsx:49-54`): "Saltar al contenido principal" → `#contenido-principal`.
- **Foco visible global** (`styles/globals.css:29-41`): `outline: 3px solid #18233a`.
- **`prefers-reduced-motion`**: CSS global anula animaciones + JS en `use-notificaciones-sonido.ts`.
- **Focus trap completo** solo en `NavigationDrawer.tsx:23-54` (Escape + Tab cíclico + scroll lock + devolución de foco).
- **Devolución de foco** en `Header.tsx` y `ChatWidget.tsx`.
- **ARIA:** `ChatWidget` (`role="dialog"`, `aria-live="polite"`, `aria-expanded`, `aria-controls`), `NavigationDrawer`, `CampanaNotificaciones` (`role="menu"`, nombre accesible con contador), `Input/Select/Textarea` (`useId`, `aria-invalid`, `aria-describedby`), `Stepper` (`aria-current="step"`).
- **Contraste:** paleta Tailwind documentada con ratios (`tailwind.config.js:27`).
- **Pruebas:** `e2e/a11y.spec.ts` con axe (`wcag2a, wcag2aa, wcag21a, wcag21aa`) sobre 15 páginas públicas + 7 internas, navegación por teclado, capturas desktop/móvil, assert de desborde horizontal ≤ 1 px.

## 9. Componentes de chat con el asistente IA

Dos implementaciones casi idénticas (`ChatWidget.tsx` global flotante + `MiniAsistente.tsx` embebido en `/soporte`), con identidad compartida vía `lib/asistente.ts` (`NOMBRE_ASISTENTE = 'Eduvi'`).

- Llamada: `httpData<Respuesta>('/asistente/preguntar', { method:'POST', body:{ pregunta } })` — **sin token** (consistente con `@Public()` del backend).
- Personalización por rol (`ROLES_EQUIPO`) solo del lado cliente; el rol **no viaja al servidor**.
- Duplicación de lógica (`enviar`, bloque de mensajes, "pensando", error) entre ambos.

## 10. Patrones de arquitectura del frontend

- **Feature-based** en `components/` (`admin/`, `solicitud/`, `reportes/`, `convocatorias/`, `home/`, `layout/`, `ui/`, `chat/`, `soporte/`, `perfil/`, `consulta/`, `legal/`, `auth/`).
- **Type-based** en `lib/` (`api`, `auth`, `rol`, `navegacion`, `etiquetas`, `acciones`, `seguridad`, `mensajes-error`, `asistente`).
- **Capas:** presentación pura (`ui/`) → contenedores/feature (smart components que mezclan datos y markup) → páginas (thin wrappers o Server Components).
- **Un solo provider** (`AuthProvider`). Sin `SWRConfig`, `ThemeProvider`, `ToastProvider`, i18n.
- **Hooks custom:** solo 2 — `use-notificaciones-sonido.ts` y `useNotificacionesStream` (ubicada en `lib/`, inconsistencia de ubicación).
- **Barrel files:** solo `components/solicitud/steps/index.ts`.
- **Alias:** `@/*` → `./src/*`.
- **Composición por props/callbacks** en el wizard de postulación (cada `Paso*` recibe `solicitudId`, `onGuardado`, `onError`).
- **Design system "brutalista institucional"**: paleta `sigeb.*`/`brutal.*`, sombras duras `6px 6px 0 0`, `borderRadius: 0`, fuentes `Archivo`/`Instrument Sans`/`Space Mono` vía `next/font/local`, con los archivos `.woff2` versionados en `apps/web/src/fonts` (licencia OFL). Se usa `next/font/local` y no `next/font/google` a propósito: Google Fonts devuelve a veces URLs de fuente sin extensión y el build falla de forma intermitente (vercel/next.js#99114).

## 11. Server Components / Server Actions

- **Server Components:** sí, pero marginales — `app/layout.tsx`, `app/convocatorias/page.tsx` (`force-dynamic`), `app/convocatorias/[id]/page.tsx` (`generateMetadata` + `notFound()`), páginas legales/estáticas, `app/admin/page.tsx` (`redirect()`), thin wrappers.
- **Server Actions:** **no existe ninguna** (`'use server'` = 0 coincidencias).
- **Server-side fetch autenticado:** **no existe** (el token está en `localStorage`).
- **Proporción:** 59 ficheros con `'use client'` (54 %) vs 50 sin (46 %).

## 12. Deuda técnica del frontend

| # | Hallazgo | Evidencia |
|---|---|---|
| 1 | `API_INTERNAL_URL` inlineado en build → Server Components apuntan al propio web en prod | `next.config.js:12-15` |
| 2 | Sin `AbortController` ni timeouts en ninguna llamada HTTP | `lib/api.ts`, `lib/api-auth.ts` |
| 3 | Tokens en `localStorage` (vulnerable a XSS); refresh token de 7 d también en `localStorage` | `lib/auth.ts` |
| 4 | 401 no expulsa al usuario (no hay redirección a `/login` desde la capa HTTP) | `lib/api-auth.ts` |
| 5 | `ConfirmDialog` sin focus trap ni Escape | `components/ui/ConfirmDialog.tsx` |
| 6 | `/sounds/notificacion.mp3` no existe → el sonido nunca suena | `hooks/use-notificaciones-sonido.ts:32` |
| 7 | `axios` declarado pero sin usar (dependencia muerta) | `package.json` (0 imports en `src/`) |
| 8 | SWR infrautilizado (1 call-site) vs fetch manual en ~40 componentes | `components/home/Convocatorias.tsx` |
| 9 | Doble implementación del chat IA (lógica duplicada) | `ChatWidget.tsx`, `MiniAsistente.tsx` |
| 10 | Mojibake en `app/coordinador/page.tsx` ("CoordinaciA3n de comitAcs") | `app/coordinador/page.tsx` |
| 11 | `http()` vs `fetchConToken()` con contratos distintos (confusión al añadir endpoints) | `lib/api.ts`, `lib/api-auth.ts` |
| 12 | Sin `.env.example` del frontend; variables no documentadas | raíz `.env.example` (sin `NEXT_PUBLIC_*`) |
| 13 | Acceso protegido solo en cliente (sin `middleware.ts`) | ausencia de `middleware.ts` |
| 14 | RHF+Zod solo en 2 formularios; los complejos usan `useState` manual | `FormularioConvocatoria.tsx`, `steps/*` |

## 13. Variables de entorno

| Variable | Dónde | Default | Nota |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `next.config.js` (env) y `lib/api.ts` | `/api` | Inlined en build |
| `NEXT_PUBLIC_API_PROXY` | `next.config.js` (rewrites) | `http://localhost:3000/api` | Solo destino del rewrite, leído en runtime. Definida en `docker-compose.prod.yml` (`http://api:3000/api`) y `playwright.config.ts` |
| `API_INTERNAL_URL` | `next.config.js` (env) y `lib/api.ts` | `NEXT_PUBLIC_API_PROXY` ?? `http://localhost:3000/api` | Servidor. Inlined en build ⚠️ |
| `E2E_API_PORT` / `E2E_WEB_PORT` / `E2E_BASE_URL` / `E2E_DATABASE_URL` | `playwright.config.ts`, `e2e/global-setup.ts` | 3000 / 3001 / `http://localhost:3001` / `postgresql://sigeb:sigeb123@localhost:5432/sigeb_test` | |
| `CI` | `playwright.config.ts` | — | Controla `reuseExistingServer` |

## 14. Playwright

- Config: `apps/web/playwright.config.ts` — un solo proyecto (Chromium), `workers: 1`, `fullyParallel: false`, `retries: 0`, locale `es-GT`, timezone `America/Guatemala`.
- `globalSetup`: `e2e/global-setup.ts` — `migrate reset --force --skip-seed --skip-generate` + `db seed`, con guarda de nombre de BD (`sigeb_test`).
- **8 specs:** `a11y`, `admin`, `autenticacion`, `convocatorias`, `legal`, `publico`, `segunda-aprobacion`, `global-setup`.
- CI: job `e2e-web` con Postgres efímero, `prisma migrate deploy` antes del arranque, `playwright install --with-deps chromium`, artefacto `playwright-report/` (7 días).

## 14.5 Portal público de convocatorias (actualizado 2026-10-27)

### 14.5.1 Helper `convocatoriaAbierta` (`lib/api.ts`)

```typescript
export function convocatoriaAbierta(
  convocatoria: Pick<Convocatoria, 'estado' | 'fechaApertura' | 'fechaCierre'>,
  ahora: Date = new Date(),
): boolean {
  if (convocatoria.estado !== 'ABIERTA') return false;
  const apertura = convocatoria.fechaApertura ? new Date(convocatoria.fechaApertura) : null;
  const cierre = convocatoria.fechaCierre ? new Date(convocatoria.fechaCierre) : null;
  if (apertura && apertura > ahora) return false;
  if (cierre && cierre < ahora) return false;
  return true;
}
```

Una convocatoria `ABIERTA` con fecha de cierre vencida se considera **cerrada** para el portal. Home, dashboard, KPIs y el badge usan este helper.

### 14.5.2 Filtros del portal (`app/convocatorias/page.tsx`)

Los filtros (estado / nivel / cobertura / beca / búsqueda) ahora **llegan al API** (`?estado`, `?nivelAcademicoId`, `?cobertura`, `?busqueda`). La vista repite el filtro en cliente como defensa frente a versiones antiguas del backend.

### 14.5.3 Tipo `formulario`

`ConvocatoriaDetalle.formulario` se amplió a `CampoFormulario[] | string | null` (antes solo `CampoFormulario[] | null`), porque la semilla guarda el formulario como arreglo y el backend puede devolver string.

### 14.5.4 Badge

`ConvocatoriaCard` calcula `estadoMostrado = abierta ? convocatoria.estado : 'CERRADA'`. Todo lo que no acepta postulaciones se muestra como cerrado.

## 15. Referencias

- `apps/web/next.config.js`, `apps/web/Dockerfile`, `apps/web/tailwind.config.js`
- `apps/web/src/app/layout.tsx`, `apps/web/src/context/AuthContext.tsx`
- `apps/web/src/lib/api.ts`, `apps/web/src/lib/api-auth.ts`, `apps/web/src/lib/auth.ts`
- `apps/web/src/components/auth/ProtectedRoute.tsx`
- `apps/web/src/components/chat/ChatWidget.tsx`, `apps/web/src/components/soporte/MiniAsistente.tsx`
- `apps/web/e2e/a11y.spec.ts`
- `docs/architecture/ARQUITECTURA-REAL.md` §3.14 (endpoints públicos)
- `docs/architecture/api-web-contrato.md`