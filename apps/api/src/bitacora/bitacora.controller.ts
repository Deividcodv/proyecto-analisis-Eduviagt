import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BitacoraService } from './bitacora.service';
import { Permisos } from '../common/decorators/permisos.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AuthzService } from '../common/services/authz.service';

/**
 * Consulta de la bitácora del sistema. Es de solo lectura: no existe ningún
 * endpoint para modificar o eliminar entradas (Sprint 8 - US-805).
 */
@ApiTags('Bitácora')
@Controller('bitacora')
@ApiBearerAuth()
export class BitacoraController {
  constructor(
    private readonly bitacoraService: BitacoraService,
    private readonly authz: AuthzService,
  ) {}

  @Get()
  @Permisos('auditoria:ver')
  @ApiOperation({
    summary: 'Listar entradas de la bitácora del sistema (solo lectura)',
  })
  @ApiQuery({ name: 'modulo', required: false })
  @ApiQuery({ name: 'entidad', required: false })
  @ApiQuery({ name: 'entidadId', required: false })
  @ApiQuery({ name: 'accionClave', required: false })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listar(
    @CurrentUser() usuario: AuthenticatedUser,
    @Query('modulo') modulo?: string,
    @Query('entidad') entidad?: string,
    @Query('entidadId') entidadId?: string,
    @Query('accionClave') accionClave?: string,
    @Query('actorId') actorId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bitacoraService.listar({
      modulo,
      entidad,
      entidadId,
      accionClave,
      actorId: this.authz.esAdmin(usuario) ? actorId : usuario.id,
      desde,
      hasta,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
