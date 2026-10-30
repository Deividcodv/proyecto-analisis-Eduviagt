import { test, expect } from '@playwright/test';

/**
 * Módulo de reportes: si un reporte falla, la página debe avisar y permitir
 * reintentar (no quedarse en un spinner eterno) y los filtros deben reaching
 * a todas las secciones.
 */
const CLAVE = 'Admin123!';

async function entrar(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('admin@sigeb.gov.gt');
  await page.getByLabel('Contraseña').fill(CLAVE);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin\/convocatorias$/);
}

test.describe('Reportes', () => {
  test('si un reporte falla avisa y permite reintentar', async ({ page }) => {
    await entrar(page);

    let fallando = true;
    await page.route('**/api/reportes/general*', async (route) => {
      if (fallando) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Falla temporal del reporte' }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/reportes');

    // Avisa del fallo...
    await expect(page.getByText(/Falla temporal del reporte/i)).toBeVisible();
    // ...y ofrece reintentar en vez de quedarse cargando.
    await expect(page.getByRole('button', { name: /Reintentar/i })).toBeVisible();

    fallando = false;
    await page.getByRole('button', { name: /Reintentar/i }).click();

    await expect(page.getByText(/Resumen general/i).first()).toBeVisible();
    await expect(page.getByText(/Falla temporal del reporte/i)).toHaveCount(0);
  });

  test('se puede elegir la convocatoria que se quiere analizar', async ({
    page,
  }) => {
    await entrar(page);

    await page.goto('/reportes');

    // El buscador y el selector de convocatoria.
    await expect(page.getByLabel(/Buscar convocatoria/i)).toBeVisible();
    const selector = page.getByLabel('Convocatoria', { exact: true }).first();
    await expect(selector).toBeVisible();

    // Al elegir una, aparece el detalle de esa convocatoria (y no el de
    // todas).
    const valor = await selector.locator('option').nth(1).getAttribute('value');
    expect(valor).toBeTruthy();
    await selector.selectOption(valor!);
    await expect(
      page.getByText(/Detalle de la convocatoria elegida/i),
    ).toBeVisible();
  });

  test('el reporte se puede exportar a PDF con sus gráficas', async ({
    page,
  }) => {
    await entrar(page);
    await page.goto('/reportes');

    const descarga = page.waitForEvent('download');
    await page.getByRole('button', { name: /Exportar PDF/i }).click();
    const archivo = await descarga;

    expect(archivo.suggestedFilename()).toMatch(/reporte-general.*\.pdf/);
  });
});
