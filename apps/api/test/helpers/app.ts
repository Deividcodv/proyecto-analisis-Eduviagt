import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PDF_RENDERER } from '../../src/solicitudes/pdf/pdf-renderer.interface';

const PDF_MINIMO = Buffer.from('%PDF-1.4\n%%EOF\n');

/**
 * Crea la aplicación NestJS para pruebas funcionales E2E replicando el
 * bootstrap real de main.ts (prefijo global /api y ValidationPipe).
 * Mockea PdfRenderer para evitar cargar Puppeteer en Jest (ESM).
 */
export async function crearApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PDF_RENDERER)
    .useValue({
      render: async () => PDF_MINIMO,
    })
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

export function api(app: INestApplication) {
  return request(app.getHttpServer());
}

export function auth(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export interface Credenciales {
  email: string;
  password: string;
}

/** Usuarios creados por prisma/seed.ts (correlativos simples y conocidos). */
export const USUARIOS_DEMO: Record<string, Credenciales> = {
  admin: { email: 'admin@sigeb.gov.gt', password: 'Admin123!' },
  postulante: { email: 'postulante@demo.gt', password: 'Admin123!' },
  evaluador: { email: 'evaluador@demo.gt', password: 'Admin123!' },
  coordinador: { email: 'coordinador@demo.gt', password: 'Admin123!' },
  miembro: { email: 'miembro@demo.gt', password: 'Admin123!' },
};

/** Beca demo con criterios de evaluación creada por el seed (0002). */
export const BECA_CON_CRITERIOS = '00000000-0000-4000-8000-000000000002';

export async function login(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const res = await api(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(
      `Login falló para ${email}: HTTP ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  return res.body.data.accessToken as string;
}

export async function loginDemo(
  app: INestApplication,
  clave: keyof typeof USUARIOS_DEMO,
): Promise<string> {
  const { email, password } = USUARIOS_DEMO[clave];
  return login(app, email, password);
}
