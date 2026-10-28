-- AlterTable: Beca.montoBase (monto de referencia, informativo)
ALTER TABLE "beca" ADD COLUMN "montoBase" DECIMAL(12,2);

-- AlterTable: Convocatoria.evaluadorPorDefectoId (FK opcional a usuario)
ALTER TABLE "convocatoria" ADD COLUMN "evaluadorPorDefectoId" TEXT;

-- AddForeignKey
ALTER TABLE "convocatoria" ADD CONSTRAINT "convocatoria_evaluadorPorDefectoId_fkey"
  FOREIGN KEY ("evaluadorPorDefectoId") REFERENCES "usuario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "convocatoria_evaluadorPorDefectoId_idx" ON "convocatoria"("evaluadorPorDefectoId");
