import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Postularse a una convocatoria:
 * - si no hay postulación, se inicia una;
 * - si hay un borrador, se continúa sin avisar;
 * - si ya se envió, se avisa en una ventana (solo se admite una
 *   postulación por convocatoria).
 */
const API = `http://localhost:${process.env.E2E_API_PORT ?? '3000'}/api`;
const CLAVE = 'Admin123!';

async function login(request: APIRequestContext, email: string): Promise<string> {
  const res = await request.post(`${API}/auth/login`, {
    data: { email, password: CLAVE },
  });
  expect(res.ok(), `login de ${email}`).toBeTruthy();
  return ((await res.json()).data as { accessToken: string }).accessToken;
}

async function api(
  request: APIRequestContext,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  token: string,
  data?: unknown,
) {
  return request[method](`${API}${path}`, {
    headers: { authorization: `Bearer ${token}` },
    ...(data !== undefined ? { data } : {}),
  });
}

async function entrar(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('postulante@demo.gt');
  await page.getByLabel('Contraseña').fill(CLAVE);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

/** Convocatoria abierta donde este postulante todavía no postuló. */
async function convocatoriaLibre(
  request: APIRequestContext,
  token: string,
): Promise<string> {
  const convo = (
    (await (await request.get(`${API}/convocatorias`)).json())
  ).data as Array<{
    id: string;
    fechaApertura?: string | null;
    fechaCierre?: string | null;
  }>;
  const mias = (
    (await (await request.get(`${API}/solicitudes`, { headers: { authorization: `Bearer ${token}` } })).json())
  ).data as Array<{ convocatoriaId: string }>;

  // Solo las que están abiertas por fecha (el botón cambia si no).
  const ahora = Date.now();
  const libre = convo.find((c) => {
    if (mias.some((s) => s.convocatoriaId === c.id)) return false;
    const apertura = c.fechaApertura ? new Date(c.fechaApertura).getTime() : 0;
    const cierre = c.fechaCierre ? new Date(c.fechaCierre).getTime() : Infinity;
    return apertura <= ahora && ahora <= cierre;
  });
  expect(libre, 'debe haber una convocatoria libre').toBeTruthy();
  return libre!.id;
}

/** Crea un borrador de postulación. */
async function crearBorrador(
  request: APIRequestContext,
  token: string,
  convocatoriaId: string,
): Promise<string> {
  const res = await api(request, 'post', '/solicitudes', token, { convocatoriaId });
  expect(res.ok(), `crear borrador: ${await res.text()}`).toBeTruthy();
  return ((await res.json()).data as { id: string }).id;
}

/** Completa el expediente (perfiles, documentos y formulario) y envía. */
async function enviarSolicitud(
  request: APIRequestContext,
  token: string,
  solicitudId: string,
  convocatoriaId: string,
) {
  const niveles = (
    (await (await request.get(`${API}/catalogos/niveles-academicos`)).json())
  ).data as Array<{ id: string; nombre: string }>;
  const generos = (
    (await (await request.get(`${API}/catalogos/generos`)).json())
  ).data as Array<{ id: string }>;

  await api(request, 'put', `/solicitudes/${solicitudId}/perfil-academico`, token, {
    generoId: generos[0].id,
    nivelAcademicoId: niveles.find((n) => n.nombre === 'Universitario')!.id,
    institucion: 'Universidad de San Carlos',
    carrera: 'Ingeniería en Sistemas',
    promedio: 88,
  });
  await api(request, 'put', `/solicitudes/${solicitudId}/perfil-financiero`, token, {
    ingresoFamiliar: 2000,
    numeroDependientes: 1,
  });

  // Documentos requeridos: se sube un PDF de prueba por cada uno.
  const detalle = (
    (await (await request.get(`${API}/convocatorias/${convocatoriaId}`)).json())
  ).data as {
    documentosRequeridos: Array<{ documentoTipoId: string; obligatorio: boolean }>;
    formulario: Array<{ id: string; seccion: string; tipo: string; requerido: boolean }>;
  };
  for (const doc of detalle.documentosRequeridos.filter((d) => d.obligatorio)) {
    await request.post(`${API}/solicitudes/${solicitudId}/documentos/${doc.documentoTipoId}`, {
      headers: { authorization: `Bearer ${token}` },
      multipart: {
        file: {
          name: 'certificado.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4 prueba'),
        },
      },
    });
  }

  // Campos del formulario dinámico.
  const secciones: Record<string, Record<string, unknown>> = {};
  for (const campo of (detalle.formulario ?? []).filter((c) => c.requerido)) {
    const valor =
      campo.tipo === 'numero' ? 80 : campo.tipo === 'booleano' ? true : 'Contenido de prueba';
    (secciones[campo.seccion] ||= {})[campo.id] = valor;
  }
  for (const [seccion, valores] of Object.entries(secciones)) {
    await api(request, 'put', `/solicitudes/${solicitudId}/respuestas`, token, {
      seccion,
      valores,
    });
  }

  const envio = await api(request, 'post', `/solicitudes/${solicitudId}/transicion`, token, {
    accion: 'enviar',
  });
  expect(envio.ok(), `enviar la solicitud: ${await envio.text()}`).toBeTruthy();
}

test.describe('Postularse a una convocatoria', () => {
  test('si ya enviaste la postulación, el botón lleva a ella', async ({
    page,
    request,
  }) => {
    const token = await login(request, 'postulante@demo.gt');
    const convocatoriaId = await convocatoriaLibre(request, token);
    const solicitudId = await crearBorrador(request, token, convocatoriaId);
    await enviarSolicitud(request, token, solicitudId, convocatoriaId);

    await entrar(page);
    await page.goto(`/convocatorias/${convocatoriaId}`);

    await expect(
      page.getByRole('link', { name: /Ver mi postulación/i }),
    ).toBeVisible();
  });

  test('si ya enviaste la postulación, entrar a aplicar avisa en una ventana', async ({
    page,
    request,
  }) => {
    const token = await login(request, 'postulante@demo.gt');
    const convocatoriaId = await convocatoriaLibre(request, token);
    const solicitudId = await crearBorrador(request, token, convocatoriaId);
    await enviarSolicitud(request, token, solicitudId, convocatoriaId);

    await entrar(page);
    await page.goto(`/convocatorias/${convocatoriaId}/aplicar`);

    const ventana = page.getByRole('dialog');
    await expect(ventana).toBeVisible();
    await expect(
      ventana.getByText(/Ya tienes una postulación para esta beca/i),
    ).toBeVisible();
    await expect(
      ventana.getByRole('button', { name: /Ver la postulación/i }),
    ).toBeVisible();
  });

  test('si tienes un borrador, se puede continuar sin aviso', async ({
    page,
    request,
  }) => {
    const token = await login(request, 'postulante@demo.gt');
    const convocatoriaId = await convocatoriaLibre(request, token);
    await crearBorrador(request, token, convocatoriaId);

    await entrar(page);
    await page.goto(`/convocatorias/${convocatoriaId}`);

    await page.getByRole('link', { name: /Continuar postulación/i }).click();
    await expect(page).toHaveURL(/\/aplicar$/);
    // El flujo de postulación se abre: no hay ventana de aviso.
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText(/Completa tu postulación/i)).toBeVisible();
  });
});
