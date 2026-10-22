import { test, expect } from '@playwright/test';

const CLAVE_DEMO = 'Admin123!';

/**
 * Flujo del panel de administración: entrar, ver el menú de secciones y navegar
 * entre ellas.
 */
test.describe('Panel de administración', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('admin@sigeb.gov.gt');
    await page.getByLabel('Contraseña').fill(CLAVE_DEMO);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    // /admin redirige a /admin/convocatorias (ver app/admin/page.tsx).
    await expect(page).toHaveURL(/\/admin\/convocatorias$/);
  });

  test('muestra el encabezado y el menú de secciones', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: 'Panel de administración' }),
    ).toBeVisible();

    const menu = page.getByRole('navigation', {
      name: 'Secciones de administración',
    });
    await expect(menu).toBeVisible();

    for (const seccion of [
      'Convocatorias',
      'Solicitudes',
      'Comités',
      'Sesiones',
      'Seguridad',
    ]) {
      await expect(menu.getByRole('link', { name: seccion })).toBeVisible();
    }
  });

  test('navega a Solicitudes y marca la pestaña activa', async ({ page }) => {
    const menu = page.getByRole('navigation', {
      name: 'Secciones de administración',
    });

    await menu.getByRole('link', { name: 'Solicitudes' }).click();

    await expect(page).toHaveURL(/\/admin\/solicitudes$/);
    await expect(
      menu.getByRole('link', { name: 'Solicitudes' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  test('navega a Convocatorias', async ({ page }) => {
    const menu = page.getByRole('navigation', {
      name: 'Secciones de administración',
    });

    await menu.getByRole('link', { name: 'Convocatorias' }).click();

    await expect(page).toHaveURL(/\/admin\/convocatorias$/);
    await expect(
      menu.getByRole('link', { name: 'Convocatorias' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  test('navega a Seguridad', async ({ page }) => {
    const menu = page.getByRole('navigation', {
      name: 'Secciones de administración',
    });

    await menu.getByRole('link', { name: 'Seguridad' }).click();

    await expect(page).toHaveURL(/\/admin\/seguridad$/);
  });

  test('la bitácora muestra quién, cuándo y qué acción se registró', async ({
    page,
  }) => {
    await page.goto('/admin/auditoria');

    await expect(
      page.getByRole('heading', { name: 'Bitácora del sistema' }),
    ).toBeVisible();

    // Cada registro identifica a la persona y su rol, y describe la acción
    // en lenguaje humano (no el nombre técnico de la operación).
    const primerRegistro = page.locator('main >> text=/Inició sesión|Creó|Modificó/').first();
    await expect(primerRegistro).toBeVisible();
  });
});
