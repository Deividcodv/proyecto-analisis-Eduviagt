import { test, expect } from '@playwright/test';

/**
 * Flujos públicos (sin sesión): portada, convocatorias, consulta y alta.
 */
test.describe('Páginas públicas', () => {
  test('la portada muestra el mensaje principal', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { level: 1 }),
    ).toContainText('Oportunidades que transforman vidas');
  });

  test('el listado de convocatorias abre y muestra su título', async ({ page }) => {
    await page.goto('/convocatorias');

    await expect(
      page.getByRole('heading', { level: 1 }),
    ).toHaveText('Convocatorias');
  });

  test('la página de consulta pide el número de solicitud', async ({ page }) => {
    await page.goto('/consulta');

    await expect(
      page.getByRole('heading', { level: 1 }),
    ).toContainText('Consulta el estado de tu beca');
    await expect(page.getByLabel('Número de solicitud')).toBeVisible();
  });

  test('consultar un código inexistente muestra un mensaje claro en español', async ({
    page,
  }) => {
    await page.goto('/consulta');

    await page.getByLabel('Número de solicitud').fill('CODIGO-QUE-NO-EXISTE');
    await page.getByRole('button', { name: 'Consultar' }).click();

    const error = page.getByRole('alert').or(page.getByText(/no encontramos|no se pudo/i));
    await expect(error.first()).toBeVisible();
    // El mensaje NO debe quedar en inglés (p. ej. "Not Found").
    await expect(page.getByText(/not found|internal server error/i)).toHaveCount(0);
  });

  test('la página de registro muestra sus campos', async ({ page }) => {
    await page.goto('/registro');

    await expect(
      page.getByRole('heading', { level: 1 }),
    ).toHaveText('Crear una cuenta');
    await expect(page.getByLabel('CUI')).toBeVisible();
    await expect(page.getByLabel('Confirmar contraseña')).toBeVisible();
  });
});
