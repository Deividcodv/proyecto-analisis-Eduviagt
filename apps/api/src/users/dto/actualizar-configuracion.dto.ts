import {
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Preferencias de notificaciones y sonido del usuario (Sprint 8 - US-804).
 * Todos los campos son opcionales: se envía solo lo que cambia.
 */
export class ActualizarConfiguracionDto {
  @ApiPropertyOptional({
    description: 'Si el usuario quiere recibir notificaciones',
  })
  @IsOptional()
  @IsBoolean()
  notificacionesActivas?: boolean;

  @ApiPropertyOptional({
    description: 'Si se reproduce un sonido al llegar una notificación',
  })
  @IsOptional()
  @IsBoolean()
  sonidoNotificaciones?: boolean;

  @ApiPropertyOptional({
    description: 'Volumen del sonido (0-100)',
    example: 40,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El volumen debe ser un número entero' })
  @Min(0, { message: 'El volumen no puede ser menor que 0' })
  @Max(100, { message: 'El volumen no puede ser mayor que 100' })
  volumenSonido?: number;
}
