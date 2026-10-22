import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarConfiguracionDto } from './dto/actualizar-configuracion.dto';

export interface ConfiguracionUsuario {
  notificacionesActivas: boolean;
  sonidoNotificaciones: boolean;
  volumenSonido: number;
}

/**
 * Preferencias de notificaciones y sonido (Sprint 8 - US-804).
 *
 * La configuración se crea sola con los valores por defecto la primera vez
 * que el usuario la consulta, así el portal nunca se queda sin preferencias.
 */
@Injectable()
export class ConfiguracionUsuarioService {
  constructor(private readonly prisma: PrismaService) {}

  async obtener(usuarioId: string): Promise<ConfiguracionUsuario> {
    const existente = await this.prisma.configuracionUsuario.findUnique({
      where: { usuarioId },
    });

    if (existente) {
      return {
        notificacionesActivas: existente.notificacionesActivas,
        sonidoNotificaciones: existente.sonidoNotificaciones,
        volumenSonido: existente.volumenSonido,
      };
    }

    const creada = await this.prisma.configuracionUsuario.create({
      data: { usuarioId },
    });

    return {
      notificacionesActivas: creada.notificacionesActivas,
      sonidoNotificaciones: creada.sonidoNotificaciones,
      volumenSonido: creada.volumenSonido,
    };
  }

  async actualizar(
    usuarioId: string,
    dto: ActualizarConfiguracionDto,
  ): Promise<ConfiguracionUsuario> {
    // `upsert` cubre el caso de quien nunca abrió sus preferencias.
    const config = await this.prisma.configuracionUsuario.upsert({
      where: { usuarioId },
      update: {
        ...(dto.notificacionesActivas !== undefined
          ? { notificacionesActivas: dto.notificacionesActivas }
          : {}),
        ...(dto.sonidoNotificaciones !== undefined
          ? { sonidoNotificaciones: dto.sonidoNotificaciones }
          : {}),
        ...(dto.volumenSonido !== undefined
          ? { volumenSonido: dto.volumenSonido }
          : {}),
      },
      create: {
        usuarioId,
        ...(dto.notificacionesActivas !== undefined
          ? { notificacionesActivas: dto.notificacionesActivas }
          : {}),
        ...(dto.sonidoNotificaciones !== undefined
          ? { sonidoNotificaciones: dto.sonidoNotificaciones }
          : {}),
        ...(dto.volumenSonido !== undefined
          ? { volumenSonido: dto.volumenSonido }
          : {}),
      },
    });

    return {
      notificacionesActivas: config.notificacionesActivas,
      sonidoNotificaciones: config.sonidoNotificaciones,
      volumenSonido: config.volumenSonido,
    };
  }
}
