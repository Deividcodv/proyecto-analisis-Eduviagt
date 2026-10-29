import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Panel del comité (miembro): sus sesiones, el quórum, el voto propio y el
 * resultado de las sesiones ya cerradas.
 *
 * El montaje se hace por API (comité, miembros, sesión y agenda); lo que se
 * comprueba con el navegador es lo que el miembro ve y puede hacer.
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

async function entrarComoMiembro(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('miembro@demo.gt');
  await page.getByLabel('Contraseña').fill(CLAVE);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

interface SesionMontada {
  comiteId: string;
  sesionId: string;
  solicitudId: string;
}

/** Comité con dos miembros y una sesión programada con una solicitud evaluada. */
async function montarSesion(
  request: APIRequestContext,
): Promise<SesionMontada> {
  const admin = await login(request, 'admin@sigeb.gov.gt');

  const solicitudes = (
    (await (await request.get(`${API}/solicitudes`, { headers: { authorization: `Bearer ${admin}` } })).json())
  ).data as Array<{ id: string; estado: string }>;
  const evaluada = solicitudes.find((s) => s.estado === 'EVALUADA');
  expect(evaluada, 'debe haber una solicitud EVALUADA').toBeTruthy();

  const comite = await api(request, 'post', '/comites', admin, {
    nombre: `Comité E2E ${Date.now()}`,
    descripcion: 'Comité de prueba para la E2E',
  });
  expect(comite.ok(), 'crear comité').toBeTruthy();
  const comiteId = (await comite.json()).data.id as string;

  for (const email of ['miembro@demo.gt', 'miembro11@seed.demo.gt']) {
    const todos = (
      (await (await request.get(`${API}/seguridad/usuarios`, { headers: { authorization: `Bearer ${admin}` } })).json())
    ).data as Array<{ id: string; email: string }>;
    const persona = todos.find((u) => u.email === email);
    expect(persona, `usuario ${email}`).toBeTruthy();
    const alta = await api(request, 'post', `/comites/${comiteId}/miembros`, admin, {
      usuarioId: persona!.id,
      rol: 'VOCAL',
    });
    expect(alta.ok(), `agregar ${email} al comité`).toBeTruthy();
  }

  const sesion = await api(request, 'post', '/sesiones', admin, {
    comiteId,
    fecha: new Date(Date.now() + 86_400_000).toISOString(),
    lugar: 'Sala de prueba',
    quorumMinimo: 1,
    solicitudesIds: [evaluada!.id],
  });
  expect(sesion.ok(), `crear sesión: ${await sesion.text()}`).toBeTruthy();
  const sesionId = (await sesion.json()).data.id as string;

  return { comiteId, sesionId, solicitudId: evaluada!.id };
}

test.describe('Panel del comité (miembro)', () => {
  test('puede votar aunque otro miembro ya haya votado', async ({ page, request }) => {
    const { sesionId, solicitudId } = await montarSesion(request);

    // Otro miembro del comité vota primero.
    const otroMiembro = await login(request, 'miembro11@seed.demo.gt');
    const voto = await api(request, 'post', `/sesiones/${sesionId}/votos`, otroMiembro, {
      solicitudId,
      voto: 'APROBAR',
    });
    expect(voto.ok(), `voto del otro miembro: ${await voto.text()}`).toBeTruthy();

    await entrarComoMiembro(page);
    await page.goto('/comite');

    await page
      .locator(`[data-sesion-id="${sesionId}"]`)
      .getByRole('button', { name: /Votar|Ver resultado/i })
      .click();
    const ventana = page.getByRole('dialog');
    await expect(ventana).toBeVisible();

    // El voto propio sigue disponible: el conteo de los demás no lo bloquea.
    const opcion = ventana.getByRole('button', { name: /^Aprobar/ }).first();
    await expect(opcion).toBeEnabled();
    await opcion.click();
    await expect(ventana.getByRole('button', { name: /Emitir voto/i }).first()).toBeEnabled();
  });

  test('no puede votar en una sesión finalizada', async ({ page, request }) => {
    const { sesionId, solicitudId } = await montarSesion(request);

    const admin = await login(request, 'admin@sigeb.gov.gt');
    const miembro = await login(request, 'miembro@demo.gt');
    await api(request, 'post', `/sesiones/${sesionId}/votos`, miembro, {
      solicitudId,
      voto: 'APROBAR',
    });
    const cierre = await api(request, 'post', `/sesiones/${sesionId}/finalizar`, admin);
    expect(cierre.ok(), `finalizar sesión: ${await cierre.text()}`).toBeTruthy();

    await entrarComoMiembro(page);
    await page.goto('/comite');

    await page
      .locator(`[data-sesion-id="${sesionId}"]`)
      .getByRole('button', { name: /Votar|Ver resultado/i })
      .click();
    const ventana = page.getByRole('dialog');
    await expect(ventana).toBeVisible();
    await expect(ventana.getByRole('button', { name: /Emitir voto/i })).toHaveCount(0);
  });
});
