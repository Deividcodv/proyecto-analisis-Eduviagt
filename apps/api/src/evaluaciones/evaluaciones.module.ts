import { Module } from '@nestjs/common';
import { EvaluacionesService } from './evaluaciones.service';
import { EvaluacionesController } from './evaluaciones.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [PrismaModule, NotificacionesModule],
  controllers: [EvaluacionesController],
  providers: [EvaluacionesService],
  exports: [EvaluacionesService],
})
export class EvaluacionesModule {}