import { Injectable, ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { ROL, ROLES_REVISORES } from '../constants/roles';

@Injectable()
export class AuthzService {
  esAdmin(usuario: AuthenticatedUser): boolean {
    return usuario.rol?.nombre === ROL.ADMIN;
  }

  esStaff(usuario: AuthenticatedUser): boolean {
    // S-012: único punto de decisión para acciones de personal sobre solicitudes.
    // Actualmente: solo ADMIN. Si el modelo cambia, modificar aquí.
    return this.esAdmin(usuario);
  }

  /**
   * Personal autorizado a gestionar solicitudes (Sprint 8 - US-806).
   * El jefe de becas se suma al administrador: puede revisar, aprobar y
   * devolver a revisión, pero la segunda firma nunca puede ser la misma
   * persona que firmó la primera.
   */
  esPersonal(usuario: AuthenticatedUser): boolean {
    return this.esAdmin(usuario) || usuario.rol?.nombre === ROL.JEFE_BECAS;
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
    return this.esAdmin(usuario) || usuario.rol?.nombre === ROL.JEFE_BECAS;
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
