import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSION_SERVICE,
  IPermissionService,
} from './permission.service';
import { PERMISSIONS_KEY } from '../decorators/permisos.decorator';

interface UsuarioConId {
  id: string;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PERMISSION_SERVICE)
    private readonly permissionService: IPermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    // Un array vacío NO relaja el acceso: fail-closed, igual que @Roles([]).
    // (Antes `@Permisos([])` permitía a cualquiera; S-005.)
    if (requiredPermissions.length === 0) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as UsuarioConId | undefined;

    if (!user?.id) {
      throw new UnauthorizedException('Debes iniciar sesión');
    }

    for (const permiso of requiredPermissions) {
      const decision = await this.permissionService.tienePermiso(
        user.id,
        permiso,
      );
      if (decision !== 'ALLOW') {
        throw new ForbiddenException(
          `No tienes el permiso requerido: ${permiso}`,
        );
      }
    }

    return true;
  }
}
