# Deployment — SIGEB

---

## Entornos

| Entorno | Propósito | URL |
|---|---|---|
| **Local** | Desarrollo individual | `localhost:3001` |
| **Servidor (Azure)** | Instancia desplegada del prototipo | `http://57.156.58.111` |

> El prototipo se despliega hoy en **una sola VM** (`vm-ubuntu-server`, Azure
> Ubuntu). No hay staging ni producción separados: el entorno `staging` de
> GitHub Actions apunta a esta misma VM. Cuando exista un dominio propio se
> añadirá el proxy TLS delante, sin cambiar la aplicación.

---

## Arquitectura del servidor

| Pieza | Detalle |
|---|---|
| Clone del repositorio | `/home/davi/sigeb` (rama `develop`, remoto `sigeb-prod`) |
| Gestor de procesos | PM2 — `sigeb-api` (`:3000`) y `sigeb-web` (`:3001`) |
| Configuración de PM2 | `/home/davi/sigeb.pm2.config.cjs` (fuera del repositorio) |
| Configuración de la API | `/home/davi/sigeb/apps/api/.env` (fuera del repositorio, permisos `600`) |
| Base de datos | PostgreSQL local, escuchando solo en `127.0.0.1:5432` |
| Documentos subidos | `/home/davi/sigeb/storage` |
| Cortafuegos | `ufw` activo, entrada por defecto denegada |

La API lee su configuración con `ConfigModule.forRoot({ isGlobal: true })`
de NestJS, es decir del `.env` del directorio de trabajo del proceso
(`apps/api/.env`). Ese archivo es **la única fuente de verdad** de
`DATABASE_URL`, `JWT_SECRET` y `JWT_REFRESH_SECRET`: no se duplican en los
secretos de GitHub ni se pasan por línea de comandos.

---

## GitHub Actions (CI/CD)

### `.github/workflows/ci.yml`

| Job | Trigger | Qué hace |
|---|---|---|
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

`DEPLOY_DATABASE_URL` y `DEPLOY_JWT_SECRET` **ya no se usan**: la API y las
migraciones leen el `.env` del servidor, y duplicar esos valores en dos
lugares es la forma más fácil de que se desincronicen.

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
AI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
CHROME_EXECUTABLE_PATH=
```

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

## Deploy manual

Los mismos pasos que ejecuta el workflow, por SSH:

```bash
ssh -i ~/.ssh/ssh-ubuntu.pem davi@57.156.58.111
cd /home/davi/sigeb
git checkout develop
git pull --ff-only origin develop
npm ci
export DATABASE_URL="$(grep -m1 '^DATABASE_URL=' apps/api/.env | cut -d= -f2-)"
cd apps/api && npx prisma migrate deploy && npx prisma generate && cd ../..
npm run build
pm2 startOrRestart /home/davi/sigeb.pm2.config.cjs --only sigeb-api,sigeb-web
pm2 save
```

`pm2 startOrRestart` arranca el proceso si no existe todavía y aplica siempre
el directorio de trabajo y el entorno del archivo de configuración. Un
`pm2 restart` con `|| true` deja el servicio caído sin avisar.

---

## Monitoreo

| Herramienta | Propósito |
|---|---|
| PM2 | Process manager, reinicio y estado de los procesos |
| PostgreSQL local | Base de datos del prototipo |

---

*Última actualización: 2026-10-22*
