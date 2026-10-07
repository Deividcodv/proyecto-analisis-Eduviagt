import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Permisos } from '../common/decorators/permisos.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AuthzService } from '../common/services/authz.service';

@ApiTags('Audit')
@Controller('audit')
@ApiBearerAuth()
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly authz: AuthzService,
  ) {}

  @Get()
  @Permisos('auditoria:ver')
  @ApiOperation({ summary: 'Listar entradas de auditoría (admin: todas, empleados: propias)' })
  @ApiQuery({ name: 'entidad', required: false })
  @ApiQuery({ name: 'accion', required: false })
  @ApiQuery({ name: 'usuarioId', required: false })
  @ApiQuery({ name: 'desde', required: false })
  @ApiQuery({ name: 'hasta', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  listar(
    @CurrentUser() usuario: AuthenticatedUser,
    @Query('entidad') entidad?: string,
    @Query('accion') accion?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const esAdmin = this.authz.esAdmin(usuario);
    return this.auditService.listar({
      entidad,
      accion,
      usuarioId: esAdmin ? usuarioId : usuario.id,
      desde,
      hasta,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
