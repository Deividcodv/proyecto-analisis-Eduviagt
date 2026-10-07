import { CatalogosService } from './catalogos.service';

describe('CatalogosService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  let service: CatalogosService;

  beforeEach(() => {
    prisma = {
      institucionEducativa: { findMany: jest.fn() },
    };
    service = new CatalogosService(prisma);
  });

  describe('findAllInstituciones', () => {
    it('filtra por nivel y búsqueda, ordena y limita a 50', async () => {
      prisma.institucionEducativa.findMany.mockResolvedValue([]);

      await service.findAllInstituciones('UNIVERSITARIO', 'san');

      expect(prisma.institucionEducativa.findMany).toHaveBeenCalledWith({
        where: {
          activa: true,
          nivel: 'UNIVERSITARIO',
          nombre: { contains: 'san', mode: 'insensitive' },
        },
        orderBy: { nombre: 'asc' },
        take: 50,
      });
    });

    it('sin filtros devuelve solo las activas', async () => {
      prisma.institucionEducativa.findMany.mockResolvedValue([]);

      await service.findAllInstituciones();

      const [args] = prisma.institucionEducativa.findMany.mock.calls[0];
      expect(args.where).toEqual({ activa: true });
      expect(args.take).toBe(50);
    });
  });
});
