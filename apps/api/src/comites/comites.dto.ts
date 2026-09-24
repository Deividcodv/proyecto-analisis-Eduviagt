import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearComiteDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;
}

export class ActualizarComiteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class AgregarMiembroDto {
  @ApiProperty({ description: 'ID del usuario a agregar al comité' })
  @IsUUID('4')
  usuarioId!: string;

  @ApiProperty({ description: 'Rol dentro del comité (ej. PRESIDENTE, VOCAL)' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  rol!: string;
}