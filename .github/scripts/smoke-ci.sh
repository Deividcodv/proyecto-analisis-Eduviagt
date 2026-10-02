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