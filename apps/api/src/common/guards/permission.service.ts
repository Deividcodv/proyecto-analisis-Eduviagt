import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPermissionChain } from './permission-chain';
import { PermissionDecision } from './permission-chain';

export type { PermissionDecision } from './permission-chain';

export const PERMISSION_SERVICE = 'PERMISSION_SERVICE';

export interface IPermissionService {
  tienePermiso(userId: string, permisoKey: string): Promise<PermissionDecision>;
}

@Injectable()
export class PermissionService implements IPermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async tienePermiso(
    userId: string,
    permisoKey: string,
  ): Promise<PermissionDecision> {
    const chain = buildPermissionChain(this.prisma);
    return chain.handle(userId, permisoKey);
  }
}
