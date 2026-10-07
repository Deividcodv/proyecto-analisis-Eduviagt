import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificacionPayload {
  usuarioId: string;
  tipo: string;
  titulo: string;
  cuerpo?: string;
}

export interface EventoNotificacion {
  id: string | null;
  usuarioId: string;
  tipo: string;
  titulo: string;
  cuerpo?: string | null;
  createdAt?: string;
  bulk?: boolean;
}

export interface ListaNotificaciones {
  total: number;
  page: number;
  pageSize: number;
  items: {
    id: string;
    tipo: string;
    titulo: string;
    cuerpo: string | null;
    leidaAt: Date | null;
    createdAt: Date;
  }[];
}

@Injectable()
export class NotificacionesService {
  private readonly conexiones = new Map<string, number>();
  private readonly subjects = new Map<string, Subject<EventoNotificacion>>();

  constructor(private readonly prisma: PrismaService) {}

  streamParaUsuario(usuarioId: string): Observable<EventoNotificacion> {
    let subject = this.subjects.get(usuarioId);
    if (!subject) {
      subject = new Subject<EventoNotificacion>();
      this.subjects.set(usuarioId, subject);
    }
    this.conexiones.set(usuarioId, (this.conexiones.get(usuarioId) ?? 0) + 1);

    return subject.asObservable().pipe(
      finalize(() => {
        const restantes = (this.conexiones.get(usuarioId) ?? 1) - 1;
        if (restantes <= 0) {
          this.conexiones.delete(usuarioId);
          this.subjects.delete(usuarioId);
          subject?.complete();
        } else {
          this.conexiones.set(usuarioId, restantes);
        }
      }),
    );
  }

  private emitir(evento: EventoNotificacion): void {
    this.subjects.get(evento.usuarioId)?.next(evento);
  }

  async crear(payload: NotificacionPayload) {
    const notificacion = await this.prisma.notificacion.create({
      data: {
        usuarioId: payload.usuarioId,
        tipo: payload.tipo,
        titulo: payload.titulo,
        cuerpo: payload.cuerpo ?? null,
      },
    });

    this.emitir({
      id: notificacion.id,
      usuarioId: notificacion.usuarioId,
      tipo: notificacion.tipo,
      titulo: notificacion.titulo,
      cuerpo: notificacion.cuerpo,
      createdAt: notificacion.createdAt.toISOString(),
    });

    return notificacion;
  }

  async crearParaVarios(
    usuarioIds: string[],
    payload: Omit<NotificacionPayload, 'usuarioId'>,
  ): Promise<void> {
    const destinatarios = [...new Set(usuarioIds)];
    if (destinatarios.length === 0) return;

    await this.prisma.notificacion.createMany({
      data: destinatarios.map((usuarioId) => ({
        usuarioId,
        tipo: payload.tipo,
        titulo: payload.titulo,
        cuerpo: payload.cuerpo ?? null,
      })),
    });

    for (const usuarioId of destinatarios) {
      this.emitir({
        id: null,
        usuarioId,
        tipo: payload.tipo,
        titulo: payload.titulo,
        cuerpo: payload.cuerpo ?? null,
        bulk: true,
      });
    }
  }

  async notificarUsuario(
    usuarioId: string,
    payload: Omit<NotificacionPayload, 'usuarioId'>,
  ) {
    return this.crear({ usuarioId, ...payload });
  }

  async notificarRoles(
    roles: string[],
    payload: Omit<NotificacionPayload, 'usuarioId'>,
  ): Promise<void> {
    const usuarios = await this.prisma.usuario.findMany({
      where: { estado: 'ACTIVO', rol: { nombre: { in: roles } } },
      select: { id: true },
    });
    await this.crearParaVarios(
      usuarios.map((u) => u.id),
      payload,
    );
  }

  async listar(
    usuarioId: string,
    page = 1,
    pageSize = 20,
  ): Promise<ListaNotificaciones> {
    const pagina = Math.max(1, page);
    const tamano = Math.min(100, Math.max(1, pageSize));

    const [total, items] = await this.prisma.$transaction([
      this.prisma.notificacion.count({ where: { usuarioId } }),
      this.prisma.notificacion.findMany({
        where: { usuarioId },
        orderBy: { createdAt: 'desc' },
        skip: (pagina - 1) * tamano,
        take: tamano,
        select: {
          id: true,
          tipo: true,
          titulo: true,
          cuerpo: true,
          leidaAt: true,
          createdAt: true,
        },
      }),
    ]);

    return { total, page: pagina, pageSize: tamano, items };
  }

  async noLeidas(usuarioId: string): Promise<number> {
    return this.prisma.notificacion.count({
      where: { usuarioId, leidaAt: null },
    });
  }

  async marcarLeida(id: string, usuarioId: string) {
    return this.prisma.notificacion.updateMany({
      where: { id, usuarioId },
      data: { leidaAt: new Date() },
    });
  }

  async marcarTodasLeidas(usuarioId: string) {
    return this.prisma.notificacion.updateMany({
      where: { usuarioId, leidaAt: null },
      data: { leidaAt: new Date() },
    });
  }
}
