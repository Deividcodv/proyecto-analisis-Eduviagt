import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../common/services/authz.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { DOCUMENTO_ESTADO } from '../common/constants/estados';

@Injectable()
export class SolicitudChecklistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  async obtener(id: string, usuario: AuthenticatedUser) {
    const solicitud = await this.prisma.solicitud.findUnique({
      where: { id },
      include: {
        convocatoria: {
          include: {
            documentosRequeridos: { include: { documentoTipo: true } },
          },
        },
        perfilAcademico: true,
        perfilFinanciero: true,
        documentos: { include: { documentoTipo: true } },
      },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    this.authz.assertAcceso(solicitud, usuario);

    const perfilAcademicoOk =
      Boolean(
        solicitud.perfilAcademico?.generoId ||
          solicitud.perfilAcademico?.generoOtro,
      ) &&
      Boolean(
        solicitud.perfilAcademico?.nivelAcademicoId ||
          solicitud.perfilAcademico?.nivelAcademicoOtro,
      );
    const perfilFinancieroOk = Boolean(
      solicitud.perfilFinanciero?.ingresoFamiliar != null,
    );

    const ultimosPorTipo = new Map<
      string,
      (typeof solicitud.documentos)[number]
    >();
    for (const doc of solicitud.documentos) {
      const actual = ultimosPorTipo.get(doc.documentoTipoId);
      if (!actual || doc.version > actual.version) {
        ultimosPorTipo.set(doc.documentoTipoId, doc);
      }
    }

    const documentos = solicitud.convocatoria.documentosRequeridos.map(
      (dr) => {
        const ultimo = ultimosPorTipo.get(dr.documentoTipoId);
        const estado = ultimo?.estado ?? DOCUMENTO_ESTADO.PENDIENTE;
        const cargado = estado === DOCUMENTO_ESTADO.CARGADO;
        return {
          documentoTipoId: dr.documentoTipoId,
          nombre: dr.documentoTipo.nombre,
          obligatorio: dr.obligatorio,
          cargado,
          estado,
          version: ultimo?.version ?? 0,
          comentarioRechazo: ultimo?.comentarioRechazo ?? null,
          archivoUrl: cargado ? ultimo!.archivoUrl : null,
        };
      },
    );

    const pendientes: string[] = [];
    if (!perfilAcademicoOk) {
      pendientes.push('Perfil académico incompleto (género y nivel académico)');
    }
    if (!perfilFinancieroOk) {
      pendientes.push('Perfil financiero incompleto (ingreso familiar requerido)');
    }

    const respuestas = (solicitud.respuestas as Record<
      string,
      Record<string, unknown>
    > | null) ?? {};

    const camposExtra = this.leerCampos(solicitud.formularioSnapshot);
    for (const campo of camposExtra) {
      if (!campo.requerido) continue;
      const valor = respuestas?.[campo.seccion]?.[campo.id];
      const vacio =
        valor === undefined ||
        valor === null ||
        (typeof valor === 'string' && valor.trim() === '');
      if (vacio) {
        pendientes.push(`Campo "${campo.etiqueta}" pendiente`);
      }
    }

    for (const documento of documentos) {
      if (!documento.obligatorio) continue;
      if (documento.estado === DOCUMENTO_ESTADO.RECHAZADO && documento.comentarioRechazo) {
        pendientes.push(
          `Documento "${documento.nombre}" rechazado: ${documento.comentarioRechazo}`,
        );
      } else if (!documento.cargado) {
        pendientes.push(`Documento "${documento.nombre}" pendiente`);
      }
    }

    return {
      solicitudId: id,
      estado: solicitud.estado,
      perfilAcademico: perfilAcademicoOk,
      perfilFinanciero: perfilFinancieroOk,
      camposExtra,
      documentos,
      pendientes,
      completo: pendientes.length === 0,
    };
  }

  private leerCampos(snapshot: unknown): {
    id: string;
    seccion: string;
    etiqueta: string;
    tipo: string;
    requerido: boolean;
    opciones?: string[];
    ayuda?: string;
    documentoTipoId?: string;
  }[] {
    if (!Array.isArray(snapshot)) return [];
    const items = snapshot as unknown as Record<string, unknown>[];
    return items
      .filter((c) => c && typeof c === 'object')
      .map((c) => ({
        id: String(c.id),
        seccion: String(c.seccion ?? 'adicional'),
        etiqueta: String(c.etiqueta ?? c.id),
        tipo: String(c.tipo ?? 'texto'),
        requerido: Boolean(c.requerido),
        ...(Array.isArray(c.opciones)
          ? { opciones: c.opciones.map((o) => String(o)) }
          : {}),
        ...(c.ayuda ? { ayuda: String(c.ayuda) } : {}),
        ...(c.documentoTipoId
          ? { documentoTipoId: String(c.documentoTipoId) }
          : {}),
      }));
  }
}
