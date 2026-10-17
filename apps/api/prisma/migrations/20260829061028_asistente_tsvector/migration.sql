-- CreateIndex
CREATE INDEX "asistente_base_conocimiento_activo_idx" ON "asistente_base_conocimiento"("activo");

-- CreateIndex: GIN funcional sobre el tsvector de búsqueda (español).
-- to_tsvector(regconfig, text) es IMMUTABLE en PG; la expresión usa solo
-- operadores inmutables (los casts text[]->text de tags no lo son y por eso
-- no se indexan; los tags se filtran por coincidencia exacta en la app).
CREATE INDEX "asistente_base_conocimiento_searchvector_gin"
ON "asistente_base_conocimiento"
USING GIN (to_tsvector('spanish', titulo || ' ' || contenido));