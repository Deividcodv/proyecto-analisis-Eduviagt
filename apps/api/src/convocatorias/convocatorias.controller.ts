import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConvocatoriasService } from './convocatorias.service';
import {
  CreateConvocatoriaDto,
  UpdateConvocatoriaDto,
  TransicionDto,
  DocumentosRequeridosDto,
} from './dto';
import { Public } from '../common/decorators/public.decorator';
import { Permisos } from '../common/decorators/permisos.decorator';

@ApiTags('Convocatorias')
@Controller('convocatorias')
export class ConvocatoriasController {
  constructor(private readonly convocatoriasService: ConvocatoriasService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar convocatorias abiertas (público)' })
  @ApiResponse({ status: 200, description: 'Lista de convocatorias ABIERTA' })
  findAllPublic() {
    return this.convocatoriasService.findAllPublic();
  }

  @Get('todas')
  @Permisos('convocatoria:ver')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas las convocatorias (admin)' })
  findAll() {
    return this.convocatoriasService.findAll();
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
  ) {
    return this.convocatoriasService.transicion(id, dto);
  }

  @Patch(':id/documentos')
  @Permisos('convocatoria:editar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Configurar documentos requeridos de la convocatoria' })
  documentos(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DocumentosRequeridosDto,
  ) {
    return this.convocatoriasService.reemplazarDocumentosRequeridos(id, dto);
  }
}