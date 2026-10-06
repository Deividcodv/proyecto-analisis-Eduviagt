import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificacionesService } from './notificaciones.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('Notificaciones')
@Controller('notificaciones')
@ApiBearerAuth()
export class NotificacionesController {
  constructor(private readonly notificaciones: NotificacionesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar mis notificaciones (paginado)' })
  listar(
    @CurrentUser('id') usuarioId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.notificaciones.listar(
      usuarioId,
      Number(page) || 1,
      Number(pageSize) || 20,
    );
  }

  @Get('no-leidas')
  @ApiOperation({ summary: 'Cantidad de notificaciones no leídas' })
  contarNoLeidas(@CurrentUser('id') usuarioId: string) {
    return this.notificaciones.noLeidas(usuarioId);
  }

  @Get('stream')
  @Public()
  @UseGuards(AuthGuard('sse-jwt'))
  @ApiOperation({ summary: 'Stream SSE de notificaciones del usuario' })
  stream(
    @CurrentUser() usuario: AuthenticatedUser,
    @Res() res: Response,
  ): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sub = this.notificaciones
      .streamParaUsuario(usuario.id)
      .subscribe((evento) => {
        res.write(`data: ${JSON.stringify(evento)}\n\n`);
      });

    const latido = setInterval(() => {
      res.write(`data: ${JSON.stringify({ tipo: 'hb' })}\n\n`);
    }, 25000);

    res.on('close', () => {
      clearInterval(latido);
      sub.unsubscribe();
      res.end();
    });
  }

  @Patch(':id/leida')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  marcarLeida(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') usuarioId: string,
  ) {
    return this.notificaciones.marcarLeida(id, usuarioId);
  }

  @Post('leer-todas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  @ApiResponse({ status: 200, description: 'Cantidad actualizada' })
  marcarTodas(@CurrentUser('id') usuarioId: string) {
    return this.notificaciones.marcarTodasLeidas(usuarioId);
  }
}
