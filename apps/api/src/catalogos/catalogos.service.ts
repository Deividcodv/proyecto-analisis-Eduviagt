import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCatalogoDto,
  UpdateCatalogoDto,
  CreateMunicipioDto,
  UpdateMunicipioDto,
} from './dto';

@Injectable()
export class CatalogosService {
  constructor(private readonly prisma: PrismaService) {}

  // ============ GENEROS ============
  findAllGeneros() {
    return this.prisma.genero.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async createGenero(dto: CreateCatalogoDto) {
    await this.assertUnique('genero', dto.nombre);
    return this.prisma.genero.create({ data: { nombre: dto.nombre, activo: dto.activo ?? true } });
  }

  async updateGenero(id: string, dto: UpdateCatalogoDto) {
    await this.findOrFail('genero', id);
    if (dto.nombre) {
      await this.assertUnique('genero', dto.nombre, id);
    }
    return this.prisma.genero.update({ where: { id }, data: dto });
  }

  async deleteGenero(id: string) {
    await this.findOrFail('genero', id);
    return this.prisma.genero.update({ where: { id }, data: { activo: false } });
  }

  // ============ NIVELES ACADEMICOS ============
  findAllNiveles() {
    return this.prisma.nivelAcademico.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async createNivel(dto: CreateCatalogoDto) {
    await this.assertUnique('nivelAcademico', dto.nombre);
    return this.prisma.nivelAcademico.create({ data: { nombre: dto.nombre, activo: dto.activo ?? true } });
  }

  async updateNivel(id: string, dto: UpdateCatalogoDto) {
    await this.findOrFail('nivelAcademico', id);
    if (dto.nombre) {
      await this.assertUnique('nivelAcademico', dto.nombre, id);
    }
    return this.prisma.nivelAcademico.update({ where: { id }, data: dto });
  }

  async deleteNivel(id: string) {
    await this.findOrFail('nivelAcademico', id);
    return this.prisma.nivelAcademico.update({ where: { id }, data: { activo: false } });
  }

  // ============ DEPARTAMENTOS ============
  findAllDepartamentos() {
    return this.prisma.departamento.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        municipios: { where: { activo: true }, orderBy: { nombre: 'asc' } },
      },
    });
  }

  async createDepartamento(dto: CreateCatalogoDto) {
    await this.assertUnique('departamento', dto.nombre);
    return this.prisma.departamento.create({ data: { nombre: dto.nombre, activo: dto.activo ?? true } });
  }

  async updateDepartamento(id: string, dto: UpdateCatalogoDto) {
    await this.findOrFail('departamento', id);
    if (dto.nombre) {
      await this.assertUnique('departamento', dto.nombre, id);
    }
    return this.prisma.departamento.update({ where: { id }, data: dto });
  }

  async deleteDepartamento(id: string) {
    await this.findOrFail('departamento', id);
    return this.prisma.departamento.update({ where: { id }, data: { activo: false } });
  }

  // ============ MUNICIPIOS ============
  findAllMunicipios(departamentoId?: string) {
    return this.prisma.municipio.findMany({
      where: {
        activo: true,
        ...(departamentoId ? { departamentoId } : {}),
      },
      orderBy: { nombre: 'asc' },
      include: { departamento: true },
    });
  }

  async createMunicipio(dto: CreateMunicipioDto) {
    await this.findOrFail('departamento', dto.departamentoId);
    await this.assertUnique('municipio', dto.nombre, undefined, { departamentoId: dto.departamentoId });
    return this.prisma.municipio.create({
      data: { nombre: dto.nombre, departamentoId: dto.departamentoId, activo: dto.activo ?? true },
    });
  }

  async updateMunicipio(id: string, dto: UpdateMunicipioDto) {
    await this.findOrFail('municipio', id);
    if (dto.departamentoId) {
      await this.findOrFail('departamento', dto.departamentoId);
    }
    if (dto.nombre || dto.departamentoId) {
      await this.assertUnique('municipio', dto.nombre ?? (await this.prisma.municipio.findUnique({ where: { id } }))!.nombre, id, { departamentoId: dto.departamentoId ?? (await this.prisma.municipio.findUnique({ where: { id } }))!.departamentoId });
    }
    return this.prisma.municipio.update({ where: { id }, data: dto });
  }

  async deleteMunicipio(id: string) {
    await this.findOrFail('municipio', id);
    return this.prisma.municipio.update({ where: { id }, data: { activo: false } });
  }

  // ============ DOCUMENTOS TIPO ============
  findAllDocumentos() {
    return this.prisma.documentoTipo.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  findAllBecas() {
    return this.prisma.beca.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' },
    });
  }

  // ============ INSTITUCIONES EDUCATIVAS ============
  findAllInstituciones(nivel?: string, busqueda?: string) {
    return this.prisma.institucionEducativa.findMany({
      where: {
        activa: true,
        ...(nivel ? { nivel } : {}),
        ...(busqueda
          ? { nombre: { contains: busqueda, mode: 'insensitive' as const } }
          : {}),
      },
      orderBy: { nombre: 'asc' },
      take: 50,
    });
  }

  async createDocumento(dto: CreateCatalogoDto) {
    await this.assertUnique('documentoTipo', dto.nombre);
    return this.prisma.documentoTipo.create({ data: { nombre: dto.nombre, activo: dto.activo ?? true } });
  }

  async updateDocumento(id: string, dto: UpdateCatalogoDto) {
    await this.findOrFail('documentoTipo', id);
    if (dto.nombre) {
      await this.assertUnique('documentoTipo', dto.nombre, id);
    }
    return this.prisma.documentoTipo.update({ where: { id }, data: dto });
  }

  async deleteDocumento(id: string) {
    await this.findOrFail('documentoTipo', id);
    return this.prisma.documentoTipo.update({ where: { id }, data: { activo: false } });
  }

  async findDocumentoById(id: string) {
    return this.findOrFail('documentoTipo', id);
  }

  async findGeneroById(id: string) {
    return this.findOrFail('genero', id);
  }

  // ============ HELPERS ============
  private delegate(
    model: 'genero' | 'nivelAcademico' | 'departamento' | 'municipio' | 'documentoTipo',
  ) {
    return this.prisma[model] as unknown as {
      findFirst(args: {
        where: Record<string, unknown>;
      }): Promise<{ id: string } | null>;
      findUnique(args: {
        where: { id: string };
      }): Promise<{ id: string } | null>;
    };
  }

  private async assertUnique(
    model: 'genero' | 'nivelAcademico' | 'departamento' | 'municipio' | 'documentoTipo',
    nombre: string,
    excludeId?: string,
    extra?: Record<string, unknown>,
  ) {
    const existing = await this.delegate(model).findFirst({
      where: { nombre, ...(excludeId ? { id: { not: excludeId } } : {}), ...(extra ?? {}) },
    });

    if (existing) {
      throw new ConflictException(`El valor "${nombre}" ya existe en catálogos`);
    }
  }

  private async findOrFail(
    model: 'genero' | 'nivelAcademico' | 'departamento' | 'municipio' | 'documentoTipo',
    id: string,
  ) {
    const record = await this.delegate(model).findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Registro ${model} no encontrado`);
    }
    return record;
  }
}