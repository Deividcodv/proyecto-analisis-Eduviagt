import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { RolesService } from './roles.service';
import { PermisosService } from './permisos.service';
import { UsuariosService } from './usuarios.service';

describe('UsersService (Matriz de seguridad)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let audit: any;
  let service: UsersService;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const actor = { id: 'admin-1', rol: { nombre: 'ADMIN' } } as any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const rolAdmin = { id: 'rol-admin', nombre: 'ADMIN' };
  const rolPostulante = { id: 'rol-postulante', nombre: 'POSTULANTE' };

  beforeEach(() => {
    prisma = {
      rol: { findUnique: jest.fn() },
      usuario: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      usuarioPermiso: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    audit = { log: jest.fn().mockResolvedValue({ id: 'audit-1' }) };
    service = new UsersService(
      new RolesService(prisma, audit),
      new PermisosService(prisma),
      new UsuariosService(prisma, audit),
    );
  });

  describe('createUsuario', () => {
    const dto = {
      cui: '1111111111111',
      nombres: 'Empleada Demo',
      email: 'empleada@demo.gt',
      password: 'Password123!',
      rolId: 'rol-admin',
    };

    it('crea el usuario con password hasheado y sin devolver el hash', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.rol.findUnique.mockResolvedValue(rolAdmin);
      prisma.usuario.create.mockResolvedValue({
        id: 'u-nuevo',
        ...dto,
        passwordHash: 'hash-abc',
        rol: { id: rolAdmin.id, nombre: rolAdmin.nombre },
      });

      const result = await service.createUsuario(dto, actor);

      expect(prisma.usuario.create).toHaveBeenCalledTimes(1);
      expect(result).not.toHaveProperty('passwordHash');
      expect(bcrypt.compareSync('Password123!', 'hash-abc')).toBe(false);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'crear', entidad: 'usuario' }),
      );
    });

    it('lanza ConflictException si el CUI ya está registrado', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ cui: dto.cui });

      await expect(service.createUsuario(dto, actor)).rejects.toThrow(
        ConflictException,
      );
    });

    it('lanza ConflictException si el correo ya está registrado', async () => {
      prisma.usuario.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ email: dto.email });

      await expect(service.createUsuario(dto, actor)).rejects.toThrow(
        ConflictException,
      );
    });

    it('lanza NotFoundException si el rol no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.rol.findUnique.mockResolvedValue(null);

      await expect(service.createUsuario(dto, actor)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findUsuarioById', () => {
    it('lanza NotFoundException si el usuario no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.findUsuarioById('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devuelve el usuario con rol y excepciones, sin password', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 'u-1',
        nombres: 'Ana',
        email: 'ana@gob.gt',
        passwordHash: 'hash',
        rol: { id: 'rol-admin', nombre: 'ADMIN' },
        usuarioPermisos: [
          {
            efecto: 'PERMITIR',
            permiso: { id: 'p-1', modulo: 'reporte', accion: 'ver' },
          },
        ],
      });

      const result = await service.findUsuarioById('u-1');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.rol.nombre).toBe('ADMIN');
      expect(result.usuarioPermisos).toHaveLength(1);
    });
  });

  describe('updateUsuario', () => {
    it('lanza BadRequestException al inactivar el propio usuario', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 'admin-1' });

      await expect(
        service.updateUsuario('admin-1', { estado: 'INACTIVO' }, actor),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUsuario('x', { estado: 'INACTIVO' }, actor),
      ).rejects.toThrow(NotFoundException);
    });

    it('actualiza el rol y audita', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 'u-1' });
      prisma.rol.findUnique.mockResolvedValue(rolPostulante);
      prisma.usuario.update.mockResolvedValue({
        id: 'u-1',
        nombre: 'Ana',
        passwordHash: 'hash',
        rol: { id: rolPostulante.id, nombre: rolPostulante.nombre },
      });

      const result = await service.updateUsuario(
        'u-1',
        { rolId: 'rol-postulante' },
        actor,
      );

      expect(result.rol.nombre).toBe('POSTULANTE');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'editar', entidad: 'usuario' }),
      );
    });
  });

  describe('assignUsuarioPermisos', () => {
    it('reemplaza las excepciones y retorna el usuario actualizado', async () => {
      prisma.usuario.findUnique
        .mockResolvedValueOnce({ id: 'u-1' })
        .mockResolvedValueOnce({
          id: 'u-1',
          rol: rolAdmin,
          usuarioPermisos: [{ efecto: 'DENEGAR', permiso: { id: 'p-2' } }],
        });

      const result = await service.assignUsuarioPermisos(
        'u-1',
        { permisos: [{ permisoId: 'p-2', efecto: 'DENEGAR' }] },
        actor,
      );

      expect(prisma.usuarioPermiso.deleteMany).toHaveBeenCalledWith({
        where: { usuarioId: 'u-1' },
      });
      expect(prisma.usuarioPermiso.createMany).toHaveBeenCalledWith({
        data: [{ usuarioId: 'u-1', permisoId: 'p-2', efecto: 'DENEGAR' }],
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'asignar-permisos' }),
      );
      expect(result.usuarioPermisos).toHaveLength(1);
    });

    it('borra todas las excepciones cuando la lista viene vacía (heredar del rol)', async () => {
      prisma.usuario.findUnique
        .mockResolvedValueOnce({ id: 'u-1' })
        .mockResolvedValueOnce({
          id: 'u-1',
          rol: rolAdmin,
          usuarioPermisos: [],
        });

      await service.assignUsuarioPermisos('u-1', { permisos: [] }, actor);

      expect(prisma.usuarioPermiso.createMany).not.toHaveBeenCalled();
      expect(prisma.usuarioPermiso.deleteMany).toHaveBeenCalled();
    });
  });

  describe('findAllUsuarios', () => {
    it('filtra por rol cuando se provee', async () => {
      prisma.usuario.findMany.mockResolvedValue([]);

      await service.findAllUsuarios('EVALUADOR');

      expect(prisma.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { rol: { nombre: 'EVALUADOR' } },
        }),
      );
    });
  });
});