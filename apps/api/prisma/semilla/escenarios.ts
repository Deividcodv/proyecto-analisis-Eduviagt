import { PrismaClient, Prisma, SolicitudEstado } from '@prisma/client';

import {
  crearPostulantes,
  crearEvaluadores,
  crearMiembrosComite,
  crearRolesEspeciales,
  asegurarConvocatorias,
  elegirUno,
  barajar,
  TOTAL_SOLICITUDES,
  DISTRIBUCION_ESTADOS,
  TOTAL_POSTULANTES,
  TOTAL_EVALUADORES,
  TOTAL_MIEMBROS_COMITE,
  TOTAL_CONVOCATORIAS,
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

type SolicitudConCiclo = {
  id: string;
  estado: SolicitudEstado;
  convocatoriaId: string;
  postulanteId: string;
  ciclo: CicloConvocatoria;
  montoOtorgable: Prisma.Decimal | null;
  requiereSegunda: boolean;
};

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
// GENERADOR PRINCIPAL DE ESCENARIOS
// ==========================================

export async function generarEscenarios() {
  console.log('🎬 Iniciando generación de escenarios completos (1000 solicitudes)...');

  // 1. Obtener roles
  const rolPostulante = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'POSTULANTE' } });
  const rolEvaluador = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'EVALUADOR' } });
  const rolMiembro = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'MIEMBRO_COMITE' } });
  const rolCoordinador = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'COORDINADOR_COMITE' } });
  const rolJefeBecas = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'JEFE_BECAS' } });
  const rolAdmin = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'ADMIN' } });

  // 2. Crear usuarios base
  const postulantes = await crearPostulantes(TOTAL_POSTULANTES, rolPostulante);
  const evaluadores = await crearEvaluadores(TOTAL_EVALUADORES, rolEvaluador);
  const miembros = await crearMiembrosComite(TOTAL_MIEMBROS_COMITE, rolMiembro);
  const { coord, jefe, dir } = await crearRolesEspeciales(rolCoordinador, rolJefeBecas, rolAdmin);

  // 3. Asegurar 11 convocatorias
  const { convocatorias, nuevasIds } = await asegurarConvocatorias(TOTAL_CONVOCATORIAS);

  // 4. Generar 4 ciclos y sincronizar SOLO las nuevas convocatorias
  const ciclos = generarCiclos(nuevasIds);
  for (let i = 0; i < ciclos.length; i++) {
    await sincronizarConvocatoriaConCiclo(ciclos[i].convocatoriaId, ciclos[i]);
  }
  console.log('✅ 4 ciclos generados y convocatorias nuevas sincronizadas');

  // 5. Distribuir 1000 solicitudes en los 4 ciclos
  const distribucionCiclos = distribuirEnCiclos(TOTAL_SOLICITUDES, ciclos);
  console.log('📊 Distribución por ciclo:', distribucionCiclos);

  // 6. Crear lista de estados objetivo (1000 elementos)
  const estadosObjetivo: SolicitudEstado[] = [];
  for (const [estado, count] of Object.entries(DISTRIBUCION_ESTADOS)) {
    for (let i = 0; i < count; i++) {
      estadosObjetivo.push(estado as SolicitudEstado);
    }
  }
  const estadosShuffled = barajar(estadosObjetivo);
  estadosObjetivo.length = 0;
  estadosObjetivo.push(...estadosShuffled);

  // 7. Crear solicitudes (en lotes para rendimiento)
  let idxEstado = 0;
  const solicitudesCreadas: SolicitudConCiclo[] = [];

  const generos = await prisma.genero.findMany();
  const niveles = await prisma.nivelAcademico.findMany();
  const departamentos = await prisma.departamento.findMany();
  const municipios = await prisma.municipio.findMany();
  const instituciones = await prisma.institucionEducativa.findMany({ where: { activa: true } });

  // Pre-calcular perfiles para postulantes
  const perfilesPostulantes = new Map<string, {
    perfilAcademico: any;
    perfilFinanciero: any;
    esUniv: boolean;
  }>();

  // Crear una sola instancia de MontosService para todo el proceso
  const { PrismaService } = await import('../../src/prisma/prisma.service');
  const { MontosService } = await import('../../src/solicitudes/montos.service');
  const prismaService = new PrismaService();
  const montosService = new MontosService(prismaService);

  for (const p of postulantes) {
    const esUniv = p.esUniv;
    const genero = Math.random() > 0.5 ? 'M' : 'F';
    const generoObj = generos.find(g => g.nombre === (genero === 'F' ? 'Femenino' : 'Masculino'));
    const nivelNombre = esUniv ? 'Universitario' : (Math.random() > 0.5 ? 'Diversificado' : 'Secundaria');
    const nivelAcademico = niveles.find(n => n.nombre === nivelNombre);
    const instFiltradas = instituciones.filter(inst =>
      (esUniv && inst.nivel === 'UNIVERSIDAD') ||
      (!esUniv && inst.nivel === 'DIVERSIFICADO') ||
      (nivelNombre === 'Secundaria' && inst.nivel === 'SECUNDARIA')
    );
    const institucion = instFiltradas[Math.floor(Math.random() * instFiltradas.length)] || instituciones[0];
    const carreras = esUniv ? ['Medicina', 'Ingeniería Civil', 'Ingeniería de Sistemas', 'Derecho', 'Arquitectura', 'Administración de Empresas'] :
      nivelNombre === 'Diversificado' ? ['Bachillerato en Ciencias y Letras', 'Bachillerato en Computación', 'Bachillerato en Contabilidad'] :
      ['Bachillerato en Ciencias y Letras', 'Bachillerato en Computación'];
    const promedio = Math.round((Math.random() * 25 + 70) * 100) / 100;
    const ingresoFamiliar = Math.round((esUniv ? 4000 : 2500 + Math.random() * 12000) * 100) / 100;
    const numeroDependientes = Math.floor(Math.random() * 5) + 1;

    perfilesPostulantes.set(p.usuario.id, {
      perfilAcademico: {
        generoId: generoObj?.id || null,
        generoOtro: null,
        nivelAcademicoId: nivelAcademico?.id || null,
        nivelAcademicoOtro: null,
        institucion: institucion?.nombre || 'Institución Demo',
        carrera: carreras[Math.floor(Math.random() * carreras.length)],
        promedio,
        departamentoId: institucion?.departamento ? departamentos.find(d => d.nombre === institucion.departamento)?.id : null,
        departamentoOtro: null,
        municipioId: institucion?.municipio ? municipios.find(m => m.nombre === institucion.municipio)?.id : null,
        municipioOtro: null,
      },
      perfilFinanciero: {
        ingresoFamiliar,
        numeroDependientes,
        becasAnteriores: Math.random() > 0.7,
        descripcionSituacion: Math.random() > 0.5 ? 'Situación económica familiar difícil.' : null,
      },
      esUniv,
    });
  }

  console.log('✅ Perfiles pre-calculados para postulantes');

  for (let c = 0; c < ciclos.length; c++) {
    const ciclo = ciclos[c];
    const numSolicitudes = distribucionCiclos[c];

    // Seleccionar convocatoria para este ciclo (rotar entre las 11)
    const convocatoriaIdx = c % convocatorias.length;
    const convocatoria = convocatorias[convocatoriaIdx];

    // Seleccionar postulantes para este ciclo
    const postulantesCiclo = barajar(postulantes).slice(0, numSolicitudes);

    // Crear solicitudes en lotes de 50
    const batchSize = 50;
    for (let b = 0; b < postulantesCiclo.length; b += batchSize) {
      const batch = postulantesCiclo.slice(b, b + batchSize);

      for (const postulanteData of batch) {
        const postulante = postulanteData.usuario;
        const perfil = perfilesPostulantes.get(postulante.id)!;
        const estadoObjetivo = estadosObjetivo[idxEstado++];

        const fechaCreacion = fechaAntesCierre(ciclo);
        const fechaEnvio = estadoObjetivo !== 'BORRADOR'
          ? new Date(fechaCreacion.getTime() + (Math.floor(Math.random() * 5) + 1) * 24 * 60 * 60 * 1000)
          : null;

        // Calcular monto
        const resultadoMonto = await montosService.calcular(convocatoria.id, perfil.perfilFinanciero.ingresoFamiliar);
        const requiereSegunda = resultadoMonto.monto !== null && montosService.requiereSegundaAprobacion(resultadoMonto.monto);

        // Crear solicitud
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

        // Perfiles snapshot
        await prisma.solicitudPerfilAcademico.create({
          data: {
            solicitudId: solicitud.id,
            ...perfil.perfilAcademico,
          },
        });

        await prisma.solicitudPerfilFinanciero.create({
          data: {
            solicitudId: solicitud.id,
            ingresoFamiliar: perfil.perfilFinanciero.ingresoFamiliar,
            numeroDependientes: perfil.perfilFinanciero.numeroDependientes,
            becasAnteriores: perfil.perfilFinanciero.becasAnteriores,
            descripcionSituacion: perfil.perfilFinanciero.descripcionSituacion,
          },
        });

        // Documentos
        const docsRequeridos = await prisma.convocatoriaDocRequerido.findMany({
          where: { convocatoriaId: convocatoria.id },
          include: { documentoTipo: true },
        });
        const obligatorios = docsRequeridos.filter(d => d.obligatorio);
        const opcionales = docsRequeridos.filter(d => !d.obligatorio);
        const docsACrear = [...obligatorios];
        if (estadoObjetivo !== 'BORRADOR') {
          for (const opc of opcionales) {
            if (Math.random() > 0.3) docsACrear.push(opc);
          }
        } else {
          docsACrear.length = Math.min(1, docsACrear.length);
        }

        for (const docReq of docsACrear) {
          const estadoDoc = estadoObjetivo === 'BORRADOR' ? 'PENDIENTE' :
                            estadoObjetivo === 'ENVIADA' ? 'CARGADO' :
                            Math.random() > 0.1 ? 'CARGADO' : 'RECHAZADO';

          await prisma.solicitudDocumento.create({
            data: {
              solicitudId: solicitud.id,
              documentoTipoId: docReq.documentoTipoId,
              estado: estadoDoc as any,
              archivoUrl: estadoDoc === 'CARGADO' ? `https://storage.demo.gt/docs/${solicitud.id}/${docReq.documentoTipoId}.pdf` : '',
              version: 1,
              comentarioRechazo: estadoDoc === 'RECHAZADO' ? 'Documento ilegible o incompleto' : '',
            },
          });
        }

        // Historial
        const historialEstados = construirHistorial(estadoObjetivo);
        const fechasHistorial = generarFechasHistorial(ciclo, estadoObjetivo, fechaCreacion, fechaEnvio);
        for (let i = 0; i < historialEstados.length; i++) {
          await prisma.historialEstado.create({
            data: {
              solicitudId: solicitud.id,
              estado: historialEstados[i],
              usuarioId: postulante.id,
              comentario: i === 0 ? 'Estado inicial' : `Cambio a ${historialEstados[i]}`,
              accion: i === 0 ? 'crear' : 'cambiar_estado',
              resultado: 'EXITOSO',
              createdAt: fechasHistorial[i],
            },
          });
        }

        solicitudesCreadas.push({
          id: solicitud.id,
          estado: estadoObjetivo,
          convocatoriaId: convocatoria.id,
          postulanteId: postulante.id,
          ciclo,
          montoOtorgable: resultadoMonto.monto,
          requiereSegunda,
        });
      }

      if ((b / batchSize) % 2 === 0) {
        console.log(`  ✅ Procesadas ${Math.min(b + batchSize, postulantesCiclo.length)} de ${postulantesCiclo.length} solicitudes (ciclo ${ciclo.indice + 1})`);
      }
    }
  }

  console.log(`🎉 ${solicitudesCreadas.length} solicitudes creadas`);

  // 8. Crear evaluaciones para solicitudes que pasan a evaluación
  await crearEvaluaciones(solicitudesCreadas, evaluadores, ciclos);

  // 9. Crear sesiones de comité
  await crearSesionesComite(solicitudesCreadas, coord, miembros, ciclos);

  // 10. Crear votos y decisiones
  await crearVotosYDecisiones(solicitudesCreadas, miembros, coord, ciclos);

  // 11. Crear aprobaciones
  await crearAprobaciones(solicitudesCreadas, jefe, dir, ciclos);

  console.log('🎉 Generación de escenarios completada');
  return { solicitudesCreadas, ciclos, convocatorias };
}

// ==========================================
// EVALUACIONES
// ==========================================

async function crearEvaluaciones(
  solicitudes: SolicitudConCiclo[],
  evaluadores: any[],
  _ciclos: CicloConvocatoria[]
) {
  const criterios = await prisma.criterioEvaluacion.findMany({ where: { activo: true } });
  if (criterios.length === 0) return;

  const paraEvaluar = solicitudes.filter(s =>
    ['EN_REVISION', 'EVALUADA', 'PENDIENTE_SEGUNDA_APROBACION', 'APROBADA', 'RECHAZADA'].includes(s.estado)
  );

  console.log(`📝 Creando evaluaciones para ${paraEvaluar.length} solicitudes...`);

  const batchSize = 100;
  for (let i = 0; i < paraEvaluar.length; i += batchSize) {
    const batch = paraEvaluar.slice(i, i + batchSize);
    for (const sol of batch) {
      const ciclo = sol.ciclo;
      const evalsSeleccionados = barajar(evaluadores).slice(0, 3);

      for (let j = 0; j < evalsSeleccionados.length; j++) {
        const evaluador = evalsSeleccionados[j];
        const fechaEval = fechaEnEvaluacion(ciclo);

        await prisma.evaluacion.create({
          data: {
            solicitudId: sol.id,
            evaluadorId: evaluador.id,
            criterioEvaluacionId: elegirUno(criterios).id,
            puntaje: Math.round((Math.random() * 40 + 60) * 100) / 100,
            observaciones: j === 0 ? 'Evaluación principal' : `Evaluación de respaldo #${j}`,
            completada: true,
            confirmImparcialidad: true,
            createdAt: fechaEval,
            updatedAt: fechaEval,
          },
        });
      }
    }
    console.log(`  ✅ Evaluaciones para ${Math.min(i + batchSize, paraEvaluar.length)} de ${paraEvaluar.length} solicitudes`);
  }

  console.log('✅ Evaluaciones creadas');
}

// ==========================================
// SESIONES DE COMITÉ
// ==========================================

async function crearSesionesComite(
  solicitudes: SolicitudConCiclo[],
  _coordinador: any,
  miembros: any[],
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

    const numSesiones = sols.length > 50 ? 4 : 2;

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
  miembros: any[],
  _coordinador: any,
  _ciclos: CicloConvocatoria[]
) {
  const paraDecision = solicitudes.filter(s =>
    ['PENDIENTE_SEGUNDA_APROBACION', 'APROBADA', 'RECHAZADA'].includes(s.estado)
  );

  console.log(`🗳️ Creando votos y decisiones para ${paraDecision.length} solicitudes...`);

  const batchSize = 50;
  for (let i = 0; i < paraDecision.length; i += batchSize) {
    const batch = paraDecision.slice(i, i + batchSize);
    for (const sol of batch) {
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
    console.log(`  ✅ Votos y decisiones para ${Math.min(i + batchSize, paraDecision.length)} de ${paraDecision.length} solicitudes`);
  }

  console.log('✅ Votos y decisiones creados');
}

// ==========================================
// APROBACIONES (PRIMERA Y SEGUNDA INSTANCIA)
// ==========================================

async function crearAprobaciones(
  solicitudes: SolicitudConCiclo[],
  jefeBecas: any,
  director: any,
  _ciclos: CicloConvocatoria[]
) {
  const paraAprobar = solicitudes.filter(s =>
    ['PENDIENTE_SEGUNDA_APROBACION', 'APROBADA'].includes(s.estado) && s.requiereSegunda
  );

  const todasAprobadas = solicitudes.filter(s => s.estado === 'APROBADA');

  console.log(`✍️ Creando aprobaciones para ${paraAprobar.length + todasAprobadas.length} solicitudes...`);

  const procesadas = new Set<string>();

  const batchSize = 100;
  for (let i = 0; i < todasAprobadas.length; i += batchSize) {
    const batch = todasAprobadas.slice(i, i + batchSize);
    for (const sol of batch) {
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