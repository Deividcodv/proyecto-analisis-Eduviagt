import { Module } from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudesController } from './solicitudes.controller';
import { SolicitudPerfilService } from './solicitud-perfil.service';
import { SolicitudDocumentoService } from './solicitud-documento.service';
import { SolicitudChecklistService } from './solicitud-checklist.service';
import { MontosService } from './montos.service';
import { ConstanciasService } from './constancias.service';
import { PDF_RENDERER } from './pdf/pdf-renderer.interface';
import { PuppeteerPdfRenderer } from './pdf/puppeteer-pdf-renderer';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { BitacoraModule } from '../bitacora/bitacora.module';

@Module({
  imports: [PrismaModule, NotificacionesModule, BitacoraModule],
  controllers: [SolicitudesController],
  providers: [
    SolicitudesService,
    SolicitudPerfilService,
    SolicitudDocumentoService,
    SolicitudChecklistService,
    MontosService,
    ConstanciasService,
    { provide: PDF_RENDERER, useClass: PuppeteerPdfRenderer },
  ],
  exports: [
    SolicitudesService,
    SolicitudPerfilService,
    SolicitudDocumentoService,
    SolicitudChecklistService,
    MontosService,
    ConstanciasService,
  ],
})
export class SolicitudesModule {}