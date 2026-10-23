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

# Marca de que se ha tenido que recurrir al repositorio de respaldo. El
# remoto se queda en el repositorio del que se ha desplegado: forzar el
# principal cuando aun no tiene la replica haria que el siguiente
# despliegue bajara un codigo antiguo.
RESPALDO_ACTIVO=0

# Commit que se quiere desplegar. El workflow lo pasa en
# `DEPLOY_EXPECTED_SHA` y es la comprobacion exacta: el remoto de destino
# tiene que contener ese commit. Sin el, se usa la marca por archivo.
DEPLOY_EXPECTED_SHA="${DEPLOY_EXPECTED_SHA:-}"

# Archivo que solo existe en la version actual del proyecto. Sirve de marca
# cuando no se conoce el commit exacto.
MARCA="apps/api/src/salud/health.controller.ts"

tiene_la_version_actual() {
  if [ -n "$DEPLOY_EXPECTED_SHA" ]; then
    # El commit esperado tiene que estar en la rama del remoto configurado.
    git merge-base --is-ancestor "$DEPLOY_EXPECTED_SHA" "origin/$RAMA" 2>/dev/null
    return $?
  fi
  # Sin `-q`: `grep -q` cerraria el pipe antes de que `git ls-tree` termine y,
  # con `pipefail`, el pipeline devolveria error aunque hubiera encontrado la
  # coincidencia.
  git ls-tree -r --name-only "origin/$RAMA" 2>/dev/null | grep -x "$MARCA" > /dev/null
}

echo "==> Repositorio: $RAIZ (rama $RAMA)"
echo "==> Origen: $DEPLOY_REPO_URL"
[ -n "$DEPLOY_EXPECTED_SHA" ] && echo "==> Commit a desplegar: $DEPLOY_EXPECTED_SHA"

echo "==> Código"
git stash || true
git remote set-url origin "$DEPLOY_REPO_URL"
git fetch origin --prune
git checkout "$RAMA"

if ! tiene_la_version_actual; then
  echo "AVISO: el remoto $DEPLOY_REPO_URL no tiene la version a desplegar en la rama $RAMA." >&2
  echo "       Se despliega desde $DEPLOY_REPO_URL_FALLBACK hasta que la replica este lista." >&2
  echo "       Ver la guia: docs/06-jose-replica-sigeb-prod.md" >&2
  git remote set-url origin "$DEPLOY_REPO_URL_FALLBACK"
  git fetch origin --prune
  git checkout "$RAMA"
  if ! tiene_la_version_actual; then
    echo "ERROR: ningun remoto tiene la version a desplegar." >&2
    exit 1
  fi
  RESPALDO_ACTIVO=1
fi

# El arbol de trabajo tiene que quedar exactamente igual que el remoto. Los
# residuos sin versionar (copias de pruebas) se quitan: si no, bloquean la
# actualizacion con "untracked working tree files would be overwritten".
# `git clean` sin `-x` respeta lo ignorado, asi que la configuracion
# (`apps/api/.env`) y los documentos (`storage/`) no se tocan.
git clean -fdq
git reset --hard "origin/$RAMA"
echo "    desplegado: $(git log --oneline -1)"

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
  # El remoto se queda en el repositorio del que se ha desplegado. Forzar el
  # principal cuando aún no tiene la réplica haría que el siguiente despliegue
  # bajara un código antiguo.
  echo "    Se desplegó desde el respaldo: $DEPLOY_REPO_URL_FALLBACK"
  echo "    EDUVIAGT será el origen en cuanto tenga la réplica."
fi

echo "==> Despliegue completado"
