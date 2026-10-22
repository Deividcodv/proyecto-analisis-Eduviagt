import { INestApplication } from '@nestjs/common';
import { api, crearApp } from './helpers/app';

describe('Catálogos (pruebas funcionales - endpoints públicos)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await crearApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    'generos',
    'niveles-academicos',
    'departamentos',
    'municipios',
    'documentos-tipo',
    'becas',
    'instituciones',
  ])('GET /api/catalogos/%s responde 200 con { data }', async (ruta) => {
    const res = await api(app).get(`/api/catalogos/${ruta}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('devuelve los géneros del seed (Masculino, Femenino, Prefiero no especificar)', async () => {
    const res = await api(app).get('/api/catalogos/generos');
    expect(res.status).toBe(200);
    const nombres = res.body.data.map((g: { nombre: string }) => g.nombre);
    expect(nombres).toEqual(
      expect.arrayContaining(['Masculino', 'Femenino']),
    );
  });

  it('municipios como dropdown en cascada por departamento', async () => {
    const deps = await api(app).get('/api/catalogos/departamentos');
    const guatemala = deps.body.data.find(
      (d: { nombre: string }) => d.nombre === 'Guatemala',
    );
    expect(guatemala).toBeDefined();

    const muni = await api(app)
      .get('/api/catalogos/municipios')
      .query({ departamentoId: guatemala.id });
    expect(muni.status).toBe(200);
    expect(Array.isArray(muni.body.data)).toBe(true);
    expect(muni.body.data.length).toBeGreaterThan(0);
  });

  it('expone el tipo de documento "Certificado académico" del seed', async () => {
    const res = await api(app).get('/api/catalogos/documentos-tipo');
    const certificado = res.body.data.find(
      (d: { nombre: string }) => d.nombre === 'Certificado académico',
    );
    expect(certificado).toBeDefined();
    expect(certificado.id).toMatch(/^[0-9a-f-]{36}$/i);
  });
});
