#!/usr/bin/env bash
# Despliegue de SIGEB en el servidor (instalación directa con PM2, sin Docker).
#
#   bash scripts/deploy-pm2.sh
#
# Variables de entorno opcionales:
#   DEPLOY_BRANCH    rama que se despliega (por defecto: develop)
#   PM2_CONFIG_PATH  archivo de configuración de PM2
#                    (por defecto: /home/davi/sigeb.pm2.config.cjs)
#
# La configuración de la base de datos y de los secretos la lee el propio
# servidor de `apps/api/.env`, que no se versiona: es la única fuente de
# verdad y por eso no se duplica en GitHub.

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

RAMA="${DEPLOY_BRANCH:-develop}"
PM2_CONFIG="${PM2_CONFIG_PATH:-/home/davi/sigeb.pm2.config.cjs}"

echo "==> Repositorio: $RAIZ (rama $RAMA)"

echo "==> Código"
git stash || true
git fetch origin --prune
git checkout "$RAMA"
git pull --ff-only origin "$RAMA"

echo "==> Dependencias"
npm ci

echo "==> Migraciones de la base de datos"
export DATABASE_URL="$(grep -m1 '^DATABASE_URL=' apps/api/.env | cut -d= -f2-)"
cd apps/api
npx prisma migrate deploy
npx prisma generate
cd "$RAIZ"

echo "==> Compilación"
npm run build

# El output 'standalone' de Next.js NO incluye `.next/static` ni `public`:
# son archivos que hay que copiar aparte. Sin esta copia el servidor responde
# 404 a cada CSS, cada chunk de JavaScript y cada SVG, y el portal se sirve
# sin estilos y sin funcionar. Es el mismo paso que hace el Dockerfile.
echo "==> Next.js: copia de estáticos y de public al árbol standalone"
DESTINO="apps/web/.next/standalone/apps/web"
mkdir -p "$DESTINO/.next"
rm -rf "$DESTINO/.next/static"
cp -a apps/web/.next/static "$DESTINO/.next/static"
rm -rf "$DESTINO/public"
cp -a apps/web/public "$DESTINO/public"

if [ -z "$(find "$DESTINO/.next/static" -name '*.css' -print -quit)" ]; then
  echo "ERROR: no hay ningún CSS en $DESTINO/.next/static; la build no es válida." >&2
  exit 1
fi
echo "    estáticos: $(find "$DESTINO/.next/static" -type f | wc -l) archivos"
echo "    public:    $(find "$DESTINO/public" -type f | wc -l) archivos"

echo "==> Procesos PM2"
pm2 startOrRestart "$PM2_CONFIG" --only sigeb-api,sigeb-web
pm2 save

echo "==> Comprobación"
# El puerto de la web se lee del propio archivo de configuración de PM2, no
# se supone: si cambia, la comprobación sigue apuntando al sitio correcto.
PUERTO_WEB="$(node -e "const c=require('$PM2_CONFIG');const w=c.apps.find(a=>a.name==='sigeb-web');process.stdout.write(String(w.env.PORT))" 2>/dev/null || echo 3002)"
CSS="$(find "$DESTINO/.next/static" -name '*.css' -print -quit)"
CSS_RELATIVO="/_next/static/${CSS#*_next/static/}"
CODIGO="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PUERTO_WEB}${CSS_RELATIVO}")"
if [ "$CODIGO" != "200" ]; then
  echo "ERROR: el CSS $CSS_RELATIVO responde $CODIGO en el puerto $PUERTO_WEB (esperado 200)." >&2
  exit 1
fi
echo "    CSS $CSS_RELATIVO -> $CODIGO"

echo "==> Despliegue completado"
