import {
  IsString,
  IsOptional,
  IsUUID,
  IsISO8601,
  MinLength,
  IsIn,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BecaCobertura } from '@prisma/client';
import { ConvocatoriaTransicion } from '../convocatoria-state-machine';

export const TIPOS_CAMPO_FORMULARIO = [
  'texto',
  'textarea',
  'numero',
  'fecha',
  'seleccion',
  'booleano',
  'archivo',
] as const;

export const SECCIONES_CAMPO_FORMULARIO = [
  'academico',
  'socioeconomico',
  'personal',
  'adicional',
] as const;

export class CampoFormularioDto {
  @ApiProperty({ description: 'Identificador del campo dentro de la convocatoria' })
  @IsString()
  @MinLength(1)
  id!: string;

  @ApiProperty({ enum: SECCIONES_CAMPO_FORMULARIO })
  @IsIn(SECCIONES_CAMPO_FORMULARIO)
  seccion!: (typeof SECCIONES_CAMPO_FORMULARIO)[number];

  @ApiProperty({ example: 'Promedio general' })
  @IsString()
  @MinLength(1)
  etiqueta!: string;

  @ApiProperty({ enum: TIPOS_CAMPO_FORMULARIO })
  @IsIn(TIPOS_CAMPO_FORMULARIO)
  tipo!: (typeof TIPOS_CAMPO_FORMULARIO)[number];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requerido?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ayuda?: string;

  @ApiPropertyOptional({ type: [String], description: 'Opciones para tipo seleccion' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  opciones?: string[];

  @ApiPropertyOptional({ description: 'Tipo de documento para campos tipo archivo' })
  @IsOptional()
  @IsUUID()
  documentoTipoId?: string;

  @ApiPropertyOptional({
    description: 'Clave base a la que mapear el valor (promedio, ingresoFamiliar, etc.)',
  })
  @IsOptional()
  @IsString()
  claveBase?: string;
}

export class CreateConvocatoriaDto {
  @ApiProperty({ example: 'Beca de Excelencia Académica' })
  @IsString()
  @MinLength(3)
  nombre!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ description: 'ID de la beca asociada' })
  @IsUUID()
  becaId!: string;

  @ApiPropertyOptional({ description: 'ID del nivel académico objetivo' })
  @IsOptional()
  @IsUUID()
  nivelAcademicoId?: string;

  @ApiPropertyOptional({ enum: BecaCobertura })
  @IsOptional()
  @IsEnum(BecaCobertura)
  cobertura?: BecaCobertura;

  @ApiPropertyOptional({ type: [CampoFormularioDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampoFormularioDto)
  formulario?: CampoFormularioDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  fechaApertura?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  fechaCierre?: string;

  @ApiPropertyOptional({
    description: 'Mínimo de evaluadores que deben completar la evaluación',
    default: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  evaluadoresMinimos?: number;

  @ApiPropertyOptional({
    description: 'Máximo de subsanaciones (correcciones) permitidas',
    default: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  maxCorrecciones?: number;
}

export class UpdateConvocatoriaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  becaId?: string;

  @ApiPropertyOptional({ description: 'ID del nivel académico objetivo' })
  @IsOptional()
  @IsUUID()
  nivelAcademicoId?: string | null;

  @ApiPropertyOptional({ enum: BecaCobertura, nullable: true })
  @IsOptional()
  @IsEnum(BecaCobertura)
  cobertura?: BecaCobertura | null;

  @ApiPropertyOptional({ type: [CampoFormularioDto], nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampoFormularioDto)
  formulario?: CampoFormularioDto[] | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  fechaApertura?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  fechaCierre?: string;

  @ApiPropertyOptional({
    description: 'Mínimo de evaluadores que deben completar la evaluación',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  evaluadoresMinimos?: number;

  @ApiPropertyOptional({
    description: 'Máximo de subsanaciones (correcciones) permitidas',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  maxCorrecciones?: number;
}

export class TransicionDto {
  @ApiProperty({ enum: ['publicar', 'cerrar', 'iniciar_evaluacion', 'resolver', 'reabrir', 'archivar'] })
  @IsIn(['publicar', 'cerrar', 'iniciar_evaluacion', 'resolver', 'reabrir', 'archivar'])
  accion!: ConvocatoriaTransicion;
}

export class DocumentoRequeridoItemDto {
  @ApiProperty({ description: 'ID del tipo de documento' })
  @IsUUID()
  documentoTipoId!: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  obligatorio!: boolean;
}

export class DocumentosRequeridosDto {
  @ApiProperty({ type: [DocumentoRequeridoItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentoRequeridoItemDto)
  items!: DocumentoRequeridoItemDto[];
}