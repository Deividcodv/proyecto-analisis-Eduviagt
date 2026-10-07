-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "departamentoId" TEXT,
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "fechaNacimiento" TIMESTAMP(3),
ADD COLUMN     "generoId" TEXT,
ADD COLUMN     "municipioId" TEXT,
ADD COLUMN     "telefono" TEXT;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_generoId_fkey" FOREIGN KEY ("generoId") REFERENCES "genero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_municipioId_fkey" FOREIGN KEY ("municipioId") REFERENCES "municipio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
