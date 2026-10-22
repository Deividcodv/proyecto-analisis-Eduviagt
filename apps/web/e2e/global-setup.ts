import { execSync } from 'node:child_process';
import * as path from 'node:path';

/**
 * globalSetup de Playwright — idempotencia de la suite E2E.
 *
 * Contexto (hallazgos F-002 y S-018): antes, cada corrida de Playwright se
 * ejecutaba sobre el `sigeb_test` existente sin reiniciarlo. Los datos se
 * acumulaban entre corridas y algunas pruebas dependían de conteos. Ahora,
 * antes de la suite, se deja la base de PRUEBAS en un estado efímero y
 * determinista: se borra el esquema, se vuelven a aplicar todas las
 * migraciones de Prisma y se ejecuta el seed.
 *
 * Orden de Playwright: `globalSetup` corre ANTES de arrancar los `webServer`
 * de la configuración, por lo que la API se levanta ya contra la base limpia.
 *
 * ⚠️ SEGURIDAD — proceso destructivo:
 *   Solo se permite contra la base de pruebas `sigeb_test`. Si la URL no
 *   termina en `/sigeb_test`, se aborta SIN tocar ninguna base. Nunca debe
 *   apuntarse a la base de desarrollo `sigeb`.
 *
 * No se confía en `apps/api/.env`: la `DATABASE_URL` se pasa de forma
 * EXPLÍCITA al subproceso, de modo que un `.env` apuntando a `sigeb` no pueda
 * provocar un borrado accidental.
 *
 * Para no depender de un shadow database, se usa `prisma migrate reset`
 * (dropea el esquema y re-aplica las migraciones; no requiere shadow DB) en
 * lugar de `prisma migrate dev`.
 */

// apps/web/e2e -> apps/api
const API_DIR = path.resolve(__dirname, '..', '..', 'api');

const DATABASE_URL_TEST =
  process.env.E2E_DATABASE_URL ??
  'postgresql://sigeb:sigeb123@localhost:5432/sigeb_test';

function nombreDeLaBase(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return '';
  }
}

function ejecutarPrisma(args: string[]): void {
  const comando = `npx prisma ${args.join(' ')}`;
  console.log(`[global-setup] $ ${comando}`);
  execSync(comando, {
    cwd: API_DIR,
    // DATABASE_URL explícita: tiene prioridad sobre apps/api/.env.
    env: { ...process.env, DATABASE_URL: DATABASE_URL_TEST },
    stdio: 'inherit',
  });
}

export default async function globalSetup(): Promise<void> {
  // Regla de oro: nada destructivo fuera de `sigeb_test`.
  if (nombreDeLaBase(DATABASE_URL_TEST) !== 'sigeb_test') {
    throw new Error(
      `[global-setup] Abortado: la E2E_DATABASE_URL debe terminar en ` +
        `"/sigeb_test" (se recibió "${DATABASE_URL_TEST}"). No se toca ninguna base.`,
    );
  }

  const inicio = Date.now();

  // `migrate reset --force` reinicia el esquema sin pedir confirmación.
  // `--skip-seed` evita el seed implícito de reset y se ejecuta por separado
  // con `prisma db seed`, reutilizando la config `prisma.seed` del package.json.
  // `--skip-generate` evita regenerar el cliente de Prisma: el job de CI ya
  // lo genera antes de arrancar, y hacerlo aqui en paralelo con el arranque
  // de la API produce conflictos de fichero.
  ejecutarPrisma(['migrate', 'reset', '--force', '--skip-seed', '--skip-generate']);
  ejecutarPrisma(['db', 'seed']);

  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(
    `[global-setup] sigeb_test reiniciada y sembrada en ${segundos}s ` +
      `(solo base de pruebas).`,
  );
}
