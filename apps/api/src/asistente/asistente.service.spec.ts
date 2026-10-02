import { AsistenteService } from './asistente.service';
import { AsistenteIAProxy } from './asistente.proxy';
import { RespuestaIA } from './asistente.types';

describe('AsistenteService (US-37)', () => {
  let prisma: any;
  let proxy: { responder: jest.Mock };
  let service: AsistenteService;

  beforeEach(() => {
    prisma = {
      asistenteConversacion: { create: jest.fn() },
      asistenteMensaje: { createMany: jest.fn() },
    };
    proxy = { responder: jest.fn() };
    service = new AsistenteService(prisma, proxy as unknown as AsistenteIAProxy);
  });

  it('responde usando el proxy y persiste la conversación anónima', async () => {
    proxy.responder.mockResolvedValue({
      respuesta: 'Aquí tienes lo que sé...',
      fuentes: ['Requisitos generales para postular'],
    } as RespuestaIA);
    prisma.asistenteConversacion.create.mockResolvedValue({ id: 'conv1' });

    const r = await service.preguntar('¿cuáles son los requisitos?');

    expect(proxy.responder).toHaveBeenCalledWith('¿cuáles son los requisitos?', {
      rol: null,
      sesionId: null,
    });
    expect(prisma.asistenteConversacion.create).toHaveBeenCalledWith({
      data: { usuarioId: null, sesionId: null },
    });
    expect(prisma.asistenteMensaje.createMany).toHaveBeenCalledWith({
      data: [
        { conversacionId: 'conv1', rol: 'usuario', contenido: '¿cuáles son los requisitos?' },
        {
          conversacionId: 'conv1',
          rol: 'asistente',
          contenido: 'Aquí tienes lo que sé...',
          contexto: { fuentes: ['Requisitos generales para postular'] },
        },
      ],
    });
    expect(r.respuesta).toContain('Aquí tienes lo que sé');
    expect(r.fuentes).toEqual(['Requisitos generales para postular']);
  });

  it('vincula la conversación al usuario autenticado', async () => {
    proxy.responder.mockResolvedValue({
      respuesta: 'Hola',
      fuentes: [],
    } as RespuestaIA);
    prisma.asistenteConversacion.create.mockResolvedValue({ id: 'conv2' });

    const usuario = {
      id: 'u1',
      cui: '1234567890123',
      nombres: 'X',
      email: 'x@y.gt',
      rol: { id: 'r1', nombre: 'POSTULANTE', descripcion: null },
    };

    await service.preguntar('hola', usuario);

    expect(prisma.asistenteConversacion.create).toHaveBeenCalledWith({
      data: { usuarioId: 'u1', sesionId: null },
    });
  });
});