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

export interface DocumentoDescargable {
  buffer: Buffer;
  nombreArchivo: string;
  contentType: string;
}

@Injectable()
export class SolicitudDocumentoService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorage,
    private readonly audit: AuditService,
    private readonly authz: AuthzService,
  ) {}

  /**
   * Devuelve el archivo de un documento para que lo descargue quien lo
   * consulta.
   *
   * Los archivos ya no se sirven como estáticos (`/storage`): cada descarga
   * pasa por aquí, se comprueba que el documento pertenece a la solicitud
   * indicada y que quien pregunta es el dueño del expediente o alguien que
   * participa en su revisión.
   */
  async descargar(
    solicitudId: string,
    documentoId: string,
    usuario: AuthenticatedUser,
  ): Promise<DocumentoDescargable> {
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
      select: { id: true, usuarioId: true },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${solicitudId} no encontrada`);
    }

    const esDueño = solicitud.usuarioId === usuario.id;
    if (!esDueño && !this.authz.esRevisor(usuario)) {
      throw new ForbiddenException(
        'No tienes acceso a los documentos de esta solicitud',
      );
    }

    const documento = await this.prisma.solicitudDocumento.findFirst({
      where: { id: documentoId, solicitudId },
      include: { documentoTipo: { select: { nombre: true } } },
    });

    if (!documento) {
      throw new NotFoundException(
        `Documento con id ${documentoId} no encontrado en la solicitud`,
      );
    }

    const key = documento.archivoUrl.replace('/storage/', '');
    const buffer = await this.storage.read(key);

    await this.audit.log({
      usuarioId: usuario.id,
      accion: 'descargar-documento',
      entidad: 'documento',
      entidadId: documento.id,
      detalle: { solicitudId, tipo: documento.documentoTipo.nombre },
    });

    return {
      buffer,
      nombreArchivo: `${sugerirNombreArchivo(documento.documentoTipo.nombre, key)}`,
      contentType: deducirContentType(key),
    };
  }

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

/** Convierte el nombre del tipo de documento en un nombre de archivo seguro. */
function sugerirNombreArchivo(nombreTipo: string, key: string): string {
  const extension = key.includes('.') ? key.slice(key.lastIndexOf('.')) : '';
  // Se separan los diacríticos combinantes (U+0300-U+036F) para que el nombre
  // del archivo sea portable: "Certificado académico" -> "certificado-academico".
  const sinDiacriticos = Array.from(nombreTipo.normalize('NFD'))
    .filter((caracter) => {
      const codigo = caracter.codePointAt(0) ?? 0;
      return codigo < 0x300 || codigo > 0x36f;
    })
    .join('');
  const base = sinDiacriticos
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${base || 'documento'}${extension}`;
}

/** Deduce el tipo MIME a partir de la extensión del archivo guardado. */
function deducirContentType(key: string): string {
  const extension = key.includes('.') ? key.slice(key.lastIndexOf('.') + 1).toLowerCase() : '';
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}
