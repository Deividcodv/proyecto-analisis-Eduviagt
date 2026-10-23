import { Prisma } from '@prisma/client';
import {
  MontosService,
  ORIGEN_MONTO,
  TIPO_REGLA_MONTO,
} from './montos.service';
import { UMBRAL_SEGUNDA_APROBACION_GTQ } from '../common/constants/roles';

/** Regla de monto con valores por defecto sobrescribibles. */
function regla(
  overrides: Partial<{
    nombre: string;
    ingresoMin: Prisma.Decimal | null;
    ingresoMax: Prisma.Decimal | null;
    tipo: string;
    montoFijo: Prisma.Decimal | null;
    porcentaje: number | null;
    prioridad: number;
    activo: boolean;
  }> = {},
) {
  return {
    id: 'r1',
    convocatoriaId: 'c1',
    nombre: 'Regla general',
    ingresoMin: null,
    ingresoMax: null,
    tipo: TIPO_REGLA_MONTO.FIJO,
    montoFijo: new Prisma.Decimal(1000),
    porcentaje: null,
    prioridad: 0,
    activo: true,
    createdAt: new Date(),
    ...overrides,
  };
}

/** Convocatoria con monto base y reglas por defecto sobrescribibles. */
function convocatoria(
  overrides: Partial<{
    montoBase: Prisma.Decimal | null;
    reglasMonto: ReturnType<typeof regla>[];
  }> = {},
) {
  return {
    id: 'c1',
    nombre: 'Convocatoria de prueba',
    moneda: 'GTQ',
    montoBase: new Prisma.Decimal(5000),
    reglasMonto: [] as ReturnType<typeof regla>[],
    ...overrides,
  };
}

describe('MontosService (US-801)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  let service: MontosService;

  beforeEach(() => {
    prisma = {
      convocatoria: { findUnique: jest.fn() },
      solicitud: { update: jest.fn() },
    };
    service = new MontosService(prisma);
  });

  describe('calcular', () => {
    it('lee la convocatoria con sus reglas activas ordenadas por prioridad y nombre', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue(convocatoria());

      await service.calcular('c1', 500);

      expect(prisma.convocatoria.findUnique).toHaveBeenCalledWith({
        where: { id: 'c1' },
        include: {
          reglasMonto: {
            where: { activo: true },
            orderBy: [{ prioridad: 'asc' }, { nombre: 'asc' }],
          },
        },
      });
    });

    it('aplica una regla COMPLETO: otorga el monto base completo', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue(
        convocatoria({
          montoBase: new Prisma.Decimal(5000),
          reglasMonto: [
            regla({
              nombre: 'Beca completa',
              tipo: TIPO_REGLA_MONTO.COMPLETO,
              montoFijo: null,
            }),
          ],
        }),
      );

      const resultado = await service.calcular('c1', 3000);

      expect(resultado.monto?.toNumber()).toBe(5000);
      expect(resultado.origen).toBe(ORIGEN_MONTO.REGLA);
      expect(resultado.reglaAplicada).toBe('Beca completa');
      expect(resultado.detalle).toContain('Beca completa');
    });

    it('aplica una regla FIJO: otorga el monto fijo de la regla', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue(
        convocatoria({
          montoBase: new Prisma.Decimal(5000),
          reglasMonto: [
            regla({
              nombre: 'Beca reducida',
              tipo: TIPO_REGLA_MONTO.FIJO,
              montoFijo: new Prisma.Decimal(2500.5),
            }),
          ],
        }),
      );

      const resultado = await service.calcular('c1', 3000);

      expect(resultado.monto?.toNumber()).toBe(2500.5);
      expect(resultado.origen).toBe(ORIGEN_MONTO.REGLA);
      expect(resultado.reglaAplicada).toBe('Beca reducida');
    });

    it('aplica una regla PORCENTAJE usando la fracción guardada (0.4 = 40%)', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue(
        convocatoria({
          montoBase: new Prisma.Decimal(1000),
          reglasMonto: [
            regla({
              nombre: 'Porcentaje del ingreso',
              tipo: TIPO_REGLA_MONTO.PORCENTAJE,
              montoFijo: null,
              porcentaje: 0.4,
            }),
          ],
        }),
      );

      const resultado = await service.calcular('c1', 3000);

      // 1000 * 0.4 = 400 (no 1000 * 0.4 / 100 = 4).
      expect(resultado.monto?.toNumber()).toBe(400);
      expect(resultado.origen).toBe(ORIGEN_MONTO.REGLA);
      expect(resultado.reglaAplicada).toBe('Porcentaje del ingreso');
    });

    it('gana la regla de menor prioridad aunque la base la devuelva después', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue(
        convocatoria({
          montoBase: new Prisma.Decimal(5000),
          reglasMonto: [
            regla({
              nombre: 'Prioridad 10',
              tipo: TIPO_REGLA_MONTO.FIJO,
              montoFijo: new Prisma.Decimal(100),
              prioridad: 10,
            }),
            regla({
              nombre: 'Prioridad 1',
              tipo: TIPO_REGLA_MONTO.FIJO,
              montoFijo: new Prisma.Decimal(200),
              prioridad: 1,
            }),
          ],
        }),
      );

      const resultado = await service.calcular('c1', 3000);

      expect(resultado.reglaAplicada).toBe('Prioridad 1');
      expect(resultado.monto?.toNumber()).toBe(200);
    });

    it('respeta los límites del tramo: ingresoMin inclusivo e ingresoMax exclusivo', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue(
        convocatoria({
          montoBase: new Prisma.Decimal(5000),
          reglasMonto: [
            regla({
              nombre: 'Tramo 1000 a 5000',
              tipo: TIPO_REGLA_MONTO.FIJO,
              montoFijo: new Prisma.Decimal(700),
              ingresoMin: new Prisma.Decimal(1000),
              ingresoMax: new Prisma.Decimal(5000),
            }),
          ],
        }),
      );

      // El mínimo es inclusivo: 1000 entra en el tramo.
      const enMinimo = await service.calcular('c1', 1000);
      expect(enMinimo.reglaAplicada).toBe('Tramo 1000 a 5000');
      expect(enMinimo.monto?.toNumber()).toBe(700);

      // El máximo es exclusivo: 5000 ya no entra y se usa el monto base.
      const enMaximo = await service.calcular('c1', 5000);
      expect(enMaximo.reglaAplicada).toBeNull();
      expect(enMaximo.origen).toBe(ORIGEN_MONTO.MONTO_BASE);
      expect(enMaximo.monto?.toNumber()).toBe(5000);
    });

    it('sin ingreso familiar solo aplican las reglas sin límites de ingreso', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue(
        convocatoria({
          montoBase: null,
          reglasMonto: [
            regla({
              nombre: 'Tramo acotado',
              tipo: TIPO_REGLA_MONTO.FIJO,
              montoFijo: new Prisma.Decimal(700),
              ingresoMin: new Prisma.Decimal(0),
              ingresoMax: new Prisma.Decimal(5000),
            }),
          ],
        }),
      );

      const resultado = await service.calcular('c1', null);

      expect(resultado.monto).toBeNull();
      expect(resultado.origen).toBeNull();
      expect(resultado.reglaAplicada).toBeNull();
      expect(resultado.detalle).toBeTruthy();
    });

    it('sin ingreso familiar aplica la regla que no acota el tramo', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue(
        convocatoria({
          montoBase: new Prisma.Decimal(5000),
          reglasMonto: [
            regla({
              nombre: 'Sin límites',
              tipo: TIPO_REGLA_MONTO.FIJO,
              montoFijo: new Prisma.Decimal(900),
            }),
          ],
        }),
      );

      const resultado = await service.calcular('c1', undefined);

      expect(resultado.reglaAplicada).toBe('Sin límites');
      expect(resultado.monto?.toNumber()).toBe(900);
    });

    it('sin monto base ni reglas aplicables devuelve monto null', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue(
        convocatoria({
          montoBase: null,
          reglasMonto: [
            regla({
              nombre: 'Tramo que no aplica',
              tipo: TIPO_REGLA_MONTO.FIJO,
              montoFijo: new Prisma.Decimal(700),
              ingresoMin: new Prisma.Decimal(1000),
              ingresoMax: new Prisma.Decimal(5000),
            }),
          ],
        }),
      );

      const resultado = await service.calcular('c1', 300);

      expect(resultado.monto).toBeNull();
      expect(resultado.origen).toBeNull();
      expect(resultado.reglaAplicada).toBeNull();
      expect(resultado.detalle).toContain('no tiene monto base');
    });

    it('una regla COMPLETO sin monto base no aplica', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue(
        convocatoria({
          montoBase: null,
          reglasMonto: [
            regla({
              nombre: 'Beca completa',
              tipo: TIPO_REGLA_MONTO.COMPLETO,
              montoFijo: null,
            }),
          ],
        }),
      );

      const resultado = await service.calcular('c1', 3000);

      expect(resultado.monto).toBeNull();
      expect(resultado.origen).toBeNull();
    });

    it('si ninguna regla aplica pero hay monto base, usa el monto base', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue(
        convocatoria({
          montoBase: new Prisma.Decimal(4500),
          reglasMonto: [
            regla({
              nombre: 'Tramo que no aplica',
              tipo: TIPO_REGLA_MONTO.FIJO,
              montoFijo: new Prisma.Decimal(700),
              ingresoMin: new Prisma.Decimal(1000),
              ingresoMax: new Prisma.Decimal(5000),
            }),
          ],
        }),
      );

      const resultado = await service.calcular('c1', 300);

      expect(resultado.monto?.toNumber()).toBe(4500);
      expect(resultado.origen).toBe(ORIGEN_MONTO.MONTO_BASE);
      expect(resultado.reglaAplicada).toBeNull();
    });
  });

  describe('requiereSegundaAprobacion', () => {
    it('el umbral exacto NO requiere segunda aprobación', () => {
      expect(
        service.requiereSegundaAprobacion(
          new Prisma.Decimal(UMBRAL_SEGUNDA_APROBACION_GTQ),
        ),
      ).toBe(false);
    });

    it('un monto apenas superior al umbral SÍ requiere segunda aprobación', () => {
      expect(
        service.requiereSegundaAprobacion(
          new Prisma.Decimal(UMBRAL_SEGUNDA_APROBACION_GTQ).plus(0.01),
        ),
      ).toBe(true);
    });

    it('un monto inferior al umbral NO requiere segunda aprobación', () => {
      expect(
        service.requiereSegundaAprobacion(
          new Prisma.Decimal(UMBRAL_SEGUNDA_APROBACION_GTQ).minus(0.01),
        ),
      ).toBe(false);
    });

    it('sin monto no requiere segunda aprobación', () => {
      expect(service.requiereSegundaAprobacion(null)).toBe(false);
      expect(service.requiereSegundaAprobacion(undefined)).toBe(false);
    });
  });

  describe('registrarOverride', () => {
    it('guarda el monto con origen OVERRIDE y la trazabilidad del ajuste', async () => {
      prisma.solicitud.update.mockResolvedValue({ id: 's1' });

      const monto = await service.registrarOverride({
        solicitudId: 's1',
        monto: new Prisma.Decimal(12500.5),
        justificacion: 'Ajuste por recálculo de ingreso familiar verificado.',
        usuarioId: 'u-jefe',
      });

      expect(prisma.solicitud.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: {
          montoOtorgable: new Prisma.Decimal(12500.5),
          montoAprobado: new Prisma.Decimal(12500.5),
          montoOrigenCalculo: ORIGEN_MONTO.OVERRIDE,
          montoCalculadoAt: expect.any(Date),
          montoCalculadoPor: 'u-jefe',
        },
      });
      expect(monto.toNumber()).toBe(12500.5);
    });

    it('no modifica el estado de la solicitud', async () => {
      prisma.solicitud.update.mockResolvedValue({ id: 's1' });

      await service.registrarOverride({
        solicitudId: 's1',
        monto: new Prisma.Decimal(1000),
        justificacion: 'Corrección de incomeo verificado en campo.',
        usuarioId: 'u-jefe',
      });

      const data = prisma.solicitud.update.mock.calls[0][0].data;
      expect(data.estado).toBeUndefined();
    });

    it('el monto registrado queda redondeado a dos decimales', async () => {
      prisma.solicitud.update.mockResolvedValue({ id: 's1' });

      const monto = await service.registrarOverride({
        solicitudId: 's1',
        monto: new Prisma.Decimal(1234.567),
        justificacion: 'Redondeo según normativa vigente.',
        usuarioId: 'u-jefe',
      });

      expect(monto.toFixed(2)).toBe('1234.57');
    });
  });
});
