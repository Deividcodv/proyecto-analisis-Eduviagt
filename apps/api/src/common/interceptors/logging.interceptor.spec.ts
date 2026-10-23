import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  function contexto(
    ruta: string,
    metodo = 'GET',
    usuario: any = null,
  ): ExecutionContext {
    const request: any = {
      method: metodo,
      url: ruta,
      originalUrl: ruta,
      baseUrl: '',
      route: { path: ruta },
      headers: {},
      user: usuario,
    };
    const response: any = {
      statusCode: 200,
      setHeader: jest.fn(),
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  let interceptor: LoggingInterceptor;
  let log: jest.SpyInstance;
  let errorLog: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    log.mockRestore();
    errorLog.mockRestore();
  });

  it('registra método, ruta, estado y duración', (done) => {
    const ctx = contexto('/api/solicitudes', 'GET', { id: 'u1' });
    const next: CallHandler = { handle: () => of({ ok: true }) };

    interceptor.intercept(ctx, next).subscribe({
      next: () => {
        const registro = JSON.parse(log.mock.calls[0][0] as string);
        expect(registro.tipo).toBe('peticion');
        expect(registro.metodo).toBe('GET');
        expect(registro.ruta).toBe('/api/solicitudes');
        expect(registro.estado).toBe(200);
        expect(registro.usuarioId).toBe('u1');
        expect(typeof registro.duracionMs).toBe('number');
        done();
      },
      error: done.fail,
    });
  });

  it('devuelve un identificador de petición en la cabecera', (done) => {
    const ctx = contexto('/api/convocatorias');
    const next: CallHandler = { handle: () => of({}) };

    interceptor.intercept(ctx, next).subscribe({
      next: () => {
        const response = ctx.switchToHttp().getResponse();
        expect(response.setHeader).toHaveBeenCalledWith(
          'X-Request-Id',
          expect.any(String),
        );
        done();
      },
      error: done.fail,
    });
  });

  it('reutiliza el identificador que envía el cliente', (done) => {
    const ctx = contexto('/api/convocatorias');
    const request = ctx.switchToHttp().getRequest();
    request.headers['x-request-id'] = 'abc-123';

    const next: CallHandler = { handle: () => of({}) };
    interceptor.intercept(ctx, next).subscribe({
      next: () => {
        const registro = JSON.parse(log.mock.calls[0][0] as string);
        expect(registro.requestId).toBe('abc-123');
        done();
      },
      error: done.fail,
    });
  });

  it('omite el cuerpo en las rutas sensibles', (done) => {
    const ctx = contexto('/api/auth/login', 'POST');
    const next: CallHandler = { handle: () => of({}) };

    interceptor.intercept(ctx, next).subscribe({
      next: () => {
        const registro = JSON.parse(log.mock.calls[0][0] as string);
        expect(registro.cuerpoOmitido).toBe(true);
        done();
      },
      error: done.fail,
    });
  });

  it('registra el error cuando la petición falla', (done) => {
    const ctx = contexto('/api/solicitudes', 'POST');
    const next: CallHandler = {
      handle: () => throwError(() => new Error('fallo interno')),
    };

    interceptor.intercept(ctx, next).subscribe({
      next: () => done.fail('deberia fallar'),
      error: () => {
        const registro = JSON.parse(errorLog.mock.calls[0][0] as string);
        expect(registro.resultado).toBe('error');
        expect(registro.error).toBe('fallo interno');
        done();
      },
    });
  });
});
