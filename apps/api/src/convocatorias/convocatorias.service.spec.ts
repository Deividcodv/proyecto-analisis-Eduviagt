import { BadRequestException } from '@nestjs/common';
import { ConvocatoriasService } from './convocatorias.service';

/**
 * Caja blanca sobre ConvocatoriasService: era el servicio de negocio más
 * grande sin ninguna prueba (0% de cobertura) y concentra reglas que el
 * estudiante ve directamente (listado público, fechas de la convocatoria,
 * documentos requeridos).
 */
describe('ConvocatoriasService', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let prisma: any;
  let audit: any;
  let service: ConvocatoriasService;

  const admin = { id: 'admin-1', rol: { nombre: 'ADMIN' } } as any;

  beforeEach(() => {
    prisma = {
      usuario: { findFirst: jest.fn().mockResolvedValue(null) },
      convocatoria: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      beca: { findUnique: jest.fn().mockResolvedValue({ id: 'b1' }) },
      nivelAcademico: { findUnique: jest.fn().mockResolvedValue({ id: 'n1' }) },
      documentoTipo: { findMany: jest.fn().mockResolvedValue([]) },
      convocatoriaDocRequerido: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      solicitud: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    service = new ConvocatoriasService(prisma, audit);
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  describe('findAllPublic (portal público)', () => {
    it('con estado ABIERTA solo lista convocatorias dentro de su ventana de fechas', async () => {
      await service.findAllPublic({ estado: 'ABIERTA' });

      const { where } = prisma.convocatoria.findMany.mock.calls[0][0];

      expect(where.estado).toBe('ABIERTA');
      expect(where.AND).toEqual([
        {
          OR: [
            { fechaApertura: null },
            { fechaApertura: { lte: expect.any(Date) } },
          ],
        },
        {
          OR: [
            { fechaCierre: null },
            { fechaCierre: { gte: expect.any(Date) } },
          ],
        },
      ]);
    });

    it('con estado CERRADA incluye los estados cerrados y las ABIERTA vencidas', async () => {
      await service.findAllPublic({ estado: 'CERRADA' });

      const { where } = prisma.convocatoria.findMany.mock.calls[0][0];

      expect(where.AND).toEqual([
        {
          OR: [
            {
              estado: {
                in: ['CERRADA', 'EN_EVALUACION', 'RESUELTA', 'ARCHIVADA'],
              },
            },
            { estado: 'ABIERTA', fechaCierre: { lt: expect.any(Date) } },
          ],
        },
      ]);
    });

    it('sin estado devuelve abiertas y cerradas, sin borradores ni abiertas futuras', async () => {
      await service.findAllPublic();

      const { where } = prisma.convocatoria.findMany.mock.calls[0][0];

      expect(where.AND).toHaveLength(1);
      const filtro = where.AND[0];
      expect(filtro.OR).toHaveLength(2);
      expect(filtro.OR[0]).toEqual(
        expect.objectContaining({ estado: 'ABIERTA' }),
      );
      expect(filtro.OR[1]).toEqual(
        expect.objectContaining({ OR: expect.any(Array) }),
      );
    });

    it('mantiene la búsqueda por texto', async () => {
      await service.findAllPublic({
        estado: 'ABIERTA',
        busqueda: 'excelencia',
      });

      const { where } = prisma.convocatoria.findMany.mock.calls[0][0];

      expect(where.estado).toBe('ABIERTA');
      expect(where.OR).toEqual(
        expect.arrayContaining([
          { nombre: { contains: 'excelencia', mode: 'insensitive' } },
        ]),
      );
    });
  });

  describe('create', () => {
    it('rechaza una convocatoria con cierre anterior a la apertura', async () => {
      await expect(
        service.create({
          nombre: 'Beca de prueba',
          becaId: 'b1',
          fechaApertura: '2026-09-01T00:00:00.000Z',
          fechaCierre: '2026-08-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.convocatoria.create).not.toHaveBeenCalled();
    });

    it('acepta una convocatoria con fechas coherentes', async () => {
      prisma.convocatoria.create.mockResolvedValue({ id: 'c1' });

      await service.create({
        nombre: 'Beca de prueba',
        becaId: 'b1',
        fechaApertura: '2026-08-01T00:00:00.000Z',
        fechaCierre: '2026-09-01T00:00:00.000Z',
      });

      expect(prisma.convocatoria.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('rechaza una fecha de cierre anterior a la apertura ya guardada', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue({
        id: 'c1',
        estado: 'BORRADOR',
        fechaApertura: new Date('2026-09-01T00:00:00.000Z'),
        fechaCierre: new Date('2026-10-01T00:00:00.000Z'),
      });

      await expect(
        service.update('c1', { fechaCierre: '2026-08-01T00:00:00.000Z' }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.convocatoria.update).not.toHaveBeenCalled();
    });

    it('acepta mover solo el cierre si sigue siendo posterior a la apertura', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue({
        id: 'c1',
        estado: 'BORRADOR',
        fechaApertura: new Date('2026-09-01T00:00:00.000Z'),
        fechaCierre: new Date('2026-10-01T00:00:00.000Z'),
      });
      prisma.convocatoria.update.mockResolvedValue({ id: 'c1' });

      await service.update('c1', { fechaCierre: '2026-11-01T00:00:00.000Z' });

      expect(prisma.convocatoria.update).toHaveBeenCalled();
    });
  });

  describe('reemplazarDocumentosRequeridos', () => {
    it('avisa con claridad cuando se repite un tipo de documento', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue({
        id: 'c1',
        estado: 'BORRADOR',
      });
      prisma.documentoTipo.findMany.mockResolvedValue([{ id: 'd1' }]);

      await expect(
        service.reemplazarDocumentosRequeridos(
          'c1',
          {
            items: [
              { documentoTipoId: 'd1', obligatorio: true },
              { documentoTipoId: 'd1', obligatorio: false },
            ],
          },
          admin,
        ),
      ).rejects.toThrow('repet');
    });

    it('no borra los documentos existentes si un tipo no existe', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue({
        id: 'c1',
        estado: 'BORRADOR',
      });
      prisma.documentoTipo.findMany.mockResolvedValue([]);

      await expect(
        service.reemplazarDocumentosRequeridos(
          'c1',
          { items: [{ documentoTipoId: 'no-existe', obligatorio: true }] },
          admin,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(
        prisma.convocatoriaDocRequerido.deleteMany,
      ).not.toHaveBeenCalled();
    });
  });
});
