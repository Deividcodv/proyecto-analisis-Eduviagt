import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConstanciasService } from './constancias.service';
import { AuthzService } from '../common/services/authz.service';

describe('ConstanciasService (US-F7)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let renderer: any;
  let service: ConstanciasService;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const usuarioAdmin = {
    id: 'a1',
    rol: { nombre: 'ADMIN' },
  } as any;

  const usuarioDueno = {
    id: 'u1',
    rol: { nombre: 'POSTULANTE' },
  } as any;

  const usuarioAjeno = {
    id: 'u2',
    rol: { nombre: 'POSTULANTE' },
  } as any;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const solicitudAprobada = {
    id: 'sol-12345678',
    usuarioId: 'u1',
    estado: 'APROBADA',
    updatedAt: new Date('2026-09-01T12:00:00.000Z'),
    usuario: {
      nombres: 'María López',
      cui: '2345678901234',
      email: 'maria@demo.gt',
    },
    convocatoria: {
      nombre: 'Beca Permanencia 2026',
      beca: { nombre: 'Permanencia' },
    },
    perfilAcademico: {
      institucion: 'USAC',
      carrera: 'Ingeniería',
      promedio: 88.5,
      nivelAcademico: { nombre: 'Universitario' },
      nivelAcademicoOtro: null,
    },
    decision: { resultado: 'APROBADA', fecha: new Date('2026-09-01T10:00:00.000Z') },
  };

  beforeEach(() => {
    prisma = {
      solicitud: { findUnique: jest.fn() },
    };
    renderer = { render: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4')) };
    service = new ConstanciasService(prisma, renderer, new AuthzService());
  });

  it('lanza NotFoundException si la solicitud no existe', async () => {
    prisma.solicitud.findUnique.mockResolvedValue(null);

    await expect(
      service.generarConstancia('inexistente', usuarioAdmin),
    ).rejects.toThrow(NotFoundException);
    expect(renderer.render).not.toHaveBeenCalled();
  });

  it('lanza ForbiddenException a un postulante que no es el dueño', async () => {
    prisma.solicitud.findUnique.mockResolvedValue(solicitudAprobada);

    await expect(
      service.generarConstancia('sol-12345678', usuarioAjeno),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lanza BadRequestException si la solicitud no está APROBADA', async () => {
    prisma.solicitud.findUnique.mockResolvedValue({
      ...solicitudAprobada,
      estado: 'EVALUADA',
    });

    await expect(
      service.generarConstancia('sol-12345678', usuarioDueno),
    ).rejects.toThrow(BadRequestException);
  });

  it('genera el PDF e incluye los datos del beneficiario en el HTML', async () => {
    prisma.solicitud.findUnique.mockResolvedValue(solicitudAprobada);

    const pdf = await service.generarConstancia(
      'sol-12345678',
      usuarioDueno,
    );

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(renderer.render).toHaveBeenCalledTimes(1);

    const html = renderer.render.mock.calls[0][0] as string;
    expect(html).toContain('María López');
    expect(html).toContain('2345678901234');
    expect(html).toContain('Beca Permanencia 2026');
    expect(html).toContain('Permanencia');
    expect(html).toContain('Ingeniería');
    expect(html).toContain('USAC');
    expect(html).toContain('EDUVIAGT-SOL-1234');
  });

  it('un admin también puede generar la constancia', async () => {
    prisma.solicitud.findUnique.mockResolvedValue(solicitudAprobada);

    const pdf = await service.generarConstancia(
      'sol-12345678',
      usuarioAdmin,
    );

    expect(Buffer.isBuffer(pdf)).toBe(true);
  });

  it('escapa valores HTML para evitar inyección en el documento', async () => {
    prisma.solicitud.findUnique.mockResolvedValue({
      ...solicitudAprobada,
      convocatoria: {
        nombre: '<script>alert(1)</script>',
        beca: { nombre: 'Beca' },
      },
    });

    await service.generarConstancia('sol-12345678', usuarioDueno);
    const html = renderer.render.mock.calls[0][0] as string;

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});