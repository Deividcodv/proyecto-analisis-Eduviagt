import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas funcionales de la web de SIGEB.
 *
 * Levanta sola la API y la web (si no están ya corriendo) y ejecuta los flujos
 * críticos en Chromium. La API se apunta SIEMPRE a la base de datos de pruebas
 * `sigeb_test` para no tocar datos de desarrollo.
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
      reuseExistingServer: true,
      timeout: 180_000,
      env: {
        DATABASE_URL: DATABASE_URL_TEST,
        PORT: API_PORT,
      },
    },
    {
      command: 'npm run dev',
      cwd: '.',
      url: BASE_URL,
      reuseExistingServer: true,
      timeout: 180_000,
      env: {
        NEXT_PUBLIC_API_PROXY: `http://localhost:${API_PORT}/api`,
      },
    },
  ],
});
