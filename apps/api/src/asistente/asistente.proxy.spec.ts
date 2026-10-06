import { AsistenteIAProxy } from './asistente.proxy';
import { RespuestaIA } from './asistente.types';

describe('AsistenteIAProxy (US-38)', () => {
  let config: { get: jest.Mock };
  let fallback: { responder: jest.Mock };
  let openai: { responder: jest.Mock };
  let proxy: AsistenteIAProxy;

  const ctx = { rol: 'POSTULANTE', sesionId: null };

  beforeEach(() => {
    config = { get: jest.fn().mockReturnValue(undefined) };
    fallback = { responder: jest.fn() };
    openai = { responder: jest.fn() };
    /* eslint-disable @typescript-eslint/no-explicit-any */
    proxy = new AsistenteIAProxy(
      config as any,
      fallback as any,
      openai as any,
    );
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });

  it('sin AI_API_KEY usa el fallback por KB y no toca el LLM', async () => {
    fallback.responder.mockResolvedValue({ respuesta: 'desde kb', fuentes: [] } as RespuestaIA);

    const r = await proxy.responder('hola', ctx);

    expect(r).toEqual({ respuesta: 'desde kb', fuentes: [] });
    expect(fallback.responder).toHaveBeenCalledWith('hola', ctx);
    expect(openai.responder).not.toHaveBeenCalled();
  });

  it('con AI_API_KEY usa el LLM y devuelve su respuesta', async () => {
    config.get.mockImplementation((k: string) => (k === 'AI_API_KEY' ? 'sk-test' : undefined));
    openai.responder.mockResolvedValue({ respuesta: 'desde llm', fuentes: [] } as RespuestaIA);

    const r = await proxy.responder('hola', ctx);

    expect(openai.responder).toHaveBeenCalledWith('hola', ctx);
    expect(r.respuesta).toBe('desde llm');
  });

  it('degradación: si el LLM falla, responde con el fallback', async () => {
    config.get.mockImplementation((k: string) => (k === 'AI_API_KEY' ? 'sk-test' : undefined));
    openai.responder.mockRejectedValue(new Error('timeout'));
    fallback.responder.mockResolvedValue({ respuesta: 'respuesta degradada', fuentes: [] } as RespuestaIA);

    const r = await proxy.responder('hola', ctx);

    expect(r.respuesta).toBe('respuesta degradada');
    expect(fallback.responder).toHaveBeenCalledWith('hola', ctx);
  });
});