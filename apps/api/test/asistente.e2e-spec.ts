import { INestApplication } from '@nestjs/common';
import { api, crearApp } from './helpers/app';

/**
 * El asistente corre con AI_API_KEY vacío en pruebas, por lo que usa el
 * proveedor determinista "fallback-kb" (reglas + base de conocimiento).
 */
describe('Asistente (pruebas funcionales - proveedor fallback)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await crearApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde una pregunta sobre documentación (201 con respuesta y fuentes)', async () => {
    const res = await api(app)
      .post('/api/asistente/preguntar')
      .send({ pregunta: '¿Qué documentos necesito para postular a una beca?' });

    expect(res.status).toBe(201);
    expect(res.body.data.respuesta).toEqual(expect.any(String));
    expect(res.body.data.respuesta.length).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.fuentes)).toBe(true);
  });

  it('ofrece orientación genérica cuando no hay términos útiles', async () => {
    const res = await api(app)
      .post('/api/asistente/preguntar')
      .send({ pregunta: 'y o a' });

    expect(res.status).toBe(201);
    expect(res.body.data.respuesta).toContain('Hazme una pregunta');
    expect(res.body.data.fuentes).toEqual([]);
  });

  it('rechaza una pregunta vacía con 400', async () => {
    const res = await api(app)
      .post('/api/asistente/preguntar')
      .send({ pregunta: '' });
    expect(res.status).toBe(400);
  });

  it('rechaza una pregunta mayor a 500 caracteres con 400', async () => {
    const res = await api(app)
      .post('/api/asistente/preguntar')
      .send({ pregunta: 'a'.repeat(501) });
    expect(res.status).toBe(400);
  });
});
