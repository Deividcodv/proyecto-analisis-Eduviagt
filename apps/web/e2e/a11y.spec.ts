import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accesibilidad (WCAG 2.0/2.1 nivel A y AA vía axe) y revisión visual.
 *
 * Las pruebas de accesibilidad fallan solo ante violaciones de impacto
 * `serious` o `critical` (lo que de verdad bloquea a una persona). Las de
 * impacto `moderate`/`minor` se imprimen para el informe, sin romper la suite.
 */

const PAGINAS_PUBLICAS = [
  { ruta: '/', nombre: 'portada' },
  { ruta: '/convocatorias', nombre: 'convocatorias' },
  { ruta: '/registro', nombre: 'registro' },
  { ruta: '/login', nombre: 'login' },
  { ruta: '/consulta', nombre: 'consulta' },
  { ruta: '/ayuda', nombre: 'ayuda' },
  { ruta: '/faq', nombre: 'faq' },
  { ruta: '/requisitos', nombre: 'requisitos' },
  { ruta: '/nosotros', nombre: 'nosotros' },
  { ruta: '/contacto', nombre: 'contacto' },
  { ruta: '/soporte', nombre: 'soporte' },
  { ruta: '/transparencia', nombre: 'transparencia' },
  { ruta: '/privacidad', nombre: 'privacidad' },
  { ruta: '/terminos', nombre: 'terminos' },
  { ruta: '/cookies', nombre: 'cookies' },
];

test.describe('Accesibilidad WCAG AA (axe)', () => {
  for (const pagina of PAGINAS_PUBLICAS) {
    test(`${pagina.nombre}: sin violaciones graves`, async ({ page }) => {
      await page.goto(pagina.ruta);
      await page.waitForLoadState('networkidle');

      const resultado = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      if (resultado.violations.length > 0) {
        console.log(`\n[A11Y ${pagina.nombre}] ${resultado.violations.length} violación(es):`);
        for (const v of resultado.violations) {
          console.log(`  · [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} nodo/s)`);
          for (const nodo of v.nodes.slice(0, 6)) {
            console.log(`      target: ${nodo.target.join(' ')}`);
            console.log(`      html:   ${nodo.html.replace(/\s+/g, ' ').slice(0, 160)}`);
            console.log(`      why:    ${(nodo.failureSummary ?? '').replace(/\n/g, ' | ')}`);
          }
        }
      }

      const graves = resultado.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.id} (${v.nodes.length})`);

      expect(graves, `Violaciones graves en ${pagina.nombre}`).toEqual([]);
    });
  }
});

/**
 * A-004: las páginas internas (con sesión iniciada) también se auditan con axe.
 * Antes, la auditoría automática solo cubría las páginas públicas.
 */
const PAGINAS_INTERNAS = [
  { ruta: '/admin/convocatorias', nombre: 'admin-convocatorias' },
  { ruta: '/admin/solicitudes', nombre: 'admin-solicitudes' },
  { ruta: '/admin/comites', nombre: 'admin-comites' },
  { ruta: '/admin/sesiones', nombre: 'admin-sesiones' },
  { ruta: '/admin/seguridad', nombre: 'admin-seguridad' },
  { ruta: '/admin/auditoria', nombre: 'admin-auditoria' },
  { ruta: '/perfil', nombre: 'perfil' },
];

test.describe('Accesibilidad WCAG AA en páginas internas (axe)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('admin@sigeb.gov.gt');
    await page.getByLabel('Contraseña').fill('Admin123!');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/admin\/convocatorias$/);
  });

  for (const pagina of PAGINAS_INTERNAS) {
    test(`${pagina.nombre}: sin violaciones graves`, async ({ page }) => {
      await page.goto(pagina.ruta);
      await page.waitForLoadState('networkidle');

      const resultado = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      if (resultado.violations.length > 0) {
        console.log(`\n[A11Y ${pagina.nombre}] ${resultado.violations.length} violación(es):`);
        for (const v of resultado.violations) {
          console.log(`  · [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} nodo/s)`);
          for (const nodo of v.nodes.slice(0, 6)) {
            console.log(`      target: ${nodo.target.join(' ')}`);
            console.log(`      html:   ${nodo.html.replace(/\s+/g, ' ').slice(0, 160)}`);
            console.log(`      why:    ${(nodo.failureSummary ?? '').replace(/\n/g, ' | ')}`);
          }
        }
      }

      const graves = resultado.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.id} (${v.nodes.length})`);

      expect(graves, `Violaciones graves en ${pagina.nombre}`).toEqual([]);
    });
  }
});

test.describe('Accesibilidad de formularios y foco', () => {
  test('los campos del registro tienen etiqueta asociada', async ({ page }) => {
    await page.goto('/registro');
    await page.waitForLoadState('networkidle');

    // Todo control de formulario visible debe tener un nombre accesible.
    const sinNombre = await page.evaluate(() => {
      const controles = Array.from(
        document.querySelectorAll<HTMLElement>('input:not([type=hidden]), select, textarea'),
      ).filter((el) => {
        const estilo = window.getComputedStyle(el);
        return estilo.display !== 'none' && estilo.visibility !== 'hidden';
      });
      return controles
        .filter((el) => {
          const input = el as HTMLInputElement;
          const porLabel = input.labels && input.labels.length > 0;
          const porAria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
          return !porLabel && !porAria;
        })
        .map((el) => (el as HTMLInputElement).name || el.id || el.tagName);
    });

    expect(sinNombre, 'Controles sin nombre accesible en /registro').toEqual([]);
  });

  test('se puede navegar con teclado desde la portada', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // En una página que no es la primera del contexto, el frame puede no
    // tener el foco y la tecla no se procesa. Se pulsa sobre el body (que
    // fija el punto de partida de la navegación) y se reintenta un par de
    // veces por si el foco aún no ha llegado al documento.
    let primerFoco = 'ninguno';
    for (let intento = 0; intento < 3; intento++) {
      await page.locator('body').press('Tab');
      primerFoco = await page.evaluate(() => {
        const el = document.activeElement;
        return el
          ? el.tagName + (el.textContent ? `: ${el.textContent.trim().slice(0, 40)}` : '')
          : 'ninguno';
      });
      if (primerFoco !== 'ninguno' && !primerFoco.startsWith('BODY')) break;
    }

    expect(primerFoco).not.toBe('ninguno');
    expect(primerFoco).not.toContain('BODY');
    // El primer elemento enfocable es el salto al contenido principal.
    expect(primerFoco).toContain('Saltar al contenido principal');
  });
});

test.describe('Revisión visual y responsive', () => {
  const CAPTURAS = [
    { ruta: '/', nombre: 'portada' },
    { ruta: '/convocatorias', nombre: 'convocatorias' },
    { ruta: '/registro', nombre: 'registro' },
    { ruta: '/login', nombre: 'login' },
    { ruta: '/consulta', nombre: 'consulta' },
    { ruta: '/ayuda', nombre: 'ayuda' },
  ];

  for (const captura of CAPTURAS) {
    test(`${captura.nombre}: captura desktop y móvil, sin desborde`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(captura.ruta);
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: `e2e/__screenshots__/${captura.nombre}-desktop.png`,
        fullPage: true,
      });

      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(captura.ruta);
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: `e2e/__screenshots__/${captura.nombre}-movil.png`,
        fullPage: true,
      });

      // Ninguna página debe provocar desplazamiento horizontal en móvil.
      const desborde = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(desborde, `desborde horizontal en ${captura.nombre} (375px)`).toBeLessThanOrEqual(1);
    });
  }
});
