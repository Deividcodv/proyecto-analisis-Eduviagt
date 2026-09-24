-- CreateTable
CREATE TABLE "sesion_agenda" (
    "id" TEXT NOT NULL,
    "sesionId" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesion_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sesion_agenda_sesionId_solicitudId_key" ON "sesion_agenda"("sesionId", "solicitudId");

-- AddForeignKey
ALTER TABLE "sesion_agenda" ADD CONSTRAINT "sesion_agenda_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "sesion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion_agenda" ADD CONSTRAINT "sesion_agenda_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
