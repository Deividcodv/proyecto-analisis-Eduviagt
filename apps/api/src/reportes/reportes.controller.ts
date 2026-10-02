import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ReportesService, TipoReporte } from './reportes.service';
import { Permisos } from '../common/decorators/permisos.decorator';

@ApiTags('Reportes')
@Controller('reportes')
@ApiBearerAuth()
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('solicitudes-por-estado')
  @Permisos('reporte:ver')
  @ApiOperation({ summary: 'Reporte: solicitudes por estado (global o por convocatoria)' })
  @ApiQuery({ name: 'convocatoriaId', required: false, type: String })
  solicitudesPorEstado(
    @Query('convocatoriaId', new ParseUUIDPipe({ optional: true }))
    convocatoriaId?: string,
  ) {
    return this.reportesService.solicitudesPorEstado(convocatoriaId);
  }

  @Get('convocatorias')
  @Permisos('reporte:ver')
  @ApiOperation({ summary: 'Reporte: convocatorias por estado' })
  convocatorias() {
    return this.reportesService.convocatorias();
  }

  @Get('evaluaciones')
  @Permisos('reporte:ver')
  @ApiOperation({
    summary:
      'Reporte: evaluaciones por convocatoria (score promedio, decisiones, pendientes)',
  })
  evaluaciones() {
    return this.reportesService.evaluaciones();
  }

  @Get(':tipo/csv')
  @Permisos('reporte:ver')
  @ApiOperation({ summary: 'Exportar reporte a CSV (UTF-8 con BOM para Excel)' })
  async exportarCsv(
    @Param('tipo') tipo: TipoReporte,
    @Res() res: Response,
  ) {
    const csv = await this.reportesService.generarCsv(tipo);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reporte-${tipo}.csv"`,
    );
    res.send(csv);
  }
}