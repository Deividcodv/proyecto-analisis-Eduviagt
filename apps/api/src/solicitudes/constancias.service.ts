import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
  decision?: { resultado: string; fecha: Date } | null;
}

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
        decision: true,
      },
    })) as unknown as SolicitudConstancia;

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    this.authz.assertAcceso(solicitud, usuario);

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
    const fechaResolucion =
      solicitud.decision?.fecha ?? solicitud.updatedAt ?? new Date();

    const nivel =
      solicitud.perfilAcademico?.nivelAcademico?.nombre ??
      solicitud.perfilAcademico?.nivelAcademicoOtro ??
      null;

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
      <span>REPÚBLICA DE GUATEMALA</span>
      <strong>Ministerio de Educación</strong>
      <span>Dirección General de Becas</span>
    </div>
    <div class="sigeb">EDUVIAGT<br />Sistema Integral de Gestión de Becas</div>
  </div>

  <h1 class="titulo-doc">Constancia de Beca</h1>
  <div class="codigo-wrap"><span class="codigo">${escapeHtml(codigo)}</span></div>

  <p class="texto">
    El Ministerio de Educación de la República de Guatemala, a través de la
    Dirección General de Becas, <strong>HACE CONSTAR</strong> que el
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
    ${fila('Fecha de resolución', this.formatearFecha(fechaResolucion))}
  </table>

  <p class="texto">
    La presente constancia se emite en cumplimiento del Reglamento de Becas del
    Ministerio de Educación y de la resolución adoptada por el comité evaluador,
    según lo registrado en el Sistema Integral de Gestión de Becas (EDUVIAGT). La
    información contenida puede ser verificada por cualquier interesado a través
    de la página oficial del sistema.
  </p>

  <div class="firma">
    <div class="linea"></div>
    <strong>Autoridad competente</strong><br />
    Dirección General de Becas — Ministerio de Educación
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
      })
      .replace(/ de /g, ' de ');
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