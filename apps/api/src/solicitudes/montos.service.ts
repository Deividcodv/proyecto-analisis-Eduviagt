import { BadRequestException, Injectable } from '@nestjs/common';
import { ConvocatoriaReglaMonto, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UMBRAL_SEGUNDA_APROBACION_GTQ } from '../common/constants/roles';

/**
 * Origen del monto calculado (Sprint 8 - US-801).
 * - REGLA: salió de una regla por tramo de ingreso.
 * - MONTO_BASE: no hubo regla aplicable y se usó el monto base.
 * - OVERRIDE: ajuste manual registrado por una persona autorizada.
 */
export const ORIGEN_MONTO = {
  REGLA: 'REGLA',
  MONTO_BASE: 'MONTO_BASE',
  OVERRIDE: 'OVERRIDE',
} as const;

export type OrigenMonto = (typeof ORIGEN_MONTO)[keyof typeof ORIGEN_MONTO];

/**
 * Tipos de regla de cálculo soportados.
 */
export const TIPO_REGLA_MONTO = {
  FIJO: 'FIJO',
  PORCENTAJE: 'PORCENTAJE',
  COMPLETO: 'COMPLETO',
} as const;

export interface ResultadoCalculoMonto {
  /** Monto en quetzales, o null si no hay regla aplicable. */
  monto: Prisma.Decimal | null;
  /** De dónde salió el monto; null si no aplica ninguna regla. */
  origen: OrigenMonto | null;
  /** Nombre de la regla por tramo que se aplicó, si hubo. */
  reglaAplicada: string | null;
  /** Explicación en español, apta para mostrar al usuario. */
  detalle: string;
}

/**
 * Servicio de cálculo de montos otorgables (Sprint 8 - US-801).
 *
 * Solo calcula y registra montos: no cambia el estado de la solicitud ni
 * resuelve el flujo de aprobación (eso vive en SolicitudesService).
 */
@Injectable()
export class MontosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcula el monto otorgable de una convocatoria para un ingreso familiar dado.
   *
   * Reglas de resolución:
   * 1. Se revisan las reglas activas ordenadas por `prioridad` ascendente y,
   *    a igual prioridad, por nombre.
   * 2. Una regla aplica cuando el ingreso cae en su tramo: `ingresoMin` es
   *    inclusivo, `ingresoMax` es exclusivo y `null` significa "sin límite".
   *    Sin ingreso familiar solo aplican las reglas sin límites de ingreso.
   * 3. El tipo define el cálculo: COMPLETO usa el monto base, FIJO usa el
   *    monto fijo de la regla y PORCENTAJE aplica el porcentaje (guardado como
   *    fracción: 0.4 significa 40%).
   * 4. Gana la primera regla que aplica. Si ninguna aplica pero hay monto
   *    base, se usa el monto base. Si no hay monto base, no hay monto.
   */
  async calcular(
    convocatoriaId: string,
    ingresoFamiliar: number | null | undefined,
  ): Promise<ResultadoCalculoMonto> {
    const convocatoria = await this.prisma.convocatoria.findUnique({
      where: { id: convocatoriaId },
      include: {
        reglasMonto: {
          where: { activo: true },
          orderBy: [{ prioridad: 'asc' }, { nombre: 'asc' }],
        },
      },
    });

    if (!convocatoria) {
      // Se mantiene la compatibilidad hacia atrás: sin convocatoria no hay
      // monto aplicable, pero el cálculo nunca lanza por datos ausentes.
      return {
        monto: null,
        origen: null,
        reglaAplicada: null,
        detalle:
          'No se encontró la convocatoria, por lo que no hay un monto aplicable.',
      };
    }

    const montoBase = this.aDecimal(convocatoria.montoBase);
    const reglas = this.ordenarReglas(convocatoria.reglasMonto);
    const ingreso = this.aDecimal(ingresoFamiliar);

    for (const regla of reglas) {
      if (!this.aplicaPorIngreso(regla, ingreso)) {
        continue;
      }

      const monto = this.montoDeRegla(regla, montoBase);
      if (monto === null) {
        // La regla aplica al tramo, pero no tiene datos suficientes para
        // calcular (monto base o monto fijo ausente): se sigue con la
        // siguiente regla.
        continue;
      }

      return {
        monto,
        origen: ORIGEN_MONTO.REGLA,
        reglaAplicada: regla.nombre,
        detalle: `Monto calculado con la regla "${regla.nombre}" (${regla.tipo}): ${this.formatear(monto)}.`,
      };
    }

    if (montoBase !== null) {
      const monto = montoBase.toDecimalPlaces(2);
      return {
        monto,
        origen: ORIGEN_MONTO.MONTO_BASE,
        reglaAplicada: null,
        detalle: `Ninguna regla por tramo de ingreso aplicó; se usa el monto base de la convocatoria: ${this.formatear(monto)}.`,
      };
    }

    return {
      monto: null,
      origen: null,
      reglaAplicada: null,
      detalle:
        'La convocatoria no tiene monto base ni reglas de monto aplicables para el ingreso familiar indicado.',
    };
  }

  /**
   * ¿El monto supera el umbral que exige una segunda aprobación?
   * null (sin monto) => false.
   *
   * La comparación es estricta: exactamente el umbral NO requiere segunda
   * aprobación, solo lo supera.
   */
  requiereSegundaAprobacion(monto: Prisma.Decimal | null | undefined): boolean {
    const valor = this.aDecimal(monto);
    if (valor === null) {
      return false;
    }
    return valor.gt(UMBRAL_SEGUNDA_APROBACION_GTQ);
  }

  /**
   * Registra un ajuste manual del monto (override) con justificación.
   * Devuelve el monto registrado.
   *
   * Solo escribe los campos de monto de la solicitud: no toca el estado.
   * La justificación queda en la bitácora de auditoría, a cargo del servicio
   * de solicitudes (Sprint 8 - US-803).
   */
  async registrarOverride(params: {
    solicitudId: string;
    monto: Prisma.Decimal;
    justificacion: string;
    usuarioId: string;
  }): Promise<Prisma.Decimal> {
    const { solicitudId, usuarioId } = params;

    const monto = this.aDecimal(params.monto);
    if (monto === null) {
      throw new BadRequestException('El monto del ajuste debe ser un valor válido.');
    }
    const montoFinal = monto.toDecimalPlaces(2);

    await this.prisma.solicitud.update({
      where: { id: solicitudId },
      data: {
        montoOtorgable: montoFinal,
        montoAprobado: montoFinal,
        montoOrigenCalculo: ORIGEN_MONTO.OVERRIDE,
        montoCalculadoAt: new Date(),
        montoCalculadoPor: usuarioId,
      },
    });

    return montoFinal;
  }

  /**
   * Ordena las reglas por prioridad ascendente y, a igual prioridad, por
   * nombre. El orden se replica en el servicio para no depender únicamente
   * del orden de la base de datos.
   */
  private ordenarReglas(reglas: ConvocatoriaReglaMonto[] | undefined): ConvocatoriaReglaMonto[] {
    if (!reglas) {
      return [];
    }
    return [...reglas].sort(
      (a, b) => a.prioridad - b.prioridad || a.nombre.localeCompare(b.nombre, 'es'),
    );
  }

  /**
   * ¿El ingreso familiar cae dentro del tramo de la regla?
   * `ingresoMin` inclusivo, `ingresoMax` exclusivo, `null` = sin límite.
   */
  private aplicaPorIngreso(
    regla: ConvocatoriaReglaMonto,
    ingreso: Prisma.Decimal | null,
  ): boolean {
    const min = this.aDecimal(regla.ingresoMin);
    const max = this.aDecimal(regla.ingresoMax);

    if (ingreso === null) {
      // Sin ingreso familiar solo aplican las reglas cuyo tramo no está
      // acotado por ingreso (ambos extremos sin límite).
      return min === null && max === null;
    }

    if (min !== null && ingreso.lt(min)) {
      return false;
    }
    if (max !== null && !ingreso.lt(max)) {
      return false;
    }
    return true;
  }

  /**
   * Calcula el monto de una regla según su tipo. Devuelve null cuando la
   * regla no tiene datos suficientes (no aplica).
   */
  private montoDeRegla(
    regla: ConvocatoriaReglaMonto,
    montoBase: Prisma.Decimal | null,
  ): Prisma.Decimal | null {
    switch (regla.tipo) {
      case TIPO_REGLA_MONTO.COMPLETO:
        // Se otorga el monto base completo de la convocatoria.
        return montoBase === null ? null : montoBase.toDecimalPlaces(2);

      case TIPO_REGLA_MONTO.FIJO: {
        const montoFijo = this.aDecimal(regla.montoFijo);
        return montoFijo === null ? null : montoFijo.toDecimalPlaces(2);
      }

      case TIPO_REGLA_MONTO.PORCENTAJE: {
        // En la base de datos el porcentaje se guarda como fracción
        // (0.4 = 40%), por eso NO se divide entre 100.
        if (regla.porcentaje === null || regla.porcentaje === undefined) {
          return null;
        }
        if (montoBase === null) {
          return null;
        }
        const porcentaje = new Prisma.Decimal(regla.porcentaje);
        return montoBase.times(porcentaje).toDecimalPlaces(2);
      }

      default:
        // Tipo desconocido: la regla no se aplica.
        return null;
    }
  }

  /**
   * Normaliza a Decimal sin perder precisión. Acepta el Decimal de Prisma,
   * números o textos; devuelve null cuando no hay valor.
   */
  private aDecimal(
    valor: Prisma.Decimal | number | string | null | undefined,
  ): Prisma.Decimal | null {
    if (valor === null || valor === undefined) {
      return null;
    }
    if (valor instanceof Prisma.Decimal) {
      return valor;
    }
    return new Prisma.Decimal(valor);
  }

  /** Formatea un monto para mostrarlo al usuario: Q1234.50 */
  private formatear(monto: Prisma.Decimal): string {
    return `Q${monto.toFixed(2)}`;
  }
}
