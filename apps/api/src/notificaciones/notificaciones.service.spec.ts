import { NotificacionesService } from './notificaciones.service';

describe('NotificacionesService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  let service: NotificacionesService;

  beforeEach(() => {
    prisma = {
      notificacion: {
        create: jest.fn(),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        count: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      usuario: { findMany: jest.fn() },
      $transaction: jest.fn(
        (ops: Promise<unknown>[]) => Promise.all(ops),
      ),
    };
    service = new NotificacionesService(prisma);
  });

  describe('crear', () => {
    it('persiste la notificación y la emite por el stream', async () => {
      const recibidos: { id: string | null }[] = [];
      const sub = service
        .streamParaUsuario('u1')
        .subscribe((evento) => recibidos.push(evento));

      prisma.notificacion.create.mockResolvedValue({
        id: 'n1',
        usuarioId: 'u1',
        tipo: 'SOLICITUD_ENVIADA',
        titulo: 'Nueva solicitud',
        cuerpo: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      await service.crear({
        usuarioId: 'u1',
        tipo: 'SOLICITUD_ENVIADA',
        titulo: 'Nueva solicitud',
      });

      expect(prisma.notificacion.create).toHaveBeenCalledWith({
        data: {
          usuarioId: 'u1',
          tipo: 'SOLICITUD_ENVIADA',
          titulo: 'Nueva solicitud',
          cuerpo: null,
        },
      });
      expect(recibidos).toHaveLength(1);
      expect(recibidos[0].id).toBe('n1');

      sub.unsubscribe();
    });
  });

  describe('crearParaVarios', () => {
    it('deduplica destinatarios y emite eventos bulk', async () => {
      const recibidos: { usuarioId: string; bulk?: boolean }[] = [];
      const sub1 = service
        .streamParaUsuario('u1')
        .subscribe((e) => recibidos.push(e));
      const sub2 = service
        .streamParaUsuario('u2')
        .subscribe((e) => recibidos.push(e));

      await service.crearParaVarios(['u1', 'u1', 'u2'], {
        tipo: 'AVISO',
        titulo: 'Aviso',
      });

      expect(prisma.notificacion.createMany).toHaveBeenCalledWith({
        data: [
          { usuarioId: 'u1', tipo: 'AVISO', titulo: 'Aviso', cuerpo: null },
          { usuarioId: 'u2', tipo: 'AVISO', titulo: 'Aviso', cuerpo: null },
        ],
      });
      expect(recibidos).toHaveLength(2);
      expect(recibidos.every((e) => e.bulk)).toBe(true);

      sub1.unsubscribe();
      sub2.unsubscribe();
    });

    it('no hace nada si no hay destinatarios', async () => {
      await service.crearParaVarios([], { tipo: 'AVISO', titulo: 'Aviso' });
      expect(prisma.notificacion.createMany).not.toHaveBeenCalled();
    });
  });

  describe('notificarRoles', () => {
    it('busca usuarios activos por rol y les crea la notificación', async () => {
      prisma.usuario.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);

      await service.notificarRoles(['ADMIN', 'COORDINADOR_COMITE'], {
        tipo: 'AVISO',
        titulo: 'Aviso',
      });

      expect(prisma.usuario.findMany).toHaveBeenCalledWith({
        where: {
          estado: 'ACTIVO',
          rol: { nombre: { in: ['ADMIN', 'COORDINADOR_COMITE'] } },
        },
        select: { id: true },
      });
      expect(prisma.notificacion.createMany).toHaveBeenCalled();
    });
  });

  describe('consultas', () => {
    it('listar pagina y ordena por fecha descendente', async () => {
      prisma.notificacion.count.mockResolvedValue(5);
      prisma.notificacion.findMany.mockResolvedValue([{ id: 'n1' }]);

      const result = await service.listar('u1', 2, 10);

      expect(result).toEqual({
        total: 5,
        page: 2,
        pageSize: 10,
        items: [{ id: 'n1' }],
      });
      expect(prisma.notificacion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { usuarioId: 'u1' },
          orderBy: { createdAt: 'desc' },
          skip: 10,
          take: 10,
        }),
      );
    });

    it('noLeidas cuenta solo las no leídas', async () => {
      prisma.notificacion.count.mockResolvedValue(3);
      await expect(service.noLeidas('u1')).resolves.toBe(3);
      expect(prisma.notificacion.count).toHaveBeenCalledWith({
        where: { usuarioId: 'u1', leidaAt: null },
      });
    });

    it('marcarLeida acota al dueño', async () => {
      prisma.notificacion.updateMany.mockResolvedValue({ count: 1 });
      await service.marcarLeida('n1', 'u1');
      expect(prisma.notificacion.updateMany).toHaveBeenCalledWith({
        where: { id: 'n1', usuarioId: 'u1' },
        data: { leidaAt: expect.any(Date) },
      });
    });

    it('marcarTodasLeidas acota al dueño y a las no leídas', async () => {
      prisma.notificacion.updateMany.mockResolvedValue({ count: 4 });
      await service.marcarTodasLeidas('u1');
      expect(prisma.notificacion.updateMany).toHaveBeenCalledWith({
        where: { usuarioId: 'u1', leidaAt: null },
        data: { leidaAt: expect.any(Date) },
      });
    });
  });
});
