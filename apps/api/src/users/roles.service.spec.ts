import { BadRequestException } from '@nestjs/common';
import { RolesService } from './roles.service';

/**
 * Caja blanca sobre RolesService: se centra en assignPermisos(), que es la
 * operación con más riesgo de seguridad del servicio (modifica los permisos
 * de un rol entero) y que no tenía ninguna prueba.
 *
 * Reproduce dos bugs reales:
 *  1. IDs duplicados en permisoIds -> Prisma viola @@unique([rolId, permisoId])
 *     y la API devolvía 500 en vez de 400.
 *  2. deleteMany() se ejecutaba ANTES y fuera de transacción: si createMany()
 *     fallaba, el rol quedaba con CERO permisos (pérdida de privilegios).
 */
describe('RolesService', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let prisma: any;
  let audit: any;
  let tx: any;
  let service: RolesService;

  const admin = { id: 'admin-1', rol: { nombre: 'ADMIN' } } as any;
  const rol = { id: 'rol-1', nombre: 'ADMIN', descripcion: 'Admin', rolPermisos: [] };

  beforeEach(() => {
    tx = {
      rolPermiso: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };

    prisma = {
      rol: {
        findUnique: jest.fn().mockResolvedValue(rol),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      usuario: { count: jest.fn().mockResolvedValue(0) },
      rolPermiso: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      // Forma callback: la lógica corre sobre `tx`, que es un mock propio.
      $transaction: jest.fn(async (fn: (t: any) => Promise<any>) => fn(tx)),
    };

    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new RolesService(prisma, audit);
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  describe('assignPermisos', () => {
    it('ejecuta el cambio de permisos de forma atómica (transacción)', async () => {
      // Si algo falla a mitad de camino, el rol NO puede quedar sin permisos.
      await service.assignPermisos(
        rol.id,
        { permisoIds: ['p1', 'p2'] },
        admin,
      );

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('devuelve 400 y NO 500 cuando un permiso no existe', async () => {
      // Simula el fallo real de Prisma: violación de FK (P2003).
      const err = Object.assign(
        new Error('Foreign key constraint failed on the field: permisoId'),
        { code: 'P2003' },
      );
      tx.rolPermiso.createMany.mockRejectedValue(err);
      prisma.rolPermiso.createMany.mockRejectedValue(err);

      await expect(
        service.assignPermisos(rol.id, { permisoIds: ['no-existe'] }, admin),
      ).rejects.toThrow(BadRequestException);
    });

    it('ignora los IDs repetidos en lugar de rechazar la petición', async () => {
      await service.assignPermisos(
        rol.id,
        { permisoIds: ['p1', 'p1', 'p2'] },
        admin,
      );

      const call = tx.rolPermiso.createMany.mock.calls[0]?.[0];
      const ids = (call?.data ?? []).map((d: { permisoId: string }) => d.permisoId);

      expect(ids).toEqual(['p1', 'p2']);
    });

    it('audita la asignación de permisos', async () => {
      await service.assignPermisos(
        rol.id,
        { permisoIds: ['p1'] },
        admin,
      );

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: admin.id,
          accion: 'asignar-permisos',
          entidad: 'rol',
          entidadId: rol.id,
        }),
      );
    });
  });

  describe('remove', () => {
    it('impide eliminar un rol que tienen usuarios asignados', async () => {
      prisma.usuario.count.mockResolvedValue(3);

      await expect(service.remove(rol.id, admin)).rejects.toThrow(
        'No se puede eliminar el rol: 3 usuario(s) lo tienen asignado',
      );
      expect(prisma.rol.delete).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('rechaza con 409 un nombre de rol duplicado', async () => {
      prisma.rol.findUnique.mockResolvedValueOnce({ id: 'otro', nombre: 'ADMIN' });

      await expect(
        service.create({ nombre: 'ADMIN', descripcion: 'x' } as never, admin),
      ).rejects.toThrow('ya existe');
    });
  });
});
