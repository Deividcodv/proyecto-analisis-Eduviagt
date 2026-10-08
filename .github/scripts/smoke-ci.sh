#!/usr/bin/env bash
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
  local email="$1" pass="$2" code body
  body=$(http_request POST "$BASE/auth/login" "{\"email\":\"$email\",\"password\":\"$pass\"}")
  code="$body"
  body=$(cat /tmp/smoke-http-body.json)
  [ "$code" = "200" ] || { echo "Login $email -> HTTP $code: $body" >&2; return 1; }
  printf '%s' "$body" | jq -r '.data.accessToken'
}

for i in $(seq 1 30); do
  code=$(http_request GET "$BASE/catalogos/generos")
  if [ "$code" = "200" ]; then
    break
  fi
  sleep 2
  if [ "$i" -eq 30 ]; then
    echo "La API no responde despues de 60s (ultimo HTTP: $code)" >&2
    exit 1
  fi
done

TOKEN_ADMIN=$(login_token "admin@sigeb.gov.gt" "Admin123!") \
  || { echo "Fallo login admin" >&2; exit 1; }
TOKEN_POST=$(login_token "postulante@demo.gt" "Admin123!") \
  || { echo "Fallo login postulante" >&2; exit 1; }
TOKEN_EVAL=$(login_token "evaluador@demo.gt" "Admin123!") \
  || { echo "Fallo login evaluador" >&2; exit 1; }
TOKEN_COORD=$(login_token "coordinador@demo.gt" "Admin123!") \
  || { echo "Fallo login coordinador" >&2; exit 1; }
TOKEN_MIEMBRO=$(login_token "miembro@demo.gt" "Admin123!") \
  || { echo "Fallo login miembro" >&2; exit 1; }

for T in "$TOKEN_ADMIN" "$TOKEN_POST" "$TOKEN_EVAL" "$TOKEN_COORD" "$TOKEN_MIEMBRO"; do
  [ -z "$T" ] && { echo "Fallo algun login"; exit 1; }
done

EVALUADOR_ID=$(curl -sf "$BASE/auth/perfil" -H "Authorization: Bearer $TOKEN_EVAL" | jq -r '.data.id')
MIEMBRO_ID=$(curl -sf "$BASE/auth/perfil" -H "Authorization: Bearer $TOKEN_MIEMBRO" | jq -r '.data.id')
ADMIN_ID=$(curl -sf "$BASE/auth/perfil" -H "Authorization: Bearer $TOKEN_ADMIN" | jq -r '.data.id')

# ---- Sprint 3: solicitud completa contra beca 2 (con criterios) ----
CONV_ID=$(curl -sf -X POST "$BASE/convocatorias" -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Beca CI","becaId":"00000000-0000-4000-8000-000000000002","evaluadoresMinimos":1}' | jq -r '.data.id')
[ -z "$CONV_ID" ] && { echo "Fallo la creacion de convocatoria"; exit 1; }

PUBLICADA_ID=$(curl -sf -X POST "$BASE/convocatorias/$CONV_ID/transicion" -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H 'Content-Type: application/json' -d '{"accion":"publicar"}' | jq -r '.data.id')
[ -z "$PUBLICADA_ID" ] && { echo "Falló publicar convocatoria"; exit 1; }

node .github/scripts/link-doc.cjs "$PUBLICADA_ID" "Certificado académico" > /dev/null

SOL_ID=$(curl -sf -X POST "$BASE/solicitudes" -H "Authorization: Bearer $TOKEN_POST" \
  -H 'Content-Type: application/json' \
  -d "{\"convocatoriaId\":\"$PUBLICADA_ID\"}" | jq -r '.data.id')
[ -z "$SOL_ID" ] && { echo "Fallo la creacion de solicitud"; exit 1; }

CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/solicitudes/$SOL_ID/transicion" \
  -H "Authorization: Bearer $TOKEN_POST" -H 'Content-Type: application/json' -d '{"accion":"enviar"}')
[ "$CODE" = "400" ] || { echo "Enviar incompleta esperaba 400, obtuve $CODE"; exit 1; }

curl -sf -X PUT "$BASE/solicitudes/$SOL_ID/perfil-academico" \
  -H "Authorization: Bearer $TOKEN_POST" -H 'Content-Type: application/json' \
  -d '{"generoOtro":"Otro CI","nivelAcademicoOtro":"Tecnico","institucion":"USAC","carrera":"Ing","promedio":88}' > /dev/null

curl -sf -X PUT "$BASE/solicitudes/$SOL_ID/perfil-financiero" \
  -H "Authorization: Bearer $TOKEN_POST" -H 'Content-Type: application/json' \
  -d '{"ingresoFamiliar":2000,"numeroDependientes":2}' > /dev/null

TIPO_ID=$(curl -sf "$BASE/catalogos/documentos-tipo" | jq -r '.data[] | select(.nombre=="Certificado académico") | .id')
printf '%%PDF-sigeb-ci' > /tmp/doc-ci.pdf
curl -sf -X POST "$BASE/solicitudes/$SOL_ID/documentos/$TIPO_ID" \
  -H "Authorization: Bearer $TOKEN_POST" -F "file=@/tmp/doc-ci.pdf;type=application/pdf" > /dev/null

# ---- AD-4.1: rechazo de documentos (en BORRADOR, antes de enviar) ----
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$BASE/solicitudes/$SOL_ID/documentos/$TIPO_ID/estado" \
  -H "Authorization: Bearer $TOKEN_POST" -H 'Content-Type: application/json' -d '{"estado":"RECHAZADO"}')
[ "$CODE" = "403" ] || { echo "Postulante rechazando esperaba 403, obtuve $CODE"; exit 1; }

DOC_EST=$(curl -sf -X PATCH "$BASE/solicitudes/$SOL_ID/documentos/$TIPO_ID/estado" \
  -H "Authorization: Bearer $TOKEN_COORD" -H 'Content-Type: application/json' -d '{"estado":"RECHAZADO"}' | jq -r '.data.estado')
[ "$DOC_EST" = "RECHAZADO" ] || { echo "Coordinador rechazando esperaba RECHAZADO, obtuve $DOC_EST"; exit 1; }

COMPLETO=$(curl -sf "$BASE/solicitudes/$SOL_ID/checklist" \
  -H "Authorization: Bearer $TOKEN_POST" | jq -r '.data.completo')
[ "$COMPLETO" = "false" ] || { echo "Checklist con doc rechazado deberia estar incompleto (obtuve: $COMPLETO)"; exit 1; }

CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/solicitudes/$SOL_ID/transicion" \
  -H "Authorization: Bearer $TOKEN_POST" -H 'Content-Type: application/json' -d '{"accion":"enviar"}')
[ "$CODE" = "400" ] || { echo "Enviar con doc rechazado esperaba 400, obtuve $CODE"; exit 1; }

CODE=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$BASE/solicitudes/$SOL_ID/documentos/$TIPO_ID/estado" \
  -H "Authorization: Bearer $TOKEN_COORD" -H 'Content-Type: application/json' -d '{"estado":"INVALIDO"}')
[ "$CODE" = "400" ] || { echo "Estado invalido esperaba 400, obtuve $CODE"; exit 1; }

curl -sf -X POST "$BASE/solicitudes/$SOL_ID/documentos/$TIPO_ID" \
  -H "Authorization: Bearer $TOKEN_POST" -F "file=@/tmp/doc-ci.pdf;type=application/pdf" > /dev/null
COMPLETO=$(curl -sf "$BASE/solicitudes/$SOL_ID/checklist" \
  -H "Authorization: Bearer $TOKEN_POST" | jq -r '.data.completo')
[ "$COMPLETO" = "true" ] || { echo "Checklist tras re-subir deberia estar completo (obtuve: $COMPLETO)"; exit 1; }

# ---- Sprint 3: envio validado ----
ESTADO=$(curl -sf -X POST "$BASE/solicitudes/$SOL_ID/transicion" \
  -H "Authorization: Bearer $TOKEN_POST" -H 'Content-Type: application/json' \
  -d '{"accion":"enviar"}' | jq -r '.data.estado')
[ "$ESTADO" = "ENVIADA" ] || { echo "Esperaba ENVIADA, obtuve $ESTADO"; exit 1; }

# ---- Sprint 4: iniciar revision y evaluacion ----
ESTADO=$(curl -sf -X POST "$BASE/solicitudes/$SOL_ID/transicion" -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H 'Content-Type: application/json' -d '{"accion":"iniciar_revision"}' | jq -r '.data.estado')
[ "$ESTADO" = "EN_REVISION" ] || { echo "iniciar_revision esperaba EN_REVISION, obtuve $ESTADO"; exit 1; }

curl -sf -X POST "$BASE/solicitudes/$SOL_ID/evaluadores" -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H 'Content-Type: application/json' -d "{\"evaluadorIds\":[\"$EVALUADOR_ID\"]}" > /dev/null

EVAL_GRP=$(curl -sf "$BASE/evaluaciones/mias" -H "Authorization: Bearer $TOKEN_EVAL" \
  | jq -c ".data[] | select(.solicitudId==\"$SOL_ID\")")
[ -z "$EVAL_GRP" ] && { echo "El evaluador no ve la solicitud asignada"; exit 1; }

curl -sf -X PATCH "$BASE/solicitudes/$SOL_ID/imparcialidad" \
  -H "Authorization: Bearer $TOKEN_EVAL" -H 'Content-Type: application/json' \
  -d '{"confirma":true}' > /dev/null

for CRITERIO in $(echo "$EVAL_GRP" | jq -r '.criterios[].id'); do
  RESP=$(curl -s -X PUT "$BASE/solicitudes/$SOL_ID/criterios/$CRITERIO" \
    -H "Authorization: Bearer $TOKEN_EVAL" -H 'Content-Type: application/json' \
    -d '{"puntaje":80}' -w $'\nSTATUS:%{http_code}')
  MSG=${RESP##*STATUS:}
  STATUS=${MSG%%$'\n'*}
  BODY=$(echo "$RESP" | sed '$d')
  [ "$STATUS" = "200" ] || { echo "PUT criterio $CRITERIO -> HTTP $STATUS :: $BODY"; exit 1; }
done

SCORE=$(curl -sf "$BASE/solicitudes/$SOL_ID/score" -H "Authorization: Bearer $TOKEN_ADMIN" | jq -r '.data.score')
echo "$SCORE" | grep -E '^[0-9]+([.][0-9]+)?$' > /dev/null || { echo "Score invalido: $SCORE"; exit 1; }

INCOMPLETO=$(curl -sf -X POST "$BASE/solicitudes/$SOL_ID/transicion" -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H 'Content-Type: application/json' -d '{"accion":"evaluar"}' | jq -r '.data.estado')
[ "$INCOMPLETO" = "EVALUADA" ] || { echo "evaluar esperaba EVALUADA, obtuve $INCOMPLETO"; exit 1; }

# ---- Conv a EN_EVALUACION ----
curl -sf -X POST "$BASE/convocatorias/$PUBLICADA_ID/transicion" -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H 'Content-Type: application/json' -d '{"accion":"cerrar"}' > /dev/null
CONV_EST=$(curl -sf -X POST "$BASE/convocatorias/$PUBLICADA_ID/transicion" -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H 'Content-Type: application/json' -d '{"accion":"iniciar_evaluacion"}' | jq -r '.data.estado')
[ "$CONV_EST" = "EN_EVALUACION" ] || { echo "convocatoria a EN_EVALUACION fallo: $CONV_EST"; exit 1; }

# ---- Sprint 4: comite, sesion, votos, finalizar ----
COMITE_ID=$(curl -sf -X POST "$BASE/comites" -H "Authorization: Bearer $TOKEN_COORD" \
  -H 'Content-Type: application/json' -d '{"nombre":"Comité CI"}' | jq -r '.data.id')
[ -z "$COMITE_ID" ] && { echo "Fallo crear comite"; exit 1; }
curl -sf -X POST "$BASE/comites/$COMITE_ID/miembros" -H "Authorization: Bearer $TOKEN_COORD" \
  -H 'Content-Type: application/json' -d "{\"usuarioId\":\"$MIEMBRO_ID\",\"rol\":\"VOCAL\"}" > /dev/null
curl -sf -X POST "$BASE/comites/$COMITE_ID/miembros" -H "Authorization: Bearer $TOKEN_COORD" \
  -H 'Content-Type: application/json' -d "{\"usuarioId\":\"$ADMIN_ID\",\"rol\":\"PRESIDENTE\"}" > /dev/null

SESION_ID=$(curl -sf -X POST "$BASE/sesiones" -H "Authorization: Bearer $TOKEN_COORD" \
  -H 'Content-Type: application/json' \
  -d "{\"comiteId\":\"$COMITE_ID\",\"fecha\":\"2026-08-29T10:00:00.000Z\",\"quorumMinimo\":2,\"solicitudesIds\":[\"$SOL_ID\"]}" | jq -r '.data.id')
[ -z "$SESION_ID" ] && { echo "Fallo crear sesion"; exit 1; }

CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/sesiones/$SESION_ID/finalizar" \
  -H "Authorization: Bearer $TOKEN_COORD" -H 'Content-Type: application/json' -d '{}')
[ "$CODE" = "400" ] || { echo "Finalizar sin quorum esperaba 400, obtuve $CODE"; exit 1; }

curl -sf -X POST "$BASE/sesiones/$SESION_ID/votos" -H "Authorization: Bearer $TOKEN_MIEMBRO" \
  -H 'Content-Type: application/json' -d "{\"solicitudId\":\"$SOL_ID\",\"voto\":\"APROBAR\"}" > /dev/null
curl -sf -X POST "$BASE/sesiones/$SESION_ID/votos" -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H 'Content-Type: application/json' -d "{\"solicitudId\":\"$SOL_ID\",\"voto\":\"ABSTENCION\"}" > /dev/null

SESION_EST=$(curl -sf -X POST "$BASE/sesiones/$SESION_ID/finalizar" -H "Authorization: Bearer $TOKEN_COORD" \
  -H 'Content-Type: application/json' -d '{}' | jq -r '.data.estado')
[ "$SESION_EST" = "FINALIZADA" ] || { echo "finalizar esperaba FINALIZADA, obtuve $SESION_EST"; exit 1; }

DECISION=$(curl -sf "$BASE/sesiones/$SESION_ID" -H "Authorization: Bearer $TOKEN_COORD" \
  | jq -r '.data.decisiones[0].resultado')
[ "$DECISION" = "APROBADA" ] || { echo "decision esperaba APROBADA, obtuve $DECISION"; exit 1; }

SOL_EST=$(curl -sf "$BASE/solicitudes/$SOL_ID" -H "Authorization: Bearer $TOKEN_ADMIN" | jq -r '.data.estado')
[ "$SOL_EST" = "APROBADA" ] || { echo "solicitud esperaba APROBADA, obtuve $SOL_EST"; exit 1; }

CONV_FINAL=$(curl -sf "$BASE/convocatorias/$PUBLICADA_ID" -H "Authorization: Bearer $TOKEN_ADMIN" | jq -r '.data.estado')
[ "$CONV_FINAL" = "RESUELTA" ] || { echo "convocatoria esperaba RESUELTA, obtuve $CONV_FINAL"; exit 1; }

# ---- US-F7: constancia en PDF (solo solicitudes APROBADAS) ----
PDF_HEAD=$(curl -s -D - -o /tmp/constancia.pdf "$BASE/solicitudes/$SOL_ID/constancia" -H "Authorization: Bearer $TOKEN_ADMIN")
echo "$PDF_HEAD" | grep -qi 'application/pdf' || { echo "Constancia sin Content-Type application/pdf"; exit 1; }
echo "$PDF_HEAD" | grep -qi 'attachment' || { echo "Constancia sin Content-Disposition attachment"; exit 1; }
[ -s /tmp/constancia.pdf ] && head -c 4 /tmp/constancia.pdf | grep -q '%PDF' || { echo "Constancia no es un PDF valido"; exit 1; }

CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/solicitudes/$SOL_ID/constancia" -H "Authorization: Bearer $TOKEN_POST")
[ "$CODE" = "200" ] || { echo "Postulante dueno descargando constancia esperaba 200, obtuve $CODE"; exit 1; }

CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/solicitudes/$SOL_ID/constancia" -H "Authorization: Bearer $TOKEN_EVAL")
[ "$CODE" = "403" ] || { echo "Evaluador descargando constancia esperaba 403, obtuve $CODE"; exit 1; }

# ---- Sprint 5: reportes y CSV (US-34, US-35) ----
for ENDPOINT in solicitudes-por-estado convocatorias evaluaciones; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reportes/$ENDPOINT" -H "Authorization: Bearer $TOKEN_ADMIN")
  [ "$CODE" = "200" ] || { echo "Reporte $ENDPOINT esperaba 200, obtuve $CODE"; exit 1; }
done

S5_TOTAL=$(curl -sf "$BASE/reportes/solicitudes-por-estado" -H "Authorization: Bearer $TOKEN_ADMIN" | jq -r '.data.porEstado | length')
[ "$S5_TOTAL" -gt 0 ] || { echo "Reporte solicitudes-por-estado vacio"; exit 1; }

S5_DEC=$(curl -sf "$BASE/reportes/evaluaciones" -H "Authorization: Bearer $TOKEN_ADMIN" \
  | jq -r '[.data.porConvocatoria[] | select(.aprobadas > 0 or .rechazadas > 0)] | length')
[ "$S5_DEC" -gt 0 ] || { echo "Reporte evaluaciones no refleja decisiones del smoke S4"; exit 1; }

CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reportes/evaluaciones" -H "Authorization: Bearer $TOKEN_POST")
[ "$CODE" = "403" ] || { echo "Reporte con postulante esperaba 403, obtuve $CODE"; exit 1; }

CSV_HEAD=$(curl -s -D - -o /dev/null "$BASE/reportes/convocatorias/csv" -H "Authorization: Bearer $TOKEN_ADMIN")
echo "$CSV_HEAD" | grep -qi 'text/csv' || { echo "CSV sin Content-Type text/csv"; exit 1; }
echo "$CSV_HEAD" | grep -qi 'attachment' || { echo "CSV sin Content-Disposition attachment"; exit 1; }
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reportes/convocatorias/csv" -H "Authorization: Bearer $TOKEN_ADMIN")
[ "$CODE" = "200" ] || { echo "CSV esperaba 200, obtuve $CODE"; exit 1; }

CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reportes/xyz/csv" -H "Authorization: Bearer $TOKEN_ADMIN")
[ "$CODE" = "400" ] || { echo "CSV tipo invalido esperaba 400, obtuve $CODE"; exit 1; }

# ---- Sprint 5: auditoria (US-36) ----
AUDIT_TOTAL=$(curl -sf "$BASE/audit" -H "Authorization: Bearer $TOKEN_ADMIN" | jq -r '.data.total')
[ -n "$AUDIT_TOTAL" ] && [ "$AUDIT_TOTAL" -gt 0 ] || { echo "Sin entradas de auditoria"; exit 1; }

AUDIT_LOGINS=$(curl -sf "$BASE/audit?accion=login" -H "Authorization: Bearer $TOKEN_ADMIN" | jq -r '.data.items | length')
[ "$AUDIT_LOGINS" -ge 5 ] || { echo "Esperaba >=5 logins auditados, obtuve $AUDIT_LOGINS"; exit 1; }

AUDIT_ACCIONES=$(curl -sf "$BASE/audit?limit=200" -H "Authorization: Bearer $TOKEN_ADMIN" |
  jq -r '[.data.items[].accion] | index("transicion") != null')
[ "$AUDIT_ACCIONES" = "true" ] || { echo "No hay transiciones auditadas en el rastro"; exit 1; }

CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/audit" -H "Authorization: Bearer $TOKEN_POST")
[ "$CODE" = "403" ] || { echo "Auditoria con postulante esperaba 403, obtuve $CODE"; exit 1; }

CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/audit")
[ "$CODE" = "401" ] || { echo "Auditoria anonima esperaba 401, obtuve $CODE"; exit 1; }

# ---- Sprint 5: asistente IA sobre base de conocimiento (US-37/US-39) ----
S5_AI=$(curl -sf -X POST "$BASE/asistente/preguntar" -H 'Content-Type: application/json' \
  -d '{"pregunta":"¿cuáles son los requisitos para postular?"}')
[ "$(echo "$S5_AI" | jq -r '.data.respuesta | contains("Requisitos")')" = "true" ] || { echo "Asistente no respondio con info de requisitos"; exit 1; }
S5_AI_FUENTES=$(echo "$S5_AI" | jq -r '.data.fuentes | length')
[ "$S5_AI_FUENTES" -gt 0 ] || { echo "Asistente respondio sin fuentes"; exit 1; }

CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/asistente/preguntar" \
  -H 'Content-Type: application/json' -d '{"pregunta":""}')
[ "$CODE" = "400" ] || { echo "Pregunta vacia esperaba 400, obtuve $CODE"; exit 1; }

# ---- Sprint 8: matriz de seguridad (alta + excepciones por usuario + estados) ----
CUI_SMOKE="$(date +%s%N | cut -c1-13)"
EMAIL_SMOKE="smoke-$(date +%s)@demo.gt"
U_CREADO=$(curl -sf -X POST "$BASE/seguridad/usuarios" -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H 'Content-Type: application/json' \
  -d "{\"cui\":\"$CUI_SMOKE\",\"nombres\":\"Smoke Matriz\",\"email\":\"$EMAIL_SMOKE\",\"password\":\"Smoke123!\",\"rolId\":\"$(curl -sf "$BASE/seguridad/roles" -H "Authorization: Bearer $TOKEN_ADMIN" | jq -r '.data[] | select(.nombre=="POSTULANTE") | .id')\"}")
[ -z "$U_CREADO" ] && { echo "Fallo crear usuario en matriz"; exit 1; }
U_ID=$(echo "$U_CREADO" | jq -r '.data.id')
USUARIO_SIN_HASH=$(echo "$U_CREADO" | jq -r '.data | has("passwordHash")')
[ "$USUARIO_SIN_HASH" = "false" ] || { echo "El alta de usuario filtro passwordHash"; exit 1; }
[ "$(echo "$U_CREADO" | jq -r '.data.rol.nombre')" = "POSTULANTE" ] || { echo "Alta sin rol POSTULANTE"; exit 1; }

TOKEN_NUEVO=$(curl -sf -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL_SMOKE\",\"password\":\"Smoke123!\"}" | jq -r '.data.accessToken')
[ -z "$TOKEN_NUEVO" ] && { echo "Login del usuario creado fallo"; exit 1; }

LISTA_SIN_HASH=$(curl -sf "$BASE/seguridad/usuarios" -H "Authorization: Bearer $TOKEN_ADMIN" | jq -r '[.data[] | has("passwordHash")] | any')
[ "$LISTA_SIN_HASH" = "false" ] || { echo "El listado de usuarios filtro passwordHash"; exit 1; }

PERM_REP=$(curl -sf "$BASE/seguridad/permisos" -H "Authorization: Bearer $TOKEN_ADMIN" \
  | jq -r '.data[] | select(.modulo=="reporte" and .accion=="ver") | .id')
[ -n "$PERM_REP" ] || { echo "Permiso reporte:ver no encontrado"; exit 1; }

CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reportes/solicitudes-por-estado" -H "Authorization: Bearer $TOKEN_NUEVO")
[ "$CODE" = "403" ] || { echo "POSTULANTE sin excepcion esperaba 403 en reporte, obtuve $CODE"; exit 1; }

curl -sf -X PATCH "$BASE/seguridad/usuarios/$U_ID/permisos" -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H 'Content-Type: application/json' \
  -d "{\"permisos\":[{\"permisoId\":\"$PERM_REP\",\"efecto\":\"PERMITIR\"}]}" > /dev/null

CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reportes/solicitudes-por-estado" -H "Authorization: Bearer $TOKEN_NUEVO")
[ "$CODE" = "200" ] || { echo "PERMITIR individual esperaba 200 en reporte, obtuve $CODE"; exit 1; }

CROSS_POST=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reportes/solicitudes-por-estado" -H "Authorization: Bearer $TOKEN_POST")
[ "$CROSS_POST" = "403" ] || { echo "Otro POSTULANTE sin excepcion esperaba 403, obtuve $CROSS_POST"; exit 1; }

EXCEPCIONES=$(curl -sf "$BASE/seguridad/usuarios/$U_ID" -H "Authorization: Bearer $TOKEN_ADMIN" \
  | jq -r "[.data.usuarioPermisos[] | select(.permiso.id==\"$PERM_REP\") | .efecto][0]")
[ "$EXCEPCIONES" = "PERMITIR" ] || { echo "La excepcion PERMITIR no persistio en el usuario, obtuve $EXCEPCIONES"; exit 1; }

curl -sf -X PATCH "$BASE/seguridad/usuarios/$U_ID/permisos" -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H 'Content-Type: application/json' \
  -d "{\"permisos\":[{\"permisoId\":\"$PERM_REP\",\"efecto\":\"DENEGAR\"}]}" > /dev/null

CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reportes/solicitudes-por-estado" -H "Authorization: Bearer $TOKEN_NUEVO")
[ "$CODE" = "403" ] || { echo "DENEGAR individual esperaba 403 en reporte, obtuve $CODE"; exit 1; }

CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/seguridad/usuarios" -H "Authorization: Bearer $TOKEN_POST" \
  -H 'Content-Type: application/json' \
  -d '{"cui":"1111111111111","nombres":"No","email":"no@demo.gt","password":"Nopass123","rolId":"x"}')
[ "$CODE" = "403" ] || { echo "POSTULANTE creando usuarios esperaba 403, obtuve $CODE"; exit 1; }

CODE=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$BASE/seguridad/usuarios/$ADMIN_ID" \
  -H "Authorization: Bearer $TOKEN_ADMIN" -H 'Content-Type: application/json' -d '{"estado":"INACTIVO"}')
[ "$CODE" = "400" ] || { echo "Auto-inactivacion del admin esperaba 400, obtuve $CODE"; exit 1; }

curl -sf -X PATCH "$BASE/seguridad/usuarios/$U_ID" -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H 'Content-Type: application/json' -d '{"estado":"INACTIVO"}' > /dev/null
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL_SMOKE\",\"password\":\"Smoke123!\"}")
[ "$CODE" = "401" ] || { echo "Login de usuario inactivo esperaba 401, obtuve $CODE"; exit 1; }
curl -sf -X PATCH "$BASE/seguridad/usuarios/$U_ID" -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H 'Content-Type: application/json' -d '{"estado":"ACTIVO"}' > /dev/null

echo "SMOKE CI OK (S3 solicitudes + S4 evaluaciones/sesiones/rechazo docs + S5 reportes/CSV + auditoria + asistente + F7 constancia PDF + S8 matriz de seguridad)"