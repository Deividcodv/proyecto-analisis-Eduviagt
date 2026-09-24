import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ==========================================
  // ROLES
  // ==========================================
  const roles = await Promise.all([
    prisma.rol.upsert({
      where: { nombre: 'ADMIN' },
      update: {},
      create: {
        nombre: 'ADMIN',
        descripcion: 'Administrador del sistema con acceso total',
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'POSTULANTE' },
      update: {},
      create: {
        nombre: 'POSTULANTE',
        descripcion: 'Estudiante que postula a becas',
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'EVALUADOR' },
      update: {},
      create: {
        nombre: 'EVALUADOR',
        descripcion: 'Persona que evalúa solicitudes',
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'COORDINADOR_COMITE' },
      update: {},
      create: {
        nombre: 'COORDINADOR_COMITE',
        descripcion: 'Coordina comités evaluadores y sesiones',
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'MIEMBRO_COMITE' },
      update: {},
      create: {
        nombre: 'MIEMBRO_COMITE',
        descripcion: 'Miembro de un comité evaluador',
      },
    }),
    prisma.rol.upsert({
      where: { nombre: 'STAFF' },
      update: {},
      create: {
        nombre: 'STAFF',
        descripcion: 'Personal administrativo del MINEDUC',
      },
    }),
  ]);
  console.log('✅ Roles creados');

  // ==========================================
  // PERMISOS
  // ==========================================
  const permisosData = [
    // Convocatorias
    { modulo: 'convocatoria', accion: 'crear' },
    { modulo: 'convocatoria', accion: 'editar' },
    { modulo: 'convocatoria', accion: 'ver' },
    // Solicitudes
    { modulo: 'solicitud', accion: 'crear' },
    { modulo: 'solicitud', accion: 'editar' },
    { modulo: 'solicitud', accion: 'ver' },
    // Documentos
    { modulo: 'documento', accion: 'crear' },
    { modulo: 'documento', accion: 'ver' },
    { modulo: 'documento', accion: 'editar' },
    { modulo: 'documento', accion: 'eliminar' },
    // Evaluaciones
    { modulo: 'evaluacion', accion: 'crear' },
    { modulo: 'evaluacion', accion: 'editar' },
    { modulo: 'evaluacion', accion: 'ver' },
    // Comités
    { modulo: 'comite', accion: 'crear' },
    { modulo: 'comite', accion: 'editar' },
    { modulo: 'comite', accion: 'ver' },
    // Sesiones
    { modulo: 'sesion', accion: 'crear' },
    { modulo: 'sesion', accion: 'editar' },
    { modulo: 'sesion', accion: 'ver' },
    // Votos
    { modulo: 'voto', accion: 'crear' },
    // Decisiones
    { modulo: 'decision', accion: 'crear' },
    { modulo: 'decision', accion: 'ver' },
    // Reportes
    { modulo: 'reporte', accion: 'ver' },
    // Seguridad
    { modulo: 'permiso', accion: 'editar' },
  ];

  const permisos = await Promise.all(
    permisosData.map((p) =>
      prisma.permiso.upsert({
        where: { modulo_accion: { modulo: p.modulo, accion: p.accion } },
        update: {},
        create: p,
      }),
    ),
  );
  console.log('✅ Permisos creados');

  // ==========================================
  // ASIGNAR PERMISOS A ROLES
  // ==========================================
  const adminRole = roles.find((r) => r.nombre === 'ADMIN');
  const allPermisos = permisos.map((p) => ({ permisoId: p.id }));

  // ADMIN tiene todos los permisos
  for (const permiso of allPermisos) {
    await prisma.rolPermiso.upsert({
      where: { rolId_permisoId: { rolId: adminRole!.id, permisoId: permiso.permisoId } },
      update: {},
      create: { rolId: adminRole!.id, permisoId: permiso.permisoId },
    });
  }
  console.log('✅ Permisos asignados a ADMIN');

  // POSTULANTE tiene permisos de solicitudes y documentos
  const postulanteRole = roles.find((r) => r.nombre === 'POSTULANTE');
  const permisosPostulante = permisos.filter((p) =>
    ['solicitud', 'documento'].includes(p.modulo),
  );
  for (const permiso of permisosPostulante) {
    await prisma.rolPermiso.upsert({
      where: {
        rolId_permisoId: { rolId: postulanteRole!.id, permisoId: permiso.id },
      },
      update: {},
      create: { rolId: postulanteRole!.id, permisoId: permiso.id },
    });
  }
  console.log('✅ Permisos de solicitud/documento asignados a POSTULANTE');

  // EVALUADOR: evaluacion completo + solicitud:ver
  // COORDINADOR_COMITE: comite/sesion/decision/evaluacion/solicitud completo
  // MIEMBRO_COMITE: voto:crear + ver de sesion/comite/solicitud
  const permisosPorRol: Array<[string, (p: (typeof permisos)[number]) => boolean]> = [
    [
      'EVALUADOR',
      (p) =>
        p.modulo === 'evaluacion' ||
        (p.modulo === 'solicitud' && p.accion === 'ver'),
    ],
    [
      'COORDINADOR_COMITE',
      (p) =>
        ['comite', 'sesion', 'decision', 'evaluacion', 'solicitud', 'documento'].includes(
          p.modulo,
        ),
    ],
    [
      'MIEMBRO_COMITE',
      (p) =>
        p.modulo === 'voto' ||
        (p.accion === 'ver' && ['sesion', 'comite', 'solicitud'].includes(p.modulo)),
    ],
  ];

  for (const [rolNombre, filtro] of permisosPorRol) {
    const rol = roles.find((r) => r.nombre === rolNombre);
    const permitidos = permisos.filter(filtro).map((p) => p.id);
    await prisma.rolPermiso.deleteMany({
      where: { rolId: rol!.id, permisoId: { notIn: permitidos } },
    });
    for (const pid of permitidos) {
      await prisma.rolPermiso.upsert({
        where: {
          rolId_permisoId: { rolId: rol!.id, permisoId: pid },
        },
        update: {},
        create: { rolId: rol!.id, permisoId: pid },
      });
    }
    console.log(`✅ Permisos asignados a ${rolNombre}`);
  }

  // ==========================================
  // BECAS Y CRITERIOS (demo)
  // ==========================================
  const becas = await Promise.all([
    prisma.beca.upsert({
      where: { id: '00000000-0000-4000-8000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-4000-8000-000000000001',
        nombre: 'Beca de Excelencia Académica',
        descripcion: 'Para estudiantes con alto rendimiento académico',
      },
    }),
    prisma.beca.upsert({
      where: { id: '00000000-0000-4000-8000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-4000-8000-000000000002',
        nombre: 'Beca de Permanencia Universitaria',
        descripcion: 'Para estudiantes en riesgo de deserción',
      },
    }),
  ]);
  console.log('✅ Becas creadas');

  const becaDemo = becas[0];
  await prisma.criterioEvaluacion.upsert({
    where: { id: '00000000-0000-4000-8000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000011',
      becaId: becaDemo.id,
      nombre: 'Rendimiento académico',
      peso: 0.6,
    },
  });
  console.log('✅ Criterios de evaluación creados (demo)');

  const becaDemo2 = becas[1];
  const criteriosBeca2 = [
    { id: '00000000-0000-4000-8000-000000000012', nombre: 'Situación socioeconómica', peso: 0.4 },
    { id: '00000000-0000-4000-8000-000000000013', nombre: 'Trayectoria académica', peso: 0.6 },
  ];
  for (const c of criteriosBeca2) {
    await prisma.criterioEvaluacion.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        becaId: becaDemo2.id,
        nombre: c.nombre,
        peso: c.peso,
      },
    });
  }
  console.log('✅ Criterios de evaluación creados para beca 2 (demo)');

  // ==========================================
  // GÉNEROS
  // ==========================================
  const generos = ['Masculino', 'Femenino', 'Otro'];
  for (const nombre of generos) {
    await prisma.genero.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log('✅ Géneros creados');

  // ==========================================
  // NIVELES ACADÉMICOS
  // ==========================================
  const niveles = ['Primaria', 'Secundaria', 'Técnico', 'Universitario', 'Posgrado'];
  for (const nombre of niveles) {
    await prisma.nivelAcademico.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log('✅ Niveles académicos creados');

  // ==========================================
  // DEPARTAMENTOS DE GUATEMALA
  // ==========================================
  const departamentos = [
    'Alta Verapaz', 'Baja Verapaz', 'Chimaltenango', 'Chiquimula',
    'El Proverbio', 'Escuintla', 'Guatemala', 'Huehuetenango',
    'Izabal', 'Jalapa', 'Jutiapa', 'Petén',
    'Quetzaltenango', 'Quiché', 'Retalhuleu', 'Sacatepéquez',
    'San Marcos', 'Santa Rosa', 'Sololá', 'Suchitepéquez',
    'Totonicapán', 'Zacapa',
  ];

  for (const nombre of departamentos) {
    await prisma.departamento.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log('✅ Departamentos creados');

  // ==========================================
  // MUNICIPIOS (muestra por departamento)
  // ==========================================
  const guatemala = await prisma.departamento.findUnique({ where: { nombre: 'Guatemala' } });
  if (guatemala) {
    const municipiosGuatemala = [
      'Guatemala', 'Mixco', 'Villa Nueva', 'Quetzaltenango',
      'San Juan Sacatepéquez', 'San José Pinula', 'Florida',
    ];
    for (const nombre of municipiosGuatemala) {
      await prisma.municipio.upsert({
        where: { nombre_departamentoId: { nombre, departamentoId: guatemala.id } },
        update: {},
        create: { nombre, departamentoId: guatemala.id },
      });
    }
  }
  console.log('✅ Municipios creados (muestra)');

  // ==========================================
  // TIPOS DE DOCUMENTO
  // ==========================================
  const documentos = [
    'Certificado académico',
    'Constancia de estudios',
    'Cédula de depletedción',
    'Fotografía',
    'Comprobante de ingresos',
    'Carta de recomendación',
  ];
  for (const nombre of documentos) {
    await prisma.documentoTipo.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log('✅ Tipos de documento creados');

  // ==========================================
  // USUARIO ADMIN POR DEFECTO
  // ==========================================
  const adminRoleData = await prisma.rol.findUnique({ where: { nombre: 'ADMIN' } });
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  await prisma.usuario.upsert({
    where: { cui: '1234567890123' },
    update: {},
    create: {
      cui: '1234567890123',
      nombres: 'Administrador SIGEB',
      email: 'admin@sigeb.gov.gt',
      passwordHash: hashedPassword,
      rolId: adminRoleData!.id,
      estado: 'ACTIVO',
    },
  });
  console.log('✅ Usuario admin creado (admin@sigeb.gov.gt / Admin123!)');

  // ==========================================
  // USUARIO POSTULANTE POR DEFECTO
  // ==========================================
  const postulanteRoleData = await prisma.rol.findUnique({
    where: { nombre: 'POSTULANTE' },
  });

  await prisma.usuario.upsert({
    where: { cui: '9999999999999' },
    update: {},
    create: {
      cui: '9999999999999',
      nombres: 'Postulante Demo',
      email: 'postulante@demo.gt',
      passwordHash: hashedPassword,
      rolId: postulanteRoleData!.id,
      estado: 'ACTIVO',
    },
  });
  console.log('✅ Usuario postulante creado (postulante@demo.gt / Admin123!)');

  // ==========================================
  // USUARIOS DEMO (Evaluación/Comités)
  // ==========================================
  const evaluadorRoleData = await prisma.rol.findUnique({
    where: { nombre: 'EVALUADOR' },
  });
  const coordinadorRoleData = await prisma.rol.findUnique({
    where: { nombre: 'COORDINADOR_COMITE' },
  });
  const miembroRoleData = await prisma.rol.findUnique({
    where: { nombre: 'MIEMBRO_COMITE' },
  });

  const usuariosDemo = [
    {
      cui: '8888888888888',
      nombres: 'Evaluador Demo',
      email: 'evaluador@demo.gt',
      rolId: evaluadorRoleData!.id,
    },
    {
      cui: '7777777777777',
      nombres: 'Coordinador Demo',
      email: 'coordinador@demo.gt',
      rolId: coordinadorRoleData!.id,
    },
    {
      cui: '6666666666666',
      nombres: 'Miembro Comité Demo',
      email: 'miembro@demo.gt',
      rolId: miembroRoleData!.id,
    },
  ];

  for (const usuario of usuariosDemo) {
    await prisma.usuario.upsert({
      where: { cui: usuario.cui },
      update: {},
      create: {
        ...usuario,
        passwordHash: hashedPassword,
        estado: 'ACTIVO',
      },
    });
  }
  console.log('✅ Usuarios demo de evaluación creados (evaluador/coordinador/miembro@demo.gt / Admin123!)');

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
