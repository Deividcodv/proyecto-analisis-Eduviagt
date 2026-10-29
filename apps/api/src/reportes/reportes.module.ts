import { Module } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SolicitudesModule } from '../solicitudes/solicitudes.module';

@Module({
  // El módulo de solicitudes aporta el renderizador de PDF (Puppeteer), que
  // ya se usa para las constancias.
  imports: [PrismaModule, SolicitudesModule],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
