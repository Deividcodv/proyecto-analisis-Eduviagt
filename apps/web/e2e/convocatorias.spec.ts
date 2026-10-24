import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Flujo del postulante: ver una convocatoria abierta y postularse.
 *
 * `sigeb_test` no trae convocatorias ABIERTAS de fábrica, así que el propio
 * test crea y publica una por API (como lo haría un administrador) y luego
 * comprueba lo que ve el visitante en la web.
 */
const API = `http://localhost:${process.env.E2E_API_PORT ?? '3000'}/api`;
const CLAVE_DEMO = 'Admin123!';
const BECA_CON_CRITERIOS = '00000000-0000-4000-8000-000000000002';

interface ConvocatoriaCreada {
  id: string;
  nombre: string;
}

async function crearConvocatoriaAbierta(
  request: APIRequestContext,
): Promise<ConvocatoriaCreada> {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: 'admin@sigeb.gov.gt', password: CLAVE_DEMO },
  });
  expect(login.ok(), 'el admin debe poder iniciar sesión').toBeTruthy();
  const token = (await login.json()).data.accessToken as string;

  const nombre = `Convocatoria E2E ${Date.now()}`;
  const creada = await request.post(`${API}/convocatorias`, {
    headers: { authorization: `Bearer ${token}` },
    data: { nombre, becaId: BECA_CON_CRITERIOS },
  });
  expect(creada.ok(), 'se debe poder crear la convocatoria').toBeTruthy();
  const id = (await creada.json()).data.id as string;

  const publicada = await request.post(`${API}/convocatorias/${id}/transicion`, {
    headers: { authorization: `Bearer ${token}` },
    data: { accion: 'publicar' },
  });
  expect(publicada.ok(), 'se debe poder publicar la convocatoria').toBeTruthy();

  return { id, nombre };
}

test.describe('Convocatorias y postulación', () => {
  test('una convocatoria abierta aparece en el listado público', async ({
    page,
    request,
  }) => {
    const { nombre } = await crearConvocatoriaAbierta(request);

    await page.goto('/convocatorias');

    await expect(page.getByText(nombre)).toBeVisible();
  });

  test('un visitante sin sesión es invitado a crear cuenta', async ({
    page,
    request,
  }) => {
    const { id } = await crearConvocatoriaAbierta(request);

    await page.goto(`/convocatorias/${id}`);

    await expect(
      page.getByRole('link', { name: 'Crear cuenta y postularme' }),
    ).toBeVisible();
  });

  test('un postulante con sesión puede iniciar su postulación', async ({
    page,
    request,
  }) => {
    const { id } = await crearConvocatoriaAbierta(request);

    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('postulante@demo.gt');
    await page.getByLabel('Contraseña').fill(CLAVE_DEMO);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto(`/convocatorias/${id}`);

    const postular = page.getByRole('link', { name: 'Postularme ahora' });
    await expect(postular).toBeVisible();
    await postular.click();

    await expect(page).toHaveURL(new RegExp(`/convocatorias/${id}/aplicar$`));
  });
});
