import { INestApplication } from '@nestjs/common';
import { api, auth, crearApp, login } from './helpers/app';
import { cuiSimple, emailSimple, nombreSimple } from './helpers/correlativos';

describe('Autenticación (pruebas funcionales)', () => {
  let app: INestApplication;

  const nuevo = {
    cui: cuiSimple(),
    email: emailSimple('nuevo'),
    nombres: nombreSimple('Postulante'),
    password: 'Password123!',
  };

  beforeAll(async () => {
    app = await crearApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra un postulante y devuelve sus datos sin el hash', async () => {
    const res = await api(app).post('/api/auth/registro').send(nuevo);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      cui: nuevo.cui,
      email: nuevo.email,
      rol: { nombre: 'POSTULANTE' },
    });
    expect(res.body.data.passwordHash).toBeUndefined();
    expect(res.body.data.id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('rechaza CUI duplicado con 409', async () => {
    const res = await api(app).post('/api/auth/registro').send({
      ...nuevo,
      email: emailSimple('otro'),
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toContain('CUI');
  });

  it('rechaza correo duplicado con 409', async () => {
    const res = await api(app).post('/api/auth/registro').send({
      ...nuevo,
      cui: cuiSimple(),
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toContain('correo');
  });

  it('rechaza un CUI que no tiene 13 dígitos con 400', async () => {
    const res = await api(app).post('/api/auth/registro').send({
      ...nuevo,
      cui: '123',
      email: emailSimple('corto'),
    });
    expect(res.status).toBe(400);
  });

  it('inicia sesión y devuelve accessToken + refreshToken + usuario', async () => {
    const res = await api(app)
      .post('/api/auth/login')
      .send({ email: nuevo.email, password: nuevo.password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.refreshToken).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({
      email: nuevo.email,
      rol: { nombre: 'POSTULANTE' },
    });
  });

  it('rechaza credenciales inválidas con 401', async () => {
    const res = await api(app)
      .post('/api/auth/login')
      .send({ email: nuevo.email, password: 'incorrecta' });
    expect(res.status).toBe(401);
  });

  it('devuelve el perfil con token y 401 sin token', async () => {
    const token = await login(app, nuevo.email, nuevo.password);

    const conToken = await api(app).get('/api/auth/perfil').set(auth(token));
    expect(conToken.status).toBe(200);
    expect(conToken.body.data.email).toBe(nuevo.email);

    const sinToken = await api(app).get('/api/auth/perfil');
    expect(sinToken.status).toBe(401);
  });

  it('renueva el token con refreshToken válido y rechaza uno inválido', async () => {
    const loginRes = await api(app)
      .post('/api/auth/login')
      .send({ email: nuevo.email, password: nuevo.password });
    const refreshToken = loginRes.body.data.refreshToken;

    const ok = await api(app).post('/api/auth/refresh').send({ refreshToken });
    expect(ok.status).toBe(200);
    expect(ok.body.data.accessToken).toEqual(expect.any(String));

    const malo = await api(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'no-es-un-token' });
    expect(malo.status).toBe(401);
  });
});
