# README — Ejecución del Sprint 5 (ejecutor único)

> **Sprint 5 · Reportes, Auditoría, Asistente IA y Paneles**
> Repo de trabajo: `proyecto-analisis-Eduviagt` · 44 pts · US-34/35/36/37/38/39 + US-54/55/56
> Ejecutor: **Marcos** (único). Los demás colaboradores no participan por PTO.

Este documento es **autocontenido**: no necesitas leer `README-COLABORADORES-S5.md` ni ningún otro
artefacto para ejecutar el sprint. Si vienes de esa guía, lee primero el [§0.2](#02-por-qué-no-sirve-la-guía-anterior).

---

## Índice

| § | Contenido |
|---|---|
| [0](#0-qué-vas-a-hacer) | Qué vas a hacer y por qué |
| [1](#1-preflight) | Preflight: qué hay y qué no hay en el destino |
| [2](#2-fase-0--mergear-el-pr--22) | Fase 0 — mergear el PR #22 |
| [3](#3-rama-y-orden-de-commits) | Rama y orden de commits |
| [4](#4-c1--auditoría-de-login-y-refresh-en-auth-us-36) | C1 — auditoría de login y refresh en auth |
| [5](#5-c2--reportes-agregados-y-csv-us-3435) | C2 — reportes agregados y CSV |
| [6](#6-c3--parche-del-interceptor-global) | C3 — parche del interceptor global |
| [7](#7-c4--asistente-ia-us-373839) | C4 — asistente IA |
| [8](#8-c5--widget-del-chat-en-la-web-us-56) | C5 — widget del chat |
| [9](#9-c6--registrar-los-módulos-en-appmodule) | C6 — registrar los módulos en `app.module.ts` |
| [10](#10-c7--panel-admin-web-us-5455) | C7 — panel admin web |
| [11](#11-c8--smoke-de-s5-en-ci) | C8 — smoke de S5 en CI |
| [12](#12-límites-de-alcance-declarados) | Límites de alcance declarados |
| [13](#13-no-hacer) | No hacer |
| [14](#14-verificación-de-cierre) | Verificación de cierre |
| [15](#15-troubleshooting) | Troubleshooting |
| [16](#16-anexo--reparto-original-por-persona) | Anexo — reparto original por persona |

---

## 0. Qué vas a hacer

### 0.1 Los dos repos y qué papel juega cada uno

| Repo | Remoto | Rol |
|---|---|---|
| **`proyecto-analisis-Eduviagt`** | `equipo` | **Destino.** Aquí trabajas. Rama `develop` = estado S1–S4. |
| `sigeb-prod` | `origin` (en el clon del simulador) | **Referencia.** De aquí sale el código de S5. No se mergea nada de aquí. |

Commits fuente (viven en el remoto del producto):

| Commit | Qué trae |
|---|---|
| `ab66393` | Módulos `reportes/`, `asistente/` y el parche del interceptor. **Merge de 3 padres.** |
| `2e52a69` | `apps/web/src/components/chat/ChatWidget.tsx` (primera versión) |
| `1436e41` | Panel admin web brutalista + `layout.tsx` |

Si tu clon no tiene el remoto del producto:

```bash
git remote add sigeb-prod https://github.com/Deividcodv/sigeb-prod.git
git fetch sigeb-prod
git cat-file -t ab66393   # debe imprimir: commit
```

### 0.2 Por qué no sirve la guía anterior

`README-COLABORADORES-S5.md` se validó contra el **estado del producto terminado**, no contra tu
`develop`. Los ocho puntos que la hacen inaplicable tal cual:

| # | Qué dice la guía anterior | Realidad en tu `develop` |
|---|---|---|
| 1 | `git fetch sigeb-prod` (§0) y `git fetch equipo` (§5) | Dos nombres para lo mismo según la sección |
| 2 | "El seed ya va mergeado" (§2, §3) | Falso: faltan `.gitattributes`, la migración `tsvector`, el permiso `auditoria:ver` y las 33 entradas de la KB |
| 3 | `git checkout 1436e41 -- apps/web/src/app/layout.tsx` (§4) | Ese archivo trae el diseño de S8 con tokens `brutal` que **no existen** en tu repo: rompe el portal |
| 4 | Los espejos de `recreacion/sprint-5/*/repo/` | Al `jose/` le falta el interceptor y al `yemerson/` le falta `layout.tsx` |
| 5 | Smoke de auditoría con `?accion=login >= 5` | En tu repo nadie loguea nada a la bitácora: el bloque no puede pasar |
| 6 | Guion de demo con `?accion=login` (§6) | Mismo problema: devuelve 0 filas |
| 7 | `git worktree add -b feature/s5-datos` (§5) | La rama ya existe en el remoto; el comando falla |
| 8 | Los 4 `git diff` de fidelidad (§7.B) | Verifican la **copia**, no la **colisión con el destino**: por eso el PR de `audit/` salió vacío sin que nadie lo notara |

### 0.3 Entorno local

```bash
git clone https://github.com/Deividcodv/proyecto-analisis-Eduviagt.git
cd proyecto-analisis-Eduviagt
git remote -v                      # debe listar 'equipo' (o 'origin') -> proyecto-analisis-Eduviagt
git checkout develop && git pull

npm install
docker compose up -d              # postgres:16-alpine en 5432 (sigeb / sigeb123 / sigeb)

cd apps/api
cp .env.example .env              # ya trae las variables AI_*; no hay que agregar nada
npx prisma migrate deploy
npx prisma generate
npx prisma db seed                # usuarios admin/postulante + 33 entradas de KB (viene del PR #22)
```

| Servicio | Puerto | Script |
|---|---|---|
| API | 3000 (`/api` global) | `npm run dev:api` |
| Web | 3001 | `npm run dev:web` |
| Todo | — | `npm run dev` |

Usuarios del seed: `admin@sigeb.gov.gt` / `Admin123!` y `postulante@demo.gt` / `Admin123!`.

> ⚠️ **`npm run lint` en `apps/api` ejecuta `eslint --fix`**: modifica tus archivos. Revisa el
> `git diff` después de correrlo.

> ⚠️ **`npx prisma migrate dev` da `EPERM` si la API está corriendo en el 3000.** Para verificar
> migraciones usa `npx prisma migrate deploy`, que no toca el schema.

---

## 1. Preflight

Corre esto **antes** de crear la rama. Cada comando debe dar exactamente lo que dice.

```bash
git fetch equipo && git checkout develop && git pull origin develop
```

### 1.1 Lo que YA existe (no lo copies, no lo rehagas)

```bash
# El módulo de auditoría está completo e idéntico al de S5 -> no hay PR de módulo que entregar
git diff ab66393^1 ab66393 -- apps/api/src/audit    # VACÍO  => nada que traer de S5

# AuditModule ya está registrado y es @Global() (AuditService inyectable desde cualquier módulo)
git grep -n "AuditModule" -- apps/api/src/app.module.ts
git grep -n "@Global" -- apps/api/src/audit/audit.module.ts

# El permiso reporte:ver ya está en el seed; auditoria:ver NO (lo trae el PR #22)
git grep -n "reporte', accion: 'ver'" -- apps/api/prisma/seed.ts

# Estas rutas web ya existen
ls apps/web/src/components/ui/InternalPageHeader.tsx   # SÍ existe
ls apps/web/src/app/layout.tsx                          # existe
git grep -n "httpData" -- apps/web/src/lib/api.ts      # httpData YA existe
```

### 1.2 Lo que NO existe (esto es lo que entregas)

```bash
test -d apps/api/src/reportes   && echo EXISTE || echo NO EXISTE   # esperado: NO EXISTE
test -d apps/api/src/asistente  && echo EXISTE || echo NO EXISTE   # esperado: NO EXISTE
test -d apps/web/src/components/chat && echo EXISTE || echo EXISTE # esperado: NO EXISTE
```

### 1.3 Los 3 archivos que se re-entregan (upgrade declarado)

Los dejó un colaborador en S4. Los sobrescribes a propósito; no es una colisión:

```bash
git ls-tree -r --name-only HEAD -- apps/web/src/app/admin/page.tsx \
  apps/web/src/components/admin apps/web/src/components/home/Convocatorias.tsx
# esperado: page.tsx + Panel{Solicitudes,Comites,Sesiones}.tsx + Convocatorias.tsx
```

Los otros 7 archivos de tu entrega son **nuevos**: `app/perfil/page.tsx`, `PanelUsuarios.tsx`,
`components/home/{HomeShell,LandingPublico,Workbench}.tsx`, `lib/rol.ts`, `lib/seguridad.ts`.

### 1.4 Lo que este Sprint NO trae (déjalo para S6)

| Falta | Por qué |
|---|---|
| `POST/GET/PATCH/DELETE /seguridad/usuarios` | Son de S8. `PanelUsuarios.tsx` los llama: renderiza y sus llamadas fallan |
| `PATCH /auth/perfil` | Es de S6. `/perfil` depende de él |
| `POST /solicitudes` con transición auditada `transicion` | La aserción `transicion` del smoke se mueve a S6 |
| `@CurrentUser()` en el asistente | Deuda de S6; el proxy resuelve `rol: null` a propósito en este sprint |
| Tokens `brutal` de Tailwind | Son del rediseño de S8, no de S5 |

---

## 2. Fase 0 — Mergear el PR #22

**Por qué va primero:** el asistente lee de la base de conocimiento y `GET /audit` exige el permiso
`auditoria:ver`. Los dos vienen del PR #22. Sin él, C4 no tiene datos y el smoke da 403.

> Los comandos de esta sección usan el remoto `equipo`. Si al clonar quedó como `origin`, sustituye
> `equipo/` por `origin/` en las tres líneas siguientes.

**Por qué es PR propio y no la base de tu rama:** son 4 archivos y 202 líneas, autocontenidos. Mergearlos
solos mantiene una revisión pequeña; si los arrastras a tu rama, mezclas la capa de datos con los módulos,
la web y el CI en una sola PR de ~40 archivos.

```bash
# 1) Verificar el contenido
git fetch equipo
git log --oneline equipo/develop..equipo/feature/s5-datos
git diff --stat equipo/develop...equipo/feature/s5-datos
# esperado: 1 commit (035b4f4) y 4 archivos:
#   .gitattributes                                      |   3 +
#   apps/api/prisma/migrations/20260829061028_asistente_tsvector/migration.sql | 10 +
#   apps/api/prisma/schema.prisma                       |   1 +
#   apps/api/prisma/seed.ts                             | 188 +

# 2) Mergear cuando la CI esté verde
gh pr list --head feature/s5-datos
gh pr merge 22 --squash --delete-branch

# 3) Traer el resultado
git checkout develop && git pull origin develop
git merge-base --is-ancestor equipo/feature/s5-datos HEAD && echo "PR1 dentro de develop"
```

**Qué contiene y por qué importa cada cosa:**

| Archivo | Qué hace | Qué rompe si falta |
|---|---|---|
| `.gitattributes` | Fija LF en `*.sh`, `*.bash`, `*.prisma` | El smoke y la migración cambian de fin de línea y fallan en Linux |
| `migrations/20260829061028_asistente_tsvector/migration.sql` | Índice B-tree de `activo` + índice GIN sobre `to_tsvector('spanish', titulo \|\| ' ' \|\| contenido)` | Sin el GIN, el `searchVector` del asistente no usa índice |
| `schema.prisma` | `@@index([activo])` en `AsistenteBaseConocimiento` | El índice B-tree no existe en el modelo |
| `seed.ts` | Permiso `auditoria:ver` + **33** entradas de conocimiento (no 34) | `GET /audit` → 403 para todos; el asistente responde "no encontré información" |

> El `@@index([activo])` duplica el índice que crea la migración a propósito: es lo que hizo el producto
> real y ambos están verificados en `\di asistente_base_conocimiento*`.

---

## 3. Rama y orden de commits

```bash
git checkout -b feature/s5-completo
```

| # | Commit | Cierra | Por qué en este orden |
|---|---|---|---|
| C1 | `feat(audit): instrumentar login y refresh en auth` | US-36 | Genera las entradas de bitácora que el smoke necesita |
| C2 | `feat(reportes): agregados y exportacion CSV con BOM` | US-34, US-35 | Módulo nuevo, aún sin registrar: el build no se entera |
| C3 | `fix(common): no envolver en JSON respuestas ya enviadas` | US-35 | Sin esto el CSV sale como `{"data":"\ufeffid;..."}` |
| C4 | `feat(asistente): base de conocimiento, proxy y fallback` | US-37, US-38, US-39 | Depende de la KB del PR #22 |
| C5 | `feat(web): ChatWidget del asistente con fix de desempaquetado` | US-56 | Depende de C4 |
| C6 | `chore(api): registrar ReportesModule y AsistenteModule` | — | **Después** de C2 y C4: antes rompe el build |
| C7 | `feat(web): panel admin con workbench por rol` | US-54, US-55 | Al final: necesita `InternalPageHeader` (ya existe) |
| C8 | `ci: smoke de S5` | — | Al final: necesita todo lo anterior para arrancar |

Una sola PR al final:

```bash
gh pr create --base develop --title "feat(s5): reportes, auditoria, asistente IA y panel admin" \
  --body "S5 completo con ejecutor unico. US-34/35 reportes + CSV con BOM; US-36 auditoria con instrumentacion de login/refresh en auth; US-37/38/39 asistente con KB tsvector, fallback y LLM opcional; US-54/55 panel admin por rol; US-56 ChatWidget. Smoke de S5 auto-contenido."
```

---

## 4. C1 — Auditoría de login y refresh en auth

> **Único bloque de código escrito a mano del sprint.** Todo lo demás es `git checkout`.

**Por qué hace falta:** el criterio de aceptación de US-36 dice que `GET /audit?accion=login` debe
encontrar accesos. En tu repo solo `users.service.ts` escribe en la bitácora (acciones `crear`, `editar`,
`eliminar`, `asignar-permisos` sobre roles). Sin instrumentar `auth/` no hay ni un solo `login`.

`auth/` es módulo tuyo desde S1, así que esto no rompe la regla de "un módulo = un dueño".
`AuditModule` es `@Global()`, **no hay que tocar `auth.module.ts`**.

### 4.1 `apps/api/src/auth/auth.service.ts`

```ts
// 1) import, junto a los demás imports del archivo
import { AuditService } from '../audit/audit.service';

// 2) constructor: agregar el servicio
constructor(
  private prisma: PrismaService,
  private jwtService: JwtService,
  private configService: ConfigService,
  private audit: AuditService,        // <-- nuevo
) {}

// 3) login: cambiar la firma e insertar el log antes del return
async login(dto: LoginDto, ip?: string) {
  // ... cuerpo actual sin cambios ...
  const tokens = await this.generateTokens(user.id, user.email);

  await this.audit.log({              // <-- nuevo
    usuarioId: user.id,
    accion: 'login',
    entidad: 'usuario',
    entidadId: user.id,
    ip,
  });

  return { ...tokens, user: { /* ... sin cambios ... */ } };
}

// 4) refreshToken: cambiar la firma e insertar el log antes del return
async refreshToken(refreshToken: string, ip?: string) {
  try {
    // ... cuerpo actual sin cambios ...
    const accessToken = this.jwtService.sign(/* ... */);

    await this.audit.log({            // <-- nuevo
      usuarioId: user.id,
      accion: 'refresh',
      entidad: 'usuario',
      entidadId: user.id,
      ip,
    });

    return { accessToken };
  } catch {
    throw new UnauthorizedException('Refresh token inválido');
  }
}
```

> El `audit.log` de `refreshToken` queda **dentro** del `try`, igual que en el producto real. Si la
> escritura a la bitácora fallara, el `catch` lo convertiría en 401. Es el comportamiento del código
> fuente; el smoke no depende de `refresh`.

### 4.2 `apps/api/src/auth/auth.controller.ts`

```ts
// 1) imports
import { Req } from '@nestjs/common';   // agregar Req al import existente de @nestjs/common
import { Request } from 'express';      // import nuevo

// 2) login: pasar el ip
async login(@Body() dto: LoginDto, @Req() req: Request) {
  return this.authService.login(dto, req.ip);
}

// 3) refresh: pasar el ip
async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
  return this.authService.refreshToken(dto.refreshToken, req.ip);
}
```

### 4.3 Verificación

```bash
git status --short        # SOLO los 2 archivos de auth
npm run build -w apps/api && npm run test -w apps/api
npm run dev:api           # en otra terminal
npx prisma db seed        # en otra: asegura el usuario admin
curl -s -X POST localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@sigeb.gov.gt","password":"Admin123!"}' > /dev/null
curl -s "localhost:3000/api/audit?accion=login" -H "Authorization: Bearer $TOKEN" | jq '.data.total'
# esperado: 1 o más
```

---

## 5. C2 — Reportes agregados y CSV (US-34, US-35)

```bash
git checkout ab66393 -- apps/api/src/reportes
git status --short    # SOLO apps/api/src/reportes (4 archivos, nuevos)
```

| Archivo | Qué trae |
|---|---|
| `reportes.controller.ts` | 3 agregados + `:tipo/csv`, todo con `@Permisos('reporte:ver')` |
| `reportes.service.ts` | Agregados con `groupBy` + `generarCsv` con BOM UTF-8 |
| `reportes.module.ts` | Importa `EvaluacionesModule` (solo lectura, es de S4) |
| `reportes.service.spec.ts` | 4 tests con mocks |

**No entra:** `app.module.ts` (es C6) · `seed.ts` · `evaluaciones/` (solo se importa) · `audit/` · `asistente/`.

`EvaluacionesService.scoreSolicitud()` y `prisma.decision.groupBy` existen en tu `develop`, así que el
servicio compila sin tocar nada de S4.

```bash
npm run test -w apps/api          # los 4 tests nuevos deben pasar
git add apps/api/src/reportes
git commit -m "feat(reportes): agregados y exportacion CSV con BOM para admin (US-34, US-35)"
```

---

## 6. C3 — Parche del interceptor global

```bash
git checkout ab66393 -- apps/api/src/common/interceptors/transform.interceptor.ts
git diff --stat    # esperado: 1 archivo, 11 inserciones y 2 eliminaciones; ningún otro
```

El parche completo (el destino tiene exactamente la versión previa, así que el diff es limpio):

```diff
-    _context: ExecutionContext,
+    context: ExecutionContext,
-    return next.handle().pipe(map((data) => ({ data })));
+    const response = context.switchToHttp().getResponse();
+    return next.handle().pipe(
+      map((data) => {
+        // Evita envolver respuestas ya enviadas (p.ej. descargas de CSV)
+        if (response.headersSent) {
+          return data;
+        }
+        return { data };
+      }),
+    );
```

> Es un archivo compartido de S1. Como ejecutor único no haycoordinate con nadie: es tuyo.
> Sin este parche, `GET /reportes/:tipo/csv` devuelve `{"data":"\ufeffid;estado;..."}` y Excel no lo abre.

```bash
npm run build -w apps/api
git add apps/api/src/common/interceptors/transform.interceptor.ts
git commit -m "fix(common): no envolver en JSON las respuestas ya enviadas (headersSent)"
```

---

## 7. C4 — Asistente IA (US-37/38/39)

```bash
git checkout ab66393 -- apps/api/src/asistente
git status --short    # SOLO apps/api/src/asistente (10 archivos, nuevos)
```

| Archivo | Qué trae |
|---|---|
| `asistente.controller.ts` | `POST /asistente/preguntar`, `@Public()`, 400 si la pregunta viene vacía |
| `asistente.service.ts` | Persiste conversación y mensajes |
| `asistente.proxy.ts` + `.spec.ts` | Resuelve proveedor: LLM si hay `AI_API_KEY`, si no fallback; degrada si el LLM falla |
| `asistente.service.spec.ts` | 2 tests con mocks |
| `providers/fallback.provider.ts` | Busca en la KB con `websearch_to_tsquery('spanish', …)`, top 3 por rank |
| `providers/openai.provider.ts` | Cliente compatible con OpenAI, con timeout, **opcional** |
| `asistente.types.ts`, `dto/preguntar.dto.ts`, `asistente.module.ts` | Tipos, validación y cableado |

**No entra:** `app.module.ts` (C6) · `seed.ts` y la migración (PR #22) · `.env.example` (ya trae `AI_*`) ·
`app/layout.tsx` (C5/C7).

```bash
npm run test -w apps/api          # 3 tests nuevos; los 6 existentes no deben romperse
npm run build -w apps/api
git add apps/api/src/asistente
git commit -m "feat(asistente): KB indexada, proxy con fallback y LLM opcional (US-37/38/39)"
```

**Verifica que funciona sin credenciales** (es el requisito: el fallback es el proveedor por defecto):

```bash
npm run dev:api
curl -s -X POST localhost:3000/api/asistente/preguntar -H 'Content-Type: application/json' \
  -d '{"pregunta":"¿cuáles son los requisitos para postular?"}' | jq '.data | {respuesta, fuentes: (.fuentes | length)}'
# esperado: respuesta que contiene "Requisitos" y 3 fuentes
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:3000/api/asistente/preguntar \
  -H 'Content-Type: application/json' -d '{"pregunta":""}'
# esperado: 400
```

---

## 8. C5 — Widget del chat en la web (US-56)

```bash
git checkout 2e52a69 -- apps/web/src/components/chat/ChatWidget.tsx
```

**Fix obligatorio (2 líneas).** La primera versión del widget usa `http()`, y como el
`TransformInterceptor` global envuelve toda respuesta en `{ data }`, la burbuja del chat sale **vacía**:

```diff
-import { http } from '@/lib/api';
+import { httpData } from '@/lib/api';
@@
-const res = await http<Respuesta>('/asistente/preguntar', {
+const res = await httpData<Respuesta>('/asistente/preguntar', {
```

Después del fix, `git diff 2e52a69 -- apps/web/src/components/chat` **no** sale vacío y eso es lo
esperado: el criterio de fidelidad del widget es el diff con el fix aplicado, no el archivo byte a byte.

```bash
npm run build -w apps/web
git add apps/web/src/components/chat/ChatWidget.tsx
git commit -m "feat(web): ChatWidget del asistente con fix httpData (US-56)"
```

> El widget todavía no se ve en ninguna página: falta montarlo en el layout, que es C7.

---

## 9. C6 — Registrar los módulos en `app.module.ts`

> **Este archivo NO se copia.** Se edita a mano: el formato del repo destino difiere del de la fuente y
> copiar el archivo entero rompe el estilo y borra comentarios de los módulos de S1–S4.

```bash
git show origin/develop:apps/api/src/app.module.ts | head -50   # referencia de estilo, no se copia
```

Tres cambios:

```ts
// 1) imports, junto a los demás
import { ReportesModule } from './reportes/reportes.module';
import { AsistenteModule } from './asistente/asistente.module';
// AuditModule YA está importado y registrado: no lo toques

// 2) en el array de imports del @Module({ ... })
    ReportesModule,
    AsistenteModule,
```

```bash
git diff --stat    # SOLO apps/api/src/app.module.ts
npm run build -w apps/api
git add apps/api/src/app.module.ts
git commit -m "chore(api): registrar ReportesModule y AsistenteModule"
```

---

## 10. C7 — Panel admin web (US-54, US-55)

```bash
git checkout 1436e41 -- apps/web/src/app/admin apps/web/src/app/perfil
git checkout 1436e41 -- apps/web/src/components/admin apps/web/src/components/home
git checkout 1436e41 -- apps/web/src/lib/rol.ts apps/web/src/lib/seguridad.ts
```

### 10.1 Los 3 upgrades declarados

| Archivo | Antes (S4) | Ahora |
|---|---|---|
| `app/admin/page.tsx` | Panel de una vista | Workbench por rol con pestañas |
| `components/admin/PanelSolicitudes.tsx` | Versión S4 | Versión `1436e41` |
| `components/admin/PanelComites.tsx` | Versión S4 | Versión `1436e41` |
| `components/admin/PanelSesiones.tsx` | Versión S4 | Versión `1436e41` |

Es un **upgrade acordado**, no una colisión: no los reviertas ni los pidas de vuelta.

### 10.2 Los 7 archivos nuevos

`app/perfil/page.tsx` · `components/admin/PanelUsuarios.tsx` ·
`components/home/{HomeShell,LandingPublico,Workbench}.tsx` · `lib/rol.ts` · `lib/seguridad.ts`

`InternalPageHeader.tsx` **ya existe** en tu `develop`: impórtalo tal cual, no lo copies.
`lib/api.ts` ya exporta `http` y `httpData`.

### 10.3 `app/layout.tsx` — edición quirúrgica, NUNCA copia

Este es el paso donde la guía anterior mete la pata. El `layout.tsx` de `1436e41` trae el **diseño de
S8**: fuentes `Archivo` / `Space_Mono` / `Instrument_Sans` y la clase `brut-body`. Tu repo **no tiene
tokens `brutal`** en `tailwind.config.js` ni en `globals.css` (comprobado: cero coincidencias). Copiarlo
cambia la tipografía y el estilo de todo el portal.

Agrega **solo estas dos líneas**:

```diff
 import { AuthProvider } from '@/context/AuthContext';
+import { ChatWidget } from '@/components/chat/ChatWidget';

 export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
   return (
     <html lang="es">
       <body className={inter.className}>
         <AuthProvider>
           <div className="flex min-h-screen flex-col bg-sigeb-gray">
             <Header />
             <main className="flex-1">{children}</main>
             <Footer />
+            <ChatWidget />
           </div>
         </AuthProvider>
       </body>
     </html>
   );
 }
```

```bash
git diff -- apps/web/src/app/layout.tsx   # SOLO 2 líneas agregadas
npm run build -w apps/web                 # esto es lo que detecta un import roto
git add apps/web/src/app/admin apps/web/src/app/perfil apps/web/src/components/admin \
        apps/web/src/components/home apps/web/src/lib/rol.ts apps/web/src/lib/seguridad.ts \
        apps/web/src/app/layout.tsx
git commit -m "feat(web): panel admin con workbench por rol y matriz de seguridad (US-54/55)"
```

**No entra** (es de S1–S4 o de etapas posteriores): `app/{comite,consulta,convocatorias,dashboard,evaluador,login,nosotros,registro,solicitudes}` ·
`components/{solicitud,consulta,convocatorias,layout}` · `lib/*` salvo `rol.ts` y `seguridad.ts` · `styles/*` ·
`tailwind.config.js` · `app/{reportes,auditoria,ayuda,soporte}` · `app/page.tsx` (es de S6).

---

## 11. C8 — Smoke de S5 en CI

> El smoke **no se copia** del de EDUVIAGT: aquel depende de `.github/scripts/link-doc.cjs` (ausente en
> tu repo) y de flujos de S3/S4 que no aplican. Este es **solo S5** y se sostiene con los 2 logins que
> hace y un rol que crea.

### 11.1 `.github/scripts/smoke-ci.sh` (archivo nuevo)

```bash
#!/usr/bin/env bash
# Smoke del Sprint 5: reportes + CSV, auditoria y asistente IA.
set -euo pipefail

BASE="${BASE_URL:-http://127.0.0.1:3000/api}"

http_request() {
  local method="$1" url="$2" body="${3:-}" resp code
  if [ -n "$body" ]; then
    resp=$(curl -s -w '\n%{http_code}' -X "$method" "$url" \
      -H 'Content-Type: application/json' -d "$body")
  else
    resp=$(curl -s -w '\n%{http_code}' -X "$method" "$url")
  fi
  code=$(printf '%s' "$resp" | tail -n 1)
  printf '%s' "$resp" | sed '$d' > /tmp/smoke-http-body.json
  printf '%s' "$code"
}

login_token() {
  local email="$1" pass="$2" code
  code=$(http_request POST "$BASE/auth/login" "{\"email\":\"$email\",\"password\":\"$pass\"}")
  if [ "$code" != "200" ]; then
    echo "Login $email -> HTTP $code: $(cat /tmp/smoke-http-body.json)" >&2
    return 1
  fi
  jq -r '.data.accessToken' < /tmp/smoke-http-body.json
}

# Espera activa: /catalogos/generos es @Public(), no necesita token.
for i in $(seq 1 30); do
  code=$(http_request GET "$BASE/catalogos/generos")
  if [ "$code" = "200" ]; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "La API no responde despues de 60s (ultimo HTTP: $code)" >&2
    exit 1
  fi
  sleep 2
done

TOKEN_ADMIN=$(login_token "admin@sigeb.gov.gt" "Admin123!") \
  || { echo "Fallo login admin" >&2; exit 1; }
TOKEN_POST=$(login_token "postulante@demo.gt" "Admin123!") \
  || { echo "Fallo login postulante" >&2; exit 1; }

# ---- Sprint 5: reportes y CSV (US-34, US-35) ----
# OJO: el seed de `develop` NO crea convocatorias ni solicitudes (solo roles, permisos,
# becas, catalogos y usuarios). Por eso los agregados se validan por FORMA, no por volumen.
REPORTE_ESTADO=$(curl -sf "$BASE/reportes/solicitudes-por-estado" \
  -H "Authorization: Bearer $TOKEN_ADMIN")
if ! printf '%s' "$REPORTE_ESTADO" | jq -e '.data.total | type == "number"' > /dev/null; then
  echo "solicitudes-por-estado: .data.total no es numero"; exit 1
fi
if ! printf '%s' "$REPORTE_ESTADO" | jq -e '.data.porEstado | type == "array"' > /dev/null; then
  echo "solicitudes-por-estado: .data.porEstado no es arreglo"; exit 1
fi

for PAR in "convocatorias:.data.detalle" "evaluaciones:.data.porConvocatoria"; do
  EP="${PAR%%:*}"
  KEY="${PAR##*:}"
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reportes/$EP" \
    -H "Authorization: Bearer $TOKEN_ADMIN")
  if [ "$code" != "200" ]; then
    echo "Reporte $EP esperaba 200, obtuve $code"; exit 1
  fi
  if ! curl -sf "$BASE/reportes/$EP" -H "Authorization: Bearer $TOKEN_ADMIN" \
      | jq -e "$KEY | type == \"array\"" > /dev/null; then
    echo "Reporte $EP: $KEY no es un arreglo"; exit 1
  fi
done

code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reportes/evaluaciones" \
  -H "Authorization: Bearer $TOKEN_POST")
if [ "$code" != "403" ]; then
  echo "Reporte con postulante esperaba 403, obtuve $code"; exit 1
fi

CSV_HEADERS=$(curl -sf -D - -o /tmp/s5-reporte.csv "$BASE/reportes/convocatorias/csv" \
  -H "Authorization: Bearer $TOKEN_ADMIN")
if ! grep -qi 'content-type:.*text/csv' <<< "$CSV_HEADERS"; then
  echo "El CSV no declara Content-Type: text/csv"; exit 1
fi
if ! grep -qi 'content-disposition:.*attachment' <<< "$CSV_HEADERS"; then
  echo "El CSV no se sirve como adjunto"; exit 1
fi
if grep -q '"data"' /tmp/s5-reporte.csv; then
  echo "El CSV vino envuelto en {data}: falta el parche headersSent (C3)"; exit 1
fi
if [ "$(head -c 3 /tmp/s5-reporte.csv | od -An -tx1 | tr -d ' \n')" != "efbbbf" ]; then
  echo "El CSV no empieza con el BOM UTF-8 (efbbbf)"; exit 1
fi
# aCsv() devuelve solo el BOM cuando el reporte no tiene filas, asi que el encabezado
# solo se comprueba cuando hay datos. El BOM va antes del encabezado: hay que buscarlo.
if [ "$(wc -c < /tmp/s5-reporte.csv)" -gt 3 ]; then
  if ! grep -q $'^\xef\xbb\xbfconvocatoria' /tmp/s5-reporte.csv; then
    echo "El CSV no arranca con el encabezado esperado"; exit 1
  fi
fi

code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reportes/xyz/csv" \
  -H "Authorization: Bearer $TOKEN_ADMIN")
if [ "$code" != "400" ]; then
  echo "CSV tipo invalido esperaba 400, obtuve $code"; exit 1
fi

# ---- Sprint 5: auditoria (US-36) ----
# El modulo audit/ ya venia en `develop`; lo que aporta S5 es instrumentar auth/. Este
# smoke se autentica 2 veces, asi que debe haber >= 2 logins auditados.
ROL_ID=$(curl -sf -X POST "$BASE/seguridad/roles" -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"SMOKE_S5","descripcion":"Rol temporal del smoke"}' | jq -r '.data.id')
if [ -z "$ROL_ID" ] || [ "$ROL_ID" = "null" ]; then
  echo "No se pudo crear el rol del smoke"; exit 1
fi
trap 'curl -sf -o /dev/null -X DELETE "$BASE/seguridad/roles/$ROL_ID" -H "Authorization: Bearer $TOKEN_ADMIN"' EXIT

AUDIT_TOTAL=$(curl -sf "$BASE/audit" -H "Authorization: Bearer $TOKEN_ADMIN" | jq -r '.data.total')
if [ -z "$AUDIT_TOTAL" ] || [ "$AUDIT_TOTAL" -le 0 ]; then
  echo "Sin entradas de auditoria"; exit 1
fi

AUDIT_LOGINS=$(curl -sf "$BASE/audit?accion=login" -H "Authorization: Bearer $TOKEN_ADMIN" \
  | jq -r '.data.items | length')
if [ "$AUDIT_LOGINS" -lt 2 ]; then
  echo "Esperaba >=2 logins auditados, obtuve $AUDIT_LOGINS"; exit 1
fi

AUDIT_SOLO_LOGIN=$(curl -sf "$BASE/audit?accion=login&limit=200" \
  -H "Authorization: Bearer $TOKEN_ADMIN" | jq -r '[.data.items[].accion] | all(. == "login")')
if [ "$AUDIT_SOLO_LOGIN" != "true" ]; then
  echo "El filtro accion=login devolvio otras acciones"; exit 1
fi

AUDIT_CREAR=$(curl -sf "$BASE/audit?accion=crear&limit=200" \
  -H "Authorization: Bearer $TOKEN_ADMIN" | jq -r '.data.items | length')
if [ "$AUDIT_CREAR" -lt 1 ]; then
  echo "El alta de rol no quedo auditada"; exit 1
fi

code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/audit" -H "Authorization: Bearer $TOKEN_POST")
if [ "$code" != "403" ]; then
  echo "Auditoria con postulante esperaba 403, obtuve $code"; exit 1
fi

code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/audit")
if [ "$code" != "401" ]; then
  echo "Auditoria anonima esperaba 401, obtuve $code"; exit 1
fi

# ---- Sprint 5: asistente IA sobre base de conocimiento (US-37/US-39) ----
# Sin AI_API_KEY: el fallback sobre la KB es el proveedor por defecto.
S5_AI=$(curl -sf -X POST "$BASE/asistente/preguntar" -H 'Content-Type: application/json' \
  -d '{"pregunta":"¿cuáles son los requisitos para postular?"}')
S5_AI_FUENTES=$(printf '%s' "$S5_AI" | jq -r '.data.fuentes | length')
if [ -z "$S5_AI_FUENTES" ] || [ "$S5_AI_FUENTES" -lt 1 ]; then
  echo "El asistente respondio sin fuentes: la KB no esta sembrada (falta el PR #22)"; exit 1
fi
if printf '%s' "$S5_AI" | jq -r '.data.respuesta' | grep -q 'No encontré información'; then
  echo "El asistente no encontro nada en la KB"; exit 1
fi

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/asistente/preguntar" \
  -H 'Content-Type: application/json' -d '{"pregunta":""}')
if [ "$code" != "400" ]; then
  echo "Pregunta vacia esperaba 400, obtuve $code"; exit 1
fi

echo "SMOKE CI OK (S5: reportes + CSV con BOM + auditoria + asistente IA)"
```

### 11.2 Por qué estas aserciones

| Aserción | Razón |
|---|---|
| Agregados validados **por forma**, no por volumen | El seed de `develop` no crea convocatorias ni solicitudes, y no hay endpoint de becas para crearlas: un reporte vacío es una respuesta **válida** |
| `?accion=login >= 2` y no `>= 5` | Este smoke hace exactamente 2 logins (admin + postulante). El `>= 5` venía de un smoke que hacía 5 |
| `all(. == "login")` | Verifica que el **filtro** funciona, no que haya N filas. Más robusto que un número mágico |
| `?accion=crear >= 1` | Genera y verifica la bitácora sin depender de `solicitudes` (que es S6) |
| **`BOM efbbbf` con `od`, no con `grep '^convocatoria'`** | El encabezado va **después** del BOM: un `grep` anclado al inicio no lo encuentra. Por eso el chequeo del encabezado usa `$'\xef\xbb\xbfconvocatoria'` |
| `grep '"data"'` negativo | Detecta la regresión del interceptor (C3) |
| `if` en vez de `&&`/`\|\|` para los chequeos negativos | Con `set -e`, una cadena `A && B` que termina en 1 puede matar el script justo cuando la aserción **pasa**. Los `if` son explícitos |
| **Sin `transicion`** | La escribe `solicitudes.transicion`, que es alcance de S6. Queda documentada como deuda |
| Asistente: `fuentes >= 1` y "no encontró" ausente | Es el criterio literal de US-37. La búsqueda usa `websearch_to_tsquery` con **OR** y top-3, así que atar el texto a una palabra concreta (`"Requisitos"`) sería frágil |

### 11.3 `.github/workflows/ci.yml` — un step nuevo

Va **después de `Build`**. Tu `ci.yml` no tiene ningún step de smoke, así que es una adición completa,
no un renombre:

```yaml
      - name: Smoke CI (S5)
        env:
          DATABASE_URL: postgresql://sigeb:sigeb123@localhost:5432/sigeb_test
          JWT_SECRET: test-secret-key
          JWT_REFRESH_SECRET: test-refresh-secret-key
        run: |
          cd apps/api
          npx prisma db seed
          node dist/main.js > /tmp/api.log 2>&1 &
          API_PID=$!
          trap 'kill "$API_PID" || true' EXIT
          cd ../..
          set +e
          bash -x .github/scripts/smoke-ci.sh > /tmp/smoke-trace.log 2>&1
          SMOKE_CODE=$?
          set -e
          if [ "$SMOKE_CODE" -ne 0 ]; then
            echo "===== smoke-trace.log ====="
            tail -n 200 /tmp/smoke-trace.log || true
            echo "===== api.log ====="
            tail -n 150 /tmp/api.log || true
            exit "$SMOKE_CODE"
          fi
          tail -n 5 /tmp/smoke-trace.log
```

`npx prisma db seed` es obligatorio: sin él no hay usuarios ni base de conocimiento.

```bash
bash -n .github/scripts/smoke-ci.sh                        # check de sintaxis
npm run lint && npm run test && npm run build              # local, en verde
bash .github/scripts/smoke-ci.sh                           # con la API arriba
git add .github/scripts/smoke-ci.sh .github/workflows/ci.yml
git commit -m "ci: smoke de S5 (reportes/CSV, auditoria y asistente IA)"
```

---

## 12. Límites de alcance declarados

Esto se declara en el review; no es un bug:

1. **La subtab Usuarios no tiene backend.** `PanelUsuarios.tsx` llama a `/seguridad/usuarios` y
   `PATCH /auth/perfil`, que llegan en S6/S8. Renderiza y sus llamadas fallan. No lo maquilles.
2. **`/perfil` depende de `PATCH /auth/perfil`** (S6).
3. **El asistente resuelve `rol: null`.** El controller es `@Public()` y no pasa `@CurrentUser()`, así que
   el proxy siempre arma contexto de visitante. Deuda de S6.
4. **No hay aserción `transicion` en el smoke.** Requiere instrumentar `solicitudes`, que es S6.
5. **El panel renderiza sin los tokens `brutal-*`.** Los archivos de S5 hacen 291 referencias a
   `brutal-tinta`, `brutal-papel`, `brutal-rojo`, `brutal-lima`, `brutal-label`, … y `develop` no
   define ninguno (`0` coincidencias en `tailwind.config.js` y `globals.css`). Compila y renderiza, pero
   sin bordes, sombras ni paleta. Esos tokens son del rediseño de S8: meterlos aquí adelantaría 4
   sprints de diseño.

---

## 13. No hacer

| Ruta / archivo | Por qué no |
|---|---|
| `apps/api/src/evaluaciones/`, `comites/`, `sesiones/` | Son de S4. `reportes` solo **importa** `EvaluacionesModule` |
| `apps/api/src/auth/` más allá de C1 | El resto de `auth/` es de S1/S4 |
| `apps/api/src/convocatorias/`, `solicitudes/` | De S2/S4; se tocan en S6 |
| `apps/api/prisma/seed.ts` y `migrations/` | Ya vienen del PR #22, mergeado |
| `apps/api/.env.example` | Ya trae `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `AI_TIMEOUT_MS` |
| `apps/web/tailwind.config.js`, `src/styles/globals.css` | El bloque `brutal` es de S8 |
| `apps/web/src/components/ui/InternalPageHeader.tsx` | Ya existe en tu `develop` |
| `apps/web/src/app/{reportes,auditoria,ayuda,soporte}` | Son de S6 |
| `apps/web/src/app/page.tsx` | Es de S6 (activa `HomeShell`) |
| `apps/web/src/components/soporte/`, `app/mis-evaluaciones`, `embudo`, `comparativa` | Etapas posteriores |
| `apps/api/src/constancias/`, PDFs | De S6 |
| Copiar `app.module.ts` o `layout.tsx` completos | Se editan a mano (§9 y §10.3) |

---

## 14. Verificación de cierre

### 14.1 Fidelidad contra la fuente (4 diffs que deben quedar vacíos)

```bash
# Reportes
git diff ab66393^1 ab66393 -- apps/api/src/reportes            # VACÍO
# Asistente
git diff ab66393^1 ab66393 -- apps/api/src/asistente           # VACÍO
# Panel admin (las 12 rutas de §10)
git diff 1436e41 -- apps/web/src/app/admin apps/web/src/app/perfil \
  apps/web/src/components/admin apps/web/src/components/home \
  apps/web/src/lib/rol.ts apps/web/src/lib/seguridad.ts         # VACÍO
# Widget: solo el fix documentado
git diff 2e52a69 -- apps/web/src/components/chat/ChatWidget.tsx  # 2 líneas
```

> `ab66393` es un **merge de 3 padres**: `git diff ab66393 -- <ruta>` siempre sale vacío. Para verificar
> hay que comparar contra `^1`.

### 14.2 No colaste nada de otras etapas

```bash
git diff --name-only origin/develop...HEAD | grep -vE '^\.github|^doc/|^recreacion/' | sort
# Debe listar SOLO rutas de S5 + los 2 archivos de auth de C1
git diff --stat origin/develop...HEAD -- apps/api/prisma | cat
# VACÍO: la capa de datos vino del PR #22
```

### 14.3 Build, tests y smoke

```bash
npm run lint && npm run test && npm run build
docker compose up -d
cd apps/api && npx prisma migrate deploy && npx prisma db seed && cd ../..
bash .github/scripts/smoke-ci.sh
```

### 14.4 Guion de demo

```bash
# API en :3000, web en :3001
# 0) Preparacion: convierte la respuesta en token (el login devuelve { data: { accessToken } })
ADMIN=$(curl -s -X POST localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@sigeb.gov.gt","password":"Admin123!"}' | jq -r '.data.accessToken')

# 1) Reportes: 200 con admin, 403 con postulante
curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $ADMIN" \
  localhost:3000/api/reportes/solicitudes-por-estado

# 2) CSV: BOM y sin envoltura JSON. Ojo, el BOM va ANTES del encabezado
curl -s -o /tmp/r.csv -H "Authorization: Bearer $ADMIN" localhost:3000/api/reportes/convocatorias/csv
head -c 3 /tmp/r.csv | od -An -tx1      # efbbbf
head -c 40 /tmp/r.csv | cat -v          # ^M-^O^M-/?convocatoria,...   NO debe ser {"data"

# 3) Auditoria: filtrada y con la entrada que acaba de crear el smoke
curl -s -H "Authorization: Bearer $ADMIN" "localhost:3000/api/audit?accion=login" | jq '.data.total'
curl -s -H "Authorization: Bearer $ADMIN" "localhost:3000/api/audit?accion=crear" | jq '.data.items[0]'

# 4) Asistente sin credenciales
curl -s -X POST localhost:3000/api/asistente/preguntar -H 'Content-Type: application/json' \
  -d '{"pregunta":"¿cuáles son los requisitos para postular?"}' | jq '.data.fuentes'
```

> El reporte saldra **con cero filas**: el seed no crea convocatorias ni solicitudes y no hay
> endpoint de becas para crearlas por API. Para verlo poblado, inserta una convocatoria por SQL
> (el `becaId` sale de `SELECT id FROM beca LIMIT 1`) o espera al sprint de convocatorias.

En la web (`:3001`):

1. `/admin` → workbench del rol del admin y las 4 pestañas.
2. Widget de chat flotando en cualquier página → pregunta y comprueba que la burbuja **no** sale vacía.
3. `npm run build -w apps/web` verde.

---

## 15. Troubleshooting

| Síntoma | Causa | Solución |
|---|---|---|
| El PR de `audit/` sale vacío | `apps/api/src/audit/` ya está idéntico en `develop` | No es un error: ya está entregado. Tu aporte es C1 |
| `EPERM` al correr `prisma migrate dev` | La API está corriendo en el 3000 | Apágala, o usa `npx prisma migrate deploy` |
| El CSV descarga `{"data":"\ufeffid;..."}` | Falta el parche `headersSent` | Es C3. Verifica que sea el commit en tu rama |
| `GET /audit` da 403 a todos | Falta el permiso `auditoria:ver` | Debe venir del PR #22. Confirma que se mergeó |
| El asistente responde "no encontré información" | La KB no está sembrada | `npx prisma db seed` (el PR #22 agrega las 33 entradas) |
| La burbuja del chat sale vacía | El widget usa `http()` en vez de `httpData()` | Son las 2 líneas del fix de C5 |
| El build de la web se cae tras C7 | Import de un archivo que no existe en tu repo | `InternalPageHeader.tsx` sí existe; revisa que no hayas copiado `components/ui` entero |
| El panel se ve sin estilos | Esperando los tokens `brutal` | Correcto: son de S8, no de S5 |
| Caracteres raros (`�`) en un archivo nuevo | Codificación heredada, no UTF-8 | Reescribe el archivo en UTF-8; `git checkout` del commit fuente lo trae bien |
| `git diff ab66393 -- <ruta>` siempre vacío | `ab66393` es merge de 3 padres | Compara contra `ab66393^1` |
| El lint "modificó" archivos sin que lo hicieras | `npm run lint` de la API corre `eslint --fix` | Revisa `git diff` y commitea lo que corresponda |

---

## 16. Anexo — Reparto original por persona

Contexto histórico. **No lo ejecutes**: el Sprint 5 lo hace una sola persona.

| Persona | Módulo | Fuente | Qué queda de eso |
|---|---|---|---|
| Marcos | `apps/api/src/audit/` | `ab66393` | Ya estaba en el destino → **C1** (instrumentar `auth`) |
| José | `apps/api/src/reportes/` + interceptor | `ab66393` | **C2, C3** |
| Hamilton | `apps/api/src/asistente/` + `ChatWidget.tsx` | `ab66393`, `2e52a69` | **C4, C5** |
| Yemerson | Panel admin + `layout.tsx` | `1436e41` | **C7** |
| David | PR1 datos + PR2 integración + CI | — | **Fase 0, C6, C8** |

Artefactos relacionados:

- Espejos de referencia (solo lectura): `recreacion/sprint-5/`
- Guía original por persona: `README-COLABORADORES-S5.md`
- Auditoría de las instrucciones: `AUDITORIA-S5.md`
- Objetivo y criterios: `goal.md` · `backlog.md`