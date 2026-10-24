import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Solicitud de eliminación de la cuenta propia.
 *
 * La contraseña verifica la identidad de quien la pide y la confirmación
 * escrita evita que la eliminación salga por un clic sin querer.
 */
export class EliminarCuentaDto {
  @ApiProperty({
    description: 'Contraseña actual de la cuenta',
    example: 'Admin123!',
  })
  @IsString()
  @MinLength(1, { message: 'Escribe tu contraseña para confirmar' })
  contrasena!: string;

  @ApiProperty({
    description: 'Debe escribir exactamente ELIMINAR para confirmar',
    example: 'ELIMINAR',
  })
  @IsString()
  @MinLength(1)
  confirmacion!: string;

  @ApiPropertyOptional({
    description: 'Motivo opcional de la solicitud',
    example: 'Ya no deseo usar la plataforma.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}
