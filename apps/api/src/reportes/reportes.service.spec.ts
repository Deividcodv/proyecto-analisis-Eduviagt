import { BadRequestException } from '@nestjs/common';
import { ReportesService } from './reportes.service';

describe('ReportesService', () => {
  let prisma: any;
  let evaluacionesService: any;
  let service: ReportesService;

  beforeEach(() => {
    prisma = {
      solicitud: { groupBy: jest.fn(), findMany: jest.fn(), count: jest.fn() },
      convocatoria: { groupBy: jest.fn(), findMany: jest.fn() },
      decision: { groupBy: jest.fn() },
    };
    evaluacionesService = { scoreSolicitud: jest.fn() };
    service = new ReportesService(prisma, evaluacionesService);
  });

  describe('solicitudesPorEstado (US-34)', () => {
    it('agrupa solicitudes por estado y desglosa por convocatoria', async () => {
      prisma.solicitud.groupBy
        .mockResolvedValueOnce([
          { estado: 'EVALUADA', _count: { _all: 2 } },
          { estado: 'APROBADA', _count: { _all: 1 } },
        ])
        .mockResolvedValueOnce([
          { convocatoriaId: 'c1', estado: 'EVALUADA', _count: { _all: 2 } },
          { convocatoriaId: 'c1', estado: 'APROBADA', _count: { _all: 1 } },
        ]);
      prisma.convocatoria.findMany.mockResolvedValue([
        {
          id: 'c1',
          nombre: 'Beca CI',
          beca: { nombre: 'Permanencia' },
          _count: { solicitudes: 3 },
        },
      ]);

      const r = await service.solicitudesPorEstado();

      expect(r.total).toBe(3);
      expect(r.porEstado).toEqual([
        { estado: 'EVALUADA', cantidad: 2 },
        { estado: 'APROBADA', cantidad: 1 },
      ]);
      expect(r.porConvocatoria[0].nombre).toBe('Beca CI');
      expect(r.porConvocatoria[0].porEstado).toHaveLength(2);
    });
  });

  describe('convocatorias (US-34)', () => {
    it('cuenta activas y resueltas', async () => {
      prisma.convocatoria.groupBy.mockResolvedValue([
        { estado: 'ABIERTA', _count: { _all: 1 } },
        { estado: 'RESUELTA', _count: { _all: 2 } },
      ]);
      prisma.convocatoria.findMany.mockResolvedValue([
        { id: 'c1', nombre: 'A', estado: 'ABIERTA', beca: { nombre: 'X' }, _count: { solicitudes: 2 }, createdAt: new Date() },
        { id: 'c2', nombre: 'B', estado: 'RESUELTA', beca: { nombre: 'Y' }, _count: { solicitudes: 0 }, createdAt: new Date() },
        { id: 'c3', nombre: 'C', estado: 'RESUELTA', beca: { nombre: 'Z' }, _count: { solicitudes: 1 }, createdAt: new Date() },
      ]);

      const r = await service.convocatorias();

      expect(r.total).toBe(3);
      expect(r.activas).toBe(1);
      expect(r.resueltas).toBe(2);
      expect(r.porEstado).toHaveLength(2);
      expect(r.detalle).toHaveLength(3);
    });
  });

  describe('evaluaciones (US-34 + pendientes review S4)', () => {
    it('calcula score promedio por evaluador y decisiones', async () => {
      prisma.convocatoria.findMany.mockResolvedValue([
        { id: 'c1', nombre: 'Beca CI', beca: { nombre: 'Permanencia' } },
      ]);
      prisma.solicitud.findMany.mockResolvedValue([
        { id: 's1' },
        { id: 's2' },
      ]);
      prisma.solicitud.count.mockResolvedValue(1);
      prisma.decision.groupBy.mockResolvedValue([
        { resultado: 'APROBADA', _count: { _all: 1 } },
        { resultado: 'RECHAZADA', _count: { _all: 1 } },
      ]);
      evaluacionesService.scoreSolicitud
        .mockResolvedValueOnce({ score: 80, completo: true })
        .mockResolvedValueOnce({ score: null, completo: false });

      const r = await service.evaluaciones();

      const conv = r.porConvocatoria[0];
      expect(conv.solicitudesEvaluadas).toBe(2);
      expect(conv.conScore).toBe(1);
      expect(conv.scorePromedio).toBe(80);
      expect(conv.aprobadas).toBe(1);
      expect(conv.rechazadas).toBe(1);
      // 1 EVALUADA sin score completo + 1 EN_REVISION
      expect(conv.pendientes).toBe(2);
    });
  });

  describe('generarCsv (US-35)', () => {
    it('rechaza tipos inválidos', async () => {
      await expect(
        service.generarCsv('otro' as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('genera CSV con BOM y encabezados', async () => {
      evaluacionesService.scoreSolicitud.mockResolvedValue({
        score: 80,
        completo: true,
      });
      prisma.convocatoria.findMany.mockResolvedValue([
        { id: 'c1', nombre: 'Beca CI', beca: { nombre: 'P' } },
      ]);
      prisma.solicitud.findMany.mockResolvedValue([{ id: 's1' }]);
      prisma.solicitud.count.mockResolvedValue(0);
      prisma.decision.groupBy.mockResolvedValue([]);

      const csv = await service.generarCsv('evaluaciones');

      expect(csv.startsWith('\ufeff')).toBe(true);
      expect(csv).toContain('convocatoria,beca,solicitudesEvaluadas');
      expect(csv).toContain('Beca CI');
    });
  });
});