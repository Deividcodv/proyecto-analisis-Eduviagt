import { INestApplication } from '@nestjs/common';
import {
  api,
  auth,
  BECA_CON_CRITERIOS,
  crearApp,
  loginDemo,
} from './helpers/app';
import { nombreSimple } from './helpers/correlativos';

/**
 * Prueba funcional end-to-end del ciclo completo de una beca, ejercitando la
 * API real (con Postgres de pruebas) desde el punto de vista del usuario.
 *
 * Los identificadores de los recursos creados aquí los genera la base de datos
 * (UUID automáticos); las credenciales usan los correlativos simples del seed.
 */
describe('Flujo completo de beca (pruebas funcionales E2E)', () => {
  let app: INestApplication;

  const tokens: Record<string, string> = {};
  const ids: Record<string, string> = {};

  const estado: Record<string, string> = {};

  beforeAll(async () => {
    app = await crearApp();
    tokens.admin = await loginDemo(app, 'admin');
    tokens.postulante = await loginDemo(app, 'postulante');
    tokens.evaluador = await loginDemo(app, 'evaluador');
    tokens.coordinador = await loginDemo(app, 'coordinador');
    tokens.miembro = await loginDemo(app, 'miembro');

    for (const clave of ['evaluador', 'miembro', 'admin']) {
      const perfil = await api(app)
        .get('/api/auth/perfil')
        .set(auth(tokens[clave]));
      ids[`${clave}Id`] = perfil.body.data.id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('admin crea una convocatoria en BORRADOR', async () => {
    const res = await api(app)
      .post('/api/convocatorias')
      .set(auth(tokens.admin))
      .send({
        nombre: nombreSimple('Beca E2E'),
        becaId: BECA_CON_CRITERIOS,
        evaluadoresMinimos: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe('BORRADOR');
    estado.convocatoriaId = res.body.data.id;
  });

  it('configura los documentos requeridos de la convocatoria (en BORRADOR)', async () => {
    const tipos = await api(app).get('/api/catalogos/documentos-tipo');
    const certificado = tipos.body.data.find(
      (d: { nombre: string }) => d.nombre === 'Certificado académico',
    );
    estado.documentoTipoId = certificado.id;

    const res = await api(app)
      .patch(`/api/convocatorias/${estado.convocatoriaId}/documentos`)
      .set(auth(tokens.admin))
      .send({
        items: [{ documentoTipoId: certificado.id, obligatorio: true }],
      });

    expect(res.status).toBe(200);
  });

  it('publica la convocatoria (BORRADOR -> ABIERTA)', async () => {
    const res = await api(app)
      .post(`/api/convocatorias/${estado.convocatoriaId}/transicion`)
      .set(auth(tokens.admin))
      .send({ accion: 'publicar' });

    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe('ABIERTA');
  });

  it('rechaza transición inválida de convocatoria con 400', async () => {
    const res = await api(app)
      .post(`/api/convocatorias/${estado.convocatoriaId}/transicion`)
      .set(auth(tokens.admin))
      .send({ accion: 'resolver' });

    expect(res.status).toBe(400);
  });

  it('postulante crea su solicitud en BORRADOR', async () => {
    const res = await api(app)
      .post('/api/solicitudes')
      .set(auth(tokens.postulante))
      .send({ convocatoriaId: estado.convocatoriaId });

    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe('BORRADOR');
    estado.solicitudId = res.body.data.id;
  });

  it('bloquea el envío cuando falta información (400)', async () => {
    const res = await api(app)
      .post(`/api/solicitudes/${estado.solicitudId}/transicion`)
      .set(auth(tokens.postulante))
      .send({ accion: 'enviar' });

    expect(res.status).toBe(400);
    expect(String(res.body.message)).toMatch(/completa/i);
  });

  it('guarda el perfil académico usando la opción "otro"', async () => {
    const res = await api(app)
      .put(`/api/solicitudes/${estado.solicitudId}/perfil-academico`)
      .set(auth(tokens.postulante))
      .send({
        generoOtro: 'Otro E2E',
        nivelAcademicoOtro: 'Técnico',
        institucion: 'USAC',
        carrera: 'Ingeniería',
        promedio: 88,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.generoOtro).toBe('Otro E2E');
    expect(res.body.data.generoId).toBeNull();
  });

  it('rechaza género de catálogo inexistente (400)', async () => {
    const res = await api(app)
      .put(`/api/solicitudes/${estado.solicitudId}/perfil-academico`)
      .set(auth(tokens.postulante))
      .send({ generoId: '00000000-0000-4000-8000-999999999999' });

    expect(res.status).toBe(400);
  });

  it('guarda el perfil financiero', async () => {
    const res = await api(app)
      .put(`/api/solicitudes/${estado.solicitudId}/perfil-financiero`)
      .set(auth(tokens.postulante))
      .send({ ingresoFamiliar: 2000, numeroDependientes: 2 });

    expect(res.status).toBe(200);
  });

  it('sube el documento obligatorio (PDF)', async () => {
    const res = await api(app)
      .post(
        `/api/solicitudes/${estado.solicitudId}/documentos/${estado.documentoTipoId}`,
      )
      .set(auth(tokens.postulante))
      .attach('file', Buffer.from('%PDF-1.4 SIGEB E2E'), {
        filename: 'certificado.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe('CARGADO');
    expect(res.body.data.version).toBe(1);
  });

  it('rechaza un archivo con formato no permitido (400)', async () => {
    const res = await api(app)
      .post(
        `/api/solicitudes/${estado.solicitudId}/documentos/${estado.documentoTipoId}`,
      )
      .set(auth(tokens.postulante))
      .attach('file', Buffer.from('no permitido'), {
        filename: 'malware.exe',
        contentType: 'application/x-msdownload',
      });

    expect(res.status).toBe(400);
  });

  it('el checklist queda completo', async () => {
    const res = await api(app)
      .get(`/api/solicitudes/${estado.solicitudId}/checklist`)
      .set(auth(tokens.postulante));

    expect(res.status).toBe(200);
    expect(res.body.data.completo).toBe(true);
    expect(res.body.data.perfilAcademico).toBe(true);
    expect(res.body.data.perfilFinanciero).toBe(true);
  });

  it('envía la solicitud (BORRADOR -> ENVIADA)', async () => {
    const res = await api(app)
      .post(`/api/solicitudes/${estado.solicitudId}/transicion`)
      .set(auth(tokens.postulante))
      .send({ accion: 'enviar', comentario: 'lista' });

    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe('ENVIADA');
  });

  it('admin inicia la revisión (ENVIADA -> EN_REVISION)', async () => {
    const res = await api(app)
      .post(`/api/solicitudes/${estado.solicitudId}/transicion`)
      .set(auth(tokens.admin))
      .send({ accion: 'iniciar_revision' });

    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe('EN_REVISION');
  });

  it('admin asigna un evaluador a la solicitud', async () => {
    const res = await api(app)
      .post(`/api/solicitudes/${estado.solicitudId}/evaluadores`)
      .set(auth(tokens.admin))
      .send({ evaluadorIds: [ids.evaluadorId] });

    expect([200, 201]).toContain(res.status);
  });

  it('el evaluador ve la solicitud asignada con sus criterios', async () => {
    const res = await api(app)
      .get('/api/evaluaciones/mias')
      .set(auth(tokens.evaluador));

    expect(res.status).toBe(200);
    const grupo = res.body.data.find(
      (g: { solicitudId: string }) => g.solicitudId === estado.solicitudId,
    );
    expect(grupo).toBeDefined();
    expect(grupo.criterios.length).toBeGreaterThan(0);
    estado.criterioId = grupo.criterios[0].id;
  });

  it('el evaluador confirma imparcialidad', async () => {
    const res = await api(app)
      .patch(`/api/solicitudes/${estado.solicitudId}/imparcialidad`)
      .set(auth(tokens.evaluador))
      .send({ confirma: true });

    expect(res.status).toBe(200);
  });

  it('el evaluador registra el puntaje de todos los criterios', async () => {
    const mias = await api(app)
      .get('/api/evaluaciones/mias')
      .set(auth(tokens.evaluador));

    const grupo = mias.body.data.find(
      (g: { solicitudId: string }) => g.solicitudId === estado.solicitudId,
    );

    expect(grupo).toBeDefined();
    expect(grupo.criterios.length).toBeGreaterThan(0);

    for (const criterio of grupo.criterios) {
      const res = await api(app)
        .put(
          `/api/solicitudes/${estado.solicitudId}/criterios/${criterio.id}`,
        )
        .set(auth(tokens.evaluador))
        .send({ puntaje: 80 });

      expect(res.status).toBe(200);
    }
  });

  it('calcula el score ponderado de la solicitud', async () => {
    const res = await api(app)
      .get(`/api/solicitudes/${estado.solicitudId}/score`)
      .set(auth(tokens.admin));

    expect(res.status).toBe(200);
    expect(typeof res.body.data.score).toBe('number');
  });

  it('admin marca la solicitud como EVALUADA', async () => {
    const res = await api(app)
      .post(`/api/solicitudes/${estado.solicitudId}/transicion`)
      .set(auth(tokens.admin))
      .send({ accion: 'evaluar' });

    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe('EVALUADA');
  });

  it('lleva la convocatoria a EN_EVALUACION', async () => {
    await api(app)
      .post(`/api/convocatorias/${estado.convocatoriaId}/transicion`)
      .set(auth(tokens.admin))
      .send({ accion: 'cerrar' });

    const res = await api(app)
      .post(`/api/convocatorias/${estado.convocatoriaId}/transicion`)
      .set(auth(tokens.admin))
      .send({ accion: 'iniciar_evaluacion' });

    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe('EN_EVALUACION');
  });

  it('coordinador crea el comité y agrega miembros', async () => {
    const comite = await api(app)
      .post('/api/comites')
      .set(auth(tokens.coordinador))
      .send({ nombre: nombreSimple('Comité E2E') });
    expect(comite.status).toBe(201);
    estado.comiteId = comite.body.data.id;

    const vocal = await api(app)
      .post(`/api/comites/${estado.comiteId}/miembros`)
      .set(auth(tokens.coordinador))
      .send({ usuarioId: ids.miembroId, rol: 'VOCAL' });
    expect(vocal.status).toBe(201);

    const presidente = await api(app)
      .post(`/api/comites/${estado.comiteId}/miembros`)
      .set(auth(tokens.coordinador))
      .send({ usuarioId: ids.adminId, rol: 'PRESIDENTE' });
    expect(presidente.status).toBe(201);
  });

  it('coordinador crea la sesión con la solicitud EVALUADA', async () => {
    const res = await api(app)
      .post('/api/sesiones')
      .set(auth(tokens.coordinador))
      .send({
        comiteId: estado.comiteId,
        fecha: new Date().toISOString(),
        quorumMinimo: 2,
        solicitudesIds: [estado.solicitudId],
      });

    expect(res.status).toBe(201);
    estado.sesionId = res.body.data.id;
  });

  it('no permite finalizar sin quórum (400)', async () => {
    const res = await api(app)
      .post(`/api/sesiones/${estado.sesionId}/finalizar`)
      .set(auth(tokens.coordinador))
      .send({});

    expect(res.status).toBe(400);
  });

  it('registra los votos de los miembros', async () => {
    const v1 = await api(app)
      .post(`/api/sesiones/${estado.sesionId}/votos`)
      .set(auth(tokens.miembro))
      .send({ solicitudId: estado.solicitudId, voto: 'APROBAR' });
    expect(v1.status).toBe(201);

    const v2 = await api(app)
      .post(`/api/sesiones/${estado.sesionId}/votos`)
      .set(auth(tokens.admin))
      .send({ solicitudId: estado.solicitudId, voto: 'ABSTENCION' });
    expect(v2.status).toBe(201);
  });

  it('finaliza la sesión y genera la decisión APROBADA', async () => {
    const res = await api(app)
      .post(`/api/sesiones/${estado.sesionId}/finalizar`)
      .set(auth(tokens.coordinador))
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe('FINALIZADA');

    const detalle = await api(app)
      .get(`/api/sesiones/${estado.sesionId}`)
      .set(auth(tokens.coordinador));
    expect(detalle.body.data.decisiones[0].resultado).toBe('APROBADA');
  });

  it('la solicitud queda APROBADA y la convocatoria RESUELTA', async () => {
    const sol = await api(app)
      .get(`/api/solicitudes/${estado.solicitudId}`)
      .set(auth(tokens.admin));
    expect(sol.body.data.estado).toBe('APROBADA');

    const conv = await api(app).get(
      `/api/convocatorias/${estado.convocatoriaId}`,
    );
    expect(conv.body.data.estado).toBe('RESUELTA');
  });

  it('genera la constancia PDF y controla el acceso', async () => {
    const parseBin = (
      res: NodeJS.ReadableStream,
      cb: (error: Error | null, body?: Buffer) => void,
    ) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    };

    const admin = await api(app)
      .get(`/api/solicitudes/${estado.solicitudId}/constancia`)
      .set(auth(tokens.admin))
      .buffer(true)
      .parse(parseBin as never);
    expect(admin.status).toBe(200);
    expect(String(admin.headers['content-type'])).toContain('application/pdf');
    expect(String(admin.headers['content-disposition'])).toContain('attachment');
    expect((admin.body as Buffer).subarray(0, 4).toString()).toBe('%PDF');

    const dueno = await api(app)
      .get(`/api/solicitudes/${estado.solicitudId}/constancia`)
      .set(auth(tokens.postulante));
    expect(dueno.status).toBe(200);

    const ajeno = await api(app)
      .get(`/api/solicitudes/${estado.solicitudId}/constancia`)
      .set(auth(tokens.evaluador));
    expect(ajeno.status).toBe(403);
  });

  it('expone la consulta pública del estado sin datos sensibles', async () => {
    const res = await api(app).get(
      `/api/solicitudes/consulta/${estado.solicitudId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.codigo).toBe(estado.solicitudId);
    expect(res.body.data.estado).toBe('APROBADA');
    expect(res.body.data).not.toHaveProperty('usuarioId');
    expect(res.body.data).not.toHaveProperty('documentos');
  });

  it('reportes: admin obtiene los reportes y exporta CSV', async () => {
    for (const ruta of [
      'solicitudes-por-estado',
      'convocatorias',
      'evaluaciones',
      'general',
      'tendencia',
      'embudo',
      'detalle',
    ]) {
      const res = await api(app)
        .get(`/api/reportes/${ruta}`)
        .set(auth(tokens.admin));
      expect(res.status).toBe(200);
    }

    const csv = await api(app)
      .get('/api/reportes/convocatorias/csv')
      .set(auth(tokens.admin));
    expect(csv.status).toBe(200);
    expect(String(csv.headers['content-type'])).toContain('text/csv');
    expect(String(csv.headers['content-disposition'])).toContain('attachment');
  });

  it('reportes: tipo CSV inválido responde 400', async () => {
    const res = await api(app)
      .get('/api/reportes/xyz/csv')
      .set(auth(tokens.admin));
    expect(res.status).toBe(400);
  });

  it('reportes y auditoría exigen permisos (403/401)', async () => {
    const reportePostulante = await api(app)
      .get('/api/reportes/solicitudes-por-estado')
      .set(auth(tokens.postulante));
    expect(reportePostulante.status).toBe(403);

    const auditPostulante = await api(app)
      .get('/api/audit')
      .set(auth(tokens.postulante));
    expect(auditPostulante.status).toBe(403);

    const auditAnonimo = await api(app).get('/api/audit');
    expect(auditAnonimo.status).toBe(401);
  });

  it('la auditoría registra los inicios de sesión y transiciones', async () => {
    const res = await api(app).get('/api/audit').set(auth(tokens.admin));
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThan(0);

    const logins = await api(app)
      .get('/api/audit')
      .query({ accion: 'login' })
      .set(auth(tokens.admin));
    expect(logins.body.data.items.length).toBeGreaterThanOrEqual(5);

    const transiciones = await api(app)
      .get('/api/audit')
      .query({ limit: 200 })
      .set(auth(tokens.admin));
    const acciones = transiciones.body.data.items.map(
      (i: { accion: string }) => i.accion,
    );
    expect(acciones).toContain('transicion');
  });
});
