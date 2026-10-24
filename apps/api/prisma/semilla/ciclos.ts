import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Define los 4 ciclos de convocatoria a lo largo de ~12 meses.
 * Cada ciclo tiene: apertura, cierre, evaluación, resolución.
 * Las fechas son relativas a HOY para que la tendencia siga funcionando.
 */
export interface CicloConvocatoria {
  indice: number;           // 0-3
  nombre: string;           // ej. "Ciclo 1 2025"
  convocatoriaId: string;   // ID de la convocatoria principal de este ciclo
  /** Fecha en que abre la convocatoria. */
  apertura: Date;
  /** Fecha en que cierra la convocatoria. */
  cierre: Date;
  /** Fecha en que inicia el período de evaluación. */
  evalInicio: Date;
  /** Fecha en que termina el período de evaluación. */
  evalFin: Date;
  /** Fecha estimada de resultados. */
  resultados: Date;
  /** Si el ciclo ya terminó completamente (resultados pasados). */
  finalizado: boolean;
  /** Días totales del ciclo. */
  duracionDias: number;
}

/** Genera los 4 ciclos hacia atrás desde hoy. */
export function generarCiclos(convocatoriasPorCiclo: string[]): CicloConvocatoria[] {
  const hoy = new Date();
  const ciclos: CicloConvocatoria[] = [];

  // Configuración: 4 ciclos, cada uno ~90 días, con ~30 días de brecha
  const duracionCiclo = 90;
  const brecha = 30;
  const evaluacionDuracion = 30; // días de evaluación
  const resolucionDuracion = 20; // días para resolver

  // El ciclo más reciente terminó hace poco (resultados ~15 días atrás)
  // El ciclo más antiguo fue hace ~12 meses
  const finUltimoCiclo = new Date(hoy);
  finUltimoCiclo.setDate(hoy.getDate() - 15); // resultados hace 15 días

  for (let i = 3; i >= 0; i--) {
    const diasAtras = (3 - i) * (duracionCiclo + brecha);
    const resultados = new Date(finUltimoCiclo);
    resultados.setDate(resultados.getDate() - diasAtras);

    const evalFin = new Date(resultados);
    evalFin.setDate(evalFin.getDate() - resolucionDuracion);

    const evalInicio = new Date(evalFin);
    evalInicio.setDate(evalInicio.getDate() - evaluacionDuracion);

    const cierre = new Date(evalInicio);
    cierre.setDate(cierre.getDate() - 15); // 15 días entre cierre e inicio evaluación

    const apertura = new Date(cierre);
    apertura.setDate(apertura.getDate() - 45); // 45 días abierta

    const convocatoriaId = convocatoriasPorCiclo[i] || convocatoriasPorCiclo[0];

    const ciclo: CicloConvocatoria = {
      indice: i,
      nombre: `Ciclo ${i + 1} 202${i >= 2 ? '5' : '6'}`,
      convocatoriaId,
      apertura,
      cierre,
      evalInicio,
      evalFin,
      resultados,
      finalizado: resultados < hoy,
      duracionDias: Math.ceil((resultados.getTime() - apertura.getTime()) / (1000 * 60 * 60 * 24)),
    };

    ciclos.push(ciclo);
  }

  return ciclos.reverse(); // Orden cronológico: ciclo 0 (antiguo) -> ciclo 3 (reciente)
}

/**
 * Asigna una convocatoria a un ciclo y, si la convocatoria no tiene fechas,
 * las sincroniza con el ciclo.
 */
export async function sincronizarConvocatoriaConCiclo(
  convocatoriaId: string,
  ciclo: CicloConvocatoria
) {
  await prisma.convocatoria.update({
    where: { id: convocatoriaId },
    data: {
      fechaApertura: ciclo.apertura,
      fechaCierre: ciclo.cierre,
    },
  });
}

/**
 * Obtiene una fecha aleatoria dentro de un rango [inicio, fin].
 */
export function fechaAleatoriaEnRango(inicio: Date, fin: Date): Date {
  const inicioMs = inicio.getTime();
  const finMs = fin.getTime();
  const randomMs = inicioMs + Math.random() * (finMs - inicioMs);
  const fecha = new Date(randomMs);
  fecha.setSeconds(0);
  fecha.setMilliseconds(0);
  return fecha;
}

/**
 * Obtiene una fecha aleatoria DURANTE la evaluación del ciclo.
 */
export function fechaEnEvaluacion(ciclo: CicloConvocatoria): Date {
  return fechaAleatoriaEnRango(ciclo.evalInicio, ciclo.evalFin);
}

/**
 * Obtiene una fecha aleatoria DESPUÉS de los resultados (para decisiones, sesiones).
 */
export function fechaPostResultados(ciclo: CicloConvocatoria, diasMax = 30): Date {
  const inicio = new Date(ciclo.resultados);
  inicio.setDate(inicio.getDate() + 1); // Al día siguiente de resultados
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + diasMax);
  return fechaAleatoriaEnRango(inicio, fin);
}

/**
 * Obtiene una fecha aleatoria ANTES del cierre (para solicitudes enviadas).
 */
export function fechaAntesCierre(ciclo: CicloConvocatoria, diasMin = 1): Date {
  const inicio = new Date(ciclo.apertura);
  inicio.setDate(inicio.getDate() + diasMin);
  const fin = new Date(ciclo.cierre);
  fin.setDate(fin.getDate() - 1); // Al menos 1 día antes del cierre
  if (fin <= inicio) return new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  return fechaAleatoriaEnRango(inicio, fin);
}

/**
 * Distribuye N solicitudes entre los 4 ciclos de forma realista:
 * - Ciclos antiguos: más solicitudes (ya resueltos)
 * - Ciclo actual: menos (en proceso)
 */
export function distribuirEnCiclos(total: number, ciclos: CicloConvocatoria[]): number[] {
  // Pesos: ciclos finalizados reciben más, ciclo actual menos
  const pesos = ciclos.map(c => c.finalizado ? 1.2 : 0.6);
  const sumaPesos = pesos.reduce((a, b) => a + b, 0);
  const base = total / sumaPesos;

  const distribucion = pesos.map(p => Math.floor(p * base));
  let asignados = distribucion.reduce((a, b) => a + b, 0);
  let idx = 0;
  while (asignados < total) {
    distribucion[idx % ciclos.length]++;
    asignados++;
    idx++;
  }
  return distribucion;
}