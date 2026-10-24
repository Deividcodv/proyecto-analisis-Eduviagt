import * as path from 'path';
import * as fs from 'fs';

// Entorno de pruebas E2E: se ejecuta antes de cargar los módulos de Nest,
// por lo que estas variables tienen prioridad sobre apps/api/.env.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ||
  'postgresql://sigeb:sigeb123@localhost:5432/sigeb_test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.JWT_ACCESS_EXPIRATION = '15m';
process.env.JWT_REFRESH_EXPIRATION = '7d';
process.env.AI_API_KEY = '';
process.env.CORS_ORIGIN = 'http://localhost:3001';

const storageDir = path.join(__dirname, '.tmp-storage');
fs.mkdirSync(storageDir, { recursive: true });
process.env.STORAGE_PATH = storageDir;
