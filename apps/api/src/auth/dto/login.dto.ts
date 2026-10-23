import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({ example: 'juan@test.com', description: 'Correo electrónico' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  // Normaliza el correo antes de validarlo: un usuario que escribe su
  // dirección con mayúsculas o espacios debe poder entrar igual.
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña' })
  @IsString()
  @MinLength(1)
  password!: string;
}
