import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CicloConvocatoria {
  indice: number;
  nombre: string;
  convocatoriaId: string;
  apertura: Date;
  cierre: Date;
  evalInicio: Date;
  evalFin: Date;
  resultados: Date;
  finalizado: boolean;
  duracionDias: number;
}

export function generarCiclos(convocatoriasPorCiclo: string[]): CicloConvocatoria[] {
  const hoy = new Date();
  const ciclos: CicloConvocatoria[] = [];

  const duracionCiclo = 90;
  const brecha = 30;
  const evaluacionDuracion = 30;
  const resolucionDuracion = 20;

  const finUltimoCiclo = new Date(hoy);
  finUltimoCiclo.setDate(hoy.getDate() - 15);

  for (let i = 3; i >= 0; i--) {
    const diasAtras = (3 - i) * (duracionCiclo + brecha);
    const resultados = new Date(finUltimoCiclo);
    resultados.setDate(resultados.getDate() - diasAtras);

    const evalFin = new Date(resultados);
    evalFin.setDate(evalFin.getDate() - resolucionDuracion);

    const evalInicio = new Date(evalFin);
    evalInicio.setDate(evalInicio.getDate() - evaluacionDuracion);

    const cierre = new Date(evalInicio);
    cierre.setDate(cierre.getDate() - 15);

    const apertura = new Date(cierre);
    apertura.setDate(apertura.getDate() - 45);

    const convocatoriaId = convocatoriasPorCiclo[i % convocatoriasPorCiclo.length] || convocatoriasPorCiclo[0];

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

  return ciclos.reverse();
}

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

export function fechaAleatoriaEnRango(inicio: Date, fin: Date): Date {
  const inicioMs = inicio.getTime();
  const finMs = fin.getTime();
  const randomMs = inicioMs + Math.random() * (finMs - inicioMs);
  const fecha = new Date(randomMs);
  fecha.setSeconds(0);
  fecha.setMilliseconds(0);
  return fecha;
}

export function fechaEnEvaluacion(ciclo: { evalInicio: Date; evalFin: Date }): Date {
  return fechaAleatoriaEnRango(ciclo.evalInicio, ciclo.evalFin);
}

export function fechaPostResultados(ciclo: { resultados: Date }, diasMax = 30): Date {
  const inicio = new Date(ciclo.resultados);
  inicio.setDate(inicio.getDate() + 1);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + diasMax);
  return fechaAleatoriaEnRango(inicio, fin);
}

export function fechaAntesCierre(ciclo: { apertura: Date; cierre: Date }): Date {
  const inicio = new Date(ciclo.apertura);
  inicio.setDate(inicio.getDate() + 1);
  const fin = new Date(ciclo.cierre);
  fin.setDate(fin.getDate() - 1);
  if (fin <= inicio) return new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  return fechaAleatoriaEnRango(inicio, fin);
}

export function distribuirEnCiclos(total: number, ciclos: any[]): number[] {
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