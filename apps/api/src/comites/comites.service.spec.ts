import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ComitesService } from './comites.service';

describe('ComitesService', () => {
  let prisma: any;
  let service: ComitesService;

  beforeEach(() => {
    prisma = {
      comite: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      comiteMiembro: {
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      usuario: { findUnique: jest.fn() },
    };
    service = new ComitesService(prisma);
  });

  describe('crearComite (US-30)', () => {
    it('crea un comité con nombre y descripcion', async () => {
      prisma.comite.create.mockResolvedValue({
        id: 'c1',
        nombre: 'Comité Beca 2',
        descripcion: 'Evaluación Permanencia',
      });
      const result = await service.crearComite({
        nombre: 'Comité Beca 2',
        descripcion: 'Evaluación Permanencia',
      });
      expect(result.nombre).toBe('Comité Beca 2');
      expect(prisma.comite.create).toHaveBeenCalledWith({
        data: {
          nombre: 'Comité Beca 2',
          descripcion: 'Evaluación Permanencia',
        },
      });
    });
  });

  describe('obtenerComite', () => {
    it('lanzar NotFound si no existe', async () => {
      prisma.comite.findUnique.mockResolvedValue(null);
      await expect(service.obtenerComite('c1')).rejects.toThrow(NotFoundException);
    });

    it('incluye miembros activos con datos del usuario', async () => {
      prisma.comite.findUnique.mockResolvedValue({
        id: 'c1',
        nombre: 'Comité',
        miembros: [
          { id: 'm1', rol: 'PRESIDENTE', usuario: { id: 'u1', nombres: 'X' } },
        ],
      });
      const result = await service.obtenerComite('c1');
      expect(result.miembros).toHaveLength(1);
      expect(result.miembros[0].rol).toBe('PRESIDENTE');
    });
  });

  describe('agregarMiembro', () => {
    it('lanezar NotFound si el comité no existe', async () => {
      prisma.comite.findUnique.mockResolvedValue(null);
      await expect(
        service.agregarMiembro('c1', { usuarioId: 'u1', rol: 'VOCAL' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza usuario inexistente', async () => {
      prisma.comite.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.usuario.findUnique.mockResolvedValue(null);
      await expect(
        service.agregarMiembro('c1', { usuarioId: 'u-x', rol: 'VOCAL' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza miembro duplicado', async () => {
      prisma.comite.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.usuario.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.comiteMiembro.findFirst.mockResolvedValue({ id: 'm1' });
      await expect(
        service.agregarMiembro('c1', { usuarioId: 'u1', rol: 'VOCAL' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('agrega un miembro activo', async () => {
      prisma.comite.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.usuario.findUnique.mockResolvedValue({ id: 'u1' });
      prisma.comiteMiembro.findFirst.mockResolvedValue(null);
      prisma.comiteMiembro.create.mockResolvedValue({ id: 'm1', rol: 'VOCAL' });
      const result = await service.agregarMiembro('c1', {
        usuarioId: 'u1',
        rol: 'VOCAL',
      });
      expect(result.id).toBe('m1');
      expect(prisma.comiteMiembro.create).toHaveBeenCalledWith({
        data: { comiteId: 'c1', usuarioId: 'u1', rol: 'VOCAL' },
        include: expect.anything(),
      });
    });
  });

  describe('eliminarMiembro', () => {
    it('rechaza si el miembro no existe en el comité', async () => {
      prisma.comiteMiembro.findFirst.mockResolvedValue(null);
      await expect(
        service.eliminarMiembro('c1', 'u1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('elimina al miembro activo', async () => {
      prisma.comiteMiembro.findFirst.mockResolvedValue({ id: 'm1' });
      prisma.comiteMiembro.delete.mockResolvedValue({ id: 'm1' });
      await expect(service.eliminarMiembro('c1', 'u1')).resolves.toEqual({
        eliminado: true,
      });
      expect(prisma.comiteMiembro.delete).toHaveBeenCalledWith({
        where: { id: 'm1' },
      });
    });
  });

  describe('actualizar/eliminar comité', () => {
    it('actualiza un comité existente', async () => {
      prisma.comite.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.comite.update.mockResolvedValue({ id: 'c1', nombre: 'Nuevo' });
      const result = await service.actualizarComite('c1', { nombre: 'Nuevo' });
      expect(result.nombre).toBe('Nuevo');
    });

    it('rechaza actualizar comité inexistente', async () => {
      prisma.comite.findUnique.mockResolvedValue(null);
      await expect(
        service.actualizarComite('c1', { nombre: 'Nuevo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('elimina un comité existente', async () => {
      prisma.comite.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.comite.delete.mockResolvedValue({ id: 'c1' });
      await expect(service.eliminarComite('c1')).resolves.toEqual({
        eliminado: true,
      });
    });
  });
});