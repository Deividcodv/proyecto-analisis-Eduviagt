import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudPerfilService } from './solicitud-perfil.service';
import { SolicitudDocumentoService } from './solicitud-documento.service';
import { SolicitudChecklistService } from './solicitud-checklist.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AuthzService } from '../common/services/authz.service';

const postulante: AuthenticatedUser = {
  id: 'u-postulante',
  cui: '9999999999999',
  nombres: 'Postulante Demo',
  email: 'postulante@demo.gt',
  rol: { id: 'r-postulante', nombre: 'POSTULANTE', descripcion: null },
};

describe('SolicitudesService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let storage: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let audit: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let montos: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let bitacora: any;
  let authz: AuthzService;
  let service: SolicitudesService;

  beforeEach(() => {
    prisma = {
      solicitud: {
        findUnique: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
      convocatoria: { findUnique: jest.fn() },
      documentoTipo: { findUnique: jest.fn() },
      solicitudDocumento: { findFirst: jest.fn(), create: jest.fn(), delete: jest.fn(), update: jest.fn() },
      solicitudPerfilAcademico: { upsert: jest.fn() },
      historialEstado: { create: jest.fn() },
      solicitudAprobacion: { create: jest.fn() },
      genero: { findUnique: jest.fn() },
      usuario: { findMany: jest.fn().mockResolvedValue([]) },
      notificacion: {
        create: jest.fn().mockResolvedValue({
          id: 'n1',
          usuarioId: 'u-postulante',
          tipo: 'SOLICITUD_ENVIADA_CONFIRMACION',
          titulo: 'Postulación enviada correctamente',
          cuerpo: null,
          createdAt: new Date(),
        }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    /* eslint-disable @typescript-eslint/no-explicit-any */
    prisma.$transaction = jest.fn(async (fn: (tx: any) => Promise<unknown>) =>
    /* eslint-enable @typescript-eslint/no-explicit-any */
      fn(prisma),
    );
    authz = new AuthzService();
    storage = {
      save: jest.fn(),
      delete: jest.fn(),
      read: jest.fn(),
      exists: jest.fn(),
    };
    audit = { log: jest.fn() };
    montos = {
      calcular: jest.fn().mockResolvedValue({
        monto: null,
        origen: null,
        reglaAplicada: null,
        detalle: 'Sin monto base ni reglas aplicables.',
      }),
      requiereSegundaAprobacion: jest.fn().mockReturnValue(false),
      registrarOverride: jest.fn(),
    };
    bitacora = { registrar: jest.fn(), listar: jest.fn() };
    service = new SolicitudesService(
      prisma,
      audit,
      authz,
      new SolicitudPerfilService(prisma, authz),
      new SolicitudDocumentoService(prisma, storage, audit, authz),
      new SolicitudChecklistService(prisma, authz),
      new NotificacionesService(prisma),
      montos,
      bitacora,
    );
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

    describe('descarga de documentos (control de acceso)', () => {
      const documento = {
        id: 'd1',
        solicitudId: 's1',
        archivoUrl: '/storage/solicitudes/s1/abc.pdf',
        documentoTipo: { nombre: 'Certificado académico' },
      };

      beforeEach(() => {
        storage.read.mockResolvedValue(Buffer.from('%PDF-1.4'));
        prisma.solicitudDocumento = {
          findFirst: jest.fn().mockResolvedValue(documento),
        };
      });

      it('el dueño de la solicitud descarga su documento', async () => {
        prisma.solicitud.findUnique.mockResolvedValue({
          id: 's1',
          usuarioId: postulante.id,
        });

        const resultado = await service.descargarDocumento('s1', 'd1', postulante);

        expect(resultado.buffer.toString()).toBe('%PDF-1.4');
        expect(resultado.contentType).toBe('application/pdf');
        expect(resultado.nombreArchivo).toBe('certificado-academico.pdf');
      });

      it('otro postulante no puede descargar un documento ajeno', async () => {
        prisma.solicitud.findUnique.mockResolvedValue({
          id: 's1',
          usuarioId: 'otro-usuario',
        });

        await expect(
          service.descargarDocumento('s1', 'd1', postulante),
        ).rejects.toThrow('No tienes acceso a los documentos');
        expect(storage.read).not.toHaveBeenCalled();
      });

      it('quien revisa postulaciones sí puede descargar el documento', async () => {
        prisma.solicitud.findUnique.mockResolvedValue({
          id: 's1',
          usuarioId: 'otro-usuario',
        });

        const resultado = await service.descargarDocumento('s1', 'd1', {
          ...postulante,
          rol: { id: 'r-eval', nombre: 'EVALUADOR', descripcion: null },
        });

        expect(resultado.buffer.length).toBeGreaterThan(0);
      });

      it('no sirve un documento que pertenece a otra solicitud', async () => {
        prisma.solicitud.findUnique.mockResolvedValue({
          id: 's1',
          usuarioId: postulante.id,
        });
        prisma.solicitudDocumento.findFirst.mockResolvedValue(null);

        await expect(
          service.descargarDocumento('s1', 'd1', postulante),
        ).rejects.toThrow('no encontrado en la solicitud');
      });
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

    it('confirma al postulante con el codigo de la solicitud', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        ...solicitudBase,
        perfilAcademico: { generoId: 'g1', nivelAcademicoId: 'n1' },
        perfilFinanciero: { ingresoFamiliar: 2500 },
        documentos: [
          { documentoTipoId: 't-cert', version: 2, estado: 'CARGADO', archivoUrl: '/storage/x.pdf' },
        ],
      });
      prisma.solicitud.update.mockResolvedValue({ id: 's1', estado: 'ENVIADA' });
      prisma.historialEstado.create.mockResolvedValue({});

      await service.transicion(
        's1',
        { accion: 'enviar', comentario: 'listo' },
        postulante,
      );

      // El postulante recibe su propia notificación, con el código con el
      // que puede rastrear la postulación.
      expect(prisma.notificacion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            usuarioId: 'u-postulante',
            tipo: 'SOLICITUD_ENVIADA_CONFIRMACION',
            cuerpo: expect.stringContaining('s1'),
          }),
        }),
      );
    });
  });

  describe('segunda aprobación por monto (Sprint 8 - US-802/803)', () => {
    const admin = {
      id: 'u-admin',
      cui: '1234567890123',
      nombres: 'Admin',
      email: 'admin@sigeb.gov.gt',
      rol: { id: 'r-admin', nombre: 'ADMIN', descripcion: null },
    } as AuthenticatedUser;

    const jefeBecas = {
      id: 'u-jefe',
      cui: '5555555555555',
      nombres: 'Jefa de Becas',
      email: 'jefebecas@demo.gt',
      rol: { id: 'r-jefe', nombre: 'JEFE_BECAS', descripcion: null },
    } as AuthenticatedUser;

    const evaluada = (monto: string | null, aprobaciones: unknown[] = []) => ({
      id: 's1',
      usuarioId: 'u-postulante',
      estado: 'EVALUADA',
      correccionesCount: 0,
      montoOtorgable: monto,
      aprobaciones,
      convocatoria: {
        id: 'c1',
        nombre: 'Beca de prueba',
        beca: { id: 'b1', nombre: 'Beca de prueba' },
        maxCorrecciones: 3,
      },
      perfilFinanciero: { ingresoFamiliar: 2500 },
    });

    it('un monto sobre el umbral deja la solicitud pendiente de 2ª aprobación', async () => {
      prisma.solicitud.findUnique.mockResolvedValue(evaluada('12000'));
      prisma.solicitud.update.mockResolvedValue({
        id: 's1',
        estado: 'PENDIENTE_SEGUNDA_APROBACION',
      });
      montos.requiereSegundaAprobacion.mockReturnValue(true);

      await service.transicion('s1', { accion: 'aprobar' }, admin);

      expect(prisma.solicitud.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 's1' },
          data: expect.objectContaining({
            estado: 'PENDIENTE_SEGUNDA_APROBACION',
          }),
        }),
      );
      expect(prisma.solicitudAprobacion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nivel: 1,
            accion: 'solicitar_segunda_aprobacion',
            resultado: 'PENDIENTE_SEGUNDA_APROBACION',
          }),
        }),
      );
    });

    it('avisa de la segunda aprobación, no de una aprobación consumada', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        usuarioId: 'u-postulante',
        estado: 'EVALUADA',
        correccionesCount: 0,
        montoOtorgable: '12000',
        aprobaciones: [],
        convocatoria: {
          id: 'c1',
          nombre: 'Beca de prueba',
          beca: { id: 'b1', nombre: 'Beca de prueba' },
          maxCorrecciones: 3,
        },
        perfilFinanciero: { ingresoFamiliar: 2500 },
      });
      prisma.solicitud.update.mockResolvedValue({
        id: 's1',
        estado: 'PENDIENTE_SEGUNDA_APROBACION',
      });
      montos.requiereSegundaAprobacion.mockReturnValue(true);

      await service.transicion(
        's1',
        { accion: 'aprobar' },
        {
          id: 'u-admin',
          cui: '1234567890123',
          nombres: 'Admin',
          email: 'admin@sigeb.gov.gt',
          rol: { id: 'r-admin', nombre: 'ADMIN', descripcion: null },
        } as AuthenticatedUser,
      );

      // La persona no debe recibir un "tu solicitud fue aprobada": sigue
      // pendiente de una segunda firma.
      const tipos = prisma.notificacion.create.mock.calls.map(
        (c: [{ data: { tipo: string } }]) => c[0].data.tipo,
      );
      expect(tipos).toContain('SOLICITUD_SEGUNDA_APROBACION');
      expect(tipos).not.toContain('SOLICITUD_APROBADA');
    });

    it('un monto bajo el umbral se aprueba de una vez', async () => {
      prisma.solicitud.findUnique.mockResolvedValue(evaluada('6000'));
      prisma.solicitud.update.mockResolvedValue({ id: 's1', estado: 'APROBADA' });
      montos.requiereSegundaAprobacion.mockReturnValue(false);

      await service.transicion('s1', { accion: 'aprobar' }, admin);

      expect(prisma.solicitud.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ estado: 'APROBADA' }),
        }),
      );
    });

    it('la 2ª aprobación no puede firmarla quien firmó la 1ª', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        usuarioId: 'u-postulante',
        estado: 'PENDIENTE_SEGUNDA_APROBACION',
        correccionesCount: 0,
        montoOtorgable: '12000',
        aprobaciones: [{ id: 'a1', nivel: 1, usuarioId: admin.id }],
        convocatoria: {
          id: 'c1',
          nombre: 'Beca de prueba',
          beca: { id: 'b1', nombre: 'Beca de prueba' },
          maxCorrecciones: 3,
        },
        perfilFinanciero: { ingresoFamiliar: 2500 },
      });

      await expect(
        service.transicion('s1', { accion: 'aprobar_segunda' }, admin),
      ).rejects.toThrow(/distinta/);
    });

    it('otra persona sí puede firmar la 2ª aprobación', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        usuarioId: 'u-postulante',
        estado: 'PENDIENTE_SEGUNDA_APROBACION',
        correccionesCount: 0,
        montoOtorgable: '12000',
        aprobaciones: [{ id: 'a1', nivel: 1, usuarioId: admin.id }],
        convocatoria: {
          id: 'c1',
          nombre: 'Beca de prueba',
          beca: { id: 'b1', nombre: 'Beca de prueba' },
          maxCorrecciones: 3,
        },
        perfilFinanciero: { ingresoFamiliar: 2500 },
      });
      prisma.solicitud.update.mockResolvedValue({ id: 's1', estado: 'APROBADA' });

      await service.transicion('s1', { accion: 'aprobar_segunda' }, jefeBecas);

      expect(prisma.solicitud.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ estado: 'APROBADA' }),
        }),
      );
      expect(prisma.solicitudAprobacion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ nivel: 2, accion: 'aprobar_segunda' }),
        }),
      );
    });

    it('devolver a revisión exige escribir el motivo', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        usuarioId: 'u-postulante',
        estado: 'PENDIENTE_SEGUNDA_APROBACION',
        correccionesCount: 0,
        montoOtorgable: '12000',
        aprobaciones: [{ id: 'a1', nivel: 1, usuarioId: admin.id }],
        convocatoria: {
          id: 'c1',
          nombre: 'Beca de prueba',
          beca: { id: 'b1', nombre: 'Beca de prueba' },
          maxCorrecciones: 3,
        },
        perfilFinanciero: { ingresoFamiliar: 2500 },
      });

      await expect(
        service.transicion('s1', { accion: 'devolver_a_revision' }, jefeBecas),
      ).rejects.toThrow(/motivo/);
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
        service.marcarEstadoDocumento(
          's1',
          't-cert',
          'RECHAZADO',
          undefined,
          postulante,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza solicitud inexistente', async () => {
      prisma.solicitud.findUnique.mockResolvedValue(null);
      await expect(
        service.marcarEstadoDocumento(
          's1',
          't-cert',
          'RECHAZADO',
          undefined,
          admin,
        ),
      ).rejects.toThrow('no encontrada');
    });

    it('rechaza si no hay documento cargado para el tipo', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({ id: 's1', estado: 'EN_REVISION' });
      prisma.solicitudDocumento.findFirst.mockResolvedValue(null);
      await expect(
        service.marcarEstadoDocumento(
          's1',
          't-cert',
          'RECHAZADO',
          undefined,
          admin,
        ),
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
        undefined,
        coordinador,
      );

      expect(result.estado).toBe('RECHAZADO');
      expect(prisma.solicitudDocumento.update).toHaveBeenCalledWith({
        where: { id: 'd1' },
        data: { estado: 'RECHAZADO', comentarioRechazo: null },
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

    it('el checklist exige los campos requeridos del formulario dinámico', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        ...base,
        perfilAcademico: { generoId: 'g1', nivelAcademicoId: 'n1' },
        perfilFinanciero: { ingresoFamiliar: 2500 },
        documentos: [],
        respuestas: null,
        formularioSnapshot: [
          {
            id: 'tipoVivienda',
            seccion: 'adicional',
            etiqueta: 'Tipo de vivienda',
            tipo: 'seleccion',
            requerido: true,
          },
        ],
      });

      const result = await service.obtenerChecklist('s1', postulante);
      expect(result.camposExtra).toHaveLength(1);
      expect(result.pendientes).toEqual(
        expect.arrayContaining(['Campo "Tipo de vivienda" pendiente']),
      );
      expect(result.completo).toBe(false);
    });
  });

  describe('consultaPublica (US-46)', () => {
    it('devuelve el estado publico sin datos sensibles del postulante', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        estado: 'APROBADA',
        createdAt: new Date('2026-08-01'),
        updatedAt: new Date('2026-08-10'),
        convocatoria: {
          nombre: 'Beca de Excelencia',
          beca: { nombre: 'Excelencia Academica' },
        },
        historial: [
          {
            estado: 'BORRADOR',
            comentario: 'Solicitud creada',
            createdAt: new Date('2026-08-01'),
          },
          {
            estado: 'APROBADA',
            comentario: 'Decision del comite',
            createdAt: new Date('2026-08-10'),
          },
        ],
      });

      const result = await service.consultaPublica('s1');

      expect(result.codigo).toBe('s1');
      expect(result.estado).toBe('APROBADA');
      expect(result.beca).toBe('Excelencia Academica');
      expect(result.convocatoria).toBe('Beca de Excelencia');
      expect(result.historial).toHaveLength(2);
      expect(result).not.toHaveProperty('usuarioId');
      expect(result).not.toHaveProperty('documentos');
      expect(result).not.toHaveProperty('perfilAcademico');
    });

    it('lanza NotFoundException si el codigo no existe', async () => {
      prisma.solicitud.findUnique.mockResolvedValue(null);
      await expect(service.consultaPublica('no-existe')).rejects.toThrow(
        'No se encontr',
      );
    });
  });

  describe('guardarRespuestas (formulario dinámico)', () => {
    const snapshot = [
      {
        id: 'tipoVivienda',
        seccion: 'adicional',
        etiqueta: 'Tipo de vivienda',
        tipo: 'seleccion',
        requerido: true,
        opciones: ['Propia', 'Rentada'],
      },
      {
        id: 'ingresoMensual',
        seccion: 'socioeconomico',
        etiqueta: 'Ingreso mensual',
        tipo: 'numero',
        requerido: true,
      },
    ];

    it('guarda las respuestas de la seccion y convierte numeros', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        usuarioId: 'u-postulante',
        estado: 'BORRADOR',
        respuestas: null,
        formularioSnapshot: snapshot,
      });
      prisma.solicitud.update.mockResolvedValue({
        id: 's1',
        respuestas: { socioeconomico: { ingresoMensual: 2500 } },
      });

      const result = await service.guardarRespuestas(
        's1',
        { seccion: 'socioeconomico', valores: { ingresoMensual: '2500' } },
        postulante,
      );

      expect(prisma.solicitud.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 's1' },
          data: expect.objectContaining({
            respuestas: { socioeconomico: { ingresoMensual: 2500 } },
          }),
        }),
      );
      expect(result.respuestas).toEqual({
        socioeconomico: { ingresoMensual: 2500 },
      });
    });

    it('rechaza si falta un campo requerido de la seccion', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        usuarioId: 'u-postulante',
        estado: 'BORRADOR',
        respuestas: null,
        formularioSnapshot: snapshot,
      });

      await expect(
        service.guardarRespuestas(
          's1',
          { seccion: 'adicional', valores: {} },
          postulante,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza editar respuestas fuera de BORRADOR/CORRECCION', async () => {
      prisma.solicitud.findUnique.mockResolvedValue({
        id: 's1',
        usuarioId: 'u-postulante',
        estado: 'ENVIADA',
        respuestas: null,
        formularioSnapshot: snapshot,
      });

      await expect(
        service.guardarRespuestas(
          's1',
          { seccion: 'adicional', valores: { tipoVivienda: 'Propia' } },
          postulante,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('create — ventana de postulación por fechas', () => {
    const convocatoriaBase = {
      id: 'c1',
      estado: 'ABIERTA',
      formulario: null,
      fechaApertura: null as Date | null,
      fechaCierre: null as Date | null,
    };

    const dias = (n: number) => new Date(Date.now() + n * 86_400_000);

    beforeEach(() => {
      prisma.solicitud.create.mockResolvedValue({ id: 's1' });
      prisma.historialEstado.create.mockResolvedValue({ id: 'h1' });
    });

    it('rechaza la postulación cuando la fecha de cierre ya pasó', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue({
        ...convocatoriaBase,
        fechaCierre: dias(-1),
      });

      await expect(
        service.create('u-postulante', { convocatoriaId: 'c1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('explica con palabras simples que la convocatoria ya cerró', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue({
        ...convocatoriaBase,
        fechaCierre: dias(-1),
      });

      await expect(
        service.create('u-postulante', { convocatoriaId: 'c1' }),
      ).rejects.toThrow('ya cerr');
    });

    it('rechaza la postulación antes de la fecha de apertura', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue({
        ...convocatoriaBase,
        fechaApertura: dias(1),
      });

      await expect(
        service.create('u-postulante', { convocatoriaId: 'c1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('permite postular dentro de la ventana de fechas', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue({
        ...convocatoriaBase,
        fechaApertura: dias(-2),
        fechaCierre: dias(2),
      });

      await expect(
        service.create('u-postulante', { convocatoriaId: 'c1' }),
      ).resolves.toEqual({ id: 's1' });
    });

    it('permite postular si la convocatoria no define fechas', async () => {
      prisma.convocatoria.findUnique.mockResolvedValue({ ...convocatoriaBase });

      await expect(
        service.create('u-postulante', { convocatoriaId: 'c1' }),
      ).resolves.toEqual({ id: 's1' });
    });
  });

  describe('transicion — reglas del comité', () => {
    const admin: AuthenticatedUser = {
      id: 'u-admin',
      cui: '1234567890123',
      nombres: 'Admin Demo',
      email: 'admin@demo.gt',
      rol: { id: 'r-admin', nombre: 'ADMIN', descripcion: null },
    };

    const solicitudEnRevision = (correccionesCount: number) => ({
      id: 's1',
      usuarioId: 'u-postulante',
      estado: 'EN_REVISION',
      correccionesCount,
      convocatoria: { maxCorrecciones: 3, beca: { nombre: 'Beca X' } },
    });

    beforeEach(() => {
      prisma.solicitud.update.mockResolvedValue({
        id: 's1',
        estado: 'CORRECCION',
      });
      prisma.notificacion.create.mockResolvedValue({
        id: 'n1',
        usuarioId: 'u-postulante',
        tipo: 'CORRECCION_SOLICITADA',
        titulo: 'Se solicitó una corrección',
        cuerpo: null,
        createdAt: new Date(),
      });
    });

    it('no permite pedir más correcciones de las permitidas', async () => {
      prisma.solicitud.findUnique.mockResolvedValue(solicitudEnRevision(3));

      await expect(
        service.transicion('s1', { accion: 'solicitar_correccion' }, admin),
      ).rejects.toThrow(BadRequestException);
    });

    it('permite pedir corrección mientras queden subsanaciones', async () => {
      prisma.solicitud.findUnique.mockResolvedValue(solicitudEnRevision(1));

      await expect(
        service.transicion('s1', { accion: 'solicitar_correccion' }, admin),
      ).resolves.toMatchObject({ estado: 'CORRECCION' });
    });

    it('rechaza al postulante en una acción del comité', async () => {
      prisma.solicitud.findUnique.mockResolvedValue(solicitudEnRevision(0));

      await expect(
        service.transicion('s1', { accion: 'solicitar_correccion' }, postulante),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
