import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface EntradaAudit {
  usuarioId: string;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  detalle?: Record<string, unknown> | null;
  ip?: string | null;
}

export interface FiltrosAudit {
  entidad?: string;
  accion?: string;
  usuarioId?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  limit?: number;
}

export type AuditClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(e: EntradaAudit, client?: AuditClient) {
    const db = client ?? this.prisma;
    return db.auditLog.create({
      data: {
        usuarioId: e.usuarioId,
        accion: e.accion,
        entidad: e.entidad,
        entidadId: e.entidadId ?? null,
        detalle: e.detalle ? (e.detalle as object) : undefined,
        ip: e.ip ?? null,
      },
    });
  }

  async listar(f: FiltrosAudit) {
    const where: Record<string, unknown> = {};
    if (f.entidad) where.entidad = f.entidad;
    if (f.accion) where.accion = f.accion;
    if (f.usuarioId) where.usuarioId = f.usuarioId;
    if (f.desde || f.hasta) {
      const fecha: { gte?: Date; lte?: Date } = {};
      if (f.desde) fecha.gte = new Date(f.desde);
      if (f.hasta) fecha.lte = new Date(f.hasta);
      where.createdAt = fecha;
    }

    const page = Math.max(f.page ?? 1, 1);
    const limit = Math.min(Math.max(f.limit ?? 50, 1), 200);

    const [total, items] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          usuario: {
            select: {
              nombres: true,
              email: true,
              rol: { select: { nombre: true } },
            },
          },
        },
      }),
    ]);

    return { total, page, limit, items };
  }
}