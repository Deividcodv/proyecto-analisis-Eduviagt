import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BecaCobertura } from '@prisma/client';
import { ConvocatoriasService } from './convocatorias.service';
import {
  CreateConvocatoriaDto,
  UpdateConvocatoriaDto,
  TransicionDto,
  DocumentosRequeridosDto,
} from './dto';
import { Public } from '../common/decorators/public.decorator';
import { Permisos } from '../common/decorators/permisos.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('Convocatorias')
@Controller('convocatorias')
export class ConvocatoriasController {
  constructor(private readonly convocatoriasService: ConvocatoriasService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar convocatorias abiertas (público)' })
  @ApiResponse({ status: 200, description: 'Lista de convocatorias ABIERTA' })
  @ApiQuery({ name: 'busqueda', required: false, description: 'Buscar por nombre de convocatoria o beca' })
  @ApiQuery({ name: 'nivelAcademicoId', required: false, description: 'Filtrar por nivel académico' })
  @ApiQuery({ name: 'cobertura', required: false, enum: BecaCobertura, description: 'Filtrar por cobertura' })
  findAllPublic(
    @Query('busqueda') busqueda?: string,
    @Query('nivelAcademicoId') nivelAcademicoId?: string,
    @Query('cobertura') cobertura?: BecaCobertura,
  ) {
    return this.convocatoriasService.findAllPublic({
      busqueda,
      nivelAcademicoId,
      cobertura,
    });
  }

  @Get('todas')
  @Permisos('convocatoria:ver')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas las convocatorias (admin)' })
  findAll() {
    return this.convocatoriasService.findAll();
  }

  @Get(':id/mi-solicitud')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener la solicitud del usuario para la convocatoria (o null)' })
  miSolicitud(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.convocatoriasService.miSolicitud(id, usuario);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener convocatoria por ID' })
  @ApiResponse({ status: 200, description: 'Convocatoria encontrada' })
  @ApiResponse({ status: 404, description: 'Convocatoria no encontrada' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.convocatoriasService.findById(id, true);
  }

  @Post()
  @Permisos('convocatoria:crear')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear convocatoria (inicia en BORRADOR)' })
  @ApiResponse({ status: 201, description: 'Convocatoria creada' })
  create(@Body() dto: CreateConvocatoriaDto) {
    return this.convocatoriasService.create(dto);
  }

  @Patch(':id')
  @Permisos('convocatoria:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar datos de la convocatoria' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConvocatoriaDto,
  ) {
    return this.convocatoriasService.update(id, dto);
  }

  @Post(':id/transicion')
  @Permisos('convocatoria:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aplicar transición de estado (máquina de estados)' })
  @ApiResponse({ status: 400, description: 'Transición inválida' })
  transicion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransicionDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.convocatoriasService.transicion(id, dto, usuario);
  }

  @Patch(':id/documentos')
  @Permisos('convocatoria:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Configurar documentos requeridos de la convocatoria' })
  documentos(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DocumentosRequeridosDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.convocatoriasService.reemplazarDocumentosRequeridos(id, dto, usuario);
  }
}