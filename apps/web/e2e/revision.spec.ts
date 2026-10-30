import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Panel de revisión del personal (ruta /revision).
 *
 * El listado identifica la postulación por la persona y su código, no por el
 * nombre de la beca; el nombre de la beca y el monto a otorgar aparecen en
 * el detalle. La asignación de evaluadores se hace con un desplegable.
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

async function entrarComoAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('admin@sigeb.gov.gt');
  await page.getByLabel('Contraseña').fill(CLAVE);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin\/convocatorias$/);
}

test.describe('Panel de revisión del personal', () => {
  test('el listado identifica la postulación por su código y la persona', async ({
    page,
    request,
  }) => {
    const admin = await login(request, 'admin@sigeb.gov.gt');
    const solicitudes = (
      (await (await request.get(`${API}/solicitudes`, { headers: { authorization: `Bearer ${admin}` } })).json())
    ).data as Array<{ id: string; estado: string; usuario?: { nombres: string } }>;
    const revisable = solicitudes.find((s) => s.estado === 'ENVIADA');
    expect(revisable, 'debe haber una solicitud ENVIADA').toBeTruthy();

    await entrarComoAdmin(page);
    await page.goto('/revision');

    const tarjeta = page.locator(`[data-solicitud-id="${revisable!.id}"]`);
    await expect(tarjeta).toBeVisible();
    // El código de la solicitud (8 caracteres) y el nombre de la persona.
    await expect(tarjeta.getByText(revisable!.id.slice(0, 8))).toBeVisible();
    await expect(tarjeta.getByText(revisable!.usuario?.nombres ?? '')).toBeVisible();
  });

  test('la asignación de evaluadores ofrece un desplegable con los evaluadores', async ({
    page,
    request,
  }) => {
    const admin = await login(request, 'admin@sigeb.gov.gt');
    const solicitudes = (
      (await (await request.get(`${API}/solicitudes`, { headers: { authorization: `Bearer ${admin}` } })).json())
    ).data as Array<{
      id: string;
      estado: string;
      convocatoria?: { evaluadorPorDefectoId?: string | null };
    }>;
    const enRevision = solicitudes.find(
      (s) => s.estado === 'EN_REVISION' && s.convocatoria?.evaluadorPorDefectoId,
    );
    expect(enRevision, 'debe haber una solicitud en revisión').toBeTruthy();

    await entrarComoAdmin(page);
    await page.goto('/revision');

    // La lista arranca filtrada por "Enviadas": las que están en revisión
    // se ven al cambiar el filtro.
    await page.getByLabel('Filtrar por estado').selectOption('EN_REVISION');

    await page
      .locator(`[data-solicitud-id="${enRevision!.id}"]`)
      .getByRole('button', { name: /Asignar evaluadores/i })
      .click();

    const desplegable = page.getByLabel(/Elegir evaluador/i);
    await expect(desplegable).toBeVisible();
    // La opción del evaluador por defecto viene preseleccionada.
    await expect(desplegable).toHaveValue(/.+/);
    // Y el desplegable ofrece a los evaluadores registrados.
    const opciones = page.locator(
      'select[aria-label="Elegir evaluador"] option:not([value=""])',
    );
    expect(await opciones.count()).toBeGreaterThan(0);
    await expect(opciones.first()).toHaveAttribute('value', /.+/);
  });

  test('el detalle muestra la beca, el monto a otorgar y las fechas', async ({
    page,
    request,
  }) => {
    const admin = await login(request, 'admin@sigeb.gov.gt');
    const solicitudes = (
      (await (await request.get(`${API}/solicitudes`, { headers: { authorization: `Bearer ${admin}` } })).json())
    ).data as Array<{ id: string; estado: string }>;
    const revisable = solicitudes.find((s) => s.estado === 'ENVIADA');
    expect(revisable, 'debe haber una solicitud ENVIADA').toBeTruthy();

    await entrarComoAdmin(page);
    await page.goto('/revision');

    await page
      .locator(`[data-solicitud-id="${revisable!.id}"]`)
      .getByRole('button', { name: /Ver detalle/i })
      .click();

    const ventana = page.getByRole('dialog');
    await expect(ventana).toBeVisible();
    await expect(ventana.getByText(/Monto a otorgar/i)).toBeVisible();
    await expect(ventana.getByText(/Apertura/i)).toBeVisible();
    await expect(ventana.getByText(/Cierre/i)).toBeVisible();
    await expect(ventana.getByText(/Beca/i).first()).toBeVisible();
  });

  test('el detalle muestra el CUI y las observaciones de los evaluadores', async ({
    page,
    request,
  }) => {
    const admin = await login(request, 'admin@sigeb.gov.gt');
    const solicitudes = (
      (await (await request.get(`${API}/solicitudes`, { headers: { authorization: `Bearer ${admin}` } })).json())
    ).data as Array<{ id: string; estado: string; usuario?: { nombres: string; cui: string } }>;
    const evaluada = solicitudes.find((s) => s.estado === 'EVALUADA');
    expect(evaluada, 'debe haber una solicitud EVALUADA').toBeTruthy();

    await entrarComoAdmin(page);
    await page.goto('/revision');

    // La lista arranca filtrada por "Enviadas": se cambia el filtro para ver
    // las que ya están evaluadas.
    await page.getByLabel('Filtrar por estado').selectOption('EVALUADA');

    await page
      .locator(`[data-solicitud-id="${evaluada!.id}"]`)
      .getByRole('button', { name: /Ver detalle/i })
      .click();

    const ventana = page.getByRole('dialog');
    await expect(ventana).toBeVisible();
    // El CUI de la persona postulante (no sale "—").
    await expect(ventana.getByText(evaluada!.usuario?.cui ?? '___')).toBeVisible();
    // Y las observaciones que dejaron los evaluadores.
    await expect(
      ventana.getByText(/Evaluación (principal|de respaldo)/i).first(),
    ).toBeVisible();
  });
});
