import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComitesService } from './comites.service';
import {
  CrearComiteDto,
  ActualizarComiteDto,
  AgregarMiembroDto,
} from './comites.dto';
import { Permisos } from '../common/decorators/permisos.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('Comit�s')
@Controller('comites')
@ApiBearerAuth()
export class ComitesController {
  constructor(private readonly comitesService: ComitesService) {}

  @Post()
  @Permisos('comite:crear')
  @ApiOperation({ summary: 'Crear comit� evaluador' })
  crearComite(@Body() dto: CrearComiteDto, @CurrentUser() usuario: AuthenticatedUser) {
    return this.comitesService.crearComite(dto, usuario);
  }

  @Get()
  @Permisos('comite:ver')
  @ApiOperation({ summary: 'Listar comités' })
  listarComites() {
    return this.comitesService.listarComites();
  }

  @Get(':id')
  @Permisos('comite:ver')
  @ApiOperation({ summary: 'Detalle de un comité con sus miembros' })
  obtenerComite(@Param('id', ParseUUIDPipe) id: string) {
    return this.comitesService.obtenerComite(id);
  }

  @Patch(':id')
  @Permisos('comite:editar')
  @ApiOperation({ summary: 'Actualizar comité' })
  actualizarComite(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarComiteDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.comitesService.actualizarComite(id, dto, usuario);
  }

  @Delete(':id')
  @Permisos('comite:editar')
  @ApiOperation({ summary: 'Eliminar comité' })
  eliminarComite(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.comitesService.eliminarComite(id, usuario);
  }

  @Post(':id/miembros')
  @Permisos('comite:editar')
  @ApiOperation({ summary: 'Agregar miembro a un comité' })
  agregarMiembro(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AgregarMiembroDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.comitesService.agregarMiembro(id, dto, usuario);
  }

  @Delete(':id/miembros/:usuarioId')
  @Permisos('comite:editar')
  @ApiOperation({ summary: 'Quitar miembro de un comité' })
  eliminarMiembro(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.comitesService.eliminarMiembro(id, usuarioId, usuario);
  }
}