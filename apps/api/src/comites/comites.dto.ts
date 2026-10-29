import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Roles que puede tener una persona dentro de un comité. */
export const ROLES_COMITE = ['PRESIDENTE', 'VOCAL', 'SECRETARIO'] as const;

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

  @ApiProperty({ description: 'Rol dentro del comité (PRESIDENTE, VOCAL o SECRETARIO)' })
  @IsIn(ROLES_COMITE)
  rol!: string;
}

export class CambiarRolMiembroDto {
  @ApiProperty({ description: 'Nuevo rol dentro del comité' })
  @IsIn(ROLES_COMITE)
  rol!: string;
}