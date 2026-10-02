import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AsistenteIAProxy } from './asistente.proxy';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@Injectable()
export class AsistenteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly proxy: AsistenteIAProxy,
  ) {}

  async preguntar(pregunta: string, usuario?: AuthenticatedUser | null) {
    const resp = await this.proxy.responder(pregunta, {
      rol: usuario?.rol?.nombre ?? null,
      sesionId: null,
    });

    const conversacion = await this.prisma.asistenteConversacion.create({
      data: {
        usuarioId: usuario?.id ?? null,
        sesionId: null,
      },
    });

    await this.prisma.asistenteMensaje.createMany({
      data: [
        {
          conversacionId: conversacion.id,
          rol: 'usuario',
          contenido: pregunta,
        },
        {
          conversacionId: conversacion.id,
          rol: 'asistente',
          contenido: resp.respuesta,
          contexto: { fuentes: resp.fuentes },
        },
      ],
    });

    return { respuesta: resp.respuesta, fuentes: resp.fuentes };
  }
}