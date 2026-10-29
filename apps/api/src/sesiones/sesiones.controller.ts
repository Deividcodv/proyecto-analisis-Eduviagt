import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SesionesService } from './sesiones.service';
import { CrearSesionDto, RegistrarVotoDto } from './sesiones.dto';
import { Permisos } from '../common/decorators/permisos.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('Sesiones')
@Controller('sesiones')
@ApiBearerAuth()
export class SesionesController {
  constructor(private readonly sesionesService: SesionesService) {}

  @Post()
  @Permisos('sesion:crear')
  @ApiOperation({ summary: 'Crear sesión con agenda de solicitudes EVALUADA' })
  crearSesion(
    @Body() dto: CrearSesionDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.sesionesService.crearSesion(dto, usuario);
  }

  @Get()
  @Permisos('sesion:ver')
  @ApiOperation({ summary: 'Listar sesiones' })
  listarSesiones() {
    return this.sesionesService.listarSesiones();
  }

  @Get('mias')
  @Permisos('sesion:ver')
  @ApiOperation({
    summary: 'Listar las sesiones de los comités a los que pertenece el usuario',
  })
  listarMisSesiones(@CurrentUser() usuario: AuthenticatedUser) {
    return this.sesionesService.listarMisSesiones(usuario);
  }

  @Get(':id')
  @Permisos('sesion:ver')
  @ApiOperation({ summary: 'Detalle de una sesión con agenda y votos' })
  obtenerSesion(@Param('id', ParseUUIDPipe) id: string) {
    return this.sesionesService.obtenerSesion(id);
  }

  @Post(':id/votos')
  @Permisos('voto:crear')
  @ApiOperation({ summary: 'Registrar voto de un miembro del comité' })
  registrarVoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarVotoDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.sesionesService.registrarVoto(id, dto, usuario);
  }

  @Post(':id/finalizar')
  @Permisos('sesion:editar')
  @ApiOperation({
    summary: 'Finalizar sesión validando quórum y generando decisiones',
  })
  finalizarSesion(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.sesionesService.finalizarSesion(id, usuario);
  }

  @Delete(':id/agenda/:solicitudId')
  @Permisos('sesion:editar')
  @ApiOperation({ summary: 'Quitar una solicitud de la agenda de la sesión' })
  @ApiResponse({ status: 400, description: 'La sesión ya fue finalizada' })
  quitarDeAgenda(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('solicitudId', ParseUUIDPipe) solicitudId: string,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.sesionesService.quitarDeAgenda(id, solicitudId, usuario);
  }
}