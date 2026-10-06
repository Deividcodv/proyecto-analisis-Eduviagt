import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CatalogosService } from './catalogos.service';
import {
  CreateCatalogoDto,
  UpdateCatalogoDto,
  CreateMunicipioDto,
  UpdateMunicipioDto,
} from './dto';
import { Permisos } from '../common/decorators/permisos.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Catálogos')
@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  // ============ PUBLICOS ============
  @Get('generos')
  @Public()
  @ApiOperation({ summary: 'Listar géneros activos' })
  findAllGeneros() {
    return this.catalogosService.findAllGeneros();
  }

  @Get('niveles-academicos')
  @Public()
  @ApiOperation({ summary: 'Listar niveles académicos activos' })
  findAllNiveles() {
    return this.catalogosService.findAllNiveles();
  }

  @Get('departamentos')
  @Public()
  @ApiOperation({ summary: 'Listar departamentos con sus municipios' })
  findAllDepartamentos() {
    return this.catalogosService.findAllDepartamentos();
  }

  @Get('municipios')
  @Public()
  @ApiQuery({ name: 'departamentoId', required: false })
  @ApiOperation({ summary: 'Listar municipios (filtrados por departamento)' })
  findAllMunicipios(@Query('departamentoId') departamentoId?: string) {
    return this.catalogosService.findAllMunicipios(departamentoId);
  }

  @Get('documentos-tipo')
  @Public()
  @ApiOperation({ summary: 'Listar tipos de documento disponibles' })
  findAllDocumentos() {
    return this.catalogosService.findAllDocumentos();
  }

  @Get('becas')
  @Public()
  @ApiOperation({ summary: 'Listar becas activas' })
  findAllBecas() {
    return this.catalogosService.findAllBecas();
  }

  @Get('instituciones')
  @Public()
  @ApiQuery({ name: 'nivel', required: false })
  @ApiQuery({ name: 'busqueda', required: false })
  @ApiOperation({
    summary: 'Listar instituciones educativas (filtradas por nivel o búsqueda)',
  })
  findAllInstituciones(
    @Query('nivel') nivel?: string,
    @Query('busqueda') busqueda?: string,
  ) {
    return this.catalogosService.findAllInstituciones(nivel, busqueda);
  }

  // ============ GENEROS (ADMIN) ============
  @Post('generos')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear género' })
  createGenero(@Body() dto: CreateCatalogoDto) {
    return this.catalogosService.createGenero(dto);
  }

  @Patch('generos/:id')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar género' })
  updateGenero(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCatalogoDto) {
    return this.catalogosService.updateGenero(id, dto);
  }

  @Delete('generos/:id')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar género' })
  deleteGenero(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogosService.deleteGenero(id);
  }

  // ============ NIVELES (ADMIN) ============
  @Post('niveles-academicos')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nivel académico' })
  createNivel(@Body() dto: CreateCatalogoDto) {
    return this.catalogosService.createNivel(dto);
  }

  @Patch('niveles-academicos/:id')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar nivel académico' })
  updateNivel(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCatalogoDto) {
    return this.catalogosService.updateNivel(id, dto);
  }

  @Delete('niveles-academicos/:id')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar nivel académico' })
  deleteNivel(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogosService.deleteNivel(id);
  }

  // ============ DEPARTAMENTOS (ADMIN) ============
  @Post('departamentos')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear departamento' })
  createDepartamento(@Body() dto: CreateCatalogoDto) {
    return this.catalogosService.createDepartamento(dto);
  }

  @Patch('departamentos/:id')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar departamento' })
  updateDepartamento(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCatalogoDto) {
    return this.catalogosService.updateDepartamento(id, dto);
  }

  @Delete('departamentos/:id')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar departamento' })
  deleteDepartamento(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogosService.deleteDepartamento(id);
  }

  // ============ MUNICIPIOS (ADMIN) ============
  @Post('municipios')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear municipio' })
  createMunicipio(@Body() dto: CreateMunicipioDto) {
    return this.catalogosService.createMunicipio(dto);
  }

  @Patch('municipios/:id')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar municipio' })
  updateMunicipio(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMunicipioDto) {
    return this.catalogosService.updateMunicipio(id, dto);
  }

  @Delete('municipios/:id')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar municipio' })
  deleteMunicipio(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogosService.deleteMunicipio(id);
  }

  // ============ DOCUMENTOS TIPO (ADMIN) ============
  @Post('documentos-tipo')
  @Permisos('documento:crear')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear tipo de documento' })
  createDocumento(@Body() dto: CreateCatalogoDto) {
    return this.catalogosService.createDocumento(dto);
  }

  @Patch('documentos-tipo/:id')
  @Permisos('permiso:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar tipo de documento' })
  updateDocumento(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCatalogoDto) {
    return this.catalogosService.updateDocumento(id, dto);
  }

  @Delete('documentos-tipo/:id')
  @Permisos('documento:eliminar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar tipo de documento' })
  deleteDocumento(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogosService.deleteDocumento(id);
  }

  @Get('documentos-tipo/:id')
  @Public()
  @ApiOperation({ summary: 'Obtener tipo de documento por ID' })
  async findDocumentoById(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogosService.findDocumentoById(id);
  }

  @Get('generos/:id')
  @Public()
  @ApiOperation({ summary: 'Obtener género por ID' })
  async findGeneroById(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogosService.findGeneroById(id);
  }
}