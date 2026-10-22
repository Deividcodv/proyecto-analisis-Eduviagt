import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BitacoraService } from './bitacora.service';

describe('BitacoraService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  let service: BitacoraService;

  beforeEach(() => {
    prisma = {
      bitacoraSistema: { create: jest.fn(), count: jest.fn(), findMany: jest.fn() },
    };
    service = new BitacoraService(prisma);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('registrar (US-805)', () => {
    it('persiste una entrada con los datos del actor', async () => {
      prisma.bitacoraSistema.create.mockResolvedValue({ id: 'b1' });

      await service.registrar({
        actor: {
          id: 'u1',
          nombre: 'Ana Pérez',
          rol: 'ADMIN',
          correo: 'ana@sigeb.test',
        },
        modulo: 'solicitud',
        entidad: 'solicitud',
        entidadId: 's1',
        accionClave: 'solicitud.aprobar',
        accionHumana: 'Aprobó la solicitud',
        descripcionHumana: 'La solicitud pasó de EN_REVISION a APROBADA.',
        ip: '127.0.0.1',
        userAgent: 'jest',
        origen: 'WEB',
        correlacionId: 'corr-1',
        sessionId: 'sess-1',
      });

      expect(prisma.bitacoraSistema.create).toHaveBeenCalledTimes(1);
      const [args] = prisma.bitacoraSistema.create.mock.calls[0];
      expect(args.data).toMatchObject({
        actorId: 'u1',
        actorNombre: 'Ana Pérez',
        actorRol: 'ADMIN',
        actorCorreo: 'ana@sigeb.test',
        modulo: 'solicitud',
        entidad: 'solicitud',
        entidadId: 's1',
        accionClave: 'solicitud.aprobar',
        accionHumana: 'Aprobó la solicitud',
        descripcionHumana: 'La solicitud pasó de EN_REVISION a APROBADA.',
        ip: '127.0.0.1',
        userAgent: 'jest',
        origen: 'WEB',
        correlacionId: 'corr-1',
        sessionId: 'sess-1',
      });
    });

    it('usa EXITOSO y API como valores por defecto', async () => {
      prisma.bitacoraSistema.create.mockResolvedValue({ id: 'b1' });

      await service.registrar({
        modulo: 'catalogo',
        entidad: 'beca',
        accionClave: 'catalogo.crear',
        accionHumana: 'Creó una beca',
        descripcionHumana: 'Se creó la beca de流畅idad.',
      });

      const [args] = prisma.bitacoraSistema.create.mock.calls[0];
      expect(args.data.resultado).toBe('EXITOSO');
      expect(args.data.origen).toBe('API');
      expect(args.data.actorId).toBeNull();
      expect(args.data.actorNombre).toBeNull();
      expect(args.data.entidadId).toBeNull();
    });

    it('guarda camposClave y datosRelevantes como JSON', async () => {
      prisma.bitacoraSistema.create.mockResolvedValue({ id: 'b1' });

      await service.registrar({
        modulo: 'solicitud',
        entidad: 'solicitud',
        entidadId: 's1',
        accionClave: 'solicitud.aprobar',
        accionHumana: 'Aprobó la solicitud',
        descripcionHumana: 'Aprobación con monto ajustado.',
        camposClave: { estadoAnterior: 'EN_REVISION', estadoNuevo: 'APROBADA' },
        datosRelevantes: { montoAprobado: '1500.00', etiquetas: ['beca', 'excelencia'] },
      });

      const [args] = prisma.bitacoraSistema.create.mock.calls[0];
      expect(args.data.camposClave).toEqual({
        estadoAnterior: 'EN_REVISION',
        estadoNuevo: 'APROBADA',
      });
      expect(args.data.datosRelevantes).toEqual({
        montoAprobado: '1500.00',
        etiquetas: ['beca', 'excelencia'],
      });
    });

    it('guarda null en las columnas JSON cuando no hay datos', async () => {
      prisma.bitacoraSistema.create.mockResolvedValue({ id: 'b1' });

      await service.registrar({
        modulo: 'solicitud',
        entidad: 'solicitud',
        accionClave: 'solicitud.aprobar',
        accionHumana: 'Aprobó la solicitud',
        descripcionHumana: 'Sin datos extra.',
        camposClave: null,
        datosRelevantes: undefined,
      });

      const [args] = prisma.bitacoraSistema.create.mock.calls[0];
      expect(args.data.camposClave).toBeNull();
      expect(args.data.datosRelevantes).toBeNull();
    });

    it('usa el cliente transaccional cuando se le pasa', async () => {
      const tx = { bitacoraSistema: { create: jest.fn().mockResolvedValue({ id: 'b1' }) } };

      await service.registrar(
        {
          modulo: 'solicitud',
          entidad: 'solicitud',
          entidadId: 's1',
          accionClave: 'solicitud.aprobar',
          accionHumana: 'Aprobó la solicitud',
          descripcionHumana: 'Aprobación registrada en la misma transacción.',
        },
        // El doble cliente transaccional real de Prisma no se puede montar en
        // una prueba unitaria: aquí solo se necesita la delegada `create`.
        tx as unknown as Prisma.TransactionClient,
      );

      expect(tx.bitacoraSistema.create).toHaveBeenCalledTimes(1);
      expect(prisma.bitacoraSistema.create).not.toHaveBeenCalled();
    });

    it('no propaga el error si la escritura de la bitácora falla', async () => {
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      const tx = {
        bitacoraSistema: {
          create: jest.fn().mockRejectedValue(new Error('Transaction already closed: P2028')),
        },
      };

      await expect(
        service.registrar(
          {
            modulo: 'solicitud',
            entidad: 'solicitud',
            entidadId: 's1',
            accionClave: 'solicitud.aprobar',
            accionHumana: 'Aprobó la solicitud',
            descripcionHumana: 'La acción original manda.',
          },
          // Mismo motivo que en el caso anterior: solo se necesita `create`.
          tx as unknown as Prisma.TransactionClient,
        ),
      ).resolves.toBeUndefined();
    });

    it('no propaga el error si la escritura falla sin cliente transaccional', async () => {
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      prisma.bitacoraSistema.create.mockRejectedValue(new Error('boom'));

      await expect(
        service.registrar({
          modulo: 'solicitud',
          entidad: 'solicitud',
          accionClave: 'solicitud.aprobar',
          accionHumana: 'Aprobó la solicitud',
          descripcionHumana: 'Sin cliente transaccional.',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('listar', () => {
    const items = [
      { id: 'b2', fechaHora: new Date('2026-10-20T10:00:00Z') },
      { id: 'b1', fechaHora: new Date('2026-10-19T10:00:00Z') },
    ];

    it('aplica filtros, paginación y orden descendente', async () => {
      prisma.bitacoraSistema.count.mockResolvedValue(7);
      prisma.bitacoraSistema.findMany.mockResolvedValue(items);

      const r = await service.listar({
        modulo: 'solicitud',
        entidad: 'solicitud',
        entidadId: 's1',
        accionClave: 'solicitud.aprobar',
        actorId: 'u1',
        desde: '2026-10-01',
        hasta: '2026-10-31',
        page: 2,
        limit: 2,
      });

      expect(r.total).toBe(7);
      expect(r.page).toBe(2);
      expect(r.limit).toBe(2);
      expect(r.items).toEqual(items);

      const [countArgs] = prisma.bitacoraSistema.count.mock.calls[0];
      expect(countArgs.where).toMatchObject({
        modulo: 'solicitud',
        entidad: 'solicitud',
        entidadId: 's1',
        accionClave: 'solicitud.aprobar',
        actorId: 'u1',
      });
      expect(countArgs.where.fechaHora.gte).toEqual(new Date('2026-10-01'));
      expect(countArgs.where.fechaHora.lte).toEqual(new Date('2026-10-31'));

      const [findArgs] = prisma.bitacoraSistema.findMany.mock.calls[0];
      expect(findArgs.orderBy).toEqual({ fechaHora: 'desc' });
      expect(findArgs.skip).toBe(2);
      expect(findArgs.take).toBe(2);
      expect(findArgs.where).toEqual(countArgs.where);
    });

    it('acota limit a 200 y exige page >= 1', async () => {
      prisma.bitacoraSistema.count.mockResolvedValue(0);
      prisma.bitacoraSistema.findMany.mockResolvedValue([]);

      const r = await service.listar({ page: 0, limit: 1000 });
      expect(r.page).toBe(1);
      expect(r.limit).toBe(200);

      const [findArgs] = prisma.bitacoraSistema.findMany.mock.calls[0];
      expect(findArgs.skip).toBe(0);
      expect(findArgs.take).toBe(200);
    });

    it('usa page 1 y limit 50 por defecto', async () => {
      prisma.bitacoraSistema.count.mockResolvedValue(0);
      prisma.bitacoraSistema.findMany.mockResolvedValue([]);

      const r = await service.listar({});
      expect(r.page).toBe(1);
      expect(r.limit).toBe(50);

      const [findArgs] = prisma.bitacoraSistema.findMany.mock.calls[0];
      expect(findArgs.skip).toBe(0);
      expect(findArgs.take).toBe(50);
    });
  });
});
