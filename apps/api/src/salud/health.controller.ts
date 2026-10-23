import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Comprobación de salud del servicio.
 *
 * La usan el balanceador, PM2, nginx y cualquier monitorización externa.
 * Responde 200 solo si la API responde **y** la base de datos está
 * accesible: un proceso vivo con la base caída no es un servicio sano.
 */
@ApiTags('Salud')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Estado del servicio y de la base de datos',
  })
  @ApiResponse({ status: 200, description: 'Todo en orden' })
  @ApiResponse({ status: 503, description: 'La base de datos no responde' })
  async verificar(@Res({ passthrough: true }) res: Response) {
    const inicio = Date.now();

    let baseDeDatos = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      baseDeDatos = 'error';
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      console.error(
        `[salud] La base de datos no responde: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return {
      estado: baseDeDatos === 'ok' ? 'ok' : 'degradado',
      version: process.env.npm_package_version ?? '1.0.0',
      entorno: process.env.NODE_ENV ?? 'development',
      baseDeDatos,
      duracionMs: Date.now() - inicio,
      marcaTiempo: new Date().toISOString(),
    };
  }
}
