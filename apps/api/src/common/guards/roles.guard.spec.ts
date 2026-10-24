import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function mockExecutionContext(rol?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: rol ? { rol: { nombre: rol } } : undefined,
      }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
}

function mockReflector(requiredRoles?: string[]): Reflector {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
  } as unknown as Reflector;
}

describe('RolesGuard', () => {
  it('permite cuando el manejador no declara @Roles', () => {
    const guard = new RolesGuard(mockReflector(undefined));
    expect(guard.canActivate(mockExecutionContext('ADMIN'))).toBe(true);
  });

  it('permite cuando el rol del usuario está en la lista', () => {
    const guard = new RolesGuard(mockReflector(['ADMIN', 'EVALUADOR']));
    expect(guard.canActivate(mockExecutionContext('EVALUADOR'))).toBe(true);
  });

  it('deniega cuando el rol del usuario no está en la lista', () => {
    const guard = new RolesGuard(mockReflector(['ADMIN']));
    expect(guard.canActivate(mockExecutionContext('POSTULANTE'))).toBe(false);
  });

  it('deniega cuando @Roles([]) está vacío (fail-closed)', () => {
    const guard = new RolesGuard(mockReflector([]));
    expect(guard.canActivate(mockExecutionContext('ADMIN'))).toBe(false);
  });

  it('deniega cuando no hay usuario autenticado', () => {
    const guard = new RolesGuard(mockReflector(['ADMIN']));
    expect(guard.canActivate(mockExecutionContext())).toBe(false);
  });
});
