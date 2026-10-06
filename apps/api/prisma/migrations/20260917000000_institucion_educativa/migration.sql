-- CreateTable
CREATE TABLE "institucion_educativa" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "sector" TEXT,
    "departamento" TEXT,
    "municipio" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institucion_educativa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "institucion_educativa_nivel_idx" ON "institucion_educativa"("nivel");

-- CreateIndex
CREATE INDEX "institucion_educativa_nombre_idx" ON "institucion_educativa"("nombre");
