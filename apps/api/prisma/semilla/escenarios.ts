import { PrismaClient, Prisma, SolicitudEstado } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { MontosService } from '../../src/solicitudes/montos.service';

import {
  crearPostulantes,
  crearEvaluadores,
  crearMiembrosComite,
  crearRolesEspeciales,
  asegurarConvocatorias,
  elegirUno,
  barajar,
  PerfilAcademicoGenerado,
  PerfilFinancieroGenerado,
} from './datos';

import {
  CicloConvocatoria,
  generarCiclos,
  distribuirEnCiclos,
  fechaEnEvaluacion,
  fechaPostResultados,
  fechaAntesCierre,
  sincronizarConvocatoriaConCiclo,
} from './ciclos';

const prisma = new PrismaClient();
const prismaService = new PrismaService();
const montosService = new MontosService(prismaService);

// ==========================================
// ESTADOS OBJETIVO PARA LAS 30 SOLICITUDES
// ==========================================

const DISTRIBUCION: Record<SolicitudEstado, number> = {
  BORRADOR: 3,
  ENVIADA: 2,
  EN_REVISION: 3,
  CORRECCION: 1,
  EVALUADA: 3,
  PENDIENTE_SEGUNDA_APROBACION: 2,
  APROBADA: 11,
  RECHAZADA: 5,
};

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

/** Crea historial de estados para una solicitud. */
async function crearHistorial(solicitudId: string, estados: SolicitudEstado[], usuarioId: string, fechas: Date[]) {
  for (let i = 0; i < estados.length; i++) {
    await prisma.historialEstado.create({
      data: {
        solicitudId,
        estado: estados[i],
        usuarioId,
        comentario: i === 0 ? 'Estado inicial' : `Cambio a ${estados[i]}`,
        accion: i === 0 ? 'crear' : 'cambiar_estado',
        resultado: 'EXITOSO',
        createdAt: fechas[i],
      },
    });
  }
}

/** Crea perfil académico para una solicitud (snapshot) usando perfil generado. */
async function crearPerfilAcademicoSnapshot(solicitudId: string, perfil: PerfilAcademicoGenerado) {
  await prisma.solicitudPerfilAcademico.create({
    data: {
      solicitudId,
      generoId: perfil.generoId,
      generoOtro: perfil.generoOtro,
      nivelAcademicoId: perfil.nivelAcademicoId,
      nivelAcademicoOtro: perfil.nivelAcademicoOtro,
      institucion: perfil.institucion,
      carrera: perfil.carrera,
      promedio: perfil.promedio,
      departamentoId: perfil.departamentoId,
      departamentoOtro: perfil.departamentoOtro,
      municipioId: perfil.municipioId,
      municipioOtro: perfil.municipioOtro,
    },
  });
}

/** Crea perfil financiero para una solicitud (snapshot) usando perfil generado. */
async function crearPerfilFinancieroSnapshot(solicitudId: string, perfil: PerfilFinancieroGenerado) {
  await prisma.solicitudPerfilFinanciero.create({
    data: {
      solicitudId,
      ingresoFamiliar: perfil.ingresoFamiliar,
      numeroDependientes: perfil.numeroDependientes,
      becasAnteriores: perfil.becasAnteriores,
      descripcionSituacion: perfil.descripcionSituacion,
    },
  });
}

/** Crea documentos simulados para una solicitud. */
async function crearDocumentos(solicitudId: string, convocatoriaId: string, estado: SolicitudEstado) {
  const docsRequeridos = await prisma.convocatoriaDocRequerido.findMany({
    where: { convocatoriaId },
    include: { documentoTipo: true },
  });

  const obligatorios = docsRequeridos.filter(d => d.obligatorio);
  const opcionales = docsRequeridos.filter(d => !d.obligatorio);

  const docsACrear = [...obligatorios];
  if (estado !== 'BORRADOR') {
    for (const opc of opcionales) {
      if (Math.random() > 0.3) docsACrear.push(opc);
    }
  } else {
    docsACrear.length = Math.min(1, docsACrear.length);
  }

  for (const docReq of docsACrear) {
    const estadoDoc = estado === 'BORRADOR' ? 'PENDIENTE' :
                      estado === 'ENVIADA' ? 'CARGADO' :
                      Math.random() > 0.1 ? 'CARGADO' : 'RECHAZADO';

    await prisma.solicitudDocumento.create({
      data: {
        solicitudId,
        documentoTipoId: docReq.documentoTipoId,
        estado: estadoDoc as any,
        archivoUrl: estadoDoc === 'CARGADO' ? `https://storage.demo.gt/docs/${solicitudId}/${docReq.documentoTipoId}.pdf` : '',
        version: 1,
        comentarioRechazo: estadoDoc === 'RECHAZADO' ? 'Documento ilegible o incompleto' : '',
      },
    });
  }
}

/** Calcula monto usando MontosService real. */
async function calcularMonto(convocatoriaId: string, ingresoFamiliar: Prisma.Decimal | null) {
  const ingreso = ingresoFamiliar ? Number(ingresoFamiliar.toString()) : null;
  return montosService.calcular(convocatoriaId, ingreso);
}

// ==========================================
// GENERADOR PRINCIPAL DE ESCENARIOS
// ==========================================

export async function generarEscenarios() {
  console.log('🎬 Iniciando generación de escenarios completos...');

  // 1. Obtener roles
  const rolPostulante = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'POSTULANTE' } });
  const rolEvaluador = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'EVALUADOR' } });
  const rolMiembro = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'MIEMBRO_COMITE' } });
  const rolCoordinador = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'COORDINADOR_COMITE' } });
  const rolJefeBecas = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'JEFE_BECAS' } });
  const rolAdmin = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'ADMIN' } });

  // 2. Crear usuarios base
  const postulantes = await crearPostulantes(20, rolPostulante);
  const evaluadores = await crearEvaluadores(5, rolEvaluador);
  const miembros = await crearMiembrosComite(10, rolMiembro);
  const { coord, jefe, dir } = await crearRolesEspeciales(rolCoordinador, rolJefeBecas, rolAdmin);

  // 3. Asegurar 7 convocatorias
  const { convocatorias, nuevasIds } = await asegurarConvocatorias(7);

  // 4. Generar 4 ciclos y sincronizar SOLO las nuevas convocatorias con ciclos
  // (las 3 base mantienen sus fechas y estados originales, incluyendo ABIERTA con "Excelencia")
  const ciclos = generarCiclos(nuevasIds);
  for (let i = 0; i < ciclos.length; i++) {
    await sincronizarConvocatoriaConCiclo(ciclos[i].convocatoriaId, ciclos[i]);
  }
  console.log('✅ 4 ciclos generados y convocatorias nuevas sincronizadas');

  // 5. Distribuir 30 solicitudes en los 4 ciclos
  const distribucionCiclos = distribuirEnCiclos(30, ciclos);
  console.log('📊 Distribución por ciclo:', distribucionCiclos);

  // 6. Crear lista de estados objetivo (30 elementos)
  const estadosObjetivo: SolicitudEstado[] = [];
  for (const [estado, count] of Object.entries(DISTRIBUCION)) {
    for (let i = 0; i < count; i++) {
      estadosObjetivo.push(estado as SolicitudEstado);
    }
  }
  barajar(estadosObjetivo);

  // 7. Crear solicitudes
  let idxEstado = 0;
  const solicitudesCreadas: Array<{
    id: string;
    estado: SolicitudEstado;
    convocatoriaId: string;
    postulanteId: string;
    ciclo: CicloConvocatoria;
    montoOtorgable: Prisma.Decimal | null;
    requiereSegunda: boolean;
  }> = [];

  for (let c = 0; c < ciclos.length; c++) {
    const ciclo = ciclos[c];
    const numSolicitudes = distribucionCiclos[c];
    const convocatoria = await prisma.convocatoria.findUniqueOrThrow({ where: { id: ciclo.convocatoriaId } });

    const postulantesCiclo = barajar(postulantes).slice(0, numSolicitudes);

    for (let s = 0; s < numSolicitudes; s++) {
      const postulanteData = postulantesCiclo[s];
      const postulante = postulanteData.usuario;
      const estadoObjetivo = estadosObjetivo[idxEstado++];

      const fechaCreacion = fechaAntesCierre(ciclo);
      const fechaEnvio = estadoObjetivo !== 'BORRADOR'
        ? new Date(fechaCreacion.getTime() + (Math.floor(Math.random() * 5) + 1) * 24 * 60 * 60 * 1000)
        : null;

      const resultadoMonto = await calcularMonto(convocatoria.id, new Prisma.Decimal(postulanteData.perfilFinanciero.ingresoFamiliar));
      const requiereSegunda = resultadoMonto.monto !== null && montosService.requiereSegundaAprobacion(resultadoMonto.monto);

      const solicitud = await prisma.solicitud.create({
        data: {
          convocatoriaId: convocatoria.id,
          usuarioId: postulante.id,
          estado: estadoObjetivo,
          respuestas: { demo: true, ciclo: ciclo.indice },
          formularioSnapshot: JSON.stringify([]),
          montoOtorgable: resultadoMonto.monto,
          montoOrigenCalculo: resultadoMonto.origen,
          montoCalculadoAt: new Date(),
          montoCalculadoPor: 'SEED',
          createdAt: fechaCreacion,
          updatedAt: fechaEnvio || fechaCreacion,
        },
      });

      await crearPerfilAcademicoSnapshot(solicitud.id, postulanteData.perfilAcademico);
      await crearPerfilFinancieroSnapshot(solicitud.id, postulanteData.perfilFinanciero);
      await crearDocumentos(solicitud.id, convocatoria.id, estadoObjetivo);

      const historialEstados = construirHistorial(estadoObjetivo);
      const fechasHistorial = generarFechasHistorial(ciclo, estadoObjetivo, fechaCreacion, fechaEnvio);
      await crearHistorial(solicitud.id, historialEstados, postulante.id, fechasHistorial);

      solicitudesCreadas.push({
        id: solicitud.id,
        estado: estadoObjetivo,
        convocatoriaId: convocatoria.id,
        postulanteId: postulante.id,
        ciclo,
        montoOtorgable: resultadoMonto.monto,
        requiereSegunda,
      });

      console.log(`  ✅ Solicitud ${solicitud.id.slice(0, 8)} - ${estadoObjetivo} (ciclo ${ciclo.indice + 1}, ${requiereSegunda ? '2da aprobación' : '1ra aprobación'})`);
    }
  }

  // 8. Crear evaluaciones para solicitudes EN_REVISION, EVALUADA, PENDIENTE_SEGUNDA_APROBACION, APROBADA, RECHAZADA
  await crearEvaluaciones(solicitudesCreadas, evaluadores, ciclos);

  // 9. Crear sesiones de comité para solicitudes EVALUADA+
  await crearSesionesComite(solicitudesCreadas, coord, miembros, ciclos);

  // 10. Crear votos y decisiones para APROBADA, RECHAZADA, PENDIENTE_SEGUNDA_APROBACION
  await crearVotosYDecisiones(solicitudesCreadas, miembros, coord, ciclos);

  // 11. Crear aprobaciones (SolicitudAprobacion) para APROBADA, PENDIENTE_SEGUNDA_APROBACION
  await crearAprobaciones(solicitudesCreadas, jefe, dir, ciclos);

  console.log('🎉 Generación de escenarios completada');
  return { solicitudesCreadas, ciclos, convocatorias };
}

// ==========================================
// HISTORIAL DE ESTADOS POR ESTADO OBJETIVO
// ==========================================

function construirHistorial(estadoFinal: SolicitudEstado): SolicitudEstado[] {
  switch (estadoFinal) {
    case 'BORRADOR':
      return ['BORRADOR'];
    case 'ENVIADA':
      return ['BORRADOR', 'ENVIADA'];
    case 'EN_REVISION':
      return ['BORRADOR', 'ENVIADA', 'EN_REVISION'];
    case 'CORRECCION':
      return ['BORRADOR', 'ENVIADA', 'EN_REVISION', 'CORRECCION', 'ENVIADA', 'EN_REVISION'];
    case 'EVALUADA':
      return ['BORRADOR', 'ENVIADA', 'EN_REVISION', 'EVALUADA'];
    case 'PENDIENTE_SEGUNDA_APROBACION':
      return ['BORRADOR', 'ENVIADA', 'EN_REVISION', 'EVALUADA', 'PENDIENTE_SEGUNDA_APROBACION'];
    case 'APROBADA':
      return ['BORRADOR', 'ENVIADA', 'EN_REVISION', 'EVALUADA', 'PENDIENTE_SEGUNDA_APROBACION', 'APROBADA'];
    case 'RECHAZADA':
      return ['BORRADOR', 'ENVIADA', 'EN_REVISION', 'EVALUADA', 'RECHAZADA'];
    default:
      return ['BORRADOR', 'ENVIADA'];
  }
}

function generarFechasHistorial(
  ciclo: CicloConvocatoria,
  estadoFinal: SolicitudEstado,
  fechaCreacion: Date,
  fechaEnvio: Date | null
): Date[] {
  const historial = construirHistorial(estadoFinal);
  const fechas: Date[] = [fechaCreacion];

  if (historial.length <= 1) return fechas;

  if (fechaEnvio) fechas.push(fechaEnvio);
  else fechas.push(new Date(fechaCreacion.getTime() + 24 * 60 * 60 * 1000));

  const inicio = fechas[fechas.length - 1];
  const fin = ['APROBADA', 'RECHAZADA', 'PENDIENTE_SEGUNDA_APROBACION'].includes(estadoFinal)
    ? fechaPostResultados(ciclo, 10)
    : fechaEnEvaluacion(ciclo);

  const restantes = historial.length - fechas.length;
  for (let i = 0; i < restantes; i++) {
    const factor = (i + 1) / (restantes + 1);
    const ms = inicio.getTime() + factor * (fin.getTime() - inicio.getTime());
    fechas.push(new Date(ms));
  }

  return fechas;
}

// ==========================================
// EVALUACIONES
// ==========================================

type SolicitudConCiclo = {
  id: string;
  estado: SolicitudEstado;
  convocatoriaId: string;
  postulanteId: string;
  ciclo: CicloConvocatoria;
  montoOtorgable: Prisma.Decimal | null;
  requiereSegunda: boolean;
};

async function crearEvaluaciones(
  solicitudes: SolicitudConCiclo[],
  evaluadores: Awaited<ReturnType<typeof crearEvaluadores>>,
  _ciclos: CicloConvocatoria[]
) {
  const criterios = await prisma.criterioEvaluacion.findMany({ where: { activo: true } });
  if (criterios.length === 0) return;

  const paraEvaluar = solicitudes.filter(s =>
    ['EN_REVISION', 'EVALUADA', 'PENDIENTE_SEGUNDA_APROBACION', 'APROBADA', 'RECHAZADA'].includes(s.estado)
  );

  console.log(`📝 Creando evaluaciones para ${paraEvaluar.length} solicitudes...`);

  for (const sol of paraEvaluar) {
    const ciclo = sol.ciclo;
    const evalsSeleccionados = barajar(evaluadores).slice(0, 3);

    for (let i = 0; i < evalsSeleccionados.length; i++) {
      const evaluador = evalsSeleccionados[i];
      const fechaEval = fechaEnEvaluacion(ciclo);

      await prisma.evaluacion.create({
        data: {
          solicitudId: sol.id,
          evaluadorId: evaluador.id,
          criterioEvaluacionId: elegirUno(criterios).id,
          puntaje: Math.round((Math.random() * 40 + 60) * 100) / 100,
          observaciones: i === 0 ? 'Evaluación principal' : `Evaluación de respaldo #${i}`,
          completada: true,
          confirmImparcialidad: true,
          createdAt: fechaEval,
          updatedAt: fechaEval,
        },
      });
    }
  }

  console.log('✅ Evaluaciones creadas');
}

// ==========================================
// SESIONES DE COMITÉ
// ==========================================

async function crearSesionesComite(
  solicitudes: SolicitudConCiclo[],
  _coordinador: Awaited<ReturnType<typeof crearRolesEspeciales>>['coord'],
  miembros: Awaited<ReturnType<typeof crearMiembrosComite>>,
  ciclos: CicloConvocatoria[]
) {
  const paraSesion = solicitudes.filter(s =>
    ['EVALUADA', 'PENDIENTE_SEGUNDA_APROBACION', 'APROBADA', 'RECHAZADA'].includes(s.estado)
  );

  console.log(`🏛️ Creando sesiones para ${paraSesion.length} solicitudes...`);

  const porCiclo = new Map<number, typeof paraSesion>();
  for (const sol of paraSesion) {
    const arr = porCiclo.get(sol.ciclo.indice) || [];
    arr.push(sol);
    porCiclo.set(sol.ciclo.indice, arr);
  }

  for (const [cicloIdx, sols] of porCiclo) {
    const ciclo = ciclos[cicloIdx];
    const comite = await prisma.comite.findFirst({
      where: { nombre: { contains: 'Excelencia' } },
    });
    if (!comite) continue;

    const numSesiones = sols.length > 5 ? 2 : 1;

    for (let s = 0; s < numSesiones; s++) {
      const fechaSesion = fechaPostResultados(ciclo, s === 0 ? 5 : 15);
      const sesion = await prisma.sesion.create({
        data: {
          comiteId: comite.id,
          fecha: fechaSesion,
          estado: 'FINALIZADA',
          quorumMinimo: 5,
        },
      });

      const asistentes = barajar(miembros).slice(0, 5 + Math.floor(Math.random() * 3));
      for (const miembro of asistentes) {
        await prisma.comiteMiembro.upsert({
          where: { comiteId_usuarioId: { comiteId: comite.id, usuarioId: miembro.id } },
          update: { activo: true, rol: 'VOCAL' },
          create: { comiteId: comite.id, usuarioId: miembro.id, rol: 'VOCAL', activo: true },
        });
      }

      const solsEnSesion = s === 0 ? sols.slice(0, Math.ceil(sols.length / 2)) : sols.slice(Math.ceil(sols.length / 2));
      for (let i = 0; i < solsEnSesion.length; i++) {
        const sol = solsEnSesion[i];
        await prisma.sesionAgenda.create({
          data: {
            sesionId: sesion.id,
            solicitudId: sol.id,
          },
        });
      }
    }
  }

  console.log('✅ Sesiones de comité creadas');
}

// ==========================================
// VOTOS Y DECISIONES
// ==========================================

async function crearVotosYDecisiones(
  solicitudes: SolicitudConCiclo[],
  miembros: Awaited<ReturnType<typeof crearMiembrosComite>>,
  _coordinador: Awaited<ReturnType<typeof crearRolesEspeciales>>['coord'],
  _ciclos: CicloConvocatoria[]
) {
  const paraDecision = solicitudes.filter(s =>
    ['PENDIENTE_SEGUNDA_APROBACION', 'APROBADA', 'RECHAZADA'].includes(s.estado)
  );

  console.log(`🗳️ Creando votos y decisiones para ${paraDecision.length} solicitudes...`);

  for (const sol of paraDecision) {
    const ciclo = sol.ciclo;
    const esAprobada = sol.estado === 'APROBADA' || sol.estado === 'PENDIENTE_SEGUNDA_APROBACION';

    const sesion = await prisma.sesion.findFirst({
      where: { comite: { nombre: { contains: 'Excelencia' } }, estado: 'FINALIZADA' },
      orderBy: { fecha: 'desc' },
    });
    if (!sesion) continue;

    const votantes = barajar(miembros).slice(0, 5 + Math.floor(Math.random() * 3));
    let votosFavor = 0;

    for (const miembro of votantes) {
      const voto = esAprobada ? (Math.random() > 0.15 ? 'A_FAVOR' : 'EN_CONTRA') :
                               (Math.random() > 0.3 ? 'EN_CONTRA' : 'A_FAVOR');
      if (voto === 'A_FAVOR') votosFavor++;

      await prisma.voto.create({
        data: {
          sesionId: sesion.id,
          solicitudId: sol.id,
          usuarioId: miembro.id,
          voto,
          observaciones: voto === 'A_FAVOR' ? 'Cumple con los criterios' : 'No cumple umbral mínimo',
        },
      });
    }

    const resultado = esAprobada ? 'APROBADA' : 'RECHAZADA';
    const fechaDecision = fechaPostResultados(ciclo, 7);

    await prisma.decision.create({
      data: {
        solicitudId: sol.id,
        sesionId: sesion.id,
        resultado,
        observaciones: esAprobada
          ? 'La mayoría del comité consideró que la solicitud cumple con los requisitos establecidos en la convocatoria.'
          : 'La solicitud no alcanzó el puntaje mínimo requerido ni la mayoría de votos favorables.',
        fecha: fechaDecision,
      },
    });
  }

  console.log('✅ Votos y decisiones creados');
}

// ==========================================
// APROBACIONES (PRIMERA Y SEGUNDA INSTANCIA)
// ==========================================

async function crearAprobaciones(
  solicitudes: SolicitudConCiclo[],
  jefeBecas: Awaited<ReturnType<typeof crearRolesEspeciales>>['jefe'],
  director: Awaited<ReturnType<typeof crearRolesEspeciales>>['dir'],
  _ciclos: CicloConvocatoria[]
) {
  const paraAprobar = solicitudes.filter(s =>
    ['PENDIENTE_SEGUNDA_APROBACION', 'APROBADA'].includes(s.estado) && s.requiereSegunda
  );

  const todasAprobadas = solicitudes.filter(s => s.estado === 'APROBADA');

  console.log(`✍️ Creando aprobaciones para ${paraAprobar.length + todasAprobadas.length} solicitudes...`);

  const procesadas = new Set<string>();

  for (const sol of todasAprobadas) {
    if (procesadas.has(sol.id)) continue;
    const ciclo = sol.ciclo;
    await prisma.solicitudAprobacion.create({
      data: {
        solicitudId: sol.id,
        usuarioId: jefeBecas.id,
        rolNombre: 'JEFE_BECAS',
        nivel: 1,
        accion: 'aprobar',
        resultado: 'APROBADA',
        comentario: 'Primera aprobación: solicitud cumple requisitos',
        createdAt: fechaPostResultados(ciclo, 10),
      },
    });
    procesadas.add(sol.id);
  }

  for (const sol of paraAprobar) {
    const ciclo = sol.ciclo;
    const fechaPrimera = fechaPostResultados(ciclo, 10);
    const fechaSegunda = new Date(fechaPrimera);
    fechaSegunda.setDate(fechaSegunda.getDate() + 3 + Math.floor(Math.random() * 5));

    await prisma.solicitudAprobacion.create({
      data: {
        solicitudId: sol.id,
        usuarioId: jefeBecas.id,
        rolNombre: 'JEFE_BECAS',
        nivel: 1,
        accion: 'aprobar',
        resultado: 'APROBADA',
        comentario: 'Primera aprobación: monto supera umbral, requiere segunda firma',
        createdAt: fechaPrimera,
      },
    });

    if (sol.estado === 'APROBADA') {
      await prisma.solicitudAprobacion.create({
        data: {
          solicitudId: sol.id,
          usuarioId: director.id,
          rolNombre: 'ADMIN',
          nivel: 2,
          accion: 'aprobar_segunda',
          resultado: 'APROBADA',
          comentario: 'Segunda aprobación confirmada',
          createdAt: fechaSegunda,
        },
      });

      await prisma.solicitud.update({
        where: { id: sol.id },
        data: { montoAprobado: sol.montoOtorgable },
      });
    }
  }

  console.log('✅ Aprobaciones (nivel 1 y 2) creadas');
}