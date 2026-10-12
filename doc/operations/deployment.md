# Deployment — SIGEB

---

## Entornos

| Entorno | Propósito | URL |
|---|---|---|
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

---

## GitHub Actions (CI/CD)

### `.github/workflows/ci.yml`

| Job | Trigger | Qué hace |
|---|---|---|
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
AI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
CHROME_EXECUTABLE_PATH=
```

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

---

## Deploy manual

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

---

## Monitoreo

| Herramienta | Propósito |
|---|---|
| PM2 | Process manager para Node.js |
| Sentry | Error tracking |
| Prometheus + Grafana | Métricas (futuro) |

---

*Última actualización: 2026-09-01*
