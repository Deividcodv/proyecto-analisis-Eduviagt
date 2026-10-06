import { Injectable, ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { ROL } from '../constants/roles';

@Injectable()
export class AuthzService {
  esAdmin(usuario: AuthenticatedUser): boolean {
    return usuario.rol?.nombre === ROL.ADMIN;
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

  assertPropietario(
    entidad: { usuarioId: string },
    usuario: AuthenticatedUser,
    mensaje = 'No tienes acceso a este recurso',
  ): void {
    if (entidad.usuarioId !== usuario.id) {
      throw new ForbiddenException(mensaje);
    }
  }
}
