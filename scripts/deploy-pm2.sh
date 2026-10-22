#!/usr/bin/env bash
# Despliegue de SIGEB en el servidor (instalación directa con PM2, sin Docker).
#
#   bash scripts/deploy-pm2.sh
#
# Variables de entorno opcionales:
#   DEPLOY_PATH      directorio del repositorio en el servidor
#                    (por defecto: la carpeta que contiene este script)
#   DEPLOY_BRANCH    rama que se despliega (por defecto: develop)
#   PM2_CONFIG_PATH  archivo de configuración de PM2
#                    (por defecto: /home/davi/sigeb.pm2.config.cjs)
#   DEPLOY_REPO_URL  repositorio del que se despliega. Por defecto es
#                    `sigeb-prod`; cuando el repositorio del equipo
#                    (`proyecto-analisis-Eduviagt`) tenga ya la réplica
#                    completa, se define en GitHub Actions (variable
#                    `DEPLOY_REPO_URL` del entorno `staging`) y el servidor
#                    pasa a actualizarse desde EDUVIAGT.
#   DEPLOY_REPO_URL_FALLBACK
#                    repositorio de respaldo. Si el de destino todavía no
#                    tiene la versión actual del proyecto (porque la réplica
#                    aún no se ha hecho), se despliega desde este en lugar
#                    de publicar una versión antigua. Por defecto: sigeb-prod.
#
# La configuración de la base de datos y de los secretos la lee el propio
# servidor de `apps/api/.env`, que no se versiona: es la única fuente de
# verdad y por eso no se duplica en GitHub.

set -euo pipefail

RAIZ="${DEPLOY_PATH:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$RAIZ"

RAMA="${DEPLOY_BRANCH:-develop}"
PM2_CONFIG="${PM2_CONFIG_PATH:-/home/davi/sigeb.pm2.config.cjs}"
DEPLOY_REPO_URL="${DEPLOY_REPO_URL:-https://github.com/Deividcodv/sigeb-prod.git}"
DEPLOY_REPO_URL_FALLBACK="${DEPLOY_REPO_URL_FALLBACK:-https://github.com/Deividcodv/sigeb-prod.git}"

# Marca de que se ha tenido que recurrir al repositorio de respaldo. Al
# terminar, el remoto se devuelve al principal: la VM queda configurada con
# EDUVIAGT aunque hoy se haya desplegado desde el respaldo.
RESPALDO_ACTIVO=0

# Archivo que solo existe en la versión actual del proyecto. Sirve de marca:
# si el remoto de destino no lo tiene, es que todavía no recibió la réplica
# y desplegaría una versión antigua.
MARCA="apps/api/src/auth/eliminar-cuenta.service.ts"

tiene_la_version_actual() {
  # Sin `-q`: `grep -q` cerraría el pipe antes de que `git ls-tree` termine y,
  # con `pipefail`, el pipeline devolvería error aunque hubiera encontrado la
  # coincidencia.
  git ls-tree -r --name-only "origin/$1" 2>/dev/null | grep -x "$MARCA" > /dev/null
}

echo "==> Repositorio: $RAIZ (rama $RAMA)"
echo "==> Origen: $DEPLOY_REPO_URL"

echo "==> Código"
git stash || true
git remote set-url origin "$DEPLOY_REPO_URL"
git fetch origin --prune
git checkout "$RAMA"

if ! tiene_la_version_actual "$RAMA"; then
  echo "AVISO: el remoto $DEPLOY_REPO_URL todavía no tiene $MARCA en la rama $RAMA." >&2
  echo "       Se despliega desde $DEPLOY_REPO_URL_FALLBACK hasta que la réplica esté lista." >&2
  echo "       Ver la guía del equipo: docs/equipo/README-JOSE-REPLICA-SIGEB-PROD.md" >&2
  git remote set-url origin "$DEPLOY_REPO_URL_FALLBACK"
  git fetch origin --prune
  git checkout "$RAMA"
  if ! tiene_la_version_actual "$RAMA"; then
    echo "ERROR: ningún remoto tiene la versión actual del proyecto ($MARCA)." >&2
    exit 1
  fi
  RESPALDO_ACTIVO=1
fi

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
# La carpeta del build se llama `.next`, pero la URL pública es `/_next`.
# Por eso la ruta se calcula con `realpath` y no con un recorte de texto.
CSS_RELATIVO="/_next/static/$(realpath --relative-to="$DESTINO/.next/static" "$CSS")"

# Se espera a que la web esté escuchando. Tras el reinicio de PM2 puede
# tardar un instante: comprobarlo de inmediato daría un error aunque el
# despliegue fuera correcto. Se espera por condición, no por un tiempo fijo.
CODIGO="000"
for _ in $(seq 1 30); do
  CODIGO="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PUERTO_WEB}${CSS_RELATIVO}" || true)"
  [ "$CODIGO" = "200" ] && break
  sleep 2
done

if [ "$CODIGO" != "200" ]; then
  echo "ERROR: el CSS $CSS_RELATIVO responde $CODIGO en el puerto $PUERTO_WEB (esperado 200)." >&2
  exit 1
fi
echo "    CSS $CSS_RELATIVO -> $CODIGO"

if [ "$RESPALDO_ACTIVO" = "1" ]; then
  # El despliegue salió del respaldo, pero la VM queda apuntando al
  # repositorio principal: en cuanto la réplica exista, el siguiente
  # despliegue traerá el código de EDUVIAGT.
  git remote set-url origin "$DEPLOY_REPO_URL"
  echo "    Repositorio principal restablecido: $DEPLOY_REPO_URL"
fi

echo "==> Despliegue completado"
