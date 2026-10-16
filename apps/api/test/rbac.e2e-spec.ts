import { INestApplication } from '@nestjs/common';
import {
  api,
  auth,
  BECA_CON_CRITERIOS,
  crearApp,
  loginDemo,
} from './helpers/app';
import { nombreSimple } from './helpers/correlativos';

type Rol = 'admin' | 'postulante' | 'evaluador' | 'coordinador' | 'miembro';

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

  describe('postulante (solicitud:crear) — solo POSTULANTE y ADMIN', () => {
    it('rechaza a EVALUADOR con 403', async () => {
      const res = await api(app)
        .post('/api/solicitudes')
        .set(auth(tokens.evaluador))
        .send({ convocatoriaId: '00000000-0000-4000-8000-000000000001' });
      expect(res.status).toBe(403);
    });
  });
});
