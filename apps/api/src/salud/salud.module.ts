import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Módulo de salud del servicio.
 *
 * Va aparte para que se pueda probar de forma aislada y para que anadir mas
 * comprobaciones (disco, memoria, almacenamiento) no toque los dominios.
 */
@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class SaludModule {}
