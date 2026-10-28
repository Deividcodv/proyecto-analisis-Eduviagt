import {
  IsString,
  IsOptional,
  IsUUID,
  IsISO8601,
  MinLength,
  MaxLength,
  IsIn,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
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

/**
 * Regla de cálculo del monto por tramo de ingreso familiar (Sprint 8).
 * Se declara antes que `CreateConvocatoriaDto` porque los decoradores
 * necesitan la clase ya definida cuando se la referencia.
 */
export class ReglaMontoDto {
  @ApiProperty({ description: 'Nombre de la regla', example: 'Ingreso hasta Q3,000' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre!: string;

  @ApiPropertyOptional({ description: 'Ingreso mínimo del tramo (inclusivo)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  ingresoMin?: number | null;

  @ApiPropertyOptional({ description: 'Ingreso máximo del tramo (exclusivo)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  ingresoMax?: number | null;

  @ApiProperty({ enum: ['FIJO', 'PORCENTAJE', 'COMPLETO'] })
  @IsIn(['FIJO', 'PORCENTAJE', 'COMPLETO'])
  tipo!: 'FIJO' | 'PORCENTAJE' | 'COMPLETO';

  @ApiPropertyOptional({ description: 'Monto fijo cuando tipo = FIJO' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoFijo?: number | null;

  @ApiPropertyOptional({
    description: 'Porcentaje del monto base (0.4 = 40%) cuando tipo = PORCENTAJE',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  porcentaje?: number | null;

  @ApiPropertyOptional({ description: 'Orden de aplicación (menor = primero)', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  prioridad?: number;
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

  @ApiPropertyOptional({
    description: 'Evaluador sugerido por defecto para las postulaciones de esta convocatoria (siempre editable)',
  })
  @IsOptional()
  @IsUUID()
  evaluadorPorDefectoId?: string | null;

  // Montos (Sprint 8 - US-801)
  @ApiPropertyOptional({ description: 'Moneda del monto base', default: 'GTQ' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  moneda?: string;

  @ApiPropertyOptional({
    description: 'Monto base de la beca, en la moneda indicada',
    example: 12000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoBase?: number;

  @ApiPropertyOptional({
    description: 'Si la beca puede otorgarse de forma parcial',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  permiteParcial?: boolean;

  @ApiPropertyOptional({
    description: 'Si el monto se calcula con reglas por tramo de ingreso',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  usarReglasMonto?: boolean;

  @ApiPropertyOptional({
    type: [ReglaMontoDto],
    description: 'Reglas por tramo de ingreso familiar (Sprint 8 - US-801)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReglaMontoDto)
  reglasMonto?: ReglaMontoDto[];
}

/**
 * Conjunto de reglas de monto de una convocatoria (Sprint 8 - US-801).
 * Reemplaza por completo las reglas anteriores.
 */
export class ReglasMontoDto {
  @ApiPropertyOptional({ description: 'Monto base de la convocatoria' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoBase?: number | null;

  @ApiProperty({ type: [ReglaMontoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReglaMontoDto)
  reglas!: ReglaMontoDto[];
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

  @ApiPropertyOptional({
    description: 'Evaluador sugerido por defecto para las postulaciones de esta convocatoria (siempre editable)',
  })
  @IsOptional()
  @IsUUID()
  evaluadorPorDefectoId?: string | null;

  // Montos (Sprint 8 - US-801)
  @ApiPropertyOptional({ description: 'Moneda del monto base' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  moneda?: string;

  @ApiPropertyOptional({ description: 'Monto base de la beca' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoBase?: number | null;

  @ApiPropertyOptional({ description: 'Si la beca puede otorgarse de forma parcial' })
  @IsOptional()
  @IsBoolean()
  permiteParcial?: boolean;

  @ApiPropertyOptional({
    description: 'Si el monto se calcula con reglas por tramo de ingreso',
  })
  @IsOptional()
  @IsBoolean()
  usarReglasMonto?: boolean;

  @ApiPropertyOptional({
    type: [ReglaMontoDto],
    description: 'Reglas por tramo de ingreso familiar (Sprint 8 - US-801)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReglaMontoDto)
  reglasMonto?: ReglaMontoDto[];
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