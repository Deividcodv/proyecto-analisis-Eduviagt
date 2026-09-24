import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

const postulante: AuthenticatedUser = {
  id: 'u-postulante',
  cui: '9999999999999',
  nombres: 'Postulante Demo',
  email: 'postulante@demo.gt',
  rol: { id: 'r-postulante', nombre: 'POSTULANTE', descripcion: null },
};

describe('SolicitudesService', () => {
  let prisma: any;
  let storage: any;
  let service: SolicitudesService;

  beforeEach(() => {
    prisma = {
      solicitud: { findUnique: jest.fn(), update: jest.fn() },
      convocatoria: { findUnique: jest.fn() },
      documentoTipo: { findUnique: jest.fn() },
      solicitudDocumento: { findFirst: jest.fn(), create: jest.fn(), delete: jest.fn(), update: jest.fn() },
      solicitudPerfilAcademico: { upsert: jest.fn() },
      historialEstado: { create: jest.fn() },
      genero: { findUnique: jest.fn() },
    };
    storage = {
      save: jest.fn(),
      delete: jest.fn(),
      read: jest.fn(),
      exists: jest.fn(),
    };
    service = new SolicitudesService(prisma, storage);
  });

  describe('guardarPerfilAcademico (US-13: opcion otro)', () => {
    it('guarda el valor libre "otro" y limpia el id del catalogo', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        usuarioId: 'u-postulante',
        estado: 'BORRADOR',
      });
      prisma.solicitudPerfilAcademico.upsert.mockResolvedValue({
        solicitudId: 's1',
        generoOtro: 'Otro valor libre',
        generoId: null,
      });

      const result = await service.guardarPerfilAcademico(
        's1',
        { generoOtro: 'Otro valor libre' },
        postulante,
      );

      expect(prisma.solicitudPerfilAcademico.upsert).toHaveBeenCalledWith({
        where: { solicitudId: 's1' },
        update: { generoOtro: 'Otro valor libre', generoId: null },
        create: { solicitudId: 's1', generoOtro: 'Otro valor libre', generoId: null },
      });
      expect(result.generoOtro).toBe('Otro valor libre');
      expect(result.generoId).toBeNull();
    });

    it('rechaza enviar id y "otro" al mismo tiempo', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        usuarioId: 'u-postulante',
        estado: 'BORRADOR',
      });

      await expect(
        service.guardarPerfilAcademico(
          's1',
          { generoId: 'g1', generoOtro: 'Libre' },
          postulante,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza un id de catalogo inexistente', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        usuarioId: 'u-postulante',
        estado: 'BORRADOR',
      });
      prisma.genero.findUnique.mockResolvedValue(null);

      await expect(
        service.guardarPerfilAcademico('s1', { generoId: 'nope' }, postulante),
      ).rejects.toThrow('Catálogo inexistente para generoId');
    });

    it('no valida como catalogo los campos de texto libre', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        usuarioId: 'u-postulante',
        estado: 'BORRADOR',
      });
      prisma.solicitudPerfilAcademico.upsert.mockResolvedValue({ solicitudId: 's1' });

      await expect(
        service.guardarPerfilAcademico(
          's1',
          { institucion: 'USAC', carrera: 'Ingeniería', generoOtro: 'Libre' },
          postulante,
        ),
      ).resolves.toBeDefined();
      expect(prisma.genero.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('control de acceso y edicion', () => {
    it('bloquea edicion de una solicitud ajena', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        usuarioId: 'otro-usuario',
        estado: 'BORRADOR',
      });

      await expect(
        service.guardarPerfilAcademico('s1', {}, postulante),
      ).rejects.toThrow(ForbiddenException);
    });

    it('bloquea edicion fuera del estado BORRADOR', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        usuarioId: 'u-postulante',
        estado: 'ENVIADA',
      });

      await expect(
        service.guardarPerfilAcademico('s1', {}, postulante),
      ).rejects.toThrow('Solo se puede editar la solicitud en estado BORRADOR');
    });
  });

  describe('subirDocumento (US-21/22)', () => {
    const file: Express.Multer.File = {
      buffer: Buffer.from('pdf'),
      originalname: 'certificado.pdf',
      mimetype: 'application/pdf',
      size: 3,
    } as Express.Multer.File;

    it('guarda el archivo, valida que aplique a la convocatoria e incrementa version', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        usuarioId: 'u-postulante',
        estado: 'BORRADOR',
        convocatoriaId: 'c1',
      });
      prisma.documentoTipo.findUnique.mockResolvedValue({ id: 't1', nombre: 'Certificado' });
      prisma.convocatoria.findUnique.mockResolvedValue({
        id: 'c1',
        documentosRequeridos: [{ documentoTipoId: 't1' }],
      });
      prisma.solicitudDocumento.findFirst.mockResolvedValue({
        id: 'd0',
        archivoUrl: '/storage/solicitudes/s1/0.pdf',
        version: 1,
      });
      storage.save.mockResolvedValue({
        url: '/storage/solicitudes/s1/new.pdf',
        key: 'solicitudes/s1/new.pdf',
        size: 3,
      });
      prisma.solicitudDocumento.create.mockResolvedValue({
        id: 'd1',
        version: 2,
        doc: true,
      });

      const result = await service.subirDocumento('s1', 't1', file, postulante);

      expect(storage.save).toHaveBeenCalledWith(
        file.buffer,
        expect.objectContaining({ folder: 'solicitudes/s1' }),
      );
      expect(storage.delete).toHaveBeenCalledWith('solicitudes/s1/0.pdf');
      expect(prisma.solicitudDocumento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: 2, estado: 'CARGADO' }),
        }),
      );
      expect(result.version).toBe(2);
    });

    it('rechaza tipo de documento que no aplica a la convocatoria', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        usuarioId: 'u-postulante',
        estado: 'BORRADOR',
        convocatoriaId: 'c1',
      });
      prisma.documentoTipo.findUnique.mockResolvedValue({ id: 't9' });
      prisma.convocatoria.findUnique.mockResolvedValue({
        id: 'c1',
        documentosRequeridos: [{ documentoTipoId: 't1' }],
      });

      await expect(
        service.subirDocumento('s1', 't9', file, postulante),
      ).rejects.toThrow('El tipo de documento no aplica a esta convocatoria');
      expect(storage.save).not.toHaveBeenCalled();
    });

    it('elimina fila y archivo', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        usuarioId: 'u-postulante',
        estado: 'BORRADOR',
      });
      prisma.solicitudDocumento.findFirst.mockResolvedValue({
        id: 'd1',
        archivoUrl: '/storage/solicitudes/s1/new.pdf',
        version: 2,
      });
      prisma.solicitudDocumento.delete.mockResolvedValue({ id: 'd1' });

      const result = await service.eliminarDocumento('s1', 't1', postulante);

      expect(prisma.solicitudDocumento.delete).toHaveBeenCalledWith({
        where: { id: 'd1' },
      });
      expect(storage.delete).toHaveBeenCalledWith('solicitudes/s1/new.pdf');
      expect(result).toEqual({ eliminado: true });
    });
  });

  describe('checklist y envio validado (US-23, US-24)', () => {
    const solicitudBase = {
      id: 's1',
      usuarioId: 'u-postulante',
      estado: 'BORRADOR',
      convocatoria: {
        documentosRequeridos: [
          {
            documentoTipoId: 't-cert',
            obligatorio: true,
            documentoTipo: { nombre: 'Certificado académico' },
          },
          {
            documentoTipoId: 't-foto',
            obligatorio: false,
            documentoTipo: { nombre: 'Fotografía' },
          },
        ],
      },
    };

    it('marca completitud de perfiles y documentos requeridos', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        ...solicitudBase,
        perfilAcademico: {
          generoOtro: 'Otro',
          nivelAcademicoId: 'n1',
        },
        perfilFinanciero: { ingresoFamiliar: 2500 },
        documentos: [
          { documentoTipoId: 't-cert', version: 1, estado: 'CARGADO', archivoUrl: '/storage/x.pdf' },
          { documentoTipoId: 't-cert', version: 2, estado: 'CARGADO', archivoUrl: '/storage/y.pdf' },
        ],
      });

      const result = await service.obtenerChecklist('s1', postulante);

      expect(result.completo).toBe(true);
      expect(result.perfilAcademico).toBe(true);
      expect(result.perfilFinanciero).toBe(true);
      const certificado = result.documentos.find(
        (d: { documentoTipoId: string }) => d.documentoTipoId === 't-cert',
      );
      expect(certificado).toEqual(
        expect.objectContaining({ cargado: true, archivoUrl: '/storage/y.pdf' }),
      );
    });

    it('lista pendientes cuando falta perfil y documento obligatorio', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        ...solicitudBase,
        perfilAcademico: null,
        perfilFinanciero: null,
        documentos: [],
      });

      const result = await service.obtenerChecklist('s1', postulante);

      expect(result.completo).toBe(false);
      expect(result.pendientes).toEqual(
        expect.arrayContaining([
          'Perfil académico incompleto (género y nivel académico)',
          'Perfil financiero incompleto (ingreso familiar requerido)',
          'Documento "Certificado académico" pendiente',
        ]),
      );
      // El opcional NO genera pendiente aunque no esté cargado.
      expect(result.pendientes).not.toEqual(
        expect.arrayContaining(['Documento "Fotografía" pendiente']),
      );
    });

    it('rechaza enviar cuando la solicitud esta incompleta', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        ...solicitudBase,
        perfilAcademico: null,
        perfilFinanciero: null,
        documentos: [],
      });

      await expect(
        service.transicion('s1', { accion: 'enviar' }, postulante),
      ).rejects.toThrow(/no está completa/);
      expect(prisma.solicitud.update).not.toHaveBeenCalled();
    });

    it('permite enviar cuando el checklist esta completo', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        ...solicitudBase,
        perfilAcademico: { generoId: 'g1', nivelAcademicoId: 'n1' },
        perfilFinanciero: { ingresoFamiliar: 2500 },
        documentos: [
          { documentoTipoId: 't-cert', version: 2, estado: 'CARGADO', archivoUrl: '/storage/x.pdf' },
        ],
      });
      prisma.solicitud.update.mockResolvedValue({
        id: 's1',
        estado: 'ENVIADA',
      });
      prisma.historialEstado.create.mockResolvedValue({});

      const result = await service.transicion(
        's1',
        { accion: 'enviar', comentario: 'listo' },
        postulante,
      );

      expect(result.estado).toBe('ENVIADA');
      expect(prisma.solicitud.update).toHaveBeenCalled();
      expect(prisma.historialEstado.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ estado: 'ENVIADA' }),
        }),
      );
    });
  });

  describe('rechazo de documentos (retro S3)', () => {
    const admin: AuthenticatedUser = {
      id: 'u-admin',
      cui: '1234567890123',
      nombres: 'Admin',
      email: 'admin@sigeb.gov.gt',
      rol: { id: 'r-admin', nombre: 'ADMIN', descripcion: null },
    };
    const coordinador: AuthenticatedUser = {
      id: 'u-coord',
      cui: '7777777777777',
      nombres: 'Coordinador',
      email: 'coordinador@demo.gt',
      rol: { id: 'r-coord', nombre: 'COORDINADOR_COMITE', descripcion: null },
    };
    const base = {
      id: 's1',
      usuarioId: 'u-postulante',
      estado: 'BORRADOR',
      convocatoria: {
        documentosRequeridos: [
          {
            documentoTipoId: 't-cert',
            obligatorio: true,
            documentoTipo: { nombre: 'Certificado académico' },
          },
        ],
      },
    };

    it('postulante no puede rechazar documentos', async () => {
      await expect(
        service.marcarEstadoDocumento('s1', 't-cert', 'RECHAZADO', postulante),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza solicitud inexistente', async () => {
      prisma.solicitud.findUnique.mockResolvedValue(null);
      await expect(
        service.marcarEstadoDocumento('s1', 't-cert', 'RECHAZADO', admin),
      ).rejects.toThrow('no encontrada');
    });

    it('rechaza si no hay documento cargado para el tipo', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({ id: 's1', estado: 'EN_REVISION' });
      prisma.solicitudDocumento.findFirst.mockResolvedValue(null);
      await expect(
        service.marcarEstadoDocumento('s1', 't-cert', 'RECHAZADO', admin),
      ).rejects.toThrow('No hay documento cargado');
    });

    it('coordinador registra el RECHAZADO del documento más reciente', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({ id: 's1', estado: 'EN_REVISION' });
      prisma.solicitudDocumento.findFirst.mockResolvedValue({ id: 'd1' });
      prisma.solicitudDocumento.update.mockResolvedValue({
        id: 'd1',
        estado: 'RECHAZADO',
        documentoTipo: { nombre: 'Certificado académico' },
      });

      const result = await service.marcarEstadoDocumento(
        's1',
        't-cert',
        'RECHAZADO',
        coordinador,
      );

      expect(result.estado).toBe('RECHAZADO');
      expect(prisma.solicitudDocumento.update).toHaveBeenCalledWith({
        where: { id: 'd1' },
        data: { estado: 'RECHAZADO' },
        include: { documentoTipo: true },
      });
      expect(prisma.solicitudDocumento.findFirst).toHaveBeenCalledWith({
        where: { solicitudId: 's1', documentoTipoId: 't-cert' },
        orderBy: { version: 'desc' },
      });
    });

    it('el checklist trata un documento RECHAZADO como pendiente', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        ...base,
        perfilAcademico: { generoId: 'g1', nivelAcademicoId: 'n1' },
        perfilFinanciero: { ingresoFamiliar: 2500 },
        documentos: [
          {
            documentoTipoId: 't-cert',
            version: 2,
            estado: 'RECHAZADO',
            archivoUrl: '/storage/x.pdf',
          },
        ],
      });

      const result = await service.obtenerChecklist('s1', postulante);
      expect(result.pendientes).toEqual(
        expect.arrayContaining(['Documento "Certificado académico" pendiente']),
      );
      expect(result.completo).toBe(false);
    });
  });
});