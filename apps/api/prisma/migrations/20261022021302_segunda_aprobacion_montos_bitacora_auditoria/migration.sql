-- AlterEnum
ALTER TYPE "SolicitudEstado" ADD VALUE 'PENDIENTE_SEGUNDA_APROBACION';

-- AlterTable
ALTER TABLE "convocatoria" ADD COLUMN     "moneda" TEXT NOT NULL DEFAULT 'GTQ',
ADD COLUMN     "montoBase" DECIMAL(12,2),
ADD COLUMN     "permiteParcial" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "usarReglasMonto" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "historial_estado" ADD COLUMN     "accion" TEXT,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "resultado" TEXT;

-- AlterTable
ALTER TABLE "solicitud" ADD COLUMN     "montoAprobado" DECIMAL(12,2),
ADD COLUMN     "montoCalculadoAt" TIMESTAMP(3),
ADD COLUMN     "montoCalculadoPor" TEXT,
ADD COLUMN     "montoOrigenCalculo" TEXT,
ADD COLUMN     "montoOtorgable" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "convocatoria_regla_monto" (
    "id" TEXT NOT NULL,
    "convocatoriaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ingresoMin" DECIMAL(12,2),
    "ingresoMax" DECIMAL(12,2),
    "tipo" TEXT NOT NULL,
    "montoFijo" DECIMAL(12,2),
    "porcentaje" DOUBLE PRECISION,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convocatoria_regla_monto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitud_aprobacion" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "rolNombre" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "comentario" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitud_aprobacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bitacora_sistema" (
    "id" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorNombre" TEXT,
    "actorRol" TEXT,
    "actorCorreo" TEXT,
    "modulo" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "accionClave" TEXT NOT NULL,
    "accionHumana" TEXT NOT NULL,
    "descripcionHumana" TEXT NOT NULL,
    "camposClave" JSONB,
    "datosRelevantes" JSONB,
    "resultado" TEXT NOT NULL,
    "motivo" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "origen" TEXT NOT NULL DEFAULT 'API',
    "correlacionId" TEXT,
    "sessionId" TEXT,

    CONSTRAINT "bitacora_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_usuario" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "notificacionesActivas" BOOLEAN NOT NULL DEFAULT true,
    "sonidoNotificaciones" BOOLEAN NOT NULL DEFAULT true,
    "volumenSonido" INTEGER NOT NULL DEFAULT 40,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "convocatoria_regla_monto_convocatoriaId_idx" ON "convocatoria_regla_monto"("convocatoriaId");

-- CreateIndex
CREATE INDEX "solicitud_aprobacion_solicitudId_idx" ON "solicitud_aprobacion"("solicitudId");

-- CreateIndex
CREATE INDEX "solicitud_aprobacion_usuarioId_idx" ON "solicitud_aprobacion"("usuarioId");

-- CreateIndex
CREATE INDEX "solicitud_aprobacion_createdAt_idx" ON "solicitud_aprobacion"("createdAt");

-- CreateIndex
CREATE INDEX "bitacora_sistema_fechaHora_idx" ON "bitacora_sistema"("fechaHora");

-- CreateIndex
CREATE INDEX "bitacora_sistema_actorId_idx" ON "bitacora_sistema"("actorId");

-- CreateIndex
CREATE INDEX "bitacora_sistema_entidad_entidadId_idx" ON "bitacora_sistema"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "bitacora_sistema_accionClave_idx" ON "bitacora_sistema"("accionClave");

-- CreateIndex
CREATE INDEX "bitacora_sistema_modulo_idx" ON "bitacora_sistema"("modulo");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_usuario_usuarioId_key" ON "configuracion_usuario"("usuarioId");

-- AddForeignKey
ALTER TABLE "convocatoria_regla_monto" ADD CONSTRAINT "convocatoria_regla_monto_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "convocatoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_aprobacion" ADD CONSTRAINT "solicitud_aprobacion_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_aprobacion" ADD CONSTRAINT "solicitud_aprobacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracion_usuario" ADD CONSTRAINT "configuracion_usuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
