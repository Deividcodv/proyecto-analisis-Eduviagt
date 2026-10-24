import { test, expect } from '@playwright/test';

/**
 * Páginas legales y de cookies (Sprint 8 - US-804/US-805).
 *
 * Se comprueba que:
 *  - están disponibles sin iniciar sesión,
 *  - el pie de página las enlaza,
 *  - identifican el proyecto como prototipo académico,
 *  - no hay banner de consentimiento: el sitio no usa tecnologías opcionales.
 */
const PAGINAS_LEGALES = [
  { ruta: '/privacidad', titulo: 'Política de privacidad' },
  { ruta: '/terminos', titulo: 'Términos y condiciones' },
  { ruta: '/cookies', titulo: 'Cookies y almacenamiento' },
];

test.describe('Páginas legales', () => {
  for (const pagina of PAGINAS_LEGALES) {
    test(`${pagina.ruta} está disponible sin iniciar sesión`, async ({ page }) => {
      const respuesta = await page.goto(pagina.ruta);
      expect(respuesta?.status()).toBe(200);
      await expect(
        page.getByRole('heading', { level: 1, name: pagina.titulo }),
      ).toBeVisible();
    });

    test(`${pagina.ruta} avisa de que es un prototipo académico`, async ({
      page,
    }) => {
      await page.goto(pagina.ruta);
      await expect(
        page.getByRole('heading', { name: 'Prototipo académico' }),
      ).toBeVisible();
    });
  }

  test('el pie de página enlaza las tres páginas', async ({ page }) => {
    await page.goto('/');
    const pie = page.locator('footer');
    await expect(pie.getByRole('link', { name: 'Privacidad' })).toBeVisible();
    await expect(
      pie.getByRole('link', { name: 'Términos y condiciones' }),
    ).toBeVisible();
    await expect(
      pie.getByRole('link', { name: 'Cookies y almacenamiento' }),
    ).toBeVisible();
  });

  test('el pie identifica el proyecto como prototipo, no como plataforma oficial', async ({
    page,
  }) => {
    await page.goto('/');
    const pie = page.locator('footer');
    await expect(pie).toContainText('Prototipo académico');
    await expect(pie).not.toContainText('Todos los derechos reservados');
  });

  test('no se pide consentimiento porque no hay tecnologías opcionales', async ({
    page,
  }) => {
    await page.goto('/cookies');
    await expect(page.getByText(/no utiliza cookies/i)).toBeVisible();
    await expect(page.getByText(/no hay un banner de consentimiento/i)).toBeVisible();

    // Y en ninguna página aparece un diálogo de consentimiento.
    await page.goto('/');
    const dialogos = await page.locator(
      '[role="dialog"]:has-text("cookie"), [role="dialog"]:has-text("consentimiento")',
    ).count();
    expect(dialogos).toBe(0);
  });
});
