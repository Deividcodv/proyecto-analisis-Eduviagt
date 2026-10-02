import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProveedorIA, RespuestaIA, ContextoIA } from '../asistente.types';

const STOPWORDS = new Set([
  'los', 'las', 'une', 'una', 'uno', 'unas', 'unos', 'para', 'son', 'eres', 'esos', 'esas',
  'este', 'esta', 'esto', 'estos', 'estas', 'que', 'cual', 'como', 'cuando', 'donde',
  'puedo', 'puedes', 'puede', 'debe', 'debes', 'tiene', 'tienen', 'hay', 'fue', 'con',
  'por', 'del', 'al', 'se', 'su', 'sus', 'mi', 'mis', 'sobre', 'entre', 'desde', 'hasta',
]);

function normalizar(pregunta: string) {
  return pregunta
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñ\s]/gi, ' ');
}

function soloTerminos(pregunta: string) {
  return normalizar(pregunta)
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .join(' ');
}

@Injectable()
export class FallbackProveedor implements ProveedorIA {
  readonly nombre = 'fallback-kb';

  constructor(private readonly prisma: PrismaService) {}

  async responder(pregunta: string, contexto: ContextoIA): Promise<RespuestaIA> {
    const consulta = soloTerminos(pregunta);

    if (consulta.length === 0) {
      return {
        respuesta:
          'Hazme una pregunta sobre las becas, el proceso de postulación, los documentos requeridos o las convocatorias.',
        fuentes: [],
      };
    }

    const filas = await this.buscarEnKb(consulta);

    if (filas.length === 0) {
      return {
        respuesta:
          'No encontré información específica sobre eso. Puedo orientarte sobre: requisitos y documentos, cómo postular, estados de la solicitud, evaluación, convocatorias y resultados.',
        fuentes: [],
      };
    }

    const cuerpo = filas
      .map(
        (f, i) =>
          `${i + 1}. ${f.titulo}: ${f.contenido
            .split('\n')[0]
            .replace(/[ \t\r]+/g, ' ')
            .trim()}`,
      )
      .join('\n');

    const nota =
      contexto.rol && contexto.rol !== 'POSTULANTE'
        ? '\n\nSi eres personal del Ministerio y necesitas más detalle, usa las herramientas de administración del sistema.'
        : '';

    return {
      respuesta: `Aquí tienes lo que sé:\n${cuerpo}${nota}`,
      fuentes: filas.map((f) => f.titulo),
    };
  }

  private async buscarEnKb(consulta: string) {
    const sql = Prisma.sql`
      SELECT id, titulo, contenido, tags,
             ts_rank(to_tsvector('spanish', titulo || ' ' || contenido),
                     websearch_to_tsquery('spanish', REPLACE(${consulta}, ' ', ' OR '))) AS rank
      FROM "asistente_base_conocimiento"
      WHERE activo = true
        AND to_tsvector('spanish', titulo || ' ' || contenido)
            @@ websearch_to_tsquery('spanish', REPLACE(${consulta}, ' ', ' OR '))
      ORDER BY rank DESC, titulo ASC
      LIMIT 3
    `;
    return this.prisma.$queryRaw<Array<{ id: string; titulo: string; contenido: string; tags: string[]; rank: number }>>(sql);
  }
}