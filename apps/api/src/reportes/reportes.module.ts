import { Module } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluacionesModule } from '../evaluaciones/evaluaciones.module';

@Module({
  imports: [PrismaModule, EvaluacionesModule],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}