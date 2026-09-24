import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SesionesService } from './sesiones.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

const miembro: AuthenticatedUser = {
  id: 'u-miembro',
  cui: '6666666666666',
  nombres: 'Miembro',
  email: 'miembro@demo.gt',
  rol: { id: 'r-miembro', nombre: 'MIEMBRO_COMITE', descripcion: null },
};

describe('SesionesService', () => {
  let prisma: any;
  let service: SesionesService;

  beforeEach(() => {
    prisma = {
      comite: { findUnique: jest.fn() },
      comiteMiembro: { findFirst: jest.fn() },
      solicitud: { findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
      sesion: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      voto: { findFirst: jest.fn(), create: jest.fn() },
      decision: { create: jest.fn() },
      historialEstado: { create: jest.fn() },
      convocatoria: { findUnique: jest.fn(), update: jest.fn() },
    };
    service = new SesionesService(prisma);
  });

  describe('crearSesion (US-31)', () => {
    const dto = {
      comiteId: 'c1',
      fecha: '2026-09-01T09:00:00.000Z',
      lugar: 'Sala 1',
      quorumMinimo: 2,
      solicitudesIds: ['s1', 's2'],
    };

    it('rechaza comité inexistente', async () => {
      prisma.comite.findUnique.mockResolvedValue(null);
      await expect(service.crearSesion(dto)).rejects.toThrow(NotFoundException);
    });

    it('rechaza solicitudes inexistentes', async () => {
      prisma.comite.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.solicitud.findMany.mockResolvedValue([
        { id: 's1', estado: 'EVALUADA', convocatoriaId: 'conv1' },
      ]);
      await expect(
        service.crearSesion({ ...dto, solicitudesIds: ['s1', 's2'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza solicitudes que no están EVALUADA', async () => {
      prisma.comite.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.solicitud.findMany.mockResolvedValue([
        { id: 's1', estado: 'BORRADOR', convocatoriaId: 'conv1' },
      ]);
      await expect(
        service.crearSesion({ ...dto, solicitudesIds: ['s1'] }),
      ).rejects.toThrow('solo admite solicitudes EVALUADA');
    });

    it('rechaza agenda de convocatorias distintas', async () => {
      prisma.comite.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.solicitud.findMany.mockResolvedValue([
        { id: 's1', estado: 'EVALUADA', convocatoriaId: 'conv1' },
        { id: 's2', estado: 'EVALUADA', convocatoriaId: 'conv2' },
      ]);
      await expect(service.crearSesion(dto)).rejects.toThrow(
        'misma convocatoria',
      );
    });

    it('crea la sesión con su agenda', async () => {
      prisma.comite.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.solicitud.findMany.mockResolvedValue([
        { id: 's1', estado: 'EVALUADA', convocatoriaId: 'conv1' },
        { id: 's2', estado: 'EVALUADA', convocatoriaId: 'conv1' },
      ]);
      prisma.sesion.create.mockResolvedValue({ id: 'ses1' });

      const result = await service.crearSesion(dto);

      expect(result.id).toBe('ses1');
      expect(prisma.sesion.create).toHaveBeenCalledWith({
        data: {
          comiteId: 'c1',
          fecha: new Date(dto.fecha),
          lugar: 'Sala 1',
          quorumMinimo: 2,
          agenda: { create: [{ solicitudId: 's1' }, { solicitudId: 's2' }] },
        },
        include: expect.anything(),
      });
    });
  });

  describe('registrarVoto (US-32)', () => {
    it('rechaza sesión inexistente', async () => {
      prisma.sesion.findUnique.mockResolvedValue(null);
      await expect(
        service.registrarVoto('ses1', { solicitudId: 's1', voto: 'APROBAR' }, miembro),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza votar en sesión finalizada', async () => {
      prisma.sesion.findUnique.mockResolvedValue({
        id: 'ses1',
        estado: 'FINALIZADA',
        comite: { id: 'c1' },
        agenda: [],
      });
      await expect(
        service.registrarVoto('ses1', { solicitudId: 's1', voto: 'APROBAR' }, miembro),
      ).rejects.toThrow('ya fue finalizada');
    });

    it('rechaza a quien no es miembro del comité', async () => {
      prisma.sesion.findUnique.mockResolvedValue({
        id: 'ses1',
        estado: 'PROGRAMADA',
        comite: { id: 'c1' },
        agenda: [{ solicitudId: 's1' }],
      });
      prisma.comiteMiembro.findFirst.mockResolvedValue(null);
      await expect(
        service.registrarVoto('ses1', { solicitudId: 's1', voto: 'APROBAR' }, miembro),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza solicitud fuera de la agenda', async () => {
      prisma.sesion.findUnique.mockResolvedValue({
        id: 'ses1',
        estado: 'PROGRAMADA',
        comite: { id: 'c1' },
        agenda: [{ solicitudId: 's1' }],
      });
      prisma.comiteMiembro.findFirst.mockResolvedValue({ id: 'm1' });
      await expect(
        service.registrarVoto('ses1', { solicitudId: 's2', voto: 'APROBAR' }, miembro),
      ).rejects.toThrow('no está en la agenda');
    });

    it('rechaza voto duplicado por la misma solicitud', async () => {
      prisma.sesion.findUnique.mockResolvedValue({
        id: 'ses1',
        estado: 'PROGRAMADA',
        comite: { id: 'c1' },
        agenda: [{ solicitudId: 's1' }],
      });
      prisma.comiteMiembro.findFirst.mockResolvedValue({ id: 'm1' });
      prisma.voto.findFirst.mockResolvedValue({ id: 'v1' });
      await expect(
        service.registrarVoto('ses1', { solicitudId: 's1', voto: 'APROBAR' }, miembro),
      ).rejects.toThrow(BadRequestException);
    });

    it('registra el voto de un miembro activo', async () => {
      prisma.sesion.findUnique.mockResolvedValue({
        id: 'ses1',
        estado: 'PROGRAMADA',
        comite: { id: 'c1' },
        agenda: [{ solicitudId: 's1' }],
      });
      prisma.comiteMiembro.findFirst.mockResolvedValue({ id: 'm1' });
      prisma.voto.findFirst.mockResolvedValue(null);
      prisma.voto.create.mockResolvedValue({ id: 'v1', voto: 'APROBAR' });

      const result = await service.registrarVoto(
        'ses1',
        { solicitudId: 's1', voto: 'APROBAR', observaciones: 'Perfil sólido' },
        miembro,
      );

      expect(result.id).toBe('v1');
      expect(prisma.voto.create).toHaveBeenCalledWith({
        data: {
          sesionId: 'ses1',
          solicitudId: 's1',
          usuarioId: 'u-miembro',
          voto: 'APROBAR',
          observaciones: 'Perfil sólido',
        },
      });
    });
  });

  describe('finalizarSesion (US-33)', () => {
    const sesionBase = {
      id: 'ses1',
      estado: 'EN_CURSO',
      quorumMinimo: 2,
      comite: { id: 'c1' },
      agenda: [
        {
          solicitud: { id: 's1', estado: 'EVALUADA', convocatoriaId: 'conv1' },
        },
        {
          solicitud: { id: 's2', estado: 'EVALUADA', convocatoriaId: 'conv1' },
        },
      ],
      votos: [
        { solicitudId: 's1', usuarioId: 'u-m1', voto: 'APROBAR' },
        { solicitudId: 's1', usuarioId: 'u-m2', voto: 'RECHAZAR' },
        { solicitudId: 's2', usuarioId: 'u-m1', voto: 'APROBAR' },
        { solicitudId: 's2', usuarioId: 'u-m2', voto: 'APROBAR' },
      ],
    };

    const mockResto = () => {
      prisma.solicitud.update.mockResolvedValue({});
      prisma.historialEstado.create.mockResolvedValue({});
      prisma.sesion.update.mockResolvedValue({ id: 'ses1', estado: 'FINALIZADA' });
    };

    it('rechaza sesión inexistente', async () => {
      prisma.sesion.findUnique.mockResolvedValue(null);
      await expect(service.finalizarSesion('ses1', miembro)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza sesión ya finalizada', async () => {
      prisma.sesion.findUnique.mockResolvedValue({ ...sesionBase, estado: 'FINALIZADA' });
      await expect(service.finalizarSesion('ses1', miembro)).rejects.toThrow(
        'ya fue finalizada',
      );
    });

    it('rechaza con quórum insuficiente', async () => {
      prisma.sesion.findUnique.mockResolvedValue({
        ...sesionBase,
        quorumMinimo: 3,
      });
      await expect(service.finalizarSesion('ses1', miembro)).rejects.toThrow(
        'Quórum insuficiente',
      );
    });

    it('rechaza si hay solicitudes que no están en EVALUADA', async () => {
      prisma.sesion.findUnique.mockResolvedValue({
        ...sesionBase,
        agenda: [
          { solicitud: { id: 's1', estado: 'APROBADA', convocatoriaId: 'conv1' } },
        ],
      });
      await expect(service.finalizarSesion('ses1', miembro)).rejects.toThrow(
        'no están en EVALUADA',
      );
    });

    it('genera decisiones por mayoría, transiciona solicitudes y cierra la sesión', async () => {
      prisma.sesion.findUnique.mockResolvedValue(sesionBase);
      mockResto();
      prisma.decision.create.mockResolvedValue({
        solicitudId: 's1',
        sesionId: 'ses1',
        resultado: 'RECHAZADA',
      });
      prisma.solicitud.count.mockResolvedValue(0);
      prisma.convocatoria.findUnique.mockResolvedValue({ estado: 'EN_EVALUACION' });
      prisma.convocatoria.update.mockResolvedValue({ estado: 'RESUELTA' });

      const result = await service.finalizarSesion('ses1', miembro);

      expect(prisma.decision.create).toHaveBeenCalledTimes(2);
      expect(prisma.solicitud.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { estado: 'RECHAZADA' },
      });
      expect(prisma.solicitud.update).toHaveBeenCalledWith({
        where: { id: 's2' },
        data: { estado: 'APROBADA' },
      });
      expect(prisma.historialEstado.create).toHaveBeenCalledTimes(2);
      expect(prisma.convocatoria.update).toHaveBeenCalledWith({
        where: { id: 'conv1' },
        data: { estado: 'RESUELTA' },
      });
      expect(prisma.sesion.update).toHaveBeenCalledWith({
        where: { id: 'ses1' },
        data: { estado: 'FINALIZADA' },
        include: expect.anything(),
      });
      expect(result.id).toBe('ses1');
    });
  });
});