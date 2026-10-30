import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DesembolsoService } from './desembolso.service';
import { AuthzService } from '../common/services/authz.service';

/**
 * Desembolso de la beca: quién puede registrar el pago, en qué estados y
 * qué se avisa al postulante.
 */
describe('DesembolsoService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let audit: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let notificaciones: any;
  let service: DesembolsoService;

  const jefe = {
    id: 'u-jefe',
    rol: { nombre: 'JEFE_BECAS' },
  } as any;
  const postulante = {
    id: 'u-postulante',
    rol: { nombre: 'POSTULANTE' },
  } as any;

  const solicitudAprobada = {
    id: 's1',
    usuarioId: 'u-postulante',
    estado: 'APROBADA',
    montoAprobado: 12000,
    montoOtorgable: 12000,
  };

  beforeEach(() => {
    prisma = {
      solicitud: { findUnique: jest.fn() },
      desembolso: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
    };
    audit = { log: jest.fn() };
    notificaciones = { notificarUsuario: jest.fn() };
    service = new DesembolsoService(
      prisma,
      audit,
      notificaciones,
      new AuthzService(prisma),
    );
  });

  it('no permite registrar el pago si la solicitud no está aprobada', async () => {
    prisma.solicitud.findUnique.mockResolvedValue({
      ...solicitudAprobada,
      estado: 'EN_REVISION',
    });

    await expect(
      service.registrar('s1', { estado: 'PAGADO' }, jefe),
    ).rejects.toThrow(BadRequestException);
  });

  it('el postulante no puede registrar el pago', async () => {
    prisma.solicitud.findUnique.mockResolvedValue(solicitudAprobada);

    await expect(
      service.registrar('s1', { estado: 'PAGADO' }, postulante),
    ).rejects.toThrow(ForbiddenException);
  });

  it('registra el pago con sus datos', async () => {
    prisma.solicitud.findUnique.mockResolvedValue(solicitudAprobada);
    prisma.desembolso.upsert.mockResolvedValue({
      id: 'd1',
      estado: 'PAGADO',
      monto: 12000,
    });

    const result = await service.registrar(
      's1',
      {
        estado: 'PAGADO',
        metodo: 'TRANSFERENCIA',
        banco: 'Banco de Guatemala',
        numeroCuenta: '1234-5678',
        titular: 'María López',
        fechaPago: '2026-11-01',
      },
      jefe,
    );

    expect(result.estado).toBe('PAGADO');
    expect(prisma.desembolso.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { solicitudId: 's1' },
        create: expect.objectContaining({
          solicitudId: 's1',
          estado: 'PAGADO',
          metodo: 'TRANSFERENCIA',
          registradoPorId: 'u-jefe',
        }),
      }),
    );
  });

  it('avisa al postulante cuando el pago queda hecho', async () => {
    prisma.solicitud.findUnique.mockResolvedValue(solicitudAprobada);
    prisma.desembolso.upsert.mockResolvedValue({
      id: 'd1',
      estado: 'PAGADO',
      monto: 12000,
    });

    await service.registrar('s1', { estado: 'PAGADO' }, jefe);

    expect(notificaciones.notificarUsuario).toHaveBeenCalledWith(
      'u-postulante',
      expect.objectContaining({ tipo: 'DESEMBOLSO_PAGADO' }),
    );
  });

  it('no avisa cuando el pago solo está en trámite', async () => {
    prisma.solicitud.findUnique.mockResolvedValue(solicitudAprobada);
    prisma.desembolso.upsert.mockResolvedValue({
      id: 'd1',
      estado: 'EN_TRAMITE',
      monto: 12000,
    });

    await service.registrar('s1', { estado: 'EN_TRAMITE' }, jefe);

    expect(notificaciones.notificarUsuario).not.toHaveBeenCalled();
  });
});
