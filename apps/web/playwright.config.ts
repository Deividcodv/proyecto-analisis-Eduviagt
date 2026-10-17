import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas funcionales de la web de SIGEB.
 *
 * Levanta sola la API y la web (si no están ya corriendo) y ejecuta los flujos
 * críticos en Chromium. La API se apunta SIEMPRE a la base de datos de pruebas
 * `sigeb_test` para no tocar datos de desarrollo.
 *
 * Idempotencia (F-002 / S-018): `globalSetup` reinicia y siembra `sigeb_test`
 * antes de cada corrida (ver `e2e/global-setup.ts`), así los datos no se
 * acumulan y ninguna prueba depende de conteos de corridas anteriores.
 *
 * Uso:
 *   cd apps/web
 *   npx playwright test                 # todo
 *   npx playwright test e2e/publico.spec.ts
 *   npx playwright test --ui            # modo interactivo
 */
const API_PORT = process.env.E2E_API_PORT ?? '3000';
const WEB_PORT = process.env.E2E_WEB_PORT ?? '3001';
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${WEB_PORT}`;

const DATABASE_URL_TEST =
  process.env.E2E_DATABASE_URL ??
  'postgresql://sigeb:sigeb123@localhost:5432/sigeb_test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  // Deja `sigeb_test` limpia y sembrada antes de arrancar la API/la web.
  globalSetup: './e2e/global-setup.ts',

  use: {
    baseURL: BASE_URL,
    locale: 'es-GT',
    timezoneId: 'America/Guatemala',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: [
    {
      command: 'npm run start',
      cwd: '../api',
      url: `http://localhost:${API_PORT}/api/catalogos/generos`,
      // En CI siempre se arranca una API limpia; en local se reutiliza la que
      // ya esté corriendo para iterar más rápido.
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        DATABASE_URL: DATABASE_URL_TEST,
        PORT: API_PORT,
        // Secretos de prueba explícitos: la E2E no depende de `apps/api/.env`
        // (que está en .gitignore y no existe en CI).
        JWT_SECRET: process.env.JWT_SECRET ?? 'test-secret-key',
        JWT_REFRESH_SECRET:
          process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-key',
      },
    },
    {
      command: 'npm run dev',
      cwd: '.',
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        NEXT_PUBLIC_API_PROXY: `http://localhost:${API_PORT}/api`,
      },
    },
  ],
});
