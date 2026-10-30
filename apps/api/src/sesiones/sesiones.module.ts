import { Module } from '@nestjs/common';
import { SesionesService } from './sesiones.service';
import { SesionesController } from './sesiones.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SolicitudesModule } from '../solicitudes/solicitudes.module';

@Module({
  imports: [PrismaModule, SolicitudesModule],
  controllers: [SesionesController],
  providers: [SesionesService],
  exports: [SesionesService],
})
export class SesionesModule {}