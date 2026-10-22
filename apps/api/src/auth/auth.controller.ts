import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { EliminarCuentaService } from './eliminar-cuenta.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { EliminarCuentaDto } from './dto/eliminar-cuenta.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly eliminarCuentaService: EliminarCuentaService,
  ) {}

  @Post('registro')
  @Public()
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 409, description: 'CUI o email ya registrado' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso con tokens' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar access token' })
  @ApiResponse({ status: 200, description: 'Nuevo access token' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refreshToken(dto.refreshToken, req.ip);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Patch('perfil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar datos del perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePerfilDto,
  ) {
    return this.authService.updatePerfil(userId, dto);
  }

  @Post('eliminar-cuenta')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Eliminar mi cuenta: se anonimizan los datos personales y se conservan, con seudónimo, los registros de trazabilidad',
  })
  @ApiResponse({ status: 401, description: 'Contraseña incorrecta' })
  async eliminarCuenta(
    @CurrentUser('id') userId: string,
    @Body() dto: EliminarCuentaDto,
  ) {
    if (dto.confirmacion.trim().toUpperCase() !== 'ELIMINAR') {
      throw new BadRequestException(
        'Para confirmar, escribe la palabra ELIMINAR en el campo de confirmación.',
      );
    }
    return this.eliminarCuentaService.eliminar(
      userId,
      dto.contrasena,
      dto.motivo,
    );
  }
}
