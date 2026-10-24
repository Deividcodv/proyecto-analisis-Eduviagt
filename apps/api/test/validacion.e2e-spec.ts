import { INestApplication } from '@nestjs/common';
import { api, auth, BECA_CON_CRITERIOS, crearApp, loginDemo } from './helpers/app';
import { nombreSimple } from './helpers/correlativos';

/**
 * Validación de entrada (caja negra).
 *
 * El bootstrap real usa ValidationPipe con whitelist + forbidNonWhitelisted,
 * así que un campo de más o un tipo equivocado deben salir como 400 y nunca
 * como 500 (que es lo que sí rompería al usuario).
 */
describe('Validación de entrada y bordes', () => {
  let app: INestApplication;
  let admin: string;

  beforeAll(async () => {
    app = await crearApp();
    admin = await loginDemo(app, 'admin');
  });

  afterAll(async () => {
    await app.close();
  });

  const crearConvocatoria = (body: Record<string, unknown>) =>
    api(app).post('/api/convocatorias').set(auth(admin)).send(body);

  describe('POST /api/convocatorias', () => {
    it('rechaza sin becaId con 400', async () => {
      const res = await crearConvocatoria({ nombre: nombreSimple('Beca') });
      expect(res.status).toBe(400);
    });

    it('rechaza un becaId que no es UUID con 400 (no 500)', async () => {
      const res = await crearConvocatoria({
        nombre: nombreSimple('Beca'),
        becaId: 'no-es-uuid',
      });
      expect(res.status).toBe(400);
    });

    it('rechaza un campo no declarado con 400', async () => {
      const res = await crearConvocatoria({
        nombre: nombreSimple('Beca'),
        becaId: BECA_CON_CRITERIOS,
        campoInventado: 'x',
      });
      expect(res.status).toBe(400);
    });

    it('rechaza un nombre demasiado corto con 400', async () => {
      const res = await crearConvocatoria({ nombre: 'ab', becaId: BECA_CON_CRITERIOS });
      expect(res.status).toBe(400);
    });

    it('rechaza evaluadoresMinimos fuera de rango con 400', async () => {
      const bajo = await crearConvocatoria({
        nombre: nombreSimple('Beca'),
        becaId: BECA_CON_CRITERIOS,
        evaluadoresMinimos: 0,
      });
      expect(bajo.status).toBe(400);

      const alto = await crearConvocatoria({
        nombre: nombreSimple('Beca'),
        becaId: BECA_CON_CRITERIOS,
        evaluadoresMinimos: 99,
      });
      expect(alto.status).toBe(400);
    });

    it('rechaza un cierre anterior a la apertura con 400', async () => {
      const res = await crearConvocatoria({
        nombre: nombreSimple('Beca'),
        becaId: BECA_CON_CRITERIOS,
        fechaApertura: '2026-09-01T00:00:00.000Z',
        fechaCierre: '2026-08-01T00:00:00.000Z',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cierre');
    });

    it('acepta una fecha que no es ISO con 400', async () => {
      const res = await crearConvocatoria({
        nombre: nombreSimple('Beca'),
        becaId: BECA_CON_CRITERIOS,
        fechaCierre: '31/12/2026',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/convocatorias/:id', () => {
    it('rechaza un id que no es UUID con 400 (no 500)', async () => {
      const res = await api(app).get('/api/convocatorias/no-es-uuid');
      expect(res.status).toBe(400);
    });

    it('devuelve 404 para un UUID inexistente', async () => {
      const res = await api(app).get(
        '/api/convocatorias/11111111-1111-4111-8111-111111111111',
      );
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/solicitudes', () => {
    it('rechaza un convocatoriaId que no es UUID con 400 (no 500)', async () => {
      const postulante = await loginDemo(app, 'postulante');
      const res = await api(app)
        .post('/api/solicitudes')
        .set(auth(postulante))
        .send({ convocatoriaId: 'abc' });
      expect(res.status).toBe(400);
    });

    it('rechaza un campo no declarado con 400', async () => {
      const postulante = await loginDemo(app, 'postulante');
      const res = await api(app)
        .post('/api/solicitudes')
        .set(auth(postulante))
        .send({
          convocatoriaId: '11111111-1111-4111-8111-111111111111',
          extra: true,
        });
      expect(res.status).toBe(400);
    });
  });
});
