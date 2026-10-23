import { Test } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let prisma: any;
  let controller: HealthController;
  let res: any;

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    res = { status: jest.fn().mockReturnThis() };

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = moduleRef.get(HealthController);
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  it('responde 200 y estado ok cuando la base de datos responde', async () => {
    const resultado = await controller.verificar(res);

    expect(res.status).not.toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(resultado).toMatchObject({
      estado: 'ok',
      baseDeDatos: 'ok',
    });
    expect(typeof resultado.duracionMs).toBe('number');
    expect(resultado.marcaTiempo).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('responde 503 y estado degradado cuando la base de datos falla', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('conexion rechazada'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const resultado = await controller.verificar(res);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(resultado).toMatchObject({
      estado: 'degradado',
      baseDeDatos: 'error',
    });
  });

  it('no filtra el mensaje interno de la base de datos en la respuesta', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('host=bd usuario=admin'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const resultado = await controller.verificar(res);

    expect(JSON.stringify(resultado)).not.toContain('usuario=admin');
  });
});
