import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AsignarEvaluadoresDto {
  @ApiProperty({
    description: 'IDs de usuarios EVALUADOR a asignar a la solicitud',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  evaluadorIds!: string[];
}

export class RegistrarPuntajeDto {
  @ApiProperty({ description: 'Puntaje del criterio (0-100)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  puntaje!: number;

  @ApiPropertyOptional({ description: 'Observaciones del evaluador' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}