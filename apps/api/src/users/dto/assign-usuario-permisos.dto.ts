import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PermisoEfecto } from '@prisma/client';

export class UsuarioPermisoItemDto {
  @ApiProperty({ example: 'uuid-permiso', description: 'ID del permiso' })
  @IsUUID()
  permisoId!: string;

  @ApiProperty({ enum: PermisoEfecto, description: 'PERMITIR otorga; DENEGAR bloquea' })
  @IsEnum(PermisoEfecto)
  efecto!: PermisoEfecto;
}

export class AssignUsuarioPermisosDto {
  @ApiProperty({
    type: [UsuarioPermisoItemDto],
    description:
      'Excepciones de permisos por usuario. Los permisos ausentes se heredan del rol.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UsuarioPermisoItemDto)
  permisos!: UsuarioPermisoItemDto[];
}