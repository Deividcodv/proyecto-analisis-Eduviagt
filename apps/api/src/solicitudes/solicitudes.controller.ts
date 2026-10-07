import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SolicitudesService } from './solicitudes.service';
import { ConstanciasService } from './constancias.service';
import {
  CreateSolicitudDto,
  TransicionSolicitudDto,
  SolicitarCorreccionDto,
  PerfilAcademicoDto,
  PerfilFinancieroDto,
  MarcarEstadoDocumentoDto,
  GuardarRespuestasDto,
} from './dto';
import { Permisos } from '../common/decorators/permisos.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

export const DOCUMENTO_MAX_BYTES = 5 * 1024 * 1024;
const DOCUMENTO_MIME_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png'];

export function documentoFileFilter(
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: BadRequestException | null, acceptFile: boolean) => void,
) {
  const extensionOk = /\.(pdf|jpe?g|png)$/i.test(file.originalname);
  if (!extensionOk || !DOCUMENTO_MIME_PERMITIDOS.includes(file.mimetype)) {
    cb(
      new BadRequestException(
        'Formato no permitido: solo PDF, JPG o PNG (máximo 5 MB)',
      ),
      false,
    );
    return;
  }
  cb(null, true);
}

@ApiTags('Solicitudes')
@Controller('solicitudes')
@ApiBearerAuth()
export class SolicitudesController {
  constructor(
    private readonly solicitudesService: SolicitudesService,
    private readonly constanciasService: ConstanciasService,
  ) {}

  @Post()
  @Permisos('solicitud:crear')
  @ApiOperation({ summary: 'Crear solicitud para una convocatoria abierta' })
  @ApiResponse({ status: 201, description: 'Solicitud creada en BORRADOR' })
  @ApiResponse({ status: 400, description: 'Convocatoria no abierta o solicitud duplicada' })
  create(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: CreateSolicitudDto,
  ) {
    return this.solicitudesService.create(usuario.id, dto);
  }

  @Get()
  @Permisos('solicitud:ver')
  @ApiOperation({ summary: 'Listar mis solicitudes (admin: todas)' })
  findAll(@CurrentUser() usuario: AuthenticatedUser) {
    return this.solicitudesService.findAll(usuario);
  }

  @Get('consulta/:codigo')
  @Public()
  @ApiOperation({ summary: 'Consulta pública del estado de una solicitud por código' })
  @ApiResponse({ status: 200, description: 'Estado de la solicitud' })
  @ApiResponse({ status: 404, description: 'Código no encontrado' })
  consultaPublica(@Param('codigo') codigo: string) {
    return this.solicitudesService.consultaPublica(codigo);
  }

  @Get(':id/checklist')
  @Permisos('solicitud:ver')
  @ApiOperation({ summary: 'Checklist de completitud (perfiles y documentos)' })
  checklist(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.solicitudesService.obtenerChecklist(id, usuario);
  }

  @Get(':id')
  @Permisos('solicitud:ver')
  @ApiOperation({ summary: 'Obtener solicitud por ID' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.solicitudesService.findById(id, usuario);
  }

  @Post(':id/transicion')
  @Permisos('solicitud:editar')
  @ApiOperation({ summary: 'Aplicar transición de estado (máquina de estados)' })
  @ApiResponse({ status: 400, description: 'Transición inválida' })
  transicion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransicionSolicitudDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.solicitudesService.transicion(id, dto, usuario);
  }

  @Post(':id/solicitar-correccion')
  @Permisos('solicitud:editar')
  @ApiOperation({
    summary: 'Solicitar una corrección (comité) respetando maxCorrecciones',
  })
  @ApiResponse({ status: 400, description: 'Se agotaron las subsanaciones' })
  solicitarCorreccion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SolicitarCorreccionDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.solicitudesService.solicitarCorreccion(id, dto, usuario);
  }

  @Put(':id/perfil-academico')
  @Permisos('solicitud:editar')
  @ApiOperation({ summary: 'Guardar perfil académico (con campos "otro")' })
  perfilAcademico(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PerfilAcademicoDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.solicitudesService.guardarPerfilAcademico(id, dto, usuario);
  }

  @Put(':id/perfil-financiero')
  @Permisos('solicitud:editar')
  @ApiOperation({ summary: 'Guardar perfil financiero' })
  perfilFinanciero(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PerfilFinancieroDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.solicitudesService.guardarPerfilFinanciero(id, dto, usuario);
  }

  @Put(':id/respuestas')
  @Permisos('solicitud:editar')
  @ApiOperation({
    summary: 'Guardar respuestas del formulario dinámico de la convocatoria',
  })
  respuestas(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GuardarRespuestasDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.solicitudesService.guardarRespuestas(id, dto, usuario);
  }

  @Post(':id/documentos/:tipoId')
  @Permisos('documento:crear')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: DOCUMENTO_MAX_BYTES, files: 1 },
      fileFilter: documentoFileFilter,
    }),
  )
  @ApiOperation({ summary: 'Subir documento (PDF, JPG o PNG, máx 5 MB)' })
  @ApiResponse({ status: 413, description: 'Archivo mayor a 5 MB' })
  subirDocumento(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tipoId', ParseUUIDPipe) tipoId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido en el campo "file"');
    }
    return this.solicitudesService.subirDocumento(id, tipoId, file, usuario);
  }

  @Delete(':id/documentos/:tipoId')
  @Permisos('documento:eliminar')
  @ApiOperation({ summary: 'Eliminar documento por tipo' })
  eliminarDocumento(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tipoId', ParseUUIDPipe) tipoId: string,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.solicitudesService.eliminarDocumento(id, tipoId, usuario);
  }

  @Patch(':id/documentos/:tipoId/estado')
  @Permisos('documento:editar')
  @ApiOperation({ summary: 'Marcar documento como RECHAZADO (retro S3)' })
  marcarEstadoDocumento(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tipoId', ParseUUIDPipe) tipoId: string,
    @Body() dto: MarcarEstadoDocumentoDto,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.solicitudesService.marcarEstadoDocumento(
      id,
      tipoId,
      dto.estado,
      dto.comentario,
      usuario,
    );
  }

  @Get(':id/constancia')
  @Permisos('solicitud:ver')
  @ApiOperation({
    summary:
      'Descargar constancia de beca en PDF (solo solicitudes APROBADAS)',
  })
  @ApiResponse({ status: 200, description: 'PDF de constancia' })
  @ApiResponse({ status: 400, description: 'Solicitud no aprobada' })
  @ApiResponse({ status: 403, description: 'Sin acceso a la solicitud' })
  async descargarConstancia(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const pdf = await this.constanciasService.generarConstancia(id, usuario);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="constancia-${id.slice(0, 8)}.pdf"`,
    );
    res.setHeader('Content-Length', pdf.length);
    res.send(pdf);
  }
}