import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  api,
  auth,
  BECA_CON_CRITERIOS,
  crearApp,
  loginDemo,
} from './helpers/app';
import { nombreSimple } from './helpers/correlativos';

type Rol = 'admin' | 'postulante' | 'evaluador' | 'coordinador' | 'miembro' | 'jefe';

/**
 * Matriz de autorización por rol (caja negra).
 *
 * El API protege todo con tres guards globales (JWT, Roles y Permisos); cada
 * ruta declara @Public() o @Permisos('modulo:accion'). Esta suite comprueba
 * que la correspondencia rol→permisos del seed realmente se cumple de punta a
 * punta.
 */
describe('Autorización (matriz RBAC por rol)', () => {
  let app: INestApplication;
  let tokens: Record<Rol, string>;

  beforeAll(async () => {
    app = await crearApp();
    tokens = {
      admin: await loginDemo(app, 'admin'),
      postulante: await loginDemo(app, 'postulante'),
      evaluador: await loginDemo(app, 'evaluador'),
      coordinador: await loginDemo(app, 'coordinador'),
      miembro: await loginDemo(app, 'miembro'),
      jefe: await loginDemo(app, 'jefe'),
    };
  });

  afterAll(async () => {
    await app.close();
  });

  describe('rutas públicas', () => {
    it('lista convocatorias sin token', async () => {
      const res = await api(app).get('/api/convocatorias');
      expect(res.status).toBe(200);
    });

    it('lee catálogos sin token', async () => {
      const res = await api(app).get('/api/catalogos/generos');
      expect(res.status).toBe(200);
    });
  });

  describe('sin credenciales', () => {
    it('responde 401 en rutas protegidas', async () => {
      for (const ruta of [
        '/api/seguridad/roles',
        '/api/solicitudes',
        '/api/comites',
        '/api/audit',
      ]) {
        const res = await api(app).get(ruta);
        expect({ ruta, status: res.status }).toEqual({ ruta, status: 401 });
      }
    });

    it('responde 401 con un token inválido', async () => {
      const res = await api(app).get('/api/solicitudes').set(auth('no-es-un-token'));
      expect(res.status).toBe(401);
    });
  });

  describe('seguridad (permiso:editar) — solo ADMIN', () => {
    const noAdmin: Rol[] = ['postulante', 'evaluador', 'coordinador', 'miembro'];

    it.each(noAdmin)('rechaza a %s con 403', async (rol) => {
      const res = await api(app).get('/api/seguridad/roles').set(auth(tokens[rol]));
      expect(res.status).toBe(403);
    });

    it('permite a ADMIN', async () => {
      const res = await api(app).get('/api/seguridad/roles').set(auth(tokens.admin));
      expect(res.status).toBe(200);
    });
  });

  describe('auditoría (auditoria:ver) — solo ADMIN', () => {
    it.each(['postulante', 'evaluador', 'coordinador', 'miembro'] as Rol[])(
      'rechaza a %s con 403',
      async (rol) => {
        const res = await api(app).get('/api/audit').set(auth(tokens[rol]));
        expect(res.status).toBe(403);
      },
    );

    it('permite a ADMIN', async () => {
      const res = await api(app).get('/api/audit').set(auth(tokens.admin));
      expect(res.status).toBe(200);
    });
  });

  describe('crear convocatoria (convocatoria:crear) — solo ADMIN', () => {
    it('rechaza a POSTULANTE con 403', async () => {
      const res = await api(app)
        .post('/api/convocatorias')
        .set(auth(tokens.postulante))
        .send({ nombre: nombreSimple('Sin permiso'), becaId: BECA_CON_CRITERIOS });

      expect(res.status).toBe(403);
    });

    it('permite a ADMIN y la deja en BORRADOR', async () => {
      const res = await api(app)
        .post('/api/convocatorias')
        .set(auth(tokens.admin))
        .send({ nombre: nombreSimple('RBAC'), becaId: BECA_CON_CRITERIOS });

      expect(res.status).toBe(201);
      expect(res.body.data.estado).toBe('BORRADOR');
    });
  });

  describe('evaluaciones (evaluacion:ver) — EVALUADOR sí, POSTULANTE no', () => {
    it('rechaza a POSTULANTE con 403', async () => {
      const res = await api(app)
        .get('/api/evaluaciones/mias')
        .set(auth(tokens.postulante));
      expect(res.status).toBe(403);
    });

    it('permite a EVALUADOR', async () => {
      const res = await api(app)
        .get('/api/evaluaciones/mias')
        .set(auth(tokens.evaluador));
      expect(res.status).toBe(200);
    });
  });

  describe('comités (comite:ver / comite:crear)', () => {
    it('rechaza a POSTULANTE ver comités con 403', async () => {
      const res = await api(app).get('/api/comites').set(auth(tokens.postulante));
      expect(res.status).toBe(403);
    });

    it('permite a COORDINADOR ver comités', async () => {
      const res = await api(app).get('/api/comites').set(auth(tokens.coordinador));
      expect(res.status).toBe(200);
    });

    it('permite a MIEMBRO ver comités', async () => {
      const res = await api(app).get('/api/comites').set(auth(tokens.miembro));
      expect(res.status).toBe(200);
    });

    it('rechaza a MIEMBRO crear un comité con 403', async () => {
      const res = await api(app)
        .post('/api/comites')
        .set(auth(tokens.miembro))
        .send({ nombre: nombreSimple('No puede') });
      expect(res.status).toBe(403);
    });

    it('rechaza a EVALUADOR crear un comité con 403', async () => {
      const res = await api(app)
        .post('/api/comites')
        .set(auth(tokens.evaluador))
        .send({ nombre: nombreSimple('No puede') });
      expect(res.status).toBe(403);
    });
  });

  describe('directorio de personal (/seguridad/personal) — por ROL', () => {
    // El directorio se autoriza por rol y no por el permiso `personal:ver`:
    // un permiso depende de que la base se haya sembrado con el seed vigente
    // (si no, la ruta responde 403 y el panel de solicitudes se vacía).
    it.each(['postulante', 'evaluador', 'miembro'] as Rol[])(
      'rechaza a %s con 403',
      async (rol) => {
        const res = await api(app).get('/api/seguridad/personal').set(auth(tokens[rol]));
        expect(res.status).toBe(403);
      },
    );

    it.each(['admin', 'jefe', 'coordinador'] as Rol[])('permite a %s', async (rol) => {
      const res = await api(app).get('/api/seguridad/personal').set(auth(tokens[rol]));
      expect(res.status).toBe(200);
    });

    it('filtra por rol', async () => {
      const res = await api(app)
        .get('/api/seguridad/personal?rol=EVALUADOR')
        .set(auth(tokens.admin));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(
        res.body.data.every(
          (u: { rol?: { nombre?: string } }) => u.rol?.nombre === 'EVALUADOR',
        ),
      ).toBe(true);
    });
  });

  describe('postulante (solicitud:crear) — solo POSTULANTE y ADMIN', () => {
    it('rechaza a EVALUADOR con 403', async () => {
      const res = await api(app)
        .post('/api/solicitudes')
        .set(auth(tokens.evaluador))
        .send({ convocatoriaId: '00000000-0000-4000-8000-000000000001' });
      expect(res.status).toBe(403);
    });
  });

  describe('matriz del flujo de revisión (iniciar revisión / aprobar)', () => {
    const prisma = new PrismaClient();
    let evaluadaId: string;
    let enviadaId: string;

    beforeAll(async () => {
      const postulante = await prisma.usuario.findUnique({
        where: { email: 'postulante@demo.gt' },
      });
      const convocatoria = await prisma.convocatoria.findFirst({
        where: { estado: 'ABIERTA' },
      });

      const enviada = await prisma.solicitud.create({
        data: {
          convocatoriaId: convocatoria!.id,
          usuarioId: postulante!.id,
          estado: 'ENVIADA',
        },
      });
      enviadaId = enviada.id;

      const evaluada = await prisma.solicitud.create({
        data: {
          convocatoriaId: convocatoria!.id,
          usuarioId: postulante!.id,
          estado: 'EVALUADA',
          montoOtorgable: 5000,
        },
      });
      evaluadaId = evaluada.id;
    });

    afterAll(async () => {
      const ids = { in: [enviadaId, evaluadaId] };
      // La solicitud de prueba autoasigna un evaluador al iniciar la
      // revisión: se borran las filas dependientes antes que la solicitud.
      await prisma.evaluacion.deleteMany({ where: { solicitudId: ids } });
      await prisma.solicitudAprobacion.deleteMany({ where: { solicitudId: ids } });
      await prisma.historialEstado.deleteMany({ where: { solicitudId: ids } });
      await prisma.solicitud.deleteMany({ where: { id: ids } });
      await prisma.$disconnect();
    });

    it('el miembro del comité puede iniciar la revisión', async () => {
      const res = await api(app)
        .post(`/api/solicitudes/${enviadaId}/transicion`)
        .set(auth(tokens.miembro))
        .send({ accion: 'iniciar_revision' });
      expect(res.status).toBe(201);
      expect(res.body.data.estado).toBe('EN_REVISION');
    });

    it('el miembro del comité NO puede aprobar (solo vota en sesión)', async () => {
      const res = await api(app)
        .post(`/api/solicitudes/${evaluadaId}/transicion`)
        .set(auth(tokens.miembro))
        .send({ accion: 'aprobar' });
      expect(res.status).toBe(403);
    });

    it('el coordinador del comité puede aprobar', async () => {
      const res = await api(app)
        .post(`/api/solicitudes/${evaluadaId}/transicion`)
        .set(auth(tokens.coordinador))
        .send({ accion: 'aprobar' });
      expect(res.status).toBe(201);
      expect(res.body.data.estado).toBe('APROBADA');
    });

    it('el evaluador no puede aprobar', async () => {
      const res = await api(app)
        .post(`/api/solicitudes/${evaluadaId}/transicion`)
        .set(auth(tokens.evaluador))
        .send({ accion: 'aprobar' });
      expect(res.status).toBe(403);
    });

    it('el miembro del comité puede asignar evaluadores', async () => {
      const evaluadorDemo = await prisma.usuario.findUnique({
        where: { email: 'evaluador@demo.gt' },
      });
      const res = await api(app)
        .post(`/api/solicitudes/${enviadaId}/evaluadores`)
        .set(auth(tokens.miembro))
        .send({ evaluadorIds: [evaluadorDemo!.id] });
      expect(res.status).toBe(201);
    });
  });
});
