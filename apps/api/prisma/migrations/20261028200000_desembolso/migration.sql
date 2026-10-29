-- Pago de las becas aprobadas: estado, método, datos bancarios y
-- comprobante. Una solicitud tiene a lo sumo un desembolso vigente.
CREATE TYPE "DesembolsoEstado" AS ENUM ('PENDIENTE', 'EN_TRAMITE', 'PAGADO', 'ANULADO');
CREATE TYPE "DesembolsoMetodo" AS ENUM ('TRANSFERENCIA', 'CHEQUE', 'EFECTIVO');

CREATE TABLE "desembolso" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "estado" "DesembolsoEstado" NOT NULL DEFAULT 'PENDIENTE',
    "monto" DECIMAL(12,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'GTQ',
    "metodo" "DesembolsoMetodo",
    "banco" TEXT,
    "numeroCuenta" TEXT,
    "titular" TEXT,
    "fechaPago" TIMESTAMP(3),
    "comprobanteUrl" TEXT,
    "registradoPorId" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desembolso_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "desembolso_solicitudId_key" ON "desembolso"("solicitudId");
CREATE INDEX "desembolso_estado_idx" ON "desembolso"("estado");

ALTER TABLE "desembolso"
  ADD CONSTRAINT "desembolso_solicitudId_fkey"
  FOREIGN KEY ("solicitudId") REFERENCES "solicitud"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "desembolso"
  ADD CONSTRAINT "desembolso_registradoPorId_fkey"
  FOREIGN KEY ("registradoPorId") REFERENCES "usuario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
