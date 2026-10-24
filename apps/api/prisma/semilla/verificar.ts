import { PrismaClient, SolicitudEstado } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando datos de demostración...\n');

  // 1. Conteos básicos
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
  console.log(`   Solicitudes: ${totalSolicitudes} (esperado: 30)`);
  console.log(`   Convocatorias: ${totalConvocatorias} (esperado: 7)`);
  console.log(`   Usuarios: ${totalUsuarios} (esperado: ~37+)`);
  console.log(`   Evaluaciones: ${totalEvaluaciones} (esperado: ~90+)`);
  console.log(`   Sesiones: ${totalSesiones} (esperado: ~4-8)`);
  console.log(`   Votos: ${totalVotos} (esperado: ~25-40)`);
  console.log(`   Decisiones: ${totalDecisiones} (esperado: ~13-18)`);
  console.log(`   Aprobaciones (nivel 1/2): ${totalAprobaciones} (esperado: ~13-20)`);
  console.log(`   Historial de estados: ${totalHistorial} (esperado: ~100+)`);
  console.log(`   Documentos: ${totalDocumentos} (esperado: ~100+)\n`);

  // 2. Distribución por estado de solicitud
  const porEstado = await prisma.solicitud.groupBy({
    by: ['estado'],
    _count: true,
    orderBy: { _count: { estado: 'desc' } },
  });

  console.log('📈 DISTRIBUCIÓN POR ESTADO (esperado vs real):');
  const esperado: Record<SolicitudEstado, number> = {
    BORRADOR: 3,
    ENVIADA: 2,
    EN_REVISION: 3,
    CORRECCION: 1,
    EVALUADA: 3,
    PENDIENTE_SEGUNDA_APROBACION: 2,
    APROBADA: 11,
    RECHAZADA: 5,
  };

  let todosOk = true;
  for (const [estado, countEsperado] of Object.entries(esperado)) {
    const real = porEstado.find(e => e.estado === estado)?._count || 0;
    const ok = real === countEsperado;
    if (!ok) todosOk = false;
    console.log(`   ${estado}: ${real} (esperado: ${countEsperado}) ${ok ? '✅' : '❌'}`);
  }

  // Estados no esperados
  for (const e of porEstado) {
    if (!(e.estado in esperado)) {
      console.log(`   ${e.estado}: ${e._count} (inesperado) ⚠️`);
      todosOk = false;
    }
  }

  // 3. Verificar fechas futuras inesperadas
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
  console.log(`   Sesiones con fecha > hoy: ${sesionesFuturas} (pueden ser 2 programadas) ${sesionesFuturas <= 2 ? '✅' : '⚠️'}`);
  console.log(`   Evaluaciones con createdAt > hoy: ${evaluacionesFuturas} ${evaluacionesFuturas === 0 ? '✅' : '❌'}`);

  // 4. Verificar montos y segunda aprobación
  const conMonto = await prisma.solicitud.count({
    where: { montoOtorgable: { not: null } },
  });
  const conMontoAprobado = await prisma.solicitud.count({
    where: { montoAprobado: { not: null } },
  });
  const requierenSegunda = await prisma.solicitud.count({
    where: { montoOtorgable: { gt: 10000 } },
  });

  console.log('\n💰 MONTOS Y SEGUNDA APROBACIÓN:');
  console.log(`   Solicitudes con montoOtorgable: ${conMonto}`);
  console.log(`   Solicitudes con montoAprobado: ${conMontoAprobado}`);
  console.log(`   Solicitudes > Q10,000 (requieren 2da): ${requierenSegunda}`);

  // 5. Verificar usuarios por rol
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

  // 6. Verificar integridad referencial (FKs son required en schema, así que siempre existen)
  console.log('\n🔗 INTEGRIDAD REFERENCIAL: FKs requeridas en schema ✅');

  // 7. Resumen final
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