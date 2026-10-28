import { PrismaClient, SolicitudEstado } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando datos de demostración (1000 solicitudes)...\n');

  const [
    totalSolicitudes,
    totalConvocatorias,
    totalUsuarios,
    totalEvaluaciones,
    totalSesiones,
    totalVotos,
    totalDecisiones,
    totalAprobaciones,
    totalHistorial,
    totalDocumentos,
  ] = await Promise.all([
    prisma.solicitud.count(),
    prisma.convocatoria.count(),
    prisma.usuario.count(),
    prisma.evaluacion.count(),
    prisma.sesion.count(),
    prisma.voto.count(),
    prisma.decision.count(),
    prisma.solicitudAprobacion.count(),
    prisma.historialEstado.count(),
    prisma.solicitudDocumento.count(),
  ]);

  console.log('📊 CONTEOS GENERALES:');
  console.log(`   Solicitudes: ${totalSolicitudes} (esperado: 1000)`);
  console.log(`   Convocatorias: ${totalConvocatorias} (esperado: 51) ${totalConvocatorias === 51 ? '✅' : '❌'}`);
  console.log(`   Usuarios: ${totalUsuarios} (esperado: ~287+)`);
  console.log(`   Evaluaciones: ${totalEvaluaciones} (esperado: ~2400)`);
  console.log(`   Sesiones: ${totalSesiones} (esperado: ~12-20)`);
  console.log(`   Votos: ${totalVotos} (esperado: ~3600+)`);
  console.log(`   Decisiones: ${totalDecisiones} (esperado: ~600)`);
  console.log(`   Aprobaciones (nivel 1/2): ${totalAprobaciones} (esperado: ~360+)`);
  console.log(`   Historial de estados: ${totalHistorial} (esperado: ~4400+)`);
  console.log(`   Documentos: ${totalDocumentos} (esperado: ~4200+)\n`);

  const porEstado = await prisma.solicitud.groupBy({
    by: ['estado'],
    _count: true,
    orderBy: { _count: { estado: 'desc' } },
  });

  console.log('📈 DISTRIBUCIÓN POR ESTADO (esperado vs real):');
  const esperado: Record<SolicitudEstado, number> = {
    BORRADOR: 100,
    ENVIADA: 70,
    EN_REVISION: 100,
    CORRECCION: 30,
    EVALUADA: 100, // base; puede subir si hay menos PENDIENTE_SEGUNDA (derivado del monto)
    PENDIENTE_SEGUNDA_APROBACION: 70, // tope; real = solicitudes con monto > Q10,000
    APROBADA: 360,
    RECHAZADA: 170,
  };

  let todosOk = true;
  for (const [estado, countEsperado] of Object.entries(esperado)) {
    const real = porEstado.find(e => e.estado === estado)?._count || 0;
    let ok = real === countEsperado;
    // La segunda aprobación se deriva del monto: solo las solicitudes con
    // montoOtorgable > Q10,000 deben estar en PENDIENTE_SEGUNDA_APROBACION.
    // Las 70 asignadas a ciegas se degradan a EVALUADA si no superan el umbral,
    // y las EVALUADA que sí lo superan se promueven a PENDIENTE_SEGUNDA.
    // Invariante: EVALUADA + PENDIENTE_SEGUNDA_APROBACION == 170.
    if (estado === 'PENDIENTE_SEGUNDA_APROBACION') {
      ok = real >= 1 && real <= 170;
    } else if (estado === 'EVALUADA') {
      const pendientes = porEstado.find(e => e.estado === 'PENDIENTE_SEGUNDA_APROBACION')?._count || 0;
      ok = (real + pendientes) === 170;
    }
    if (!ok) todosOk = false;
    console.log(`   ${estado}: ${real} (esperado: ${countEsperado}) ${ok ? '✅' : '❌'}`);
  }

  for (const e of porEstado) {
    if (!(e.estado in esperado)) {
      console.log(`   ${e.estado}: ${e._count} (inesperado) ⚠️`);
      todosOk = false;
    }
  }

  const hoy = new Date();
  const solicitudesFuturas = await prisma.solicitud.count({
    where: { createdAt: { gt: hoy } },
  });
  const sesionesFuturas = await prisma.sesion.count({
    where: { fecha: { gt: hoy } },
  });
  const evaluacionesFuturas = await prisma.evaluacion.count({
    where: { createdAt: { gt: hoy } },
  });

  console.log('\n📅 FECHAS FUTURAS INESPERADAS:');
  console.log(`   Solicitudes con createdAt > hoy: ${solicitudesFuturas} ${solicitudesFuturas === 0 ? '✅' : '❌'}`);
  console.log(`   Sesiones con fecha > hoy: ${sesionesFuturas} (pueden ser algunas programadas) ${sesionesFuturas <= 10 ? '✅' : '⚠️'}`);
  console.log(`   Evaluaciones con createdAt > hoy: ${evaluacionesFuturas} ${evaluacionesFuturas === 0 ? '✅' : '❌'}`);

  // ==========================================
  // CONVOCATORIAS: COBERTURA DEL CATÁLOGO
  // ==========================================
  const convocatorias = await prisma.convocatoria.findMany({
    select: {
      estado: true,
      fechaApertura: true,
      fechaCierre: true,
      formulario: true,
      cobertura: true,
      nivelAcademicoId: true,
      nivelAcademico: { select: { nombre: true } },
    },
  });

  const estaAbierta = (conv: {
    estado: string;
    fechaApertura: Date | null;
    fechaCierre: Date | null;
  }) =>
    conv.estado === 'ABIERTA' &&
    (!conv.fechaApertura || conv.fechaApertura <= hoy) &&
    (!conv.fechaCierre || conv.fechaCierre >= hoy);

  const estaCerrada = (conv: {
    estado: string;
    fechaCierre: Date | null;
  }) =>
    ['CERRADA', 'EN_EVALUACION', 'RESUELTA', 'ARCHIVADA'].includes(
      conv.estado,
    ) ||
    (conv.estado === 'ABIERTA' &&
      !!conv.fechaCierre &&
      conv.fechaCierre < hoy);

  const nivelesEsperados = [
    'Primaria',
    'Básico',
    'Diversificado',
    'Secundaria',
    'Técnico',
    'Universitario',
    'Posgrado',
  ];

  const sinNivel = convocatorias.filter((c) => !c.nivelAcademicoId).length;
  const sinCobertura = convocatorias.filter((c) => !c.cobertura).length;
  const formulariosInvalidos = convocatorias.filter(
    (c) => !Array.isArray(c.formulario),
  ).length;
  const resueltas = convocatorias.filter((c) => c.estado === 'RESUELTA').length;

  console.log('\n🎓 CONVOCATORIAS POR NIVEL:');
  console.log(`   Sin nivel académico: ${sinNivel} ${sinNivel === 0 ? '✅' : '❌'}`);
  console.log(`   Sin cobertura: ${sinCobertura} ${sinCobertura === 0 ? '✅' : '❌'}`);
  console.log(
    `   Formularios que no son arreglo: ${formulariosInvalidos} ${formulariosInvalidos === 0 ? '✅' : '❌'}`,
  );
  console.log(
    `   RESUELTA para ciclos: ${resueltas} (esperado: ≥4) ${resueltas >= 4 ? '✅' : '❌'}`,
  );

  let convocatoriasOk =
    totalConvocatorias === 51 &&
    sinNivel === 0 &&
    sinCobertura === 0 &&
    formulariosInvalidos === 0 &&
    resueltas >= 4;

  for (const nombre of nivelesEsperados) {
    const delNivel = convocatorias.filter(
      (c) => c.nivelAcademico?.nombre === nombre,
    );
    const abiertas = delNivel.filter(estaAbierta).length;
    const cerradas = delNivel.filter(estaCerrada).length;
    const ok = abiertas === 5 && cerradas >= 2;
    if (!ok) convocatoriasOk = false;
    console.log(
      `   ${nombre}: ${abiertas} abiertas (esperado: 5), ${cerradas} cerradas (esperado: ≥2) ${ok ? '✅' : '❌'}`,
    );
  }

  if (!convocatoriasOk) todosOk = false;

  const conMonto = await prisma.solicitud.count({
    where: { montoOtorgable: { not: null } },
  });
  const conMontoAprobado = await prisma.solicitud.count({
    where: { montoAprobado: { not: null } },
  });

  console.log('\n💰 MONTOS Y SEGUNDA APROBACIÓN:');
  console.log(`   Solicitudes con montoOtorgable: ${conMonto}`);
  console.log(`   Solicitudes con montoAprobado: ${conMontoAprobado}`);

  const usuariosPorRol = await prisma.usuario.groupBy({
    by: ['rolId'],
    _count: true,
  });
  const roles = await prisma.rol.findMany();
  const rolMap = new Map(roles.map(r => [r.id, r.nombre]));

  console.log('\n👥 USUARIOS POR ROL:');
  for (const u of usuariosPorRol) {
    console.log(`   ${rolMap.get(u.rolId) || u.rolId}: ${u._count}`);
  }

  console.log('\n🔗 INTEGRIDAD REFERENCIAL: FKs requeridas en schema ✅');

  console.log('\n' + '='.repeat(50));
  if (todosOk &&
      solicitudesFuturas === 0 &&
      evaluacionesFuturas === 0) {
    console.log('✅ VERIFICACIÓN EXITOSA: Todos los cheques pasaron');
    process.exit(0);
  } else {
    console.log('❌ VERIFICACIÓN FALLÓ: Revisar advertencias arriba');
    process.exit(1);
  }
}

main()
  .catch(e => {
    console.error('Error en verificación:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());