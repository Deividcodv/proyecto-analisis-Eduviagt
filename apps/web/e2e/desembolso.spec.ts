import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Desembolso de la beca: la autoridad competente registra el pago y la
 * persona beneficiaria ve el estado en su postulación.
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

async function entrar(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(CLAVE);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

test.describe('Desembolso de la beca', () => {
  test('la autoridad registra el pago y la persona beneficiaria lo ve', async ({
    page,
    request,
  }) => {
    const admin = await login(request, 'admin@sigeb.gov.gt');
    const jefe = await login(request, 'jefebecas@demo.gt');

    // Una postulación aprobada y su persona dueña.
    const solicitudes = (
      (
        await (
          await request.get(`${API}/solicitudes`, {
            headers: { authorization: `Bearer ${admin}` },
          })
        ).json()
      ).data as Array<{ id: string; estado: string; usuario?: { cui: string } }>
    );
    const aprobada = solicitudes.find((s) => s.estado === 'APROBADA');
    expect(aprobada, 'debe haber una postulación aprobada').toBeTruthy();

    const usuarios = (
      (
        await (
          await request.get(`${API}/seguridad/usuarios`, {
            headers: { authorization: `Bearer ${admin}` },
          })
        ).json()
      ).data as Array<{ email: string; cui: string }>
    );
    const duena = usuarios.find((u) => u.cui === aprobada!.usuario?.cui);
    expect(duena, 'debe encontrarse a la persona postulante').toBeTruthy();

    // 1. El jefe de becas registra el pago.
    await entrar(page, 'jefebecas@demo.gt');
    await page.goto('/revision');
    await page.getByLabel('Filtrar por estado').selectOption('APROBADA');
    await page
      .locator(`[data-solicitud-id="${aprobada!.id}"]`)
      .getByRole('button', { name: /Ver detalle/i })
      .click();

    const ventana = page.getByRole('dialog');
    await expect(ventana).toBeVisible();
    await ventana.getByRole('button', { name: /Registrar pago/i }).click();

    const formulario = page.getByRole('dialog', { name: /Registrar el pago/i });
    await expect(formulario).toBeVisible();
    await formulario.getByLabel('Estado del pago').selectOption('PAGADO');
    await formulario.getByLabel('Banco').fill('Banco de Guatemala');
    await formulario.getByLabel('Número de cuenta').fill('1234-5678');
    await formulario.getByRole('button', { name: /Guardar el pago/i }).click();

    await expect(ventana.getByText('Pagado').first()).toBeVisible();
    await expect(ventana.getByText('Banco de Guatemala').first()).toBeVisible();

    // 2. La persona beneficiaria ve el estado del pago en su postulación.
    await entrar(page, duena!.email);
    await page.goto(`/solicitudes/${aprobada!.id}`);
    await expect(page.getByText(/Estado del pago/i)).toBeVisible();
    await expect(page.getByText(/Pagado/i).first()).toBeVisible();

    // 3. El estado quedó registrado en el API.
    const pago = (
      await (
        await request.get(`${API}/solicitudes/${aprobada!.id}/desembolso`, {
          headers: { authorization: `Bearer ${jefe}` },
        })
      ).json()
    ).data as { estado: string; banco: string };
    expect(pago.estado).toBe('PAGADO');
    expect(pago.banco).toBe('Banco de Guatemala');
  });
});
