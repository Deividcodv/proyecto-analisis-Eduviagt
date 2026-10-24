import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [solicitudes, convocatorias, usuarios, evaluaciones, sesiones, votos, decisiones] = await Promise.all([
    prisma.solicitud.count(),
    prisma.convocatoria.count(),
    prisma.usuario.count(),
    prisma.evaluacion.count(),
    prisma.sesion.count(),
    prisma.voto.count(),
    prisma.decision.count(),
  ]);
  console.log('Solicitudes:', solicitudes);
  console.log('Convocatorias:', convocatorias);
  console.log('Usuarios:', usuarios);
  console.log('Evaluaciones:', evaluaciones);
  console.log('Sesiones:', sesiones);
  console.log('Votos:', votos);
  console.log('Decisiones:', decisiones);

  const porEstado = await prisma.solicitud.groupBy({ by: ['estado'], _count: true });
  console.log('\nPor estado:');
  porEstado.forEach(e => console.log(' ', e.estado, ':', e._count));
}

main().finally(() => prisma.$disconnect());