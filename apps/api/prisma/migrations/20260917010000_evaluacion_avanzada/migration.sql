-- AlterTable
ALTER TABLE "convocatoria" ADD COLUMN "evaluadoresMinimos" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN "maxCorrecciones" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "evaluacion" ADD COLUMN "confirmImparcialidad" BOOLEAN NOT NULL DEFAULT false;
