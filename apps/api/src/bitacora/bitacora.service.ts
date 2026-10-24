import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Resultados posibles de una acción registrada en la bitácora.
 * - EXITOSO: la acción se completó correctamente.
 * - RECHAZADO: la acción fue rechazada por una regla de negocio.
 * - ERROR: la acción falló por un error técnico.
 */
export const RESULTADO_BITACORA = {
  EXITOSO: 'EXITOSO',
  RECHAZADO: 'RECHAZADO',
  ERROR: 'ERROR',
} as const;

export type ResultadoBitacora = (typeof RESULTADO_BITACORA)[keyof typeof RESULTADO_BITACORA];

/** Origen de la acción: interfaz web (WEB) o llamada directa a la API (API). */
export const ORIGEN_BITACORA = {
  WEB: 'WEB',
  API: 'API',
} as const;

/** Persona que ejecuta la acción. Se guarda desnormalizada para que la
 * bitácora siga siendo legible aunque luego cambie el usuario. */
export interface ActorBitacora {
  id: string;
  nombre: string;
  rol: string;
  correo: string;
}

/** Contenido de una entrada de bitácora. */
export interface EntradaBitacora {
  actor?: ActorBitacora | null;
  modulo: string;
  entidad: string;
  entidadId?: string | null;
  /** Clave técnica, p. ej. "solicitud.aprobar" */
  accionClave: string;
  /** La misma acción en lenguaje comprensible, p. ej. "Aprobó la solicitud" */
  accionHumana: string;
  descripcionHumana: string;
  camposClave?: Record<string, unknown> | null;
  datosRelevantes?: Record<string, unknown> | null;
  resultado?: ResultadoBitacora;
  motivo?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  origen?: 'WEB' | 'API';
  correlacionId?: string | null;
  sessionId?: string | null;
}

/** Filtros de consulta de la bitácora. */
export interface FiltrosBitacora {
  modulo?: string;
  entidad?: string;
  entidadId?: string;
  accionClave?: string;
  actorId?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  limit?: number;
}

/** Fila de bitácora tal como se devuelve en las consultas (solo lectura). */
export interface ItemBitacora {
  id: string;
  fechaHora: Date;
  actorId: string | null;
  actorNombre: string | null;
  actorRol: string | null;
  actorCorreo: string | null;
  modulo: string;
  entidad: string;
  entidadId: string | null;
  accionClave: string;
  accionHumana: string;
  descripcionHumana: string;
  camposClave: unknown;
  datosRelevantes: unknown;
  resultado: string;
  motivo: string | null;
  ip: string | null;
  userAgent: string | null;
  origen: string;
  correlacionId: string | null;
  sessionId: string | null;
}

/**
 * Valor nulo para una columna `Json?`.
 *
 * `Prisma.InputJsonValue` no admite `null` en la raíz porque sería ambiguo
 * entre "JSON null" y "NULL en la base de datos". Para una columna `Json?`
 * nullable, entregar `null` al motor guarda NULL en la base de datos
 * (comportamiento verificado contra Prisma 5 + PostgreSQL), que es
 * exactamente lo que se busca aquí. El cast queda acotado a esta constante
 * para no relajar el tipado del resto del servicio.
 */
const NULO_JSON = null as unknown as Prisma.InputJsonValue;

/**
 * Convierte un valor arbitrario en JSON válido para Prisma.
 * Los valores que JSON no puede representar (funciones, símbolos,
 * `undefined`, números no finitos) se normalizan a `null`.
 */
function convertirAJson(valor: unknown): Prisma.InputJsonValue | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'string' || typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (valor instanceof Date) return valor.toISOString();
  if (Array.isArray(valor)) return valor.map((item) => convertirAJson(item));
  if (typeof valor === 'object') {
    const salida: Record<string, Prisma.InputJsonValue | null> = {};
    for (const [clave, item] of Object.entries(valor as Record<string, unknown>)) {
      salida[clave] = convertirAJson(item);
    }
    return salida;
  }
  return null;
}

/** Prepara el valor de una columna `Json?` a partir de un objeto plano. */
function valorJsonColumna(
  valor: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue {
  if (valor === null || valor === undefined) return NULO_JSON;
  return convertirAJson(valor) as Prisma.InputJsonValue;
}

/** Devuelve un entero seguro, con valor por defecto si no es utilizable. */
function enteroSeguro(valor: number | undefined, porDefecto: number): number {
  if (valor === undefined || !Number.isFinite(valor)) return porDefecto;
  return Math.trunc(valor);
}

/**
 * Bitácora del sistema (US-805): registro inmutable y de solo consulta de
 * las acciones relevantes del sistema (quién, cuándo, qué y con qué
 * resultado). No existen métodos para modificar ni eliminar entradas.
 */
@Injectable()
export class BitacoraService {
  private readonly logger = new Logger(BitacoraService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una entrada. Acepta un cliente transaccional para que la
   * bitácora quede dentro de la MISMA transacción que la acción que audita.
   *
   * La escritura nunca propaga un error: si falla (por ejemplo porque la
   * transacción ya estaba abortada), la acción original manda y solo queda
   * el aviso en el log. Así una incidencia de la bitácora no puede tumbar
   * una operación de negocio que ya se va a confirmar o revertir por otra
   * vía.
   */
  async registrar(entrada: EntradaBitacora, client?: Prisma.TransactionClient): Promise<void> {
    const db: Prisma.TransactionClient = client ?? this.prisma;
    try {
      await db.bitacoraSistema.create({ data: this.construirDatos(entrada) });
    } catch (error) {
      // La bitácora es un registro secundario: no debe hacer fallar la acción
      // auditada. Si la escritura falla porque la transacción ya estaba
      // abortada (o por cualquier otro motivo), se registra el aviso y se
      // retorna sin lanzar el error.
      this.logger.warn(
        `No se pudo registrar la entrada de bitácora "${entrada.accionClave}": ${this.mensajeError(
          error,
        )}`,
      );
    }
  }

  /** Consulta paginada, de más reciente a más antigua. */
  async listar(filtros: FiltrosBitacora): Promise<{
    total: number;
    page: number;
    limit: number;
    items: ItemBitacora[];
  }> {
    const where = this.construirFiltros(filtros);

    const page = Math.max(enteroSeguro(filtros.page, 1), 1);
    const limit = Math.min(Math.max(enteroSeguro(filtros.limit, 50), 1), 200);

    const [total, items] = await Promise.all([
      this.prisma.bitacoraSistema.count({ where }),
      this.prisma.bitacoraSistema.findMany({
        where,
        orderBy: { fechaHora: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, items };
  }

  /** Arma el `data` de la creación a partir de una entrada. */
  private construirDatos(entrada: EntradaBitacora): Prisma.BitacoraSistemaCreateInput {
    const actor = entrada.actor ?? null;
    return {
      actorId: actor?.id ?? null,
      actorNombre: actor?.nombre ?? null,
      actorRol: actor?.rol ?? null,
      actorCorreo: actor?.correo ?? null,
      modulo: entrada.modulo,
      entidad: entrada.entidad,
      entidadId: entrada.entidadId ?? null,
      accionClave: entrada.accionClave,
      accionHumana: entrada.accionHumana,
      descripcionHumana: entrada.descripcionHumana,
      camposClave: valorJsonColumna(entrada.camposClave),
      datosRelevantes: valorJsonColumna(entrada.datosRelevantes),
      resultado: entrada.resultado ?? RESULTADO_BITACORA.EXITOSO,
      motivo: entrada.motivo ?? null,
      ip: entrada.ip ?? null,
      userAgent: entrada.userAgent ?? null,
      origen: entrada.origen ?? ORIGEN_BITACORA.API,
      correlacionId: entrada.correlacionId ?? null,
      sessionId: entrada.sessionId ?? null,
    };
  }

  /** Traduce los filtros de consulta al `where` de Prisma. */
  private construirFiltros(filtros: FiltrosBitacora): Prisma.BitacoraSistemaWhereInput {
    const where: Prisma.BitacoraSistemaWhereInput = {};

    if (filtros.modulo) where.modulo = filtros.modulo;
    if (filtros.entidad) where.entidad = filtros.entidad;
    if (filtros.entidadId) where.entidadId = filtros.entidadId;
    if (filtros.accionClave) where.accionClave = filtros.accionClave;
    if (filtros.actorId) where.actorId = filtros.actorId;

    const rango: { gte?: Date; lte?: Date } = {};
    if (filtros.desde) {
      const desde = new Date(filtros.desde);
      // Una fecha inválida se ignora en lugar de romper la consulta.
      if (!Number.isNaN(desde.getTime())) rango.gte = desde;
    }
    if (filtros.hasta) {
      const hasta = new Date(filtros.hasta);
      if (!Number.isNaN(hasta.getTime())) rango.lte = hasta;
    }
    if (rango.gte || rango.lte) where.fechaHora = rango;

    return where;
  }

  /** Extrae un mensaje legible de cualquier error. */
  private mensajeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
