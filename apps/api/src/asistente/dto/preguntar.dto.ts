import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PreguntarDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  pregunta!: string;
}