import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DesembolsoEstado, DesembolsoMetodo } from '@prisma/client';

/**
 * Datos del pago de una beca aprobada.
 *
 * Todos son opcionales: el desembolso se abre solo al aprobarse y se va
 * completando conforme avanza el trámite.
 */
export class RegistrarDesembolsoDto {
  @ApiPropertyOptional({ enum: DesembolsoEstado })
  @IsOptional()
  @IsEnum(DesembolsoEstado)
  estado?: DesembolsoEstado;

  @ApiPropertyOptional({ enum: DesembolsoMetodo })
  @IsOptional()
  @IsEnum(DesembolsoMetodo)
  metodo?: DesembolsoMetodo;

  @ApiPropertyOptional({ description: 'Monto a entregar' })
  @IsOptional()
  @IsNumber()
  monto?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  banco?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  numeroCuenta?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  titular?: string;

  @ApiPropertyOptional({ description: 'Fecha en que se entregó el dinero' })
  @IsOptional()
  @IsDateString()
  fechaPago?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  comprobanteUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notas?: string;
}
