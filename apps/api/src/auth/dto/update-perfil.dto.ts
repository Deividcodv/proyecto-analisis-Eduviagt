import {
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePerfilDto {
  @ApiPropertyOptional({ example: 'Juan Carlos Pérez', description: 'Nombres completos' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombres?: string;

  @ApiPropertyOptional({ example: '+502 5555 1234', description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({ example: '1998-05-21', description: 'Fecha de nacimiento (ISO)' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento no es válida' })
  fechaNacimiento?: string;

  @ApiPropertyOptional({ example: 'Calle 3, zona 8', description: 'Dirección de residencia' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  direccion?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000000', description: 'ID de género' })
  @IsOptional()
  @IsUUID('4', { message: 'El género no es válido' })
  generoId?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000000', description: 'ID de departamento' })
  @IsOptional()
  @IsUUID('4', { message: 'El departamento no es válido' })
  departamentoId?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000000', description: 'ID de municipio' })
  @IsOptional()
  @IsUUID('4', { message: 'El municipio no es válido' })
  municipioId?: string;
}