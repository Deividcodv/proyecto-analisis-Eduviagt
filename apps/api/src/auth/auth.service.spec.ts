import { NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UpdatePerfilDto } from './dto/update-perfil.dto';

describe('AuthService (perfil)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let jwt: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let config: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let audit: any;
  let service: AuthService;

  const usuarioBase = {
    id: 'u-1',
    cui: '1234567890123',
    nombres: 'Ana López',
    email: 'ana@demo.gt',
    telefono: null,
    fechaNacimiento: null,
    direccion: null,
    passwordHash: 'hash-abc',
    rol: { id: 'rol-postulante', nombre: 'POSTULANTE' },
  };

  beforeEach(() => {
    prisma = {
      usuario: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      rol: { findUnique: jest.fn() },
      genero: { findUnique: jest.fn() },
      departamento: { findUnique: jest.fn() },
      municipio: { findUnique: jest.fn() },
    };
    jwt = { sign: jest.fn(), verify: jest.fn(), signAsync: jest.fn() };
    config = {
      get: jest.fn((key: string) => {
        const valores: Record<string, string | undefined> = {
          JWT_SECRET: 'test-secret',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
        };
        return valores[key];
      }),
    };
    audit = { log: jest.fn().mockResolvedValue({ id: 'audit-1' }) };
    service = new AuthService(prisma, jwt, config, audit);
  });

  describe('getProfile', () => {
    it('lanza NotFoundException si el usuario no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devuelve el perfil aplanado con rol y datos personales', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        ...usuarioBase,
        fechaNacimiento: new Date('1998-05-21'),
        genero: { id: 'g-1', nombre: 'Femenino' },
        departamento: { id: 'd-1', nombre: 'Guatemala' },
        municipio: { id: 'm-1', nombre: 'Guatemala' },
      });

      const result = await service.getProfile('u-1');

      expect(result).toMatchObject({
        id: 'u-1',
        nombres: 'Ana López',
        rol: { id: 'rol-postulante', nombre: 'POSTULANTE' },
        genero: { id: 'g-1', nombre: 'Femenino' },
        departamento: { id: 'd-1', nombre: 'Guatemala' },
        municipio: { id: 'm-1', nombre: 'Guatemala' },
      });
      expect(result.fechaNacimiento).toBeInstanceOf(Date);
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('updatePerfil', () => {
    const dto: UpdatePerfilDto = {
      nombres: 'Ana María López',
      telefono: '+502 5555 1234',
      fechaNacimiento: '1998-05-21',
      direccion: 'Calle 3, zona 8',
      generoId: 'g-1',
      departamentoId: 'd-1',
      municipioId: 'm-1',
    };

    it('lanza NotFoundException si el usuario no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.updatePerfil('no-existe', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('valida género, departamento y municipio', async () => {
      prisma.usuario.findUnique.mockResolvedValue(usuarioBase);
      prisma.genero.findUnique.mockResolvedValue(null);

      await expect(service.updatePerfil('u-1', dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.usuario.update).not.toHaveBeenCalled();
    });

    it('actualiza los datos y devuelve el perfil sin hash', async () => {
      prisma.usuario.findUnique.mockResolvedValue(usuarioBase);
      prisma.genero.findUnique.mockResolvedValue({ id: 'g-1' });
      prisma.departamento.findUnique.mockResolvedValue({ id: 'd-1' });
      prisma.municipio.findUnique.mockResolvedValue({ id: 'm-1' });
      prisma.usuario.update.mockResolvedValue({
        ...usuarioBase,
        nombres: 'Ana María López',
        telefono: '+502 5555 1234',
        fechaNacimiento: new Date('1998-05-21'),
        direccion: 'Calle 3, zona 8',
        genero: { id: 'g-1', nombre: 'Femenino' },
        departamento: { id: 'd-1', nombre: 'Guatemala' },
        municipio: { id: 'm-1', nombre: 'Guatemala' },
      });

      const result = await service.updatePerfil('u-1', dto);

      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-1' },
          data: expect.objectContaining({
            telefono: '+502 5555 1234',
            generoId: 'g-1',
          }),
        }),
      );
      expect(result.nombres).toBe('Ana María López');
      expect(result.telefono).toBe('+502 5555 1234');
      expect(result).not.toHaveProperty('passwordHash');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'update_perfil', entidad: 'usuario' }),
      );
    });
  });
});