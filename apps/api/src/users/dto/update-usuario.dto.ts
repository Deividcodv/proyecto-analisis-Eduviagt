import { IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UsuarioEstado } from '@prisma/client';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ description: 'Nuevo rol del usuario' })
  @IsOptional()
  @IsUUID()
  rolId?: string;

  @ApiPropertyOptional({ enum: UsuarioEstado, description: 'Nuevo estado del usuario' })
  @IsOptional()
  @IsEnum(UsuarioEstado)
  estado?: UsuarioEstado;
}