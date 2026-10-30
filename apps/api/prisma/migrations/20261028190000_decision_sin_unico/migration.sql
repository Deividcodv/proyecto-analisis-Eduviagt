-- Una solicitud puede volver a entrar en agenda (por ejemplo, si el comité
-- la devuelve a revisión). La decisión ya no es única por solicitud: con la
-- restricción anterior, incluirla en dos sesiones terminaba en un error
-- P2002 sin manejar (HTTP 500).
DROP INDEX IF EXISTS "decision_solicitudId_key";

-- Índice de apoyo para buscar las decisiones de una solicitud.
CREATE INDEX IF NOT EXISTS "decision_solicitudId_idx" ON "decision"("solicitudId");
