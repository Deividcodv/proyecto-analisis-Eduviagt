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

@ApiTags('Comités')
@Controller('comites')
@ApiBearerAuth()
export class ComitesController {
  constructor(private readonly comitesService: ComitesService) {}

  @Post()
  @Permisos('comite:crear')
  @ApiOperation({ summary: 'Crear comité evaluador' })
  crearComite(@Body() dto: CrearComiteDto) {
    return this.comitesService.crearComite(dto);
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
  ) {
    return this.comitesService.actualizarComite(id, dto);
  }

  @Delete(':id')
  @Permisos('comite:editar')
  @ApiOperation({ summary: 'Eliminar comité' })
  eliminarComite(@Param('id', ParseUUIDPipe) id: string) {
    return this.comitesService.eliminarComite(id);
  }

  @Post(':id/miembros')
  @Permisos('comite:editar')
  @ApiOperation({ summary: 'Agregar miembro a un comité' })
  agregarMiembro(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AgregarMiembroDto,
  ) {
    return this.comitesService.agregarMiembro(id, dto);
  }

  @Delete(':id/miembros/:usuarioId')
  @Permisos('comite:editar')
  @ApiOperation({ summary: 'Quitar miembro de un comité' })
  eliminarMiembro(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
  ) {
    return this.comitesService.eliminarMiembro(id, usuarioId);
  }
}