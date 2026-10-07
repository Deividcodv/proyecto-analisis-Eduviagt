-- CreateEnum
CREATE TYPE "BecaCobertura" AS ENUM ('PARCIAL', 'COMPLETA');

-- AlterTable
ALTER TABLE "convocatoria" ADD COLUMN     "cobertura" "BecaCobertura",
ADD COLUMN     "formulario" JSONB,
ADD COLUMN     "nivelAcademicoId" TEXT;

-- AlterTable
ALTER TABLE "solicitud" ADD COLUMN     "formularioSnapshot" JSONB,
ADD COLUMN     "respuestas" JSONB;

-- AddForeignKey
ALTER TABLE "convocatoria" ADD CONSTRAINT "convocatoria_nivelAcademicoId_fkey" FOREIGN KEY ("nivelAcademicoId") REFERENCES "nivel_academico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
