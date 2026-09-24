import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EvaluacionesService } from './evaluaciones.service';
import { AsignarEvaluadoresDto, RegistrarPuntajeDto } from './evaluaciones.dto';
import { Permisos } from '../common/decorators/permisos.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('Evaluaciones')
@Controller()
@ApiBearerAuth()
export class EvaluacionesController {
  constructor(private readonly evaluacionesService: EvaluacionesService) {}

  @Get('evaluaciones/mias')
  @Permisos('evaluacion:ver')
  @ApiOperation({ summary: 'Mis evaluaciones asignadas (evaluador)' })
  misEvaluaciones(@CurrentUser() usuario: AuthenticatedUser) {
    return this.evaluacionesService.misEvaluaciones(usuario);
  }

  @Get('solicitudes/:id/score')
  @Permisos('evaluacion:ver')
  @ApiOperation({ summary: 'Score ponderado de una solicitud (auto-score)' })
  scoreSolicitud(@Param('id', ParseUUIDPipe) id: string) {
    return this.evaluacionesService.scoreSolicitud(id);
  }

  @Post('solicitudes/:id/evaluadores')
  @Permisos('evaluacion:crear')
  @ApiOperation({ summary: 'Asignar evaluadores a una solicitud en EN_REVISION' })
  @ApiResponse({ status: 400, description: 'Solicitud no está en EN_REVISION' })
  asignarEvaluadores(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AsignarEvaluadoresDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.evaluacionesService.asignarEvaluadores(id, dto, usuario);
  }

  @Put('solicitudes/:id/criterios/:criterioId')
  @Permisos('evaluacion:editar')
  @ApiOperation({ summary: 'Registrar puntaje de un criterio (0-100)' })
  registrarPuntaje(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('criterioId', ParseUUIDPipe) criterioId: string,
    @Body() dto: RegistrarPuntajeDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.evaluacionesService.registrarPuntaje(id, criterioId, dto, usuario);
  }
}