import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { formatearErroresValidacion } from './common/filters/mensajes-error';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Los documentos que suben los postulantes NO se sirven como archivos
  // estáticos: se entregan por un endpoint autenticado que comprueba que
  // quien los pide es el dueño de la solicitud o alguien que participa en
  // su revisión. Ver SolicitudesService.descargarDocumento.

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // S-007: los mensajes por defecto de class-validator están en inglés;
      // se convierten a mensajes claros en español.
      exceptionFactory: (errores) =>
        new BadRequestException(formatearErroresValidacion(errores)),
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('EDUVIAGT API')
    .setDescription('EDUVIAGT - Sistema Integral de Gestión de Becas (API)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  // Interfaz de escucha. En el servidor la API queda atada a 127.0.0.1 porque
  // la web —que la consume por proxy— corre en la misma maquina: no hace
  // falta dejarla escuchando en la red publica.
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`🚀 EDUVIAGT API running on http://${host}:${port}`);
  console.log(`📚 Swagger docs: http://${host}:${port}/api/docs`);
}
bootstrap();
