# Deployment — SIGEB

---

## Entornos

| Entorno | Propósito | URL |
|---|---|---|
<<<<<<< HEAD
| **Local** | Desarrollo individual | localhost |
| **Development** | Integración del equipo | dev.sigeb.gov.gt |
| **Staging** | QA y pruebas | staging.sigeb.gov.gt |
| **Production** | Producción | sigeb.gov.gt |

---

## Docker Compose (desarrollo)

### `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: sigeb-postgres
    environment:
      POSTGRES_DB: sigeb
      POSTGRES_USER: sigeb
      POSTGRES_PASSWORD: sigeb123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sigeb -d sigeb"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Solo levanta Postgres local. La API y la web corren con `npm run dev:*` (ver `doc/operations/setup-guide.md` o `npm run up`).

---

## Docker Compose (producción)

### `docker-compose.prod.yml`

Levanta el stack completo (Postgres + API + Web) con las imágenes Docker del monorepo:

```bash
cp .env.example .env      # definir JWT_SECRET y DB_PASSWORD obligatorios
docker compose -f docker-compose.prod.yml up -d --build
```

Características:
- **API**: build multi-stage (`apps/api/Dockerfile`) con Chromium del sistema para las constancias PDF (US-F7), volumen `storage_data` para documentos y healthcheck.
- **Web**: build multi-stage (`apps/web/Dockerfile`) con `output: 'standalone'`; enruta `/api` hacia el servicio `api` vía `NEXT_PUBLIC_API_PROXY`.
- **Env**: `DB_PASSWORD`, `JWT_SECRET` (obligatorios vía `.env`), `CORS_ORIGIN`, `AI_API_KEY`/`AI_BASE_URL` opcionales.

Para migraciones iniciales:

```bash
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
```
=======
| **Local** | Desarrollo individual | `localhost:3001` |
| **Servidor (Azure)** | Instancia desplegada del prototipo | `http://57.156.58.111:3001` |

> El prototipo se despliega hoy en **una sola VM** (`vm-ubuntu-server`, Azure
> Ubuntu). No hay staging ni producción separados: el entorno `staging` de
> GitHub Actions apunta a esta misma VM. Cuando exista un dominio propio se
> añadirá el proxy TLS delante, sin cambiar la aplicación.

---

## Arquitectura del servidor

| Pieza | Detalle |
|---|---|
| Clone del repositorio | `/home/davi/sigeb` (rama `develop`, remoto `sigeb-prod`) |
| Gestor de procesos | PM2 — `sigeb-api` (`:3000`) y `sigeb-web` (`:3002`) |
| Proxy inverso | nginx en `:3001` → web en `127.0.0.1:3002` |
| Configuración de PM2 | `/home/davi/sigeb.pm2.config.cjs` (fuera del repositorio) |
| Configuración de la API | `/home/davi/sigeb/apps/api/.env` (fuera del repositorio, permisos `600`) |
| Base de datos | PostgreSQL local, escuchando solo en `127.0.0.1:5432` |
| Documentos subidos | `/home/davi/sigeb/storage` |
| Cortafuegos | `ufw` activo, entrada por defecto denegada |

Solo queda expuesto a internet el puerto **3001**, que atiende nginx. La web
(Next.js standalone) y la API escuchan únicamente en la interfaz local del
loopback: las consume el proxy, que corre en la misma máquina. La API además
lee `HOST` para atarse a `127.0.0.1` (`apps/api/src/main.ts`).

El cortafuegos del sistema (`ufw`) cierra el 3000, pero **el NSG de Azure es
la primera barrera** y hay que mantenerlo alineado: por ahora permite 22, 21,
3001 y el rango pasivo de FTP (40000-40100). Cuando exista un dominio propio
hay que **abrir el 80 y el 443** en el NSG y añadir esos *listeners* en
`/etc/nginx/sites-available/sigeb`.

La API lee su configuración con `ConfigModule.forRoot({ isGlobal: true })`
de NestJS, es decir del `.env` del directorio de trabajo del proceso
(`apps/api/.env`). Ese archivo es **la única fuente de verdad** de
`DATABASE_URL`, `JWT_SECRET` y `JWT_REFRESH_SECRET`: no se duplican en los
secretos de GitHub ni se pasan por línea de comandos.
>>>>>>> sigeb-prod/develop

---

## GitHub Actions (CI/CD)

### `.github/workflows/ci.yml`

| Job | Trigger | Qué hace |
|---|---|---|
<<<<<<< HEAD
| `lint-and-test` | push a `develop`, `master`, `feature/**` y PR | lint, `prisma generate`, migraciones, `npm test`, `npm run build` y **smoke HTTP** (Sprints 3-5 + S6/S7 + constancia PDF US-F7) |
| `docker-build` | igual que arriba | compila ambas imágenes Docker para validar los Dockerfiles en cada PR |
| `deploy-staging` | push a `develop` | despliegue SSH (PM2) al servidor de staging |
| `deploy-production` | push a `master` | despliegue SSH (PM2) al servidor de producción |

El smoke usa `puppeteer` para generar el PDF de la constancia: la caché de Chromium se guarda con
`actions/cache` y las librerías del sistema se instalan antes del paso de smoke.

### Secretos de GitHub (Settings → Secrets and variables → Actions)

| Secreto | Uso |
|---|---|
| `DEPLOY_HOST` | IP/host del servidor |
| `DEPLOY_USER` | Usuario SSH |
| `DEPLOY_KEY` | Clave privada SSH |
| `DEPLOY_PORT` | Puerto SSH (default `22`) |
| `DEPLOY_PATH` | Ruta del clone en el servidor |
| `DEPLOY_DATABASE_URL` | `DATABASE_URL` de despliegue |
| `DEPLOY_JWT_SECRET` | `JWT_SECRET` de despliegue |

Los entornos `staging` y `production` están disponibles en Settings → Environments y se recomienda activar
**required reviewers** sobre producción.

---

## Variables de entorno por entorno

### Development
```env
DATABASE_URL=postgresql://sigeb:sigeb123@localhost:5432/sigeb
JWT_SECRET=dev-secret-key
JWT_REFRESH_SECRET=dev-refresh-secret
JWT_REFRESH_EXPIRATION=7d
STORAGE_PATH=./storage
PORT=3000
CORS_ORIGIN=http://localhost:3001
=======
| `api-tests` | push y PR | lint, `prisma generate`, migraciones, seed, `npm run test:api`, `tsc` del API y de la web, build del API y humo de integración |
| `e2e-web` | push y PR | Playwright completo con base efímera |
| `docker-build` | push a `develop` o `master` | compila ambas imágenes Docker para validar los Dockerfiles |
| `deploy-staging` | push a `develop` | despliegue por SSH: `git pull --ff-only`, `npm ci`, `prisma migrate deploy`, build y `pm2 startOrRestart` |
| `deploy-production` | push a `master` **y** `PRODUCTION_READY=true` | mismo procedimiento sobre `master` |

`deploy-production` está **deshabilitado a propósito**: `master` va varias
sprints por detrás de `develop`, así que un push a `master` desplegaría un
código ancientísimo. Se activa poniendo `PRODUCTION_READY=true` en el
entorno `production` de GitHub, una vez que `master` y el servidor estén
alineados.

### Secretos y variables de GitHub

Entorno `staging` (Settings → Environments → staging):

| Secreto | Valor | Uso |
|---|---|---|
| `DEPLOY_HOST` | `57.156.58.111` | IP/host del servidor |
| `DEPLOY_USER` | `davi` | usuario SSH |
| `DEPLOY_KEY` | clave privada en PEM | autenticación SSH |
| `DEPLOY_PORT` | `22` | puerto SSH (opcional, por defecto 22) |
| `DEPLOY_PATH` | `/home/davi/sigeb` | ruta del clone en el servidor |

Variable de repositorio (opcional):

| Variable | Por defecto | Uso |
|---|---|---|
| `PM2_CONFIG_PATH` | `/home/davi/sigeb.pm2.config.cjs` | archivo de configuración de PM2 |
| `DEPLOY_REPO_URL` | `https://github.com/Deividcodv/sigeb-prod.git` | repositorio del que se despliega |
| `DEPLOY_REPO_URL_FALLBACK` | `https://github.com/Deividcodv/sigeb-prod.git` | repositorio de respaldo |

`DEPLOY_DATABASE_URL` y `DEPLOY_JWT_SECRET` **ya no se usan**: la API y las
migraciones leen el `.env` del servidor, y duplicar esos valores en dos
lugares es la forma más fácil de que se desincronicen.

### Cambiar el origen del despliegue a EDUVIAGT

Hoy el servidor se actualiza desde `sigeb-prod`. Cuando el repositorio del
equipo (`proyecto-analisis-Eduviagt`) tenga ya la réplica completa —la guía
está en `Docs/README-JOSE-REPLICA-SIGEB-PROD.md` de ese repositorio—, se
añade la variable `DEPLOY_REPO_URL` en el entorno `staging` de GitHub:

```text
DEPLOY_REPO_URL = https://github.com/Deividcodv/proyecto-analisis-Eduviagt.git
```

A partir del siguiente push a `develop`, el despliegue tira de EDUVIAGT.

**No se publica una versión antigua por error.** El script comprueba que el
remoto de destino tenga la versión actual del proyecto (el archivo
`apps/api/src/auth/eliminar-cuenta.service.ts` sirve de marca). Si todavía
no se hizo la réplica, **despliega desde el repositorio de respaldo** y lo
avisa:

```text
AVISO: el remoto .../proyecto-analisis-Eduviagt.git todavía no tiene
       apps/api/src/auth/eliminar-cuenta.service.ts en la rama develop.
       Se despliega desde .../sigeb-prod.git hasta que la réplica esté lista.
```

En cuanto la réplica esté mergeada, el despliegue pasa a EDUVIAGT sin tocar
nada más.

---

## Variables de entorno del servidor

`/home/davi/sigeb/apps/api/.env` (modo `600`):

```env
DATABASE_URL=postgresql://sigeb:<password>@localhost:5432/sigeb
POSTGRES_DB=sigeb
POSTGRES_USER=sigeb
DB_PASSWORD=<password>
JWT_SECRET=<secreto largo>
JWT_REFRESH_SECRET=<otro secreto largo>
JWT_REFRESH_EXPIRATION=7d
PORT=3000
CORS_ORIGIN=http://57.156.58.111:3001
STORAGE_PATH=/home/davi/sigeb/storage
>>>>>>> sigeb-prod/develop
AI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
CHROME_EXECUTABLE_PATH=
```

<<<<<<< HEAD
### Staging
```env
DATABASE_URL=postgresql://sigeb:${DB_PASSWORD}@staging-db:5432/sigeb
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
STORAGE_PATH=/data/storage
PORT=3000
CORS_ORIGIN=https://staging.sigeb.gov.gt
AI_API_KEY=${AI_API_KEY}
AI_BASE_URL=https://api.openai.com/v1
CHROME_EXECUTABLE_PATH=/usr/bin/chromium
```

### Production
```env
DATABASE_URL=postgresql://sigeb:${DB_PASSWORD}@prod-db:5432/sigeb
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
STORAGE_PATH=/data/storage
PORT=3000
CORS_ORIGIN=https://sigeb.gov.gt
AI_API_KEY=${AI_API_KEY}
AI_BASE_URL=https://api.openai.com/v1
CHROME_EXECUTABLE_PATH=/usr/bin/chromium
```

> `CHROME_EXECUTABLE_PATH` apunta a un Chromium/Chrome del sistema para la generación de constancias
> (US-F7). Si no se define, puppeteer usa el navegador que descargó en su caché.
=======
> `HOST`, `CORS_ORIGIN`, `PORT` y `STORAGE_PATH` también están en
> `/home/davi/sigeb.pm2.config.cjs`. El entorno del proceso tiene prioridad
> sobre el `.env`, así que ambos archivos deben coincidir.
>
> `CHROME_EXECUTABLE_PATH` apunta a un Chromium/Chrome del sistema para generar
> las constancias en PDF (US-F7). Si no se define, Puppeteer usa el navegador
> de su caché.

---

## Docker Compose (alternativa)

`docker-compose.prod.yml` levanta el stack completo (Postgres + API + Web) con
las imágenes Docker del monorepo. Es la opción para un entorno aislado; el
servidor actual usa PM2 sobre una instalación directa de Node.

```bash
cp .env.example .env      # definir JWT_SECRET y DB_PASSWORD obligatorios
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
```

---

## Proxy inverso (nginx)

`/etc/nginx/sites-available/sigeb` (habilitado por symlink en
`sites-enabled`). Es la única entrada pública: escucha en el 3001 y reenvía a
la web en `127.0.0.1:3002`.

```bash
sudo nginx -t                 # validar la configuración
sudo systemctl reload nginx   # recargar sin cortar el servicio
```

Puntos a tener en cuenta:

- `client_max_body_size 10m` es obligatorio: el límite por defecto de nginx
  (1 MB) cortaría las cargas de documentos, que la API admite hasta 5 MB.
- El bloque `map $http_upgrade $connection_upgrade` hace que la cabecera
  `Connection: upgrade` solo se reenvíe cuando el cliente la pide.
- Cuando haya dominio propio, se añaden los `listen 443 ssl` y la redirección
  del 80, y se instala `certbot` para el certificado.
>>>>>>> sigeb-prod/develop

---

## Deploy manual

<<<<<<< HEAD
> El build de ambos workspaces requiere `devDependencies`, por lo que el paso correcto es `npm ci`
> (sin `--production`) antes de `npm run build`. `npm run test`/`lint` son opcionales en el servidor.

### Backend
```bash
# En el servidor
cd /ruta/al/repo
git pull origin master
npm ci
cd apps/api
npx prisma migrate deploy
npx prisma generate
cd ../..
npm run build
pm2 restart sigeb-api --update-env
```

### Frontend
```bash
# En el servidor
cd /ruta/al/repo
git pull origin master
npm ci
npm run build
pm2 restart sigeb-web --update-env
```

> En el servidor los procesos se corren con `pm2` (ver `ecosystem.config.js` si se crea). El workflow de
> GitHub replica exactamente estos pasos por SSH en los jobs `deploy-staging`/`deploy-production`.
=======
Los mismos pasos que ejecuta el workflow, por SSH. El script vive en el
repositorio, así que el despliegue manual y el de CI ejecutan exactamente lo
mismo:

```bash
ssh -i ~/.ssh/ssh-ubuntu.pem davi@57.156.58.111
cd /home/davi/sigeb
bash scripts/deploy-pm2.sh
```

Qué hace, en orden:

1. `git fetch` + `git pull --ff-only` de la rama que se despliega
   (`DEPLOY_BRANCH`, por defecto `develop`).
2. `npm ci`.
3. `prisma migrate deploy` y `prisma generate`. La `DATABASE_URL` se lee del
   `apps/api/.env` del servidor, que no se versiona.
4. `npm run build`.
5. **Copia de `.next/static` y de `public` al árbol standalone.** El output
   `standalone` de Next.js no los incluye: sin este paso el servidor responde
   404 a cada CSS, cada chunk de JavaScript y cada SVG, y el portal se sirve
   sin estilos y sin funcionar. Es el mismo paso que hace el `Dockerfile`.
6. `pm2 startOrRestart` de `sigeb-api` y `sigeb-web`, y `pm2 save`.
7. Comprobación: el script pide el CSS al servidor y **falla si no responde
   200**, para que un despliegue roto no pase inadvertido.

> `pm2 startOrRestart` arranca el proceso si no existe todavía y aplica siempre
> el directorio de trabajo y el entorno del archivo de configuración. Un
> `pm2 restart` con `|| true` deja el servicio caído sin avisar.
>>>>>>> sigeb-prod/develop

---

## Monitoreo

| Herramienta | Propósito |
|---|---|
<<<<<<< HEAD
| PM2 | Process manager para Node.js |
| Sentry | Error tracking |
| Prometheus + Grafana | Métricas (futuro) |

---

*Última actualización: 2026-09-01*
=======
| PM2 | Process manager, reinicio y estado de los procesos |
| PostgreSQL local | Base de datos del prototipo |

---

*Última actualización: 2026-10-22*
>>>>>>> sigeb-prod/develop
