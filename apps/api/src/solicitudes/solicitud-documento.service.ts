import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthzService } from '../common/services/authz.service';
import {
  DOCUMENT_STORAGE,
  DocumentStorage,
} from '../storage/storage.interface';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import {
  SOLICITUD_ESTADO,
  DOCUMENTO_ESTADO,
} from '../common/constants/estados';
import { ROL } from '../common/constants/roles';

@Injectable()
export class SolicitudDocumentoService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorage,
    private readonly audit: AuditService,
    private readonly authz: AuthzService,
  ) {}

  async subir(
    id: string,
    tipoId: string,
    file: Express.Multer.File,
    usuario: AuthenticatedUser,
  ) {
    const solicitud = await this.obtainEditable(id, usuario);

    const tipo = await this.prisma.documentoTipo.findUnique({
      where: { id: tipoId },
    });
    if (!tipo) {
      throw new NotFoundException(
        `Tipo de documento con id ${tipoId} no encontrado`,
      );
    }

    const convocatoria = await this.prisma.convocatoria.findUnique({
      where: { id: solicitud.convocatoriaId },
      include: { documentosRequeridos: true },
    });
    if (!convocatoria) {
      throw new NotFoundException('Convocatoria no encontrada');
    }

    const aplica = convocatoria.documentosRequeridos.some(
      (dr) => dr.documentoTipoId === tipoId,
    );
    if (!aplica) {
      throw new BadRequestException(
        'El tipo de documento no aplica a esta convocatoria',
      );
    }

    const anterior = await this.prisma.solicitudDocumento.findFirst({
      where: { solicitudId: id, documentoTipoId: tipoId },
      orderBy: { version: 'desc' },
    });

    const stored = await this.storage.save(file.buffer, {
      folder: `solicitudes/${id}`,
      name: file.originalname,
      contentType: file.mimetype,
    });

    const nuevo = await this.prisma.solicitudDocumento.create({
      data: {
        solicitudId: id,
        documentoTipoId: tipoId,
        archivoUrl: stored.url,
        estado: DOCUMENTO_ESTADO.CARGADO,
        comentarioRechazo: null,
        version: (anterior?.version ?? 0) + 1,
      },
      include: { documentoTipo: true },
    });

    if (anterior) {
      try {
        await this.storage.delete(anterior.archivoUrl.replace('/storage/', ''));
      } catch {
        // El archivo anterior ya no existe; se ignora.
      }
    }

    return nuevo;
  }

  async eliminar(id: string, tipoId: string, usuario: AuthenticatedUser) {
    await this.obtainEditable(id, usuario);

    const doc = await this.prisma.solicitudDocumento.findFirst({
      where: { solicitudId: id, documentoTipoId: tipoId },
      orderBy: { version: 'desc' },
    });

    if (!doc) {
      throw new NotFoundException('No hay documento cargado para este tipo');
    }

    await this.prisma.solicitudDocumento.delete({ where: { id: doc.id } });

    try {
      await this.storage.delete(doc.archivoUrl.replace('/storage/', ''));
    } catch {
      // El archivo ya no existe; se ignora.
    }

    return { eliminado: true };
  }

  async marcarEstado(
    id: string,
    tipoId: string,
    estado: 'RECHAZADO',
    comentario: string | undefined,
    usuario: AuthenticatedUser,
  ) {
    const esRevisor =
      this.authz.esAdmin(usuario) ||
      usuario.rol?.nombre === ROL.COORDINADOR_COMITE;
    if (!esRevisor) {
      throw new ForbiddenException(
        'Solo administradores o el coordinador del comité pueden rechazar documentos',
      );
    }

    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id },
    });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    const doc = await this.prisma.solicitudDocumento.findFirst({
      where: { solicitudId: id, documentoTipoId: tipoId },
      orderBy: { version: 'desc' },
    });

    if (!doc) {
      throw new NotFoundException('No hay documento cargado para este tipo');
    }

    const actualizado = await this.prisma.solicitudDocumento.update({
      where: { id: doc.id },
      data: {
        estado,
        comentarioRechazo: comentario?.trim() ? comentario.trim() : null,
      },
      include: { documentoTipo: true },
    });

    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'cambiar-estado-documento',
      entidad: 'documento',
      entidadId: id,
      detalle: {
        tipoId,
        estado,
        version: doc.version,
        comentario: actualizado.comentarioRechazo,
      },
    });

    return actualizado;
  }

  private async obtainEditable(id: string, usuario: AuthenticatedUser) {
    const solicitud = await this.prisma.solicitud.findUnique({ where: { id } });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    if (!this.authz.esAdmin(usuario) && solicitud.usuarioId !== usuario.id) {
      throw new ForbiddenException('No tienes acceso a esta solicitud');
    }

    if (!this.authz.esAdmin(usuario) && solicitud.estado !== SOLICITUD_ESTADO.BORRADOR) {
      throw new BadRequestException(
        'Solo se puede editar la solicitud en estado BORRADOR',
      );
    }

    return solicitud;
  }
}
