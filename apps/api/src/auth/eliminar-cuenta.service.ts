import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BitacoraService } from '../bitacora/bitacora.service';
import {
  DOCUMENT_STORAGE,
  DocumentStorage,
} from '../storage/storage.interface';

export interface ResultadoEliminacion {
  /** Datos que se conservan, para poder explicárselo a la persona. */
  conservados: string[];
  /** Datos que se han borrado. */
  eliminados: string[];
  /** Correo seudónimo con el que queda la cuenta. */
  seudonimo: string;
}

/** Claves del detalle de auditoría que pueden contener datos personales. */
const CLAVES_PERSONALES = new Set([
  'cui',
  'email',
  'nombres',
  'nombre',
  'telefono',
  'direccion',
  'fechaNacimiento',
  'generoId',
]);

@Injectable()
export class EliminarCuentaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorage,
    private readonly audit: AuditService,
    private readonly bitacora: BitacoraService,
  ) {}

  /**
   * Elimina la cuenta de una persona.
   *
   * No se borra la fila del usuario: se anonimizan sus datos personales y se
   * conservan, con un seudónimo, los registros que hacen falta para poder
   * justificar las decisiones de beca ya tomadas (solicitudes, evaluaciones,
   * votos, decisiones, historial y auditoría).
   */
  async eliminar(
    usuarioId: string,
    contrasena: string,
    motivo?: string,
  ): Promise<ResultadoEliminacion> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: { rol: { select: { nombre: true } } },
    });

    if (!usuario) {
      throw new NotFoundException('La cuenta no existe');
    }

    if (usuario.eliminadoAt) {
      throw new BadRequestException('Esta cuenta ya fue eliminada');
    }

    // Verificación de identidad: sin la contraseña, cualquiera que encuentre
    // una sesión abierta podría borrar la cuenta.
    const coincide = await bcrypt.compare(contrasena, usuario.passwordHash);
    if (!coincide) {
      throw new UnauthorizedException('La contraseña no es correcta');
    }

    const seudonimo = this.generarSeudonimo(usuario.id);
    const emailSeudonimo = `eliminado+${seudonimo}@anonimo.invalid`;
    const cuiSeudonimo = `9${String(Math.abs(hashNumerico(usuario.id))).padStart(12, '0')}`;

    const solicitudes = await this.prisma.solicitud.findMany({
      where: { usuarioId },
      select: {
        id: true,
        documentos: { select: { id: true, archivoUrl: true } },
      },
    });

    const idsSolicitud = solicitudes.map((s) => s.id);
    const archivos = solicitudes.flatMap((s) =>
      s.documentos.map((d) => d.archivoUrl.replace('/storage/', '')),
    );

    await this.prisma.$transaction(async (tx) => {
      // 1. Documentos: se borran las filas y luego los archivos.
      await tx.solicitudDocumento.deleteMany({
        where: { solicitudId: { in: idsSolicitud } },
      });

      // 2. Perfiles: son datos personales y socioeconómicos de la persona.
      await tx.solicitudPerfilAcademico.updateMany({
        where: { solicitudId: { in: idsSolicitud } },
        data: {
          institucion: null,
          carrera: null,
          promedio: null,
          generoId: null,
          generoOtro: null,
          nivelAcademicoId: null,
          nivelAcademicoOtro: null,
          departamentoId: null,
          departamentoOtro: null,
          municipioId: null,
          municipioOtro: null,
        },
      });
      await tx.solicitudPerfilFinanciero.updateMany({
        where: { solicitudId: { in: idsSolicitud } },
        data: {
          ingresoFamiliar: null,
          numeroDependientes: null,
          descripcionSituacion: null,
        },
      });

      // 3. Permisos y preferencias: son de la cuenta, no del historial.
      await tx.usuarioPermiso.deleteMany({ where: { usuarioId } });
      await tx.configuracionUsuario.deleteMany({ where: { usuarioId } });

      // 4. Auditoría: se sanean los datos personales que quedaban en el
      //    detalle de las entradas, pero se conservan las entradas.
      await this.sanearAuditoria(tx, usuarioId);

      // 5. La cuenta: se anonimiza y se bloquea.
      await tx.usuario.update({
        where: { id: usuarioId },
        data: {
          nombres: `Usuario eliminado (${seudonimo})`,
          email: emailSeudonimo,
          cui: cuiSeudonimo,
          passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
          telefono: null,
          fechaNacimiento: null,
          direccion: null,
          generoId: null,
          departamentoId: null,
          municipioId: null,
          estado: 'INACTIVO',
          eliminadoAt: new Date(),
        },
      });
    });

    // 6. Los archivos se borran fuera de la transacción: el sistema de
    //    archivos no participa en ella y un fallo aquí no debe dejar la
    //    base de datos a medias.
    for (const key of archivos) {
      try {
        await this.storage.delete(key);
      } catch {
        // Si el archivo ya no estaba, no hay nada que hacer.
      }
    }

    await this.audit.log({
      usuarioId,
      accion: 'eliminar-cuenta',
      entidad: 'usuario',
      entidadId: usuarioId,
      detalle: { motivo: motivo ?? null, seudonimo },
    });

    await this.bitacora.registrar({
      actor: {
        id: usuario.id,
        nombre: `Usuario eliminado (${seudonimo})`,
        rol: usuario.rol?.nombre ?? 'SIN_ROL',
        correo: emailSeudonimo,
      },
      modulo: 'usuario',
      entidad: 'usuario',
      entidadId: usuarioId,
      accionClave: 'usuario.eliminar_cuenta',
      accionHumana: 'Eliminó su cuenta',
      descripcionHumana:
        motivo?.trim() ||
        'La persona eliminó su cuenta. Se anonimizaron sus datos personales.',
      resultado: 'EXITOSO',
      origen: 'WEB',
    });

    return {
      seudonimo: emailSeudonimo,
      eliminados: [
        'Nombre, correo, CUI, teléfono, fecha de nacimiento y dirección.',
        'Género, departamento y municipio.',
        'Perfiles académico y financiero de tus solicitudes.',
        'Los documentos que adjuntaste y sus archivos.',
        'Tus permisos y preferencias de notificación.',
      ],
      conservados: [
        'Tus solicitudes y el estado en que quedaron.',
        'Las evaluaciones, los votos y las decisiones de los comités.',
        'El historial de cambios de cada solicitud.',
        'La bitácora de auditoría, con la acción y su resultado.',
      ],
    };
  }

  /**
   * Sustituye por un seudónimo los datos personales que quedaban en el
   * detalle de las entradas de auditoría de la persona.
   */
  private async sanearAuditoria(
    tx: Prisma.TransactionClient,
    usuarioId: string,
  ): Promise<void> {
    const entradas = await tx.auditLog.findMany({
      where: { usuarioId },
      select: { id: true, detalle: true },
    });

    for (const entrada of entradas) {
      if (!entrada.detalle || typeof entrada.detalle !== 'object') continue;
      const saneado = { ...(entrada.detalle as Record<string, unknown>) };
      for (const clave of Object.keys(saneado)) {
        if (CLAVES_PERSONALES.has(clave)) saneado[clave] = null;
      }
      await tx.auditLog.update({
        where: { id: entrada.id },
        data: { detalle: saneado as Prisma.InputJsonValue },
      });
    }
  }

  /** Seudónimo estable y no reversible a partir de la cuenta. */
  private generarSeudonimo(usuarioId: string): string {
    return createHash('sha256')
      .update(usuarioId)
      .digest('hex')
      .slice(0, 10);
  }
}

function hashNumerico(valor: string): number {
  return createHash('sha256').update(valor).digest().readUInt32BE(0);
}
