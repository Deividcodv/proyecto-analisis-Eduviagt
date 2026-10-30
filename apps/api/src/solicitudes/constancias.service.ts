import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PDF_RENDERER, PdfRenderer } from './pdf/pdf-renderer.interface';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AuthzService } from '../common/services/authz.service';
import { SOLICITUD_ESTADO } from '../common/constants/estados';

interface SolicitudConstancia {
  id: string;
  usuarioId: string;
  estado: string;
  updatedAt: Date;
  usuario: { nombres: string; cui: string; email: string };
  convocatoria: { nombre: string; beca: { nombre: string } };
  perfilAcademico?: {
    institucion: string | null;
    carrera: string | null;
    promedio: number | null;
    nivelAcademico?: { nombre: string } | null;
    nivelAcademicoOtro?: string | null;
  } | null;
  decisiones?: { resultado: string; fecha: Date }[];
  montoAprobado?: Prisma.Decimal | number | null;
  montoOtorgable?: Prisma.Decimal | number | null;
  aprobaciones?: {
    nivel: number;
    accion: string;
    resultado: string;
    rolNombre: string;
    createdAt: Date;
    usuario?: { nombres: string } | null;
  }[];
  desembolso?: {
    estado: string;
    monto?: Prisma.Decimal | number | null;
    metodo?: string | null;
    banco?: string | null;
    numeroCuenta?: string | null;
    titular?: string | null;
    fechaPago?: Date | null;
  } | null;
}

const ETIQUETA_DESEMBOLSO: Record<string, string> = {
  PENDIENTE: 'Pendiente de gestionar',
  EN_TRAMITE: 'En trámite',
  PAGADO: 'Pagado',
  ANULADO: 'Anulado',
};

const ETIQUETA_METODO: Record<string, string> = {
  TRANSFERENCIA: 'Transferencia',
  CHEQUE: 'Cheque',
  EFECTIVO: 'Efectivo',
};

@Injectable()
export class ConstanciasService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PDF_RENDERER) private readonly renderer: PdfRenderer,
    private readonly authz: AuthzService,
  ) {}

  async generarConstancia(
    id: string,
    usuario: AuthenticatedUser,
  ): Promise<Buffer> {
    const solicitud = (await this.prisma.solicitud.findUnique({
      where: { id },
      include: {
        usuario: true,
        convocatoria: { include: { beca: true } },
        perfilAcademico: { include: { nivelAcademico: true } },
        // La más reciente es la decisión vigente: la solicitud puede tener
        // más de una si volvió a revisión.
        decisiones: { orderBy: { fecha: 'desc' } },
        // Para dejar constancia de quién firmó y de cómo se entregó el dinero.
        aprobaciones: {
          orderBy: { createdAt: 'asc' },
          include: { usuario: { select: { nombres: true } } },
        },
        desembolso: true,
      },
    })) as unknown as SolicitudConstancia;

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    this.authz.assertAccesoPersonal(solicitud, usuario);

    if (solicitud.estado !== SOLICITUD_ESTADO.APROBADA) {
      throw new BadRequestException(
        'La constancia solo está disponible para solicitudes aprobadas',
      );
    }

    const html = this.renderHtml(solicitud);
    return this.renderer.render(html);
  }

  private renderHtml(solicitud: SolicitudConstancia): string {
    const codigo = `EDUVIAGT-${solicitud.id.slice(0, 8).toUpperCase()}`;
    // La decisión vigente es la más reciente: la solicitud puede tener más
    // de una si volvió a revisión. No se depende del orden del arreglo.
    const decisionVigente = (solicitud.decisiones ?? []).reduce<
      { resultado: string; fecha: Date } | null
    >((vigente, d) => (!vigente || d.fecha > vigente.fecha ? d : vigente), null);
    const fechaResolucion =
      decisionVigente?.fecha ?? solicitud.updatedAt ?? new Date();

    const nivel =
      solicitud.perfilAcademico?.nivelAcademico?.nombre ??
      solicitud.perfilAcademico?.nivelAcademicoOtro ??
      null;

    // Monto aprobado y estado del pago.
    const monto = solicitud.montoAprobado ?? solicitud.montoOtorgable ?? null;
    const montoAprobado = monto != null ? `Q${monto}` : null;
    const estadoPago = solicitud.desembolso
      ? ETIQUETA_DESEMBOLSO[solicitud.desembolso.estado] ??
        solicitud.desembolso.estado
      : 'Pendiente de gestionar';
    const formaEntrega = solicitud.desembolso?.metodo
      ? `${ETIQUETA_METODO[solicitud.desembolso.metodo]}${
          solicitud.desembolso.banco
            ? ` · ${solicitud.desembolso.banco}${
                solicitud.desembolso.numeroCuenta
                  ? ` · cuenta ${solicitud.desembolso.numeroCuenta}`
                  : ''
              }`
            : ''
        }${
          solicitud.desembolso.titular
            ? ` · titular ${solicitud.desembolso.titular}`
            : ''
        }`
      : null;
    const fechaPago = solicitud.desembolso?.fechaPago
      ? this.formatearFecha(solicitud.desembolso.fechaPago)
      : null;

    // Quién firmó: la última aprobación registrada.
    const aprobaciones = solicitud.aprobaciones ?? [];
    const ultima = [...aprobaciones].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];
    const firmante = {
      nombre: ultima?.usuario?.nombres ?? 'Autoridad competente',
      cargo: ultima?.rolNombre
        ? `Cargo: ${ultima.rolNombre.replace(/_/g, ' ')}`
        : 'Autoridad competente · EDUVIAGT',
      nivel: ultima?.nivel ?? 1,
    };

    const fila = (
      etiqueta: string,
      valor: string | number | null | undefined,
    ) => `<tr><td class="etiqueta">${escapeHtml(etiqueta)}</td>
      <td class="valor">${valor == null || valor === '' ? '—' : escapeHtml(String(valor))}</td></tr>`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    color: #1c2530;
    margin: 0;
    line-height: 1.5;
  }
  .encabezado {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid #0f3d63;
    padding-bottom: 10px;
  }
  .mineduc { font-size: 12px; color: #0f3d63; letter-spacing: 1px; }
  .mineduc strong { display: block; font-size: 18px; }
  .sigeb { font-size: 11px; color: #6b7280; text-align: right; }
  .titulo-doc {
    text-align: center;
    margin: 26px 0 6px;
    font-size: 17px;
    letter-spacing: 1px;
    color: #0f3d63;
    text-transform: uppercase;
  }
  .codigo {
    text-align: center;
    font-size: 12px;
    color: #0f3d63;
    border: 1px solid #0f3d63;
    display: inline-block;
    padding: 4px 14px;
    border-radius: 20px;
  }
  .codigo-wrap { text-align: center; margin: 8px 0 22px; }
  .texto { font-size: 13px; text-align: justify; }
  .texto .beneficiario {
    font-size: 16px;
    font-weight: bold;
    color: #0f3d63;
  }
  table.datos {
    width: 100%;
    border-collapse: collapse;
    margin: 22px 0;
    font-size: 13px;
  }
  table.datos td {
    border: 1px solid #d1d5db;
    padding: 8px 12px;
    background: #f8fafc;
  }
  table.datos td.etiqueta {
    width: 34%;
    font-weight: bold;
    background: #eef4f9;
    color: #0f3d63;
  }
  .resolucion {
    margin: 10px 0 26px;
    padding: 14px 18px;
    border-left: 4px solid #0f3d63;
    background: #f8fafc;
    font-size: 13px;
    text-align: justify;
  }
  .firma {
    margin-top: 48px;
    text-align: center;
    font-size: 13px;
  }
  .firma .linea {
    border-top: 1px solid #1c2530;
    width: 55%;
    margin: 42px auto 8px;
  }
  .firma .sello {
    display: inline-block;
    margin-top: 10px;
    padding: 4px 10px;
    border: 2px solid #1c2530;
    border-radius: 4px;
    font-family: monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
  }
  .pie {
    margin-top: 34px;
    border-top: 1px solid #d1d5db;
    padding-top: 10px;
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #6b7280;
  }
</style>
</head>
<body>
  <div class="encabezado">
    <div class="mineduc">
      <span>PROTOTIPO ACADÉMICO</span>
      <strong>EDUVIAGT</strong>
      <span>Sistema de gestión de becas</span>
    </div>
    <div class="sigeb">EDUVIAGT<br />Sistema Integral de Gestión de Becas</div>
  </div>

  <h1 class="titulo-doc">Constancia de Beca</h1>
  <div class="codigo-wrap"><span class="codigo">${escapeHtml(codigo)}</span></div>

  <p class="texto">
    El sistema EDUVIAGT, en su versión de prototipo académico,
    <strong>HACE CONSTAR</strong> que el
    postulante <strong class="beneficiario">${escapeHtml(solicitud.usuario.nombres)}</strong>,
    con CUI <strong>${escapeHtml(solicitud.usuario.cui)}</strong>, ha sido
    <strong>beneficiario(a) de una beca otorgada en el marco de la convocatoria
    «${escapeHtml(solicitud.convocatoria.nombre)}»</strong> del programa
    «${escapeHtml(solicitud.convocatoria.beca.nombre)}», aprobada por el comité
    evaluador correspondiente.
  </p>

  <table class="datos">
    ${fila('Número de constancia', codigo)}
    ${fila('Nombre del beneficiario', solicitud.usuario.nombres)}
    ${fila('CUI', solicitud.usuario.cui)}
    ${fila('Correo electrónico', solicitud.usuario.email)}
    ${fila('Institución educativa', solicitud.perfilAcademico?.institucion)}
    ${fila('Nivel académico', nivel)}
    ${fila('Carrera / programa', solicitud.perfilAcademico?.carrera)}
    ${fila('Promedio acumulado', solicitud.perfilAcademico?.promedio)}
    ${fila('Programa de beca', solicitud.convocatoria.beca.nombre)}
    ${fila('Convocatoria', solicitud.convocatoria.nombre)}
    ${fila('Monto aprobado', montoAprobado)}
    ${fila('Estado del pago', estadoPago)}
    ${fila('Forma de entrega', formaEntrega)}
    ${fila('Fecha de resolución', this.formatearFecha(fechaResolucion))}
    ${fila('Fecha del pago', fechaPago)}
  </table>

  <p class="texto">
    La presente constancia se emite a partir de la resolución adoptada por el
    comité evaluador, según lo registrado en el Sistema Integral de Gestión de
    Becas (EDUVIAGT), y deja constancia del monto aprobado y de la forma en que
    fue entregado.
  </p>

  <div class="firma">
    <div class="linea"></div>
    <strong>${escapeHtml(firmante.nombre)}</strong><br />
    ${escapeHtml(firmante.cargo)}<br />
    Firmada el ${escapeHtml(this.formatearFecha(fechaResolucion))}
    ${firmante.nivel > 1 ? '· Segunda instancia de aprobación' : ''}
    <div class="sello">EDUVIAGT · ${escapeHtml(codigo)}</div>
  </div>
  <div class="pie">
    <span>Documento generado electrónicamente por EDUVIAGT</span>
    <span>${escapeHtml(codigo)} · ${escapeHtml(this.formatearFecha(new Date()))}</span>
  </div>
</body>
</html>`;
  }

  private formatearFecha(fecha: Date): string {
    return fecha
      .toLocaleDateString('es-GT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
  }
}

function escapeHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}