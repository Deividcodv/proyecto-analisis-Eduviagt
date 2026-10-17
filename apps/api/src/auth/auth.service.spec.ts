import {
  ConflictException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UpdatePerfilDto } from './dto/update-perfil.dto';

jest.mock('bcrypt');

describe('AuthService (perfil)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let jwt: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let config: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let audit: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let intentosLogin: any;
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
        findFirst: jest.fn(),
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
      getOrThrow: jest.fn((key: string) => {
        const valores: Record<string, string> = {
          JWT_SECRET: 'test-secret',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_ACCESS_EXPIRATION: '15m',
          JWT_REFRESH_EXPIRATION: '7d',
        };
        return valores[key];
      }),
    };
    audit = { log: jest.fn().mockResolvedValue({ id: 'audit-1' }) };
    intentosLogin = {
      estado: jest
        .fn()
        .mockReturnValue({ bloqueado: false, reintentarEnSegundos: 0 }),
      registrarFallo: jest.fn(),
      registrarExito: jest.fn(),
    };
    (bcrypt.genSalt as unknown as jest.Mock).mockResolvedValue('salt');
    (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('hash-bcrypt');
    service = new AuthService(prisma, jwt, config, audit, intentosLogin);
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

  describe('register (correo sin distinguir mayúsculas)', () => {
    const dtoValido = {
      cui: '1234567890123',
      nombres: 'Juan Pérez',
      email: 'JUAN@Test.com',
      password: 'Password123!',
    };

    beforeEach(() => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.rol.findUnique.mockResolvedValue({
        id: 'rol-1',
        nombre: 'POSTULANTE',
      });
      prisma.usuario.create.mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async ({ data }: any) => ({
          id: 'u-9',
          ...data,
          createdAt: new Date(),
          rol: { id: 'rol-1', nombre: 'POSTULANTE' },
        }),
      );
    });

    it('guarda el correo en minúsculas', async () => {
      await service.register(dtoValido);

      expect(prisma.usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'juan@test.com' }),
        }),
      );
    });

    it('devuelve 409 (no 500) si el correo o el CUI chocan por una carrera', async () => {
      prisma.usuario.create.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }),
      );

      await expect(service.register(dtoValido)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const emailGuardado = 'juan@test.com';
    const usuarioLogin = {
      id: 'u-login',
      cui: '1234567890123',
      nombres: 'Juan Pérez',
      email: emailGuardado,
      estado: 'ACTIVO',
      passwordHash: 'hash-bcrypt',
      rol: { id: 'rol-1', nombre: 'POSTULANTE' },
    };

    // Simula una BD real: findUnique compara exacto, findFirst admite
    // mode:'insensitive'. Así la prueba acepta cualquier implementación
    // correcta y falla con la actual (que pasa el correo tal cual).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coincide = (where: any): boolean => {
      const e = where?.email;
      if (typeof e === 'string') return e === emailGuardado;
      if (e && typeof e === 'object' && typeof e.equals === 'string') {
        return e.mode === 'insensitive'
          ? e.equals.toLowerCase() === emailGuardado
          : e.equals === emailGuardado;
      }
      return false;
    };

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.usuario.findUnique.mockImplementation(async ({ where }: any) =>
        coincide(where) ? usuarioLogin : null,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.usuario.findFirst.mockImplementation(async ({ where }: any) =>
        coincide(where) ? usuarioLogin : null,
      );
      (bcrypt.compare as unknown as jest.Mock).mockResolvedValue(true);
      jwt.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
    });

    it('permite iniciar sesión con el correo en mayúsculas', async () => {
      const result = await service.login({
        email: 'JUAN@TEST.com',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('access-token');
    });

    it('permite iniciar sesión con el correo en minúsculas', async () => {
      const result = await service.login({
        email: 'juan@test.com',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('access-token');
    });

    it('rechaza a un usuario inactivo', async () => {
      const inactivo = { ...usuarioLogin, estado: 'INACTIVO' };
      prisma.usuario.findUnique.mockResolvedValue(inactivo);
      prisma.usuario.findFirst.mockResolvedValue(inactivo);

      await expect(
        service.login({ email: 'juan@test.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    // S-002: límite de intentos.
    it('devuelve 429 y no consulta la BD cuando la clave está bloqueada', async () => {
      intentosLogin.estado.mockReturnValue({
        bloqueado: true,
        reintentarEnSegundos: 42,
      });

      await expect(
        service.login(
          { email: 'juan@test.com', password: 'Password123!' },
          '1.2.3.4',
        ),
      ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });

      expect(prisma.usuario.findFirst).not.toHaveBeenCalled();
    });

    it('registra el fallo (clave IP + correo) cuando la contraseña es incorrecta', async () => {
      (bcrypt.compare as unknown as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'JUAN@test.com', password: 'mala' }, '1.2.3.4'),
      ).rejects.toThrow(UnauthorizedException);

      expect(intentosLogin.registrarFallo).toHaveBeenCalledWith(
        '1.2.3.4:juan@test.com',
      );
    });

    it('reinicia el contador tras un inicio de sesión correcto', async () => {
      await service.login(
        { email: 'juan@test.com', password: 'Password123!' },
        '1.2.3.4',
      );

      expect(intentosLogin.registrarExito).toHaveBeenCalledWith(
        '1.2.3.4:juan@test.com',
      );
    });
  });
});