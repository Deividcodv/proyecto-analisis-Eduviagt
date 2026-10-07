import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../common/services/authz.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PerfilAcademicoDto, PerfilFinancieroDto } from './dto';
import { SOLICITUD_ESTADO } from '../common/constants/estados';

@Injectable()
export class SolicitudPerfilService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  async guardarAcademico(
    id: string,
    dto: PerfilAcademicoDto,
    usuario: AuthenticatedUser,
  ) {
    await this.obtainEditable(id, usuario);

    const campos = {
      ...this.resolverCatalogoCampo(dto, 'generoId', 'generoOtro'),
      ...this.resolverCatalogoCampo(dto, 'nivelAcademicoId', 'nivelAcademicoOtro'),
      ...this.resolverCatalogoCampo(dto, 'departamentoId', 'departamentoOtro'),
      ...this.resolverCatalogoCampo(dto, 'municipioId', 'municipioOtro'),
      ...(dto.institucion !== undefined ? { institucion: dto.institucion } : {}),
      ...(dto.carrera !== undefined ? { carrera: dto.carrera } : {}),
      ...(dto.promedio !== undefined ? { promedio: dto.promedio } : {}),
    };

    await this.assertCatalogosExisten(campos);

    return this.prisma.solicitudPerfilAcademico.upsert({
      where: { solicitudId: id },
      update: campos,
      create: { solicitudId: id, ...campos },
    });
  }

  async guardarFinanciero(
    id: string,
    dto: PerfilFinancieroDto,
    usuario: AuthenticatedUser,
  ) {
    await this.obtainEditable(id, usuario);

    const campos = {
      ...(dto.ingresoFamiliar !== undefined
        ? { ingresoFamiliar: dto.ingresoFamiliar }
        : {}),
      ...(dto.numeroDependientes !== undefined
        ? { numeroDependientes: dto.numeroDependientes }
        : {}),
      ...(dto.becasAnteriores !== undefined
        ? { becasAnteriores: dto.becasAnteriores }
        : {}),
      ...(dto.descripcionSituacion !== undefined
        ? { descripcionSituacion: dto.descripcionSituacion }
        : {}),
    };

    return this.prisma.solicitudPerfilFinanciero.upsert({
      where: { solicitudId: id },
      update: campos,
      create: { solicitudId: id, ...campos },
    });
  }

  esAcademicoCompleto(
    perfil?: {
      generoId?: string | null;
      generoOtro?: string | null;
      nivelAcademicoId?: string | null;
      nivelAcademicoOtro?: string | null;
    } | null,
  ): boolean {
    if (!perfil) {
      return false;
    }
    const generoOk = Boolean(perfil.generoId || perfil.generoOtro);
    const nivelOk = Boolean(
      perfil.nivelAcademicoId || perfil.nivelAcademicoOtro,
    );
    return generoOk && nivelOk;
  }

  esFinancieroCompleto(perfil?: { ingresoFamiliar?: number | null } | null): boolean {
    return Boolean(perfil && perfil.ingresoFamiliar != null);
  }

  private async obtainEditable(id: string, usuario: AuthenticatedUser) {
    const solicitud = await this.prisma.solicitud.findUnique({ where: { id } });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    if (!this.authz.esAdmin(usuario) && solicitud.usuarioId !== usuario.id) {
      throw new ForbiddenException('No tienes acceso a esta solicitud');
    }

    if (!this.authz.esAdmin(usuario) && solicitud.estado !== SOLICITUD_ESTADO.BORRADOR) {      throw new BadRequestException(
        'Solo se puede editar la solicitud en estado BORRADOR',
      );
    }

    return solicitud;
  }

  private resolverCatalogoCampo(
    dto: PerfilAcademicoDto,
    idProp: 'generoId' | 'nivelAcademicoId' | 'departamentoId' | 'municipioId',
    otroProp:
      | 'generoOtro'
      | 'nivelAcademicoOtro'
      | 'departamentoOtro'
      | 'municipioOtro',
  ): Record<string, string | null | undefined> {
    const idVal = dto[idProp];
    const otroVal = dto[otroProp];

    if (idVal && otroVal) {
      throw new BadRequestException(
        `${idProp} y ${otroProp} son mutuamente excluyentes`,
      );
    }

    if (otroVal) {
      return { [idProp]: null, [otroProp]: otroVal };
    }

    if (idVal !== undefined) {
      return { [idProp]: idVal, [otroProp]: null };
    }

    return {};
  }

  private async assertCatalogosExisten(
    campos: Record<string, string | number | null | undefined>,
  ) {
    for (const [prop, valor] of Object.entries(campos)) {
      if (valor == null || typeof valor !== 'string' || !prop.endsWith('Id')) {
        continue;
      }

      let existe = false;
      switch (prop) {
        case 'generoId':
          existe = Boolean(
            await this.prisma.genero.findUnique({ where: { id: valor } }),
          );
          break;
        case 'nivelAcademicoId':
          existe = Boolean(
            await this.prisma.nivelAcademico.findUnique({ where: { id: valor } }),
          );
          break;
        case 'departamentoId':
          existe = Boolean(
            await this.prisma.departamento.findUnique({ where: { id: valor } }),
          );
          break;
        case 'municipioId':
          existe = Boolean(
            await this.prisma.municipio.findUnique({ where: { id: valor } }),
          );
          break;
      }

      if (!existe) {
        throw new BadRequestException(`Catálogo inexistente para ${prop}`);
      }
    }
  }
}
