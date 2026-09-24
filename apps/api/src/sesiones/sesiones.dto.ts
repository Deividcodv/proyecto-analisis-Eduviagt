import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const VOTO_OPCIONES = ['APROBAR', 'RECHAZAR', 'ABSTENCION'] as const;

export class CrearSesionDto {
  @ApiProperty()
  @IsUUID('4')
  comiteId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  fecha!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  lugar?: string;

  @ApiPropertyOptional({ description: 'Miembros mínimos presentes para decidir' })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  quorumMinimo?: number;

  @ApiProperty({ description: 'Solicitudes EVALUADA de la agenda de la sesión' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  solicitudesIds!: string[];
}

export class RegistrarVotoDto {
  @ApiProperty()
  @IsUUID('4')
  solicitudId!: string;

  @ApiProperty({ enum: [...VOTO_OPCIONES] })
  @IsIn([...VOTO_OPCIONES])
  voto!: (typeof VOTO_OPCIONES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}