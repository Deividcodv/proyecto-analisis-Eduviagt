-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "eliminadoAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "usuario_eliminadoAt_idx" ON "usuario"("eliminadoAt");
