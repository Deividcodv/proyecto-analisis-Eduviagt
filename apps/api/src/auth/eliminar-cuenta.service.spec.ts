import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EliminarCuentaService } from './eliminar-cuenta.service';

describe('EliminarCuentaService', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let prisma: any;
  let storage: any;
  let audit: any;
  let bitacora: any;
  let service: EliminarCuentaService;

  const usuario = {
    id: 'u1',
    cui: '1234567890123',
    nombres: 'Persona Prueba',
    email: 'persona@demo.gt',
    passwordHash: '',
    rol: { nombre: 'POSTULANTE' },
    eliminadoAt: null as Date | null,
  };

  beforeEach(async () => {
    prisma = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue(usuario),
        update: jest.fn().mockResolvedValue({}),
      },
      solicitud: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 's1',
            documentos: [{ id: 'd1', archivoUrl: '/storage/solicitudes/s1/a.pdf' }],
          },
        ]),
      },
      solicitudDocumento: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      solicitudPerfilAcademico: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      solicitudPerfilFinanciero: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      usuarioPermiso: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      configuracionUsuario: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      auditLog: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'a1', detalle: { cui: '1234567890123', accion: 'crear' } },
        ]),
        update: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn(async (fn: (tx: any) => Promise<unknown>) => fn(prisma)),
    };
    storage = { delete: jest.fn().mockResolvedValue(undefined) };
    audit = { log: jest.fn().mockResolvedValue({}) };
    bitacora = { registrar: jest.fn().mockResolvedValue(undefined) };

    usuario.passwordHash = await bcrypt.hash('Admin123!', 10);
    service = new EliminarCuentaService(prisma, storage, audit, bitacora);
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  it('exige la contraseña correcta', async () => {
    await expect(
      service.eliminar('u1', 'contraseña-equivocada'),
    ).rejects.toThrow(UnauthorizedException);
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });

  it('anonimiza los datos personales y bloquea la cuenta', async () => {
    const resultado = await service.eliminar('u1', 'Admin123!');

    const actualizacion = prisma.usuario.update.mock.calls[0][0].data;
    expect(actualizacion.nombres).toMatch(/Usuario eliminado/);
    expect(actualizacion.email).toMatch(/@anonimo\.invalid$/);
    expect(actualizacion.cui).not.toBe('1234567890123');
    expect(actualizacion.telefono).toBeNull();
    expect(actualizacion.direccion).toBeNull();
    expect(actualizacion.fechaNacimiento).toBeNull();
    expect(actualizacion.estado).toBe('INACTIVO');
    expect(actualizacion.eliminadoAt).toBeInstanceOf(Date);
    // La contraseña deja de servir para iniciar sesión.
    expect(actualizacion.passwordHash).not.toBe(usuario.passwordHash);

    expect(resultado.seudonimo).toMatch(/@anonimo\.invalid$/);
    expect(resultado.conservados.length).toBeGreaterThan(0);
  });

  it('conserva las solicitudes y borra los documentos y sus archivos', async () => {
    await service.eliminar('u1', 'Admin123!');

    // Las solicitudes NO se borran: son la trazabilidad de la decisión.
    expect(prisma.solicitud.deleteMany).toBeUndefined();
    expect(prisma.solicitudDocumento.deleteMany).toHaveBeenCalledWith({
      where: { solicitudId: { in: ['s1'] } },
    });
    expect(storage.delete).toHaveBeenCalledWith('solicitudes/s1/a.pdf');
  });

  it('anonimiza los perfiles académico y financiero', async () => {
    await service.eliminar('u1', 'Admin123!');

    const academico = prisma.solicitudPerfilAcademico.updateMany.mock.calls[0][0].data;
    expect(academico.institucion).toBeNull();
    expect(academico.carrera).toBeNull();
    expect(academico.promedio).toBeNull();

    const financiero = prisma.solicitudPerfilFinanciero.updateMany.mock.calls[0][0].data;
    expect(financiero.ingresoFamiliar).toBeNull();
    expect(financiero.numeroDependientes).toBeNull();
    expect(financiero.descripcionSituacion).toBeNull();
  });

  it('sanea los datos personales del detalle de auditoría', async () => {
    await service.eliminar('u1', 'Admin123!');

    const saneado = prisma.auditLog.update.mock.calls[0][0].data.detalle;
    expect(saneado.cui).toBeNull();
    expect(saneado.accion).toBe('crear');
  });

  it('registra la eliminación en la auditoría y en la bitácora', async () => {
    await service.eliminar('u1', 'Admin123!', 'Ya no uso la plataforma');

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'eliminar-cuenta', entidad: 'usuario' }),
    );
    expect(bitacora.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accionClave: 'usuario.eliminar_cuenta' }),
    );
  });

  it('no borra la cuenta dos veces', async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      ...usuario,
      eliminadoAt: new Date(),
    });

    await expect(service.eliminar('u1', 'Admin123!')).rejects.toThrow(
      BadRequestException,
    );
  });
});
