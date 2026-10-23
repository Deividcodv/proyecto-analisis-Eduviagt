import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfiguracionUsuarioService } from './configuracion.service';
import { ActualizarConfiguracionDto } from './dto/actualizar-configuracion.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

/**
 * Preferencias del usuario (Sprint 8 - US-804): notificaciones y sonido.
 * Cada usuario solo puede ver y cambiar las suyas.
 */
@ApiTags('Preferencias')
@Controller('usuarios/me')
@ApiBearerAuth()
export class ConfiguracionController {
  constructor(private readonly configuracion: ConfiguracionUsuarioService) {}

  @Get('configuracion')
  @ApiOperation({ summary: 'Obtener mis preferencias de notificación y sonido' })
  obtener(@CurrentUser() usuario: AuthenticatedUser) {
    return this.configuracion.obtener(usuario.id);
  }

  @Patch('configuracion')
  @ApiOperation({ summary: 'Actualizar mis preferencias de notificación y sonido' })
  actualizar(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: ActualizarConfiguracionDto,
  ) {
    return this.configuracion.actualizar(usuario.id, dto);
  }
}
