import { Injectable, ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { ROL, ROLES_REVISORES } from '../constants/roles';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthzService {
  constructor(private readonly prisma: PrismaService) {}

  esAdmin(usuario: AuthenticatedUser): boolean {
    return usuario.rol?.nombre === ROL.ADMIN;
  }

  esStaff(usuario: AuthenticatedUser): boolean {
    // S-012: único punto de decisión para acciones de personal sobre solicitudes.
    // Actualmente: solo ADMIN. Si el modelo cambia, modificar aquí.
    return this.esAdmin(usuario);
  }

  /**
   * Personal revisor: puede gestionar el ciclo de revisión de las
   * solicitudes (iniciar revisión, asignar evaluadores, pedir correcciones,
   * devolver a revisión).
   *
   * No es lo mismo que "puede aprobar": el jefe de becas y el coordinador
   * del comité firman, el miembro del comité vota en la sesión.
   */
  esPersonal(usuario: AuthenticatedUser): boolean {
    return (
      this.esAdmin(usuario) ||
      usuario.rol?.nombre === ROL.JEFE_BECAS ||
      usuario.rol?.nombre === ROL.COORDINADOR_COMITE ||
      usuario.rol?.nombre === ROL.MIEMBRO_COMITE
    );
  }

  /**
   * Quién puede firmar la aprobación de una solicitud.
   *
   * La decisión del comité (votación en sesión) es la primera instancia; la
   * firma la hace el jefe de becas, el coordinador del comité o el
   * administrador. El miembro del comité únicamente vota.
   */
  puedeAprobar(usuario: AuthenticatedUser): boolean {
    return (
      this.esAdmin(usuario) ||
      usuario.rol?.nombre === ROL.JEFE_BECAS ||
      usuario.rol?.nombre === ROL.COORDINADOR_COMITE
    );
  }

  /**
   * ¿El usuario participa en la revisión de postulaciones ajenas y, por tanto,
   * puede consultar los documentos que el postulante adjuntó?
   */
  esRevisor(usuario: AuthenticatedUser): boolean {
    return ROLES_REVISORES.includes(usuario.rol?.nombre ?? '');
  }

  assertAdmin(usuario: AuthenticatedUser, mensaje?: string): void {
    if (!this.esAdmin(usuario)) {
      throw new ForbiddenException(
        mensaje ?? 'Solo los administradores pueden realizar esta acción',
      );
    }
  }

  assertAcceso(
    entidad: { usuarioId: string },
    usuario: AuthenticatedUser,
    mensaje = 'No tienes acceso a este recurso',
  ): void {
    if (!this.esAdmin(usuario) && entidad.usuarioId !== usuario.id) {
      throw new ForbiddenException(mensaje);
    }
  }

  /**
   * Como `assertAcceso`, pero también permite al personal (ADMIN o
   * JEFE_BECAS) acceder a las solicitudes que gestiona. Evita la
   * asimetría: antes JEFE_BECAS podía aprobar lo que no podía ver.
   */
  assertAccesoPersonal(
    entidad: { usuarioId: string },
    usuario: AuthenticatedUser,
    mensaje = 'No tienes acceso a este recurso',
  ): void {
    if (
      !this.esPersonal(usuario) &&
      entidad.usuarioId !== usuario.id
    ) {
      throw new ForbiddenException(mensaje);
    }
  }

  assertPropietario(
    entidad: { usuarioId: string },
    usuario: AuthenticatedUser,
    mensaje = 'No tienes acceso a este recurso',
  ): void {
    if (entidad.usuarioId !== usuario.id) {
      throw new ForbiddenException(mensaje);
    }
  }

  /**
   * ¿El usuario tiene esta solicitud asignada como evaluador?
   */
  async esEvaluadorAsignado(
    solicitudId: string,
    usuario: AuthenticatedUser,
  ): Promise<boolean> {
    if (usuario.rol?.nombre !== ROL.EVALUADOR) {
      return false;
    }
    const asignacion = await this.prisma.evaluacion.findFirst({
      where: { solicitudId, evaluadorId: usuario.id },
      select: { id: true },
    });
    return Boolean(asignacion);
  }

  /**
   * Quién puede ver el detalle de una solicitud:
   * - el postulante dueño de ella;
   * - el personal revisor (administrador, jefe de becas, comité);
   * - el evaluador que tiene esa solicitud asignada.
   *
   * Es el punto único de decisión: lo usan el detalle, el checklist y la
   * descarga de documentos, para que no se abra una puerta por un lado y se
   * cierre por otro.
   */
  async assertAccesoASolicitud(
    solicitudId: string,
    solicitud: { usuarioId: string },
    usuario: AuthenticatedUser,
    mensaje = 'No tienes acceso a este recurso',
  ): Promise<void> {
    if (this.esPersonal(usuario)) return;
    if (solicitud.usuarioId === usuario.id) return;
    if (await this.esEvaluadorAsignado(solicitudId, usuario)) return;

    throw new ForbiddenException(mensaje);
  }

  /**
   * Quién puede gestionar el pago de una beca (el desembolso).
   *
   * Es la autoridad competente sobre el dinero: el jefe de becas y el
   * administrador. El comité y los evaluadores no.
   */
  puedeGestionarDesembolso(usuario: AuthenticatedUser): boolean {
    return this.esAdmin(usuario) || usuario.rol?.nombre === ROL.JEFE_BECAS;
  }

  /**
   * Segunda instancia de aprobación (Sprint 8 - US-802/803).
   *
   * Además del permiso, la segunda firma nunca puede ser la misma persona
   * que aprobó en primera instancia: la separación de authority es real, no
   * solo de rol.
   */
  puedeSegundaAprobacion(
    usuario: AuthenticatedUser,
    primerAprobadorId?: string | null,
  ): boolean {
    if (primerAprobadorId && primerAprobadorId === usuario.id) {
      return false;
    }
    return this.puedeAprobar(usuario);
  }

  assertSegundaAprobacion(
    usuario: AuthenticatedUser,
    primerAprobadorId?: string | null,
  ): void {
    if (primerAprobadorId && primerAprobadorId === usuario.id) {
      throw new ForbiddenException(
        'La segunda aprobación debe realizarla una persona distinta a quien aprobó en primera instancia',
      );
    }
    if (!this.puedeSegundaAprobacion(usuario, primerAprobadorId)) {
      throw new ForbiddenException(
        'No tienes autorización para aprobar en segunda instancia',
      );
    }
  }
}
