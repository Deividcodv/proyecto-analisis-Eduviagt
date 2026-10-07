import { AuditService } from './audit.service';

describe('AuditService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  let service: AuditService;

  beforeEach(() => {
    prisma = {
      auditLog: { create: jest.fn(), count: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn(),
    };
    service = new AuditService(prisma);
  });

  describe('log (US-36)', () => {
    it('persiste una entrada con los campos básicos', async () => {
      prisma.auditLog.create.mockResolvedValue({ id: 'a1' });
      await service.log({
        usuarioId: 'u1',
        accion: 'login',
        entidad: 'usuario',
        entidadId: 'u1',
        ip: '127.0.0.1',
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          usuarioId: 'u1',
          accion: 'login',
          entidad: 'usuario',
          entidadId: 'u1',
          detalle: undefined,
          ip: '127.0.0.1',
        },
      });
    });
  });

  describe('listar', () => {
    it('aplica filtros y paginación', async () => {
      prisma.$transaction.mockResolvedValue([
        3,
        [{ id: 'a1' }, { id: 'a2' }],
      ]);
      const r = await service.listar({
        entidad: 'sesion',
        accion: 'finalizar',
        page: 2,
        limit: 2,
      });
      expect(r.total).toBe(3);
      expect(r.page).toBe(2);
      expect(r.limit).toBe(2);
      const [countArgs] = prisma.auditLog.count.mock.calls[0];
      expect(countArgs.where).toMatchObject({ entidad: 'sesion', accion: 'finalizar' });
      const [findArgs] = prisma.auditLog.findMany.mock.calls[0];
      expect(findArgs.skip).toBe(2);
      expect(findArgs.take).toBe(2);
    });

    it('acota limit a 200', async () => {
      prisma.$transaction.mockResolvedValue([0, []]);
      await service.listar({ limit: 1000 });
      const [findArgs] = prisma.auditLog.findMany.mock.calls[0];
      expect(findArgs.take).toBe(200);
    });
  });
});