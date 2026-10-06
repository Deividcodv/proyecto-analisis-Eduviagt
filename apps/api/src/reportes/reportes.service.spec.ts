import { BadRequestException } from '@nestjs/common';
import { ReportesService } from './reportes.service';

describe('ReportesService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  let service: ReportesService;

  beforeEach(() => {
    prisma = {
      solicitud: { groupBy: jest.fn(), findMany: jest.fn(), count: jest.fn() },
      convocatoria: { groupBy: jest.fn(), findMany: jest.fn() },
      decision: { findMany: jest.fn() },
      evaluacion: { findMany: jest.fn() },
    };
    service = new ReportesService(prisma);
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

  describe('evaluaciones (S4+ refactorizado a prisma)', () => {
    it('calcula score promedio, decisiones y pendientes por convocatoria', async () => {
      prisma.convocatoria.findMany.mockResolvedValue([
        { id: 'c1', nombre: 'Beca CI', beca: { nombre: 'Permanencia' } },
      ]);
      prisma.solicitud.groupBy.mockResolvedValue([
        { convocatoriaId: 'c1', estado: 'EVALUADA', _count: { _all: 2 } },
      ]);
      prisma.solicitud.findMany.mockResolvedValue([
        { id: 's1', convocatoriaId: 'c1' },
        { id: 's2', convocatoriaId: 'c1' },
      ]);
      prisma.evaluacion.findMany.mockResolvedValue([
        { solicitudId: 's1', evaluadorId: 'u1', completada: true, puntaje: 80, criterioEvaluacion: { peso: 0.4 } },
        { solicitudId: 's1', evaluadorId: 'u1', completada: true, puntaje: 90, criterioEvaluacion: { peso: 0.6 } },
        { solicitudId: 's2', evaluadorId: 'u1', completada: false, puntaje: null, criterioEvaluacion: { peso: 0.4 } },
        { solicitudId: 's2', evaluadorId: 'u2', completada: false, puntaje: null, criterioEvaluacion: { peso: 0.6 } },
      ]);
      prisma.decision.findMany.mockResolvedValue([
        {
          resultado: 'APROBADA',
          solicitud: { convocatoriaId: 'c1' },
        },
        {
          resultado: 'RECHAZADA',
          solicitud: { convocatoriaId: 'c1' },
        },
      ]);

      const r = await service.evaluaciones();

      const conv = r.porConvocatoria[0];
      expect(r.totalConvocatorias).toBe(1);
      expect(r.totalSolicitudesEvaluadas).toBe(2);
      expect(conv.solicitudesEvaluadas).toBe(2);
      expect(conv.conScore).toBe(1);
      expect(conv.scorePromedio).toBe(85);
      expect(conv.aprobadas).toBe(1);
      expect(conv.rechazadas).toBe(1);
      expect(conv.pendientes).toBe(1);
    });
  });

  describe('embudo (S4)', () => {
    it('calcula etapas acumuladas y conversiones', async () => {
      prisma.solicitud.groupBy.mockResolvedValue([
        { estado: 'BORRADOR', _count: { _all: 2 } },
        { estado: 'ENVIADA', _count: { _all: 3 } },
        { estado: 'EN_REVISION', _count: { _all: 1 } },
        { estado: 'EVALUADA', _count: { _all: 2 } },
        { estado: 'APROBADA', _count: { _all: 1 } },
        { estado: 'RECHAZADA', _count: { _all: 1 } },
      ]);

      const r = await service.embudo();

      expect(r.total).toBe(10);
      expect(r.etapas.map((e) => e.cantidad)).toEqual([10, 8, 4, 2, 1]);
      expect(r.etapas[0].porcentaje).toBe(100);
      expect(r.etapas[2].porcentaje).toBe(40);
      expect(r.conversion.envio).toBe(80);
      expect(r.conversion.aprobacion).toBe(50);
    });
  });

  describe('detalle (S4)', () => {
    it('agrega columnas por convocatoria y una fila de totales', async () => {
      prisma.convocatoria.findMany.mockResolvedValue([
        { id: 'c1', nombre: 'Beca CI', estado: 'ABIERTA', beca: { nombre: 'P' } },
      ]);
      prisma.solicitud.groupBy.mockResolvedValue([
        { convocatoriaId: 'c1', estado: 'BORRADOR', _count: { _all: 1 } },
        { convocatoriaId: 'c1', estado: 'EVALUADA', _count: { _all: 1 } },
        { convocatoriaId: 'c1', estado: 'APROBADA', _count: { _all: 1 } },
      ]);
      prisma.decision.findMany.mockResolvedValue([
        {
          resultado: 'APROBADA',
          fecha: new Date('2026-02-10T00:00:00.000Z'),
          solicitud: {
            convocatoriaId: 'c1',
            createdAt: new Date('2026-02-01T00:00:00.000Z'),
          },
        },
      ]);

      const r = await service.detalle();

      expect(r.filas).toHaveLength(1);
      expect(r.filas[0].total).toBe(3);
      expect(r.filas[0].borradores).toBe(1);
      expect(r.filas[0].evaluadas).toBe(2);
      expect(r.filas[0].tasaAprobacion).toBe(100);
      expect(r.filas[0].tiempoPromedioResolucionDias).toBe(9);
      expect(r.totales.aprobadas).toBe(1);
      expect(r.totales.tasaAprobacion).toBe(100);
    });
  });

  describe('generarCsv (US-35)', () => {
    it('rechaza tipos inválidos', async () => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      await expect(
        service.generarCsv('otro' as any),
      ).rejects.toThrow(BadRequestException);
      /* eslint-enable @typescript-eslint/no-explicit-any */
    });

    it('genera CSV con BOM y encabezados para evaluaciones', async () => {
      prisma.convocatoria.findMany.mockResolvedValue([
        { id: 'c1', nombre: 'Beca CI', beca: { nombre: 'P' } },
      ]);
      prisma.solicitud.groupBy.mockResolvedValue([]);
      prisma.solicitud.findMany.mockResolvedValue([
        { id: 's1', convocatoriaId: 'c1' },
      ]);
      prisma.evaluacion.findMany.mockResolvedValue([
        { solicitudId: 's1', evaluadorId: 'u1', completada: true, puntaje: 80, criterioEvaluacion: { peso: 0.4 } },
        { solicitudId: 's1', evaluadorId: 'u1', completada: true, puntaje: 90, criterioEvaluacion: { peso: 0.6 } },
      ]);
      prisma.decision.findMany.mockResolvedValue([]);

      const csv = await service.generarCsv('evaluaciones');

      expect(csv.startsWith('\ufeff')).toBe(true);
      expect(csv).toContain('convocatoria,beca,solicitudesEvaluadas');
      expect(csv).toContain('Beca CI');
    });
  });
});
