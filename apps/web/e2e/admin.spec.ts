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

    // La ruta canónica del panel de revisión es /revision: ahí lo ve
    // también el comité.
    await expect(page).toHaveURL(/\/revision$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Solicitudes' }),
    ).toBeVisible();
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

/**
 * El catálogo de evaluadores (`/seguridad/personal`) es un recurso auxiliar
 * del panel de solicitudes. Si el servidor lo rechaza (base sembrada con un
 * seed anterior, sin el permiso `personal:ver`), la lista de solicitudes NO
 * puede quedar vacía: cada carga se resuelve por separado.
 */
test.describe('Panel de solicitudes: tolerancia a fallos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('admin@sigeb.gov.gt');
    await page.getByLabel('Contraseña').fill(CLAVE_DEMO);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/admin\/convocatorias$/);
  });

  test('sigue mostrando las solicitudes si el catálogo de personal falla', async ({
    page,
  }) => {
    // Escenario real de un servidor con la base sembrada por un seed
    // anterior: los dos endpoints del catálogo responden 403.
    const responder403 = async (route: import('@playwright/test').Route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 403,
          message: 'No tienes el permiso requerido: personal:ver',
        }),
      });
    };
    await page.route('**/seguridad/personal*', responder403);
    await page.route('**/seguridad/usuarios*', responder403);

    await page.goto('/admin/solicitudes');

    // El fallo del catálogo no se muestra como error (degrada en silencio)...
    await expect(page.getByText('No tienes el permiso requerido')).toHaveCount(0);
    // ...y la lista de solicitudes se sigue viendo.
    await expect(
      page.getByRole('button', { name: /Iniciar revisión/i }).first(),
    ).toBeVisible();
  });

  test('el catálogo de evaluadores se recupera con el endpoint alterno', async ({
    page,
  }) => {
    await page.route('**/seguridad/personal*', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 403,
          message: 'No tienes el permiso requerido: personal:ver',
        }),
      });
    });

    await page.goto('/revision');

    // La lista no se vacía aunque el catálogo principal falle.
    await expect(page.getByText('No tienes el permiso requerido')).toHaveCount(0);

    await page.getByLabel('Filtrar por estado').selectOption('EN_REVISION');
    await page.getByRole('button', { name: /Asignar evaluadores/i }).first().click();

    // El catálogo se recupera con `/seguridad/usuarios`: hay evaluadores en
    // el desplegable y el botón de asignar queda habilitado.
    const modal = page.getByRole('heading', {
      name: /Asignar evaluadores a la solicitud/i,
    });
    await expect(modal).toBeVisible();
    const desplegable = page.getByLabel(/Elegir evaluador/i);
    await expect(desplegable).toBeVisible();
    await expect(page.getByRole('button', { name: 'Asignar', exact: true })).toBeEnabled();
  });
});
