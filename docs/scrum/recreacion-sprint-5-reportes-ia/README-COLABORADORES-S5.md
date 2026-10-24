# README — Colaboradores Sprint 5 (Reportes + Auditoria + Asistente IA + Paneles)

> ## ⚠️ NO EJECUTAR ESTA GUÍA
>
> Se validó contra el estado del **producto terminado** (`EDUVIAGT-prod`), no contra el `develop` del repo
> de trabajo (`equipo/develop` = `proyecto-analisis-Eduviagt`), que está 77 commits atrás. Por eso:
>
> - El módulo `audit/` **ya existe** en el destino, así que el PR de Marcos sale vacío (por diseño, §2).
> - El seed, la migración `tsvector`, el permiso `auditoria:ver` y las 33 entradas de la KB **no están
>   mergeados**: viven solo en `equipo/feature/s5-datos` (PR #22), contrary a lo que dicen §2 y §3.
> - El `git checkout 1436e41 -- apps/web/src/app/layout.tsx` de §4 mete el diseño de S8 con tokens
>   `brutal` que no existen en el destino. Se edita a mano.
> - El bloque de smoke de auditoría (`?accion=login >= 5`, `accion == "transicion"`) **no puede pasar**:
>   en el destino nadie instrumentó `auth/` ni `solicitudes/`.
> - Los espejos de `recreacion/sprint-5/{jose,yemerson}/repo/` no traen los dos archivos que esta guía
>   manda copiar.
>
> El Sprint 5 lo ejecuta **una sola persona (Marcos)**; los demás no participan por PTO.
> **Para ejecutarlo: [`README-EJECUCION-S5.md`](README-EJECUCION-S5.md).**
> El detalle de cada hallazgo: [`AUDITORIA-S5.md`](AUDITORIA-S5.md).

---

Guia paso a paso para David, Jose, Marcos, Hamilton y Yemerson. Contiene los comandos y los
cambios de codigo exactos que debe hacer cada uno, con base en las fuentes `ab66393` (Jose, Marcos
y Hamilton: API de `reportes`, `audit` y `asistente`), `2e52a69` (Hamilton: widget del chat) y
`1436e41` (Yemerson: panel admin brutalista) del remote `EDUVIAGT-prod`, sobre `develop` del repo de
trabajo del equipo.

> Sprint de 5 dias: 28 sep - 02 oct. 44 puntos. Cierre de sprint el viernes 02 oct con review y
> retrospectiva. La simulacion continua en S6 (05-16 oct).

---

## §0 Precondiciones comunes (todos)

Si el remote `EDUVIAGT-prod` no existe aun en tu clon:

```bash
cd /c/proyectos/<tu-repo-de-equipo>
git remote add EDUVIAGT-prod https://github.com/Deividcodv/EDUVIAGT-prod.git
git fetch EDUVIAGT-prod
```

Antes de **crear tu rama**, siempre:

```bash
git checkout develop
git pull origin develop
```

### Reglas de oro

- La PR va con base **`develop`**, titulo y commit **convencionales**, CI **verde**.
- Tu PR debe contener **solo tus archivos** (+ el bloque de infra que el §5 asigna a David).
- **NO** copies archivos de otros miembros aunque esten en el mismo commit fuente. Cada archivo
  tiene un dueno.
- **NO** copies paginas web que todavia no son del sprint: de `1436e41` fuera de las rutas de §4
  (ver checklist en §7), nada de etapas posteriores (`e36ac2c`, `dcba851`, `99429da`, `5d4cb1f`).
- Los espejos de referencia estan en `recreacion/sprint-5/<miembro>/` dentro del repo de la
  simulacion. **Son de solo lectura**: no corras los `git checkout` de esta guia en ese repo, solo
  en tu clon de trabajo.

### Tabla de archivos compartidos y dueno en S5

Estos archivos los toca mas de una historia y por eso tienen un dueno explicito:

| Archivo compartido | Quien lo entrega | Por que |
|--------------------|------------------|---------|
| `apps/api/prisma/seed.ts` | David | Permiso `auditoria:ver` + las 33 entradas de conocimiento |
| `apps/api/prisma/schema.prisma` + migracion `20260829061028_asistente_tsvector` | David | `@@index([activo])` + indice GIN funcional sobre `to_tsvector('spanish', titulo \|\| ' ' \|\| contenido)` |
| `.gitattributes` | David | Fija LF en `*.sh`, `*.bash` y `*.prisma`; sin esto el smoke y la migracion cambian de fin de linea |
| `apps/api/src/common/interceptors/transform.interceptor.ts` | Jose (coordinado con Marcos) | Sin `headersSent` el CSV sale envuelto en `{ data }` |
| `apps/api/src/app.module.ts` | David (PR2) | Registra `ReportesModule` y `AsistenteModule`. Va en la PR2: antes el build falla |
| `.github/scripts/smoke-ci.sh` + `.github/workflows/ci.yml` | David (PR2) | Smoke de S5. En `develop` no existe ninguno de los dos: es adicion completa, no renombre |
| `apps/web/src/app/layout.tsx` | Yemerson (monta el `ChatWidget` de Hamilton) | Un solo lugar donde se monta el chat |

En `develop` ya existen y **no** son de nadie en S5: `apps/api/.env.example` (con las variables
`AI_*`), `apps/web/src/components/ui/InternalPageHeader.tsx` y `apps/api/src/audit/`.

### Verificar contra un commit merge (importante)

`ab66393` es un **merge de 3 padres**, asi que `git diff ab66393 -- <ruta>` devuelve siempre vacio.
Para copiar se usa `git checkout ab66393 -- <ruta>` (funciona igual), pero para **verificar
fidelidad** hay que comparar contra el primer padre:

```bash
git diff ab66393^1 ab66393 -- apps/api/src/reportes   # debe quedar VACIO
```

`1436e41` y `2e52a69` son commits normales: `git diff 1436e41 -- <ruta>` si funciona.

---

## §1 JOSE — Reportes agregados + exportacion CSV (US-34, US-35)

Entregable: el modulo `reportes` de `ab66393`.

```bash
git fetch EDUVIAGT-prod
git checkout develop && git pull origin develop
git checkout -b feature/reportes-csv

# Modulo de reportes (4 archivos)
git checkout ab66393 -- apps/api/src/reportes

# Parche propio del interceptor global para que el CSV salga crudo (archivo compartido, §0)
git checkout ab66393 -- apps/api/src/common/interceptors/transform.interceptor.ts

git status   # SOLO apps/api/src/reportes y apps/api/src/common/interceptors
git add apps/api/src/reportes apps/api/src/common/interceptors/transform.interceptor.ts
git commit -m "feat(reportes): agregados y exportacion CSV con BOM para admin (US-34, US-35)"
git push -u origin feature/reportes-csv
```

### Archivos NO incluidos en tu PR

- `apps/api/src/app.module.ts` → lo registra **David** (§5, PR2). Sin eso el modulo no se registra.
- `apps/api/prisma/seed.ts` (permiso `reporte:ver` ya existe del sprint 1) → no lo toques.
- `.github/scripts/smoke-ci.sh`, `.github/workflows/ci.yml` → **David** (§5, PR2).
- `.gitattributes` → **David** (§5, PR1, ya mergeado).
- `apps/api/src/evaluaciones/` → es de S4 y solo se **importa** (`EvaluacionesModule` en
  `reportes.module.ts`); no lo copies ni lo modifiques.
- No copies nada de `apps/api/src/audit/` ni `apps/api/src/asistente/` (Marcos y Hamilton).

### Dependencias de S4 (ya existen en `develop`)

`EvaluacionesModule` (para el reporte de evaluaciones). No copies nada.

### Abrir la PR

```bash
gh pr create --base develop --title "feat(api): S5 reportes" --body "US-34/35: 3 agregados + CSV con BOM; parche headersSent en el interceptor. app.module, seed y smoke los aplica David. CI verde"
```

### Verificacion antes de avisar a David

```bash
git diff ab66393^1 ab66393 -- apps/api/src/reportes
git diff ab66393^1 ab66393 -- apps/api/src/common/interceptors/transform.interceptor.ts
# Todas las diferencias deben quedar VACIAS
git log --oneline -3
```

---

## §2 MARCOS — Modulo de auditoria (US-36)

Entregable: el modulo `audit` de `ab66393`.

```bash
git fetch EDUVIAGT-prod
git checkout develop && git pull origin develop
git checkout -b feature/auditoria-registro

git checkout ab66393 -- apps/api/src/audit

git status   # SOLO apps/api/src/audit
git add apps/api/src/audit
git commit -m "feat(audit): registro de auditoria dirigido con GET /audit (US-36)"
git push -u origin feature/auditoria-registro
```

### Archivos NO incluidos en tu PR (decision del sprint)

En el producto real el commit `16f724d` instrumento `AuditService` en 8 modulos de dominio (auth,
convocatorias, solicitudes, evaluaciones, comites, sesiones, users) y toco 4 specs mas. **En S5 no
lo hacemos**: tu PR es **solo el modulo `audit/`**. La instrumentacion dirigida se planifica en S6
para no romper la regla de "un modulo = un dueno". Queda anotado en el `goal.md` y en la
retrospectiva del sprint.

- `apps/api/src/app.module.ts` → **David** (§5, PR2).
- `apps/api/prisma/seed.ts` (permiso `auditoria:ver`) → **David** (§5, PR1, ya mergeado).

> Ojo: `apps/api/src/audit/` **ya existe completo en `develop`** (incluido su `spec`). Tu PR puede
> quedar vacia; no rehagas el modulo. Si quieres aportar, el trabajo real es la instrumentacion
> dirigida, que por acuerdo de sprint se hace en S6.
- `apps/api/src/auth/`, `users/`, `convocatorias/`, `solicitudes/`, `evaluaciones/`, `comites/`,
  `sesiones/` → **no los toques en S5**.
- El interceptor global lo entrega **Jose** (§1) en este sprint.

### Abrir la PR

```bash
gh pr create --base develop --title "feat(api): S5 auditoria" --body "US-36: AuditService.log() + GET /audit paginado con permiso auditoria:ver. Solo el modulo; la instrumentacion dirigida de los modulos de dominio queda para S6. Registro en app.module y permiso los aplica David"
```

### Verificacion antes de avisar a David

```bash
git diff ab66393^1 ab66393 -- apps/api/src/audit
# Debe quedar VACIO
```

---

## §3 HAMILTON — Asistente IA (US-37/38/39) + widget del chat (US-56)

Entregable: el modulo `asistente` de `ab66393` y el widget de `2e52a69`.

```bash
git fetch EDUVIAGT-prod
git checkout develop && git pull origin develop
git checkout -b feature/asistente-ia

# Modulo de asistente (10 archivos)
git checkout ab66393 -- apps/api/src/asistente

# Widget del chat (primera version, la de 2e52a69)
git checkout 2e52a69 -- apps/web/src/components/chat/ChatWidget.tsx

git status   # SOLO apps/api/src/asistente y apps/web/src/components/chat
git add apps/api/src/asistente apps/web/src/components/chat/ChatWidget.tsx
git commit -m "feat(asistente): KB indexada, proxy con fallback y widget de chat (US-37/38/39/56)"
git push -u origin feature/asistente-ia
```

### Fix obligatorio del widget (lo haces tu, son 2 lineas)

`2e52a69` es la **primera** version del widget (despues se toca en `5d4cb1f`, `99429da` y `1436e41`).
Viene con un bug: usa `http()` en vez de `httpData()`, y como el `TransformInterceptor` global
envuelve toda respuesta en `{ data }`, la burbuja del chat sale **vacia**.

```tsx
// apps/web/src/components/chat/ChatWidget.tsx
-import { http } from '@/lib/api';
+import { httpData } from '@/lib/api';
...
-const res = await http<Respuesta>('/asistente/preguntar', {
+const res = await httpData<Respuesta>('/asistente/preguntar', {
```

Despues del fix tu `git diff` contra `2e52a69` **ya no sale vacio**, y eso es lo esperado: el criterio
de fidelidad del widget es el diff con el fix aplicado, no el archivo byte a byte.

### Archivos NO incluidos en tu PR

- `apps/api/src/app.module.ts` → **David** (§5, PR2).
- `apps/api/prisma/seed.ts` (array `conocimiento`, 33 entradas) → **David** (§5, PR1). El archivo
  es suyo y ya va mergeado; tu contribucion es revisar el contenido de la KB, no editar el seed.
- Migracion `tsvector` + indice GIN y `@@index([activo])` → **David** (§5, PR1).
- `apps/api/.env.example` → ya tiene las variables `AI_*`, no lo toques.
- `apps/web/src/app/layout.tsx` (montar `<ChatWidget />`) → **Yemerson** (§4).
- `apps/web/src/app/soporte/page.tsx` (`99429da`), `apps/web/src/components/soporte/MiniAsistente.tsx`
  (`5d4cb1f`), `SeedAsistente.tsx` → **son de S6 o posterior, no se copian**.
- Nada de `apps/api/src/audit/` ni `apps/api/src/reportes/`.

### Deuda conocida de US-38

El controller no pasa `@CurrentUser()`, asi que el proxy siempre resuelve contexto de visitante
(`rol: null`). Se acepta en este sprint y se cierra en S6; no amplies tu PR para arreglarlo.

### Abrir la PR

```bash
gh pr create --base develop --title "feat(asistente): S5 IA" --body "US-37/38/39: KB tsvector, POST /asistente/preguntar publico, proxy con fallback y LLM opcional. US-56 adelantada: ChatWidget con fix httpData. Migracion, seed, app.module y .env los aplica David"
```

### Verificacion antes de avisar a David

```bash
git diff ab66393^1 ab66393 -- apps/api/src/asistente
# Debe quedar VACIO
git diff 2e52a69 -- apps/web/src/components/chat/ChatWidget.tsx
# Debe mostrar SOLO las 2 lineas del fix http -> httpData
```

---

## §4 YEMERSON — Panel admin web con workbench por rol (US-54, US-55)

Entregable: 12 archivos de `1436e41`.

```bash
git fetch EDUVIAGT-prod
git checkout develop && git pull origin develop
git checkout -b feature/panel-admin

# Paginas admin y perfil
git checkout 1436e41 -- apps/web/src/app/admin apps/web/src/app/perfil
# Paneles y componentes del workbench
git checkout 1436e41 -- apps/web/src/components/admin apps/web/src/components/home
# Logica de rol y seguridad
git checkout 1436e41 -- apps/web/src/lib/rol.ts apps/web/src/lib/seguridad.ts
# Montaje del widget de chat de Hamilton (archivo compartido, §0)
git checkout 1436e41 -- apps/web/src/app/layout.tsx

git status
git add apps/web/src/app/admin apps/web/src/app/perfil apps/web/src/components/admin apps/web/src/components/home apps/web/src/lib/rol.ts apps/web/src/lib/seguridad.ts apps/web/src/app/layout.tsx
git commit -m "feat(web): panel admin con workbench por rol y matriz de seguridad (US-54/55)"
git push -u origin feature/panel-admin
```

### Excepcion declarada al protocolo anti-interferencia

`app/admin/page.tsx`, `PanelSolicitudes.tsx`, `PanelComites.tsx` y `PanelSesiones.tsx` **ya existen en
`develop`**: los dejo **Hamilton en S4** desde `3cb58e9`. Tu PR los **re-entrega** con la version
brutalista de `1436e41`. Es un upgrade acordado y documentado (esta seccion + el README de Hamilton
de S5), no una colision: no lo revertas ni lo pidas de vuelta, y no re-litigues el archivo al hacer
force-with-lease.

Los 8 archivos que si son nuevos tuyos: `app/perfil/page.tsx`, `PanelUsuarios.tsx`,
`components/home/{HomeShell,LandingPublico,Workbench,Convocatorias}.tsx`, `lib/rol.ts`,
`lib/seguridad.ts`.

### Archivos NO incluidos en tu PR

De `1436e41` existe mucho mas web, y todo lo demas ya es de S1-S4 o de etapas posteriores:
`app/comite`, `app/consulta`, `app/convocatorias`, `app/dashboard`, `app/evaluador`, `app/login`,
`app/nosotros`, `app/registro`, `app/solicitudes`, `components/solicitud`, `components/layout`,
`components/ui`, `components/consulta`, `components/convocatorias`, `lib/*` (salvo `rol.ts` y
`seguridad.ts`), `styles/*` → **no se copian**.
- `apps/web/src/app/reportes`, `app/auditoria`, `app/ayuda`, `app/soporte` → **son de S6**, no.
- `apps/web/src/app/page.tsx` → **es de S6** (aun asi, montalo en tu PR solo si David lo aprueba:
  es lo que activa `HomeShell`).
- `tailwind.config.js` y `globals.css` → **no son de S5**. El bloque `brutal` viene de `1436e41`
  (sprint 8, redisenio brutalista) y `ab66393` no toca esos archivos. Si tu panel los necesita para
  verse bien, su estilo va en clases de Tailwind ya existentes (`EDUVIAGT.*`) o se acuerda el bloque
  brutal como parte del sprint de redisenio, no de S5.
- `apps/web/src/components/ui/InternalPageHeader.tsx` → ya existe en `develop`, importalo tal cual.
- Nada de `apps/api/`.

### La subtab Usuarios no tiene backend (limitation consciente)

`PanelUsuarios.tsx` llama a `/seguridad/usuarios` y `PATCH /auth/perfil`, que en el producto real
llegan en S6 con la migracion `20260902024700_usuario_datos_perfil`. En S5 **no los construyas**: la
pestana renderiza y sus llamadas fallan. Se declara como limitacion en el review, no es un bug.

### Abrir la PR

```bash
gh pr create --base develop --title "feat(web): S5 panel admin" --body "US-54/55: workbench por rol, paneles de solicitudes/comites/sesiones/usuarios y matriz de roles. Upgrade declarado de los 4 paneles de S4. Monta el ChatWidget de Hamilton. InternalPageHeader ya existe en develop"
```

### Verificacion antes de avisar a David

```bash
git diff 1436e41 -- apps/web/src/app/admin apps/web/src/app/perfil apps/web/src/components/admin apps/web/src/components/home apps/web/src/lib/rol.ts apps/web/src/lib/seguridad.ts
# Debe quedar VACIO
```

---

## §5 DAVID — Infra compartida, orden de merge y aprobacion

La infra de S5 se entrega en **dos PRs**, porque una sola no puede quedar verde. `develop` no tiene
`apps/api/src/reportes/` ni `apps/api/src/asistente/`: registrar esos modulos en `app.module.ts`
rompe el build, y el smoke de CI pega contra endpoints que no existen.

### PR 1 — Datos (`feature/s5-datos`, PR #22, ya abierta)

Capa sobre la que se apoyan reportes y asistente. No toca modulos ni CI, asi que se puede mergear
con `develop` en S4 y con CI verde.

```bash
git fetch equipo
git worktree add -b feature/s5-datos ../equipo-s5 equipo/develop

# 1) Indice sobre activo (una linea en el modelo AsistenteBaseConocimiento)
# 2) Migracion del indice GIN (copiar el archivo, no regenerar con migrate dev)
# 3) Seed: permiso auditoria:ver + las 33 entradas de la base de conocimiento
# 4) .gitattributes: fija LF en *.sh, *.bash y *.prisma
```

Verificado localmente contra `postgres:16-alpine` limpio: `prisma validate`, `migrate deploy`
(3 migraciones), `prisma generate`, `db seed`, `lint` (0 errores), 93/93 tests del API y `build`.
Los dos indices se confirman en `\di asistente_base_conocimiento*`.

> La entrada de la base de conocimiento son **33**, no 34. Los indices GIN y B-tree aparecen tambien
> en `\di`, pero el seed tiene 33 filas.

### PR 2 — Integracion (`feature/s5-integracion`, despues de Jose y Hamilton)

```bash
# 1) Registrar SOLO los dos modulos nuevos, con edicion quirurgica (no copiar el archivo entero:
#    el formato del repo es distinto al de la fuente y se perderia el estilo del repo)
# 2) .github/scripts/smoke-ci.sh: agregar el archivo completo (en develop no existe)
# 3) .github/workflows/ci.yml: agregar el step "Smoke Sprints 3-5 (API)" despues de Build
```

En `ci.yml` de `develop` **no existe ningun step de smoke** (a diferencia del linaje de
`EDUVIAGT-prod`, donde es un renombre de `Sprints 3-4` a `Sprints 3-5`), asi que es una adicion
completa del step, no un cambio de nombre.

El `smoke-ci.sh` de la fuente se escribio contra el S3/S4 de `EDUVIAGT-prod`. El S4 de `develop` es una
reimplementacion independiente, asi que hay que correrlo localmente contra Postgres antes de hacer
push: si falla por una diferencia real de contrato (envoltorio `.data`, codigos de transicion,
quorum), se ajusta el script y se documenta en la PR.

### Fuera de alcance de S5

- `apps/api/.env.example` ya tiene `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` y `AI_TIMEOUT_MS`.
- `apps/web/src/components/ui/InternalPageHeader.tsx` ya existe.
- `apps/api/src/audit/` ya existe: **Marcos no tiene nada que entregar** en `develop`.
- `apps/web/tailwind.config.js` y `globals.css` **no son de S5**: el bloque `brutal` viene de
  `1436e41` (*sprint 8 - redisenio brutalista*), y `ab66393` no toca esos archivos. Meterlos en S5
  adelanta 4 sprints de diseno y adelanta el trabajo de Yemerson.

### Orden de merge y aprobacion

**David (datos) → Jose → Hamilton → David (integracion) → Yemerson**

1. **David PR1** (datos): indices, seed, permiso, `.gitattributes`. No depende de nadie.
2. **Jose**: reportes + el parche `headersSent` del interceptor (que Marcos necesita para que el JSON
   de `GET /audit` siga siendo JSON).
3. **Hamilton**: asistente + widget. Depende del seed y de la migracion de David (PR1).
4. **David PR2** (integracion): `app.module.ts` registra `ReportesModule` y `AsistenteModule`, mas el
   smoke. Va **despues** de Jose y Hamilton, porque antes el build falla al importar modulos que no
   existen. Aqui si aplica `AuditModule` ya presente en `develop`.
5. **Yemerson**: panel admin, al final, cuando los endpoints ya estan en `develop`. Es el unico PR
   que **sobreescribe** archivos de otro (upgrade de los 4 paneles de S4) y el unico que monta el
   `layout.tsx`.

David aprueba cada PR solo si el `git diff` contra la fuente queda vacio (o, en el widget, muestra
solo el fix documentado) y la CI esta verde.

---

## §6 Guion de verificacion del sprint (demo del 02 oct)

Con API en `:3000` y web en `:3001`. Los permisos se validan con el token de un ADMIN y otro de
POSTULANTE.

```bash
# 1) Reportes: 200 con ADMIN, 403 con POSTULANTE
curl -s -H "Authorization: Bearer $ADMIN" localhost:3000/api/reportes/solicitudes-por-estado
curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $POSTULANTE" localhost:3000/api/reportes/solicitudes-por-estado

# 2) CSV: content-type, attachment y BOM (los 3 primeros bytes deben ser EF BB BF)
curl -s -D - -o /tmp/rep.csv -H "Authorization: Bearer $ADMIN" localhost:3000/api/reportes/solicitudes-por-estado/csv
xxd -l 3 /tmp/rep.csv        # debe imprimir efbb bf
head -c 60 /tmp/rep.csv       # NO debe empezar por {"data":

# 3) Auditoria: paginada y filtrada
curl -s -H "Authorization: Bearer $ADMIN" "localhost:3000/api/audit?page=1&limit=20"
curl -s -H "Authorization: Bearer $ADMIN" "localhost:3000/api/audit?accion=login"

# 4) Asistente: publico, con fuentes y 400 si la pregunta va vacia
curl -s -X POST localhost:3000/api/asistente/preguntar -H 'Content-Type: application/json' -d '{"pregunta":"Como postulo a una beca?"}'
curl -s -X POST localhost:3000/api/asistente/preguntar -H 'Content-Type: application/json' -d '{"pregunta":""}'

# 5) Mismo resultado de asistente con y sin la llave (el fallback es el proveedor por defecto)
#    (reinicia la API sin la variable y repite el punto 4)
```

Scripts reales (raiz con turbo): `npm run dev` levanta todo, `npm run dev -w apps/api` solo la API,
`npm run dev -w apps/web` solo la web (puerto 3001), `npm run build -w apps/web` compila la web.

En la web (`:3001`):
1. `/admin` → workbench con el workbench del rol del admin y las 4 pestañas.
2. `/perfil` → perfil con el header de acciones.
3. Widget de chat flotando en cualquier pagina → preguntar y ver la burbuja con respuesta y fuentes
   (si sale vacia, es el bug de `http()`: revisa que quedara `httpData`).
4. `npm run build -w apps/web` verde (esto es lo que detecta un import roto en el panel admin; `InternalPageHeader` ya existe, asi que si falla es otro archivo tuyo).

---

## §7 Apendices

### A. Checklist de exclusiones de S5

Nada de esto se copia en S5, aunque exista en los commits fuente:

| Ruta / archivo | Por que no |
|----------------|------------|
| `apps/api/src/auth/`, `users/`, `convocatorias/`, `solicitudes/`, `evaluaciones/`, `comites/`, `sesiones/` | Son de S1/S4. En `16f724d` la auditoria los instrumenta, pero esa parte es de S6 |
| `apps/api/src/evaluaciones/` (metricas) | Depende de S4; `reportes` solo importa `EvaluacionesModule` |
| `apps/web/src/app/solicitudes/nueva`, `app/solicitudes/[id]`, `app/ayuda`, `app/consulta` | De S6 y posteriores |
| `apps/web/src/components/solicitud/`, `components/consulta/`, `components/convocatorias/` | De S4/S6 |
| `apps/web/src/app/soporte/`, `components/soporte/MiniAsistente.tsx`, `SeedAsistente.tsx` | `99429da` y `5d4cb1f`, de S6 en adelante |
| `apps/web/src/app/mis-evaluaciones`, `embudo`, `comparativa` | `e36ac2c` (etapa posterior) |
| `apps/api/src/reportes/*` metricas de embudo/comparativa | Version de etapa posterior, no la de S5 |
| `constancias`, PDFs, `app/page.tsx` con `HomeShell` | De S6 |
| `tailwind.config.js` / `globals.css` con tokens `brutal` | De S8 (`1436e41`, redisenio brutalista). `ab66393` no los toca: no son de S5 |
| `apps/api/.env.example`, `InternalPageHeader.tsx`, `apps/api/src/audit/` | Ya existen en `develop`; no se copian de ninguna fuente |

Verificacion de que nada se coló:

```bash
git diff ab66393^1 ab66393 -- apps/web/src
# Debe quedar VACIO en los PRs de API (quien lo traiga, looka)
git status --short
```

### B. Verificacion de fidelidad al cierre del sprint (David)

Los 4 diffs que deben quedar vacios al cierre:

```bash
# Reportes (Jose)
git diff ab66393^1 ab66393 -- apps/api/src/reportes
# Auditoria (Marcos)
git diff ab66393^1 ab66393 -- apps/api/src/audit
# Asistente (Hamilton)
git diff ab66393^1 ab66393 -- apps/api/src/asistente
# Panel admin (Yemerson)
git diff 1436e41 -- apps/web/src/app/admin apps/web/src/app/perfil apps/web/src/components/admin apps/web/src/components/home apps/web/src/lib/rol.ts apps/web/src/lib/seguridad.ts
# Widget (Hamilton) - solo el fix documentado
git diff 2e52a69 -- apps/web/src/components/chat/ChatWidget.tsx
```

Y los 3 bloques de smoke de S5 deben estar en `.github/scripts/smoke-ci.sh`:

```bash
grep -n "Sprint 5" .github/scripts/smoke-ci.sh
# Sprint 5: reportes y CSV (US-34, US-35)
# Sprint 5: auditoria (US-36)
# Sprint 5: asistente IA sobre base de conocimiento (US-37/US-39)
```

### C. Donde queda cada cosa

- Espejos de referencia (solo lectura): `recreacion/sprint-5/{jose,marcos,hamilton,yemerson}/`.
- Artefactos Scrum del sprint: `docs/scrum/recreacion-sprint-5-reportes-ia/`.
- Artefactos del producto real (referencia, no copiar): `docs/scrum/sprint-5-reportes-ia/`.
