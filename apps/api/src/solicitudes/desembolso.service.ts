import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { AuthzService } from '../common/services/authz.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { SOLICITUD_ESTADO } from '../common/constants/estados';
import type { RegistrarDesembolsoDto } from './dto';

/**
 * Desembolso de la beca: el pago de una postulación aprobada.
 *
 * Al aprobarse se abre el desembolso en PENDIENTE; el jefe de becas (o la
 * autoridad competente) lo va actualizando hasta marcarlo PAGADO, y el
 * postulante recibe el aviso.
 */
@Injectable()
export class DesembolsoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notificaciones: NotificacionesService,
    private readonly authz: AuthzService,
  ) {}

  /** Datos del desembolso de una solicitud (para el personal y el postulante). */
  async obtener(solicitudId: string, usuario: AuthenticatedUser) {
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
      select: {
        id: true,
        usuarioId: true,
        estado: true,
        montoAprobado: true,
        montoOtorgable: true,
      },
    });

    if (!solicitud) {
      throw new NotFoundException(
        `Solicitud con id ${solicitudId} no encontrada`,
      );
    }

    // El postulante solo puede ver el desembolso de su propia solicitud.
    if (!this.authz.esPersonal(usuario) && solicitud.usuarioId !== usuario.id) {
      throw new ForbiddenException('No tienes acceso a esta solicitud');
    }

    return this.prisma.desembolso.findUnique({ where: { solicitudId } });
  }

  /**
   * Registra o actualiza el pago de la beca.
   *
   * Solo quien administra las becas (jefe de becas o administrador) puede
   * hacerlo, y solo sobre una solicitud aprobada.
   */
  async registrar(
    solicitudId: string,
    dto: RegistrarDesembolsoDto,
    usuario: AuthenticatedUser,
  ) {
    if (!this.authz.puedeGestionarDesembolso(usuario)) {
      throw new ForbiddenException(
        'Solo la autoridad competente puede registrar el pago de la beca',
      );
    }

    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
      select: {
        id: true,
        usuarioId: true,
        estado: true,
        montoAprobado: true,
        montoOtorgable: true,
      },
    });

    if (!solicitud) {
      throw new NotFoundException(
        `Solicitud con id ${solicitudId} no encontrada`,
      );
    }

    if (solicitud.estado !== SOLICITUD_ESTADO.APROBADA) {
      throw new BadRequestException(
        'El pago solo se puede registrar sobre una beca aprobada',
      );
    }

    const monto =
      dto.monto != null
        ? new Prisma.Decimal(dto.monto)
        : new Prisma.Decimal(solicitud.montoAprobado ?? solicitud.montoOtorgable ?? 0);

    const datos = {
      estado: dto.estado ?? 'PENDIENTE',
      monto,
      metodo: dto.metodo ?? null,
      banco: dto.banco ?? null,
      numeroCuenta: dto.numeroCuenta ?? null,
      titular: dto.titular ?? null,
      fechaPago: dto.fechaPago ? new Date(dto.fechaPago) : null,
      comprobanteUrl: dto.comprobanteUrl ?? null,
      notas: dto.notas ?? null,
    };

    const desembolso = await this.prisma.desembolso.upsert({
      where: { solicitudId },
      create: {
        solicitudId,
        ...datos,
        registradoPorId: usuario.id,
      },
      update: {
        ...datos,
        registradoPorId: usuario.id,
      },
    });

    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'registrar-desembolso',
      entidad: 'desembolso',
      entidadId: desembolso.id,
      detalle: { solicitudId, estado: desembolso.estado },
    });

    if (datos.estado === 'PAGADO') {
      await this.notificaciones.notificarUsuario(solicitud.usuarioId, {
        tipo: 'DESEMBOLSO_PAGADO',
        titulo: 'Tu beca fue pagada',
        cuerpo:
          'El pago de tu beca se realizó. Puedes descargar tu constancia con el detalle del desembolso.',
      });
    }

    return desembolso;
  }

  /**
   * Abre el desembolso en PENDIENTE al aprobarse la beca: así el postulante
   * sabe que su beca está aprobada y que el pago está en camino.
   */
  async abrirAlAprobar(
    solicitudId: string,
    monto: Prisma.Decimal | null | undefined,
    usuario: AuthenticatedUser,
  ) {
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
      select: { id: true, usuarioId: true, estado: true },
    });
    if (!solicitud) return null;

    return this.prisma.desembolso.upsert({
      where: { solicitudId },
      create: {
        solicitudId,
        estado: 'PENDIENTE',
        monto: new Prisma.Decimal(monto ?? 0),
        registradoPorId: usuario.id,
      },
      update: {},
    });
  }
}
