import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @ApiProperty({ example: '1234567890123', description: 'CUI del usuario (13 dígitos)' })
  @IsString()
  @Matches(/^\d{13}$/, { message: 'El CUI debe tener exactamente 13 dígitos' })
  cui!: string;

  @ApiProperty({ example: 'Ana Gómez', description: 'Nombres completos' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  nombres!: string;

  @ApiProperty({ example: 'ana@gob.gt', description: 'Correo electrónico' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email!: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña inicial (mín 8 caracteres)' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: 'uuid-rol', description: 'ID del rol a asignar' })
  @IsUUID()
  rolId!: string;
}