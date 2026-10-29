-- Marca la evaluación como finalizada por el evaluador.
--
-- Cuando el evaluador termina su revisión la marca; si se alcanzó el mínimo
-- de evaluadores, la solicitud pasa sola a EVALUADA y sale de la cola de
-- "por evaluar".
ALTER TABLE "evaluacion" ADD COLUMN "finalizada" BOOLEAN NOT NULL DEFAULT false;
