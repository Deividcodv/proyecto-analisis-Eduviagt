#!/usr/bin/env bash
# Copia de seguridad de EDUVIAGT en el servidor.
#
#   bash scripts/backup.sh                    # copia del dia
#   bash scripts/backup.sh --list             # que copias hay
#   bash scripts/backup.sh --restore <archivo>  # restaura una copia
#
# Qué copia:
#   - la base de datos PostgreSQL (volcado completo con pg_dump);
#   - los documentos subidos por los postulantes (storage/);
#   - la configuracion de PM2 (que no esta versionada).
#
# Las copias se guardan en /home/davi/backups y se conservan los ultimos
# BACKUP_RETENTION dias. Una copia que nunca se restaura no esta verificada:
# por eso el script incluye la orden de restauracion.
#
# Nota: `pg_dump` no lee la variable DATABASE_URL del entorno (a diferencia de
# `psql`), por eso se le pasa la URL como argumento.

set -euo pipefail

RAIZ="${DEPLOY_PATH:-/home/davi/sigeb}"
DESTINO="${BACKUP_DIR:-/home/davi/backups}"
RETENCION="${BACKUP_RETENTION:-14}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVO="$DESTINO/sigeb-$TIMESTAMP.tar.gz"

# La URL de la base se lee del .env del servidor, que no se versiona.
if [ -f "$RAIZ/apps/api/.env" ]; then
  DATABASE_URL="$(grep -m1 '^DATABASE_URL=' "$RAIZ/apps/api/.env" | cut -d= -f2-)"
  export DATABASE_URL
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: no se encontro DATABASE_URL en $RAIZ/apps/api/.env" >&2
  exit 1
fi

listar() {
  echo "Copias en $DESTINO:"
  ls -1t "$DESTINO"/sigeb-*.tar.gz 2>/dev/null | while read -r f; do
    printf '  %-38s %7s  %s\n' \
      "$(basename "$f")" \
      "$(du -h "$f" | cut -f1)" \
      "$(date -r "$f" '+%Y-%m-%d %H:%M')"
  done
}

restaurar() {
  local archivo="$1"
  if [ ! -f "$archivo" ]; then
    echo "ERROR: no existe la copia $archivo" >&2
    exit 1
  fi

  echo "AVISO: se va a sobrescribir la base de datos actual."
  read -r -p "¿Continuar? (escribe SI para confirmar) " confirmacion
  if [ "$confirmacion" != "SI" ]; then
    echo "Cancelado."
    exit 1
  fi

  local trabajo
  trabajo="$(mktemp -d)"
  trap 'rm -rf "$trabajo"' EXIT

  echo "==> 1/3 Base de datos"
  tar -xzf "$archivo" -C "$trabajo" --wildcards 'sigeb/dump.sql'
  # El volcado incluye los DROP TABLE: se restaura sobre la base actual.
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$trabajo/sigeb/dump.sql" > /dev/null

  echo "==> 2/3 Documentos"
  tar -xzf "$archivo" -C "$RAIZ" --wildcards 'sigeb/storage'

  echo "==> 3/3 Reinicio de los procesos"
  pm2 restart sigeb-api --update-env
  pm2 restart sigeb-web --update-env

  echo "Restauracion completada desde $(basename "$archivo")"
}

case "${1:-backup}" in
  --list)
    listar
    ;;

  --restore)
    if [ -z "${2:-}" ]; then
      echo "Uso: $0 --restore <archivo>" >&2
      exit 1
    fi
    restaurar "$2"
    ;;

  backup)
    mkdir -p "$DESTINO"

    trabajo_tmp="$(mktemp -d)"
    trap 'rm -rf "$trabajo_tmp"' EXIT
    mkdir -p "$trabajo_tmp/sigeb"

    echo "==> Volcado de la base de datos"
    pg_dump "$DATABASE_URL" \
      --format=plain \
      --clean \
      --if-exists \
      --no-owner \
      --no-privileges \
      --file="$trabajo_tmp/sigeb/dump.sql"

    echo "==> Documentos y configuracion"
    if [ -d "$RAIZ/storage" ]; then
      cp -a "$RAIZ/storage" "$trabajo_tmp/sigeb/storage"
    fi
    if [ -f "/home/davi/sigeb.pm2.config.cjs" ]; then
      cp -a "/home/davi/sigeb.pm2.config.cjs" "$trabajo_tmp/sigeb/"
    fi

    echo "==> Empaquetado"
    tar -czf "$ARCHIVO" -C "$trabajo_tmp" sigeb
    chmod 600 "$ARCHIVO"

    echo "==> Limpieza (se conservan las ultimas $RETENCION copias)"
    ls -1t "$DESTINO"/sigeb-*.tar.gz 2>/dev/null | tail -n "+$((RETENCION + 1))" | while read -r viejo; do
      echo "    se borra $(basename "$viejo")"
      rm -f "$viejo"
    done

    echo "Copia creada: $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"
    ;;

  *)
    echo "Uso: $0 [backup|--list|--restore <archivo>]" >&2
    exit 1
    ;;
esac
