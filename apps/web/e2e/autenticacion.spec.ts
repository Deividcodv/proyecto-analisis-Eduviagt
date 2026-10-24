import { test, expect } from '@playwright/test';

/**
 * Flujos de autenticación: alta de cuenta, inicio de sesión por rol y
 * control de acceso en el cliente.
 *
 * Usuarios demo creados por el seed del API (ver apps/api/test/helpers/app.ts).
 */
const CLAVE_DEMO = 'Admin123!';

function correoUnico(): string {
  return `e2e.${Date.now()}.${Math.floor(Math.random() * 1e6)}@test.gt`;
}

function cuiUnico(): string {
  // 13 dígitos: '1' + 8 del reloj + 4 aleatorios.
  const reloj = Date.now().toString().slice(-8);
  const aleatorio = Math.floor(Math.random() * 1e4)
    .toString()
    .padStart(4, '0');
  return `1${reloj}${aleatorio}`;
}

test.describe('Registro de cuenta', () => {
  test('crea una cuenta nueva y confirma el alta', async ({ page }) => {
    await page.goto('/registro');

    await page.getByLabel('CUI').fill(cuiUnico());
    await page.getByLabel('Nombres completos').fill('Postulante De Prueba');
    await page.getByLabel('Correo electrónico').fill(correoUnico());
    await page.getByLabel('Contraseña', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirmar contraseña').fill('Password123!');
    await page.getByRole('button', { name: 'Registrarse' }).click();

    await expect(
      page.getByRole('heading', { name: '¡Cuenta creada!' }),
    ).toBeVisible();
  });

  test('avisa cuando las contraseñas no coinciden', async ({ page }) => {
    await page.goto('/registro');

    await page.getByLabel('CUI').fill(cuiUnico());
    await page.getByLabel('Nombres completos').fill('Postulante De Prueba');
    await page.getByLabel('Correo electrónico').fill(correoUnico());
    await page.getByLabel('Contraseña', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirmar contraseña').fill('OtraClave123!');
    await page.getByRole('button', { name: 'Registrarse' }).click();

    await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible();
  });
});

test.describe('Inicio de sesión', () => {
  test('un postulante llega a su panel', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Correo electrónico').fill('postulante@demo.gt');
    await page.getByLabel('Contraseña').fill(CLAVE_DEMO);
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('un administrador llega al panel de administración', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Correo electrónico').fill('admin@sigeb.gov.gt');
    await page.getByLabel('Contraseña').fill(CLAVE_DEMO);
    await page.getByRole('button', { name: 'Ingresar' }).click();

    // /admin redirige a /admin/convocatorias (ver app/admin/page.tsx).
    await expect(page).toHaveURL(/\/admin\/convocatorias$/);
  });

  test('acepta el correo escrito con mayúsculas', async ({ page }) => {
    // Regresión: antes el correo era sensible a mayúsculas y muchos teclados
    // móviles capitalizan la primera letra, dejando fuera al usuario.
    await page.goto('/login');

    await page
      .getByLabel('Correo electrónico')
      .fill('POSTULANTE@DEMO.GT');
    await page.getByLabel('Contraseña').fill(CLAVE_DEMO);
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('con contraseña incorrecta muestra un mensaje claro', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Correo electrónico').fill('postulante@demo.gt');
    await page.getByLabel('Contraseña').fill('claveIncorrecta');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByText(/credenciales|incorrecta|inválid/i)).toBeVisible();
    await expect(page.getByText(/unauthorized|credenciales incorrectas/i)).toHaveCount(0);
  });
});

test.describe('Control de acceso en el cliente', () => {
  test('un postulante no puede entrar al panel de administración', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('postulante@demo.gt');
    await page.getByLabel('Contraseña').fill(CLAVE_DEMO);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto('/admin/solicitudes');

    // ProtectedRoute lo devuelve a su propio panel.
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('sin sesión, una ruta privada redirige al login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login$/);
  });
});
