-- Normaliza los snapshots de formulario que se guardaron como TEXTO JSON.
--
-- `solicitud.formularioSnapshot` es un campo Json que la interfaz itera
-- como arreglo. El seed lo guardaba con `JSON.stringify([])`, es decir, la
-- cadena "[]" y no un arreglo: con ese valor el panel del evaluador y el
-- detalle de la solicitud se caían con "campos.map is not a function".
--
-- Se convierte a arreglo vacío. Las solicitudes creadas a partir de ahora
-- ya se guardan normalizadas (ver `SolicitudesService.normalizarFormulario`).
UPDATE "solicitud"
SET "formularioSnapshot" = '[]'::jsonb
WHERE "formularioSnapshot" IS NOT NULL
  AND jsonb_typeof("formularioSnapshot") = 'string';
