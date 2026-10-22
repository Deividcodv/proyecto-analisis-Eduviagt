import { Global, Module } from '@nestjs/common';
import { BitacoraService } from './bitacora.service';
import { BitacoraController } from './bitacora.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Módulo de la bitácora del sistema (US-805).
 * Solo expone consultas: la bitácora es de solo lectura, no se registran
 * endpoints para actualizar ni eliminar entradas.
 */
@Global()
@Module({
  imports: [PrismaModule],
  controllers: [BitacoraController],
  providers: [BitacoraService],
  exports: [BitacoraService],
})
export class BitacoraModule {}
