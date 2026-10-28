import { PrismaClient, SolicitudEstado, Rol } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// CONSTANTES DE DISTRIBUCIÓN
// ==========================================

/** 1000 solicitudes repartidas en 8 estados. */
export const TOTAL_SOLICITUDES = 1000;

export const DISTRIBUCION_ESTADOS: Record<SolicitudEstado, number> = {
  BORRADOR: 100,
  ENVIADA: 70,
  EN_REVISION: 100,
  CORRECCION: 30,
  EVALUADA: 100,
  PENDIENTE_SEGUNDA_APROBACION: 70,
  APROBADA: 360,
  RECHAZADA: 170,
};

/** 11 convocatorias para distintos niveles académicos. */
export const TOTAL_CONVOCATORIAS = 11;

/** 250 postulantes únicos. */
export const TOTAL_POSTULANTES = 250;

/** 30 evaluadores. */
export const TOTAL_EVALUADORES = 30;

/** 50 miembros de comité. */
export const TOTAL_MIEMBROS_COMITE = 50;

/** 4 ciclos a lo largo de ~12 meses. */
export const CICLOS = 4;

// ==========================================
// BECAS POR NIVEL ACADÉMICO
// ==========================================

export const BECAS_POR_NIVEL: Array<{
  id: string;
  nombre: string;
  descripcion: string;
  nivel: string;
  cobertura: 'COMPLETA' | 'PARCIAL';
  montoBase: number;
  criterios: { nombre: string; peso: number }[];
}> = [
  // ===== PRIMARIA =====
  {
    id: '00000000-0000-4000-8000-000000000011',
    nombre: 'Beca de Apoyo a Estudios Primarios',
    descripcion: 'Apoyo económico para estudiantes de primaria con alto rendimiento académico y necesidad socioeconómica.',
    nivel: 'PRIMARIA',
    cobertura: 'PARCIAL',
    montoBase: 2000,
    criterios: [
      { nombre: 'Rendimiento académico', peso: 0.6 },
      { nombre: 'Situación socioeconómica', peso: 0.4 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000012',
    nombre: 'Beca de Excelencia en Matemáticas',
    descripcion: 'Beca para estudiantes de primaria destacados en matemáticas.',
    nivel: 'PRIMARIA',
    cobertura: 'COMPLETA',
    montoBase: 3000,
    criterios: [
      { nombre: 'Rendimiento en matemáticas', peso: 0.7 },
      { nombre: 'Situación socioeconómica', peso: 0.3 },
    ],
  },
  // ===== SECUNDARIA =====
  {
    id: '00000000-0000-4000-8000-000000000013',
    nombre: 'Beca de Permanencia Secundaria',
    descripcion: 'Apoyo para estudiantes de secundaria en riesgo de deserción.',
    nivel: 'SECUNDARIA',
    cobertura: 'PARCIAL',
    montoBase: 4000,
    criterios: [
      { nombre: 'Desempeño académico', peso: 0.5 },
      { nombre: 'Necesidad socioeconómica', peso: 0.5 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000014',
    nombre: 'Beca de Ciencias Secundaria',
    descripcion: 'Beca para estudiantes destacados en ciencias en nivel secundario.',
    nivel: 'SECUNDARIA',
    cobertura: 'COMPLETA',
    montoBase: 5000,
    criterios: [
      { nombre: 'Rendimiento en ciencias', peso: 0.6 },
      { nombre: 'Situación socioeconómica', peso: 0.4 },
    ],
  },
  // ===== DIVERSIFICADO =====
  {
    id: '00000000-0000-4000-8000-000000000015',
    nombre: 'Beca de Excelencia en Diversificado',
    descripcion: 'Apoyo integral para estudiantes de diversificado con alto promedio.',
    nivel: 'DIVERSIFICADO',
    cobertura: 'COMPLETA',
    montoBase: 6000,
    criterios: [
      { nombre: 'Rendimiento académico', peso: 0.55 },
      { nombre: 'Situación socioeconómica', peso: 0.45 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000016',
    nombre: 'Beca de Continuidad de Estudios',
    descripcion: 'Beca para estudiantes que interrumpieron sus estudios y buscan reincorporarse.',
    nivel: 'DIVERSIFICADO',
    cobertura: 'PARCIAL',
    montoBase: 4500,
    criterios: [
      { nombre: 'Desempeño académico', peso: 0.45 },
      { nombre: 'Necesidad socioeconómica', peso: 0.35 },
      { nombre: 'Participación comunitaria', peso: 0.2 },
    ],
  },
  // ===== TÉCNICO =====
  {
    id: '00000000-0000-4000-8000-000000000017',
    nombre: 'Beca Técnica Industrial',
    descripcion: 'Apoyo para estudiantes de carreras técnicas industriales.',
    nivel: 'TECNICO',
    cobertura: 'PARCIAL',
    montoBase: 5000,
    criterios: [
      { nombre: 'Desempeño técnico', peso: 0.5 },
      { nombre: 'Situación socioeconómica', peso: 0.5 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000018',
    nombre: 'Beca de Apoyo a Estudios Técnicos',
    descripcion: 'Beca parcial para estudiantes de institutos técnicos.',
    nivel: 'TECNICO',
    cobertura: 'COMPLETA',
    montoBase: 7000,
    criterios: [
      { nombre: 'Rendimiento técnico', peso: 0.6 },
      { nombre: 'Situación socioeconómica', peso: 0.4 },
    ],
  },
  // ===== UNIVERSIDAD (ya existentes + nuevas) =====
  {
    id: '00000000-0000-4000-8000-000000000001',
    nombre: 'Beca de Excelencia Académica',
    descripcion: 'Apoyo económico integral para estudiantes universitarios con alto rendimiento académico.',
    nivel: 'UNIVERSIDAD',
    cobertura: 'COMPLETA',
    montoBase: 12000,
    criterios: [
      { nombre: 'Rendimiento académico', peso: 0.5 },
      { nombre: 'Situación socioeconómica', peso: 0.3 },
      { nombre: 'Actividades extracurriculares y comunitarias', peso: 0.2 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    nombre: 'Beca de Permanencia Universitaria',
    descripcion: 'Beca de apoyo para estudiantes universitarios en riesgo de deserción.',
    nivel: 'UNIVERSIDAD',
    cobertura: 'PARCIAL',
    montoBase: 6000,
    criterios: [
      { nombre: 'Desempeño académico', peso: 0.45 },
      { nombre: 'Necesidad socioeconómica', peso: 0.35 },
      { nombre: 'Participación comunitaria', peso: 0.2 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000019',
    nombre: 'Beca de Investigación Universitaria',
    descripcion: 'Apoyo para estudiantes universitarios que desarrollan proyectos de investigación.',
    nivel: 'UNIVERSIDAD',
    cobertura: 'COMPLETA',
    montoBase: 15000,
    criterios: [
      { nombre: 'Calidad del proyecto', peso: 0.4 },
      { nombre: 'Rendimiento académico', peso: 0.3 },
      { nombre: 'Situación socioeconómica', peso: 0.3 },
    ],
  },
];

// ==========================================
// DATOS BASE: NOMBRES, APELLIDOS, ETC.
// ==========================================

const APELLIDOS = [
  'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez',
  'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Reyes', 'Morales',
  'Jiménez', 'Herrera', 'Medina', 'Castro', 'Ortiz', 'Rojas', 'Guzmán', 'Ruiz',
  'Álvarez', 'Méndez', 'Castillo', 'Suárez', 'Gutiérrez', 'Romero', 'Vargas',
  'Ramos', 'Molina', 'Vega', 'Cruz', 'Silva', 'Moreno', 'Gallardo', 'Pineda',
  'Cabrera', 'Fuentes', 'Aguilar', 'Estrada', 'León', 'Mendoza', 'Peña',
  'Cortés', 'Carrillo', 'Salazar', 'Cano', 'Cervantes',
];

const NOMBRES_MASC = [
  'Carlos', 'Juan', 'José', 'Luis', 'Miguel', 'Pedro', 'Jorge', 'Manuel',
  'Francisco', 'Antonio', 'Alejandro', 'Daniel', 'Pablo', 'Adrián', 'Raúl',
  'Óscar', 'Andrés', 'Fernando', 'Sergio', 'Diego', 'Javier', 'Roberto',
  'Alberto', 'Enrique', 'Vicente', 'Iván', 'Rubén', 'Gabriel', 'Eduardo',
  'Ricardo', 'Federico', 'Esteban', 'Gustavo', 'Héctor', 'Ignacio', 'Julio',
  'Kevin', 'Leonardo', 'Marco', 'Nicolás', 'Omar', 'Pablo', 'Ramón', 'Saúl',
  'Tomás', 'Ulises', 'Valentín', 'Walter', 'Xavier', 'Yahir', 'Zacarías',
];

const NOMBRES_FEM = [
  'María', 'Ana', 'Laura', 'Sofía', 'Isabel', 'Carmen', 'Lucía', 'Paula',
  'Elena', 'Claudia', 'Patricia', 'Verónica', 'Andrea', 'Natalia', 'Mariana',
  'Gabriela', 'Valeria', 'Daniela', 'Alejandra', 'Camila', 'Fernanda', 'Ximena',
  'Jimena', 'Renata', 'Regina', 'Montserrat', 'Xóchitl', 'Itzel', 'Yaretzi',
  'Abril', 'Beatriz', 'Carolina', 'Diana', 'Estefanía', 'Fabiola', 'Gloria',
  'Hilda', 'Irene', 'Juana', 'Karla', 'Leticia', 'Mónica', 'Nadia', 'Olga',
  'Priscila', 'Rosa', 'Sara', 'Teresa', 'Úrsula', 'Verónica', 'Wendy', 'Yolanda',
  'Zulema',
];

// Constantes de carreras e instituciones se usan inline en crearPostulantes

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function nombreAleatorio(genero?: 'M' | 'F'): string {
  const esMujer = genero === 'F' || (genero === undefined && Math.random() > 0.5);
  const nombre = esMujer
    ? NOMBRES_FEM[Math.floor(Math.random() * NOMBRES_FEM.length)]
    : NOMBRES_MASC[Math.floor(Math.random() * NOMBRES_MASC.length)];
  const apellido1 = APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)];
  const apellido2 = APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)];
  return `${nombre} ${apellido1} ${apellido2}`;
}

function cuiAleatorio(): string {
  return Array.from({ length: 13 }, () => Math.floor(Math.random() * 10)).join('');
}

function emailAleatorio(nombre: string, idx: number, dominio = 'seed.demo.gt'): string {
  const base = nombre.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
  return `${base}${idx}@${dominio}`;
}

function telefonoAleatorio(): string {
  return `+502 ${Math.floor(Math.random() * 9 + 2)}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
}

function fechaNacimientoAleatoria(edadMin = 17, edadMax = 55): Date {
  const hoy = new Date();
  const edad = Math.floor(Math.random() * (edadMax - edadMin + 1)) + edadMin;
  const año = hoy.getFullYear() - edad;
  const mes = Math.floor(Math.random() * 12);
  const dia = Math.floor(Math.random() * 28) + 1;
  return new Date(año, mes, dia);
}

export function fechaRelativa(dias: number, horas = 0, minutos = 0): Date {
  const f = new Date();
  f.setDate(f.getDate() + dias);
  f.setHours(f.getHours() + horas);
  f.setMinutes(f.getMinutes() + minutos);
  f.setSeconds(0);
  f.setMilliseconds(0);
  return f;
}

export function elegirUno<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function barajar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// ==========================================
// FUNCIONES DE CREACIÓN DE USUARIOS
// ==========================================

export async function crearPostulantes(cantidad: number, rolPostulante: Rol) {
  const postulantes = [];
  const hashedPassword = await import('bcrypt').then(b => b.hash('Admin123!', 10));
  const generos = await prisma.genero.findMany();
  const departamentos = await prisma.departamento.findMany();
  const municipios = await prisma.municipio.findMany();

  for (let i = 0; i < cantidad; i++) {
    const genero = Math.random() > 0.5 ? 'M' : 'F';
    const nombre = nombreAleatorio(genero);
    const cui = cuiAleatorio();
    const email = emailAleatorio(nombre, i);
    const esUniv = Math.random() > 0.5;

    const usuario = await prisma.usuario.upsert({
      where: { email },
      update: { nombres: nombre },
      create: {
        cui,
        nombres: nombre,
        email,
        passwordHash: hashedPassword,
        rolId: rolPostulante.id,
        estado: 'ACTIVO',
        telefono: telefonoAleatorio(),
        fechaNacimiento: fechaNacimientoAleatoria(),
        generoId: generos.find(g => g.nombre === (genero === 'F' ? 'Femenino' : 'Masculino'))?.id,
        departamentoId: departamentos[Math.floor(Math.random() * departamentos.length)].id,
        municipioId: municipios[Math.floor(Math.random() * municipios.length)].id,
      },
    });

    postulantes.push({ usuario, esUniv });
  }

  console.log(`✅ ${postulantes.length} postulantes creados`);
  return postulantes;
}

export async function crearEvaluadores(cantidad: number, rolEvaluador: Rol) {
  const evaluadores = [];
  const hashedPassword = await import('bcrypt').then(b => b.hash('Admin123!', 10));
  for (let i = 0; i < cantidad; i++) {
    const genero = Math.random() > 0.5 ? 'M' : 'F';
    const nombre = `Eval ${nombreAleatorio(genero)}`;
    const cui = cuiAleatorio();
    const email = `eval${i + 1}@seed.demo.gt`;

    const usuario = await prisma.usuario.upsert({
      where: { email },
      update: { nombres: nombre },
      create: {
        cui,
        nombres: nombre,
        email,
        passwordHash: hashedPassword,
        rolId: rolEvaluador.id,
        estado: 'ACTIVO',
        telefono: telefonoAleatorio(),
        fechaNacimiento: fechaNacimientoAleatoria(30, 65),
      },
    });
    evaluadores.push(usuario);
  }
  console.log(`✅ ${evaluadores.length} evaluadores creados`);
  return evaluadores;
}

export async function crearMiembrosComite(cantidad: number, rolMiembro: Rol) {
  const miembros = [];
  const hashedPassword = await import('bcrypt').then(b => b.hash('Admin123!', 10));
  for (let i = 0; i < cantidad; i++) {
    const genero = Math.random() > 0.5 ? 'M' : 'F';
    const nombre = `Miembro ${nombreAleatorio(genero)}`;
    const cui = cuiAleatorio();
    const email = `miembro${i + 10}@seed.demo.gt`;

    const usuario = await prisma.usuario.upsert({
      where: { email },
      update: { nombres: nombre },
      create: {
        cui,
        nombres: nombre,
        email,
        passwordHash: hashedPassword,
        rolId: rolMiembro.id,
        estado: 'ACTIVO',
        telefono: telefonoAleatorio(),
        fechaNacimiento: fechaNacimientoAleatoria(35, 70),
      },
    });
    miembros.push(usuario);
  }
  console.log(`✅ ${miembros.length} miembros de comité creados`);
  return miembros;
}

export async function crearRolesEspeciales(
  rolCoordinador: Rol,
  rolJefeBecas: Rol,
  rolAdmin: Rol
) {
  const hashedPassword = await import('bcrypt').then(b => b.hash('Admin123!', 10));

  const coord = await prisma.usuario.upsert({
    where: { email: 'coordinador@seed.demo.gt' },
    update: {},
    create: {
      cui: cuiAleatorio(),
      nombres: 'Coordinador Principal Demo',
      email: 'coordinador@seed.demo.gt',
      passwordHash: hashedPassword,
      rolId: rolCoordinador.id,
      estado: 'ACTIVO',
    },
  });

  const jefe = await prisma.usuario.upsert({
    where: { email: 'jefebecas@seed.demo.gt' },
    update: {},
    create: {
      cui: cuiAleatorio(),
      nombres: 'Jefa de Becas Principal',
      email: 'jefebecas@seed.demo.gt',
      passwordHash: hashedPassword,
      rolId: rolJefeBecas.id,
      estado: 'ACTIVO',
    },
  });

  const dir = await prisma.usuario.upsert({
    where: { email: 'director@seed.demo.gt' },
    update: {},
    create: {
      cui: cuiAleatorio(),
      nombres: 'Director de Becas Principal',
      email: 'director@seed.demo.gt',
      passwordHash: hashedPassword,
      rolId: rolAdmin.id,
      estado: 'ACTIVO',
    },
  });

  console.log('✅ Roles especiales creados (coordinador, jefebecas, director)');
  return { coord, jefe, dir };
}

// ==========================================
// CONVOCATORIAS POR NIVEL
// ==========================================

export async function asegurarConvocatorias(total: number) {
  const existentes = await prisma.convocatoria.findMany({ orderBy: { createdAt: 'asc' } });
  const convocatorias = [...existentes];
  const nuevasIds: string[] = [];

  const becas = await prisma.beca.findMany({ where: { activa: true } });

  // Crear becas que falten (de cualquier nivel)
  for (const beca of BECAS_POR_NIVEL) {
    const existe = await prisma.beca.findUnique({ where: { id: beca.id } });
    if (!existe) {
      await prisma.beca.upsert({
        where: { id: beca.id },
        update: { nombre: beca.nombre, descripcion: beca.descripcion, activa: true },
        create: {
          id: beca.id,
          nombre: beca.nombre,
          descripcion: beca.descripcion,
          activa: true,
        },
      });

      await prisma.criterioEvaluacion.deleteMany({ where: { becaId: beca.id } });
      for (const criterio of beca.criterios) {
        await prisma.criterioEvaluacion.create({
          data: {
            becaId: beca.id,
            nombre: criterio.nombre,
            peso: criterio.peso,
            activo: true,
          },
        });
      }
    }
  }

  const becasActualizadas = await prisma.beca.findMany({ where: { activa: true } });
  console.log(`✅ ${becasActualizadas.length} becas activas (${becasActualizadas.length - becas.length} nuevas)`);

  const hoy = new Date();
  const ciclos = 4;
  const duracionCicloDias = 90;
  const brechaDias = 30;

  for (let c = existentes.length; c < total; c++) {
    const cicloIdx = c % ciclos;
    const inicioCiclo = new Date(hoy);
    inicioCiclo.setDate(hoy.getDate() - (ciclos - 1 - cicloIdx) * (duracionCicloDias + brechaDias) - duracionCicloDias / 2);

    const fechaInicio = new Date(inicioCiclo);
    fechaInicio.setDate(fechaInicio.getDate() - 30);
    const fechaCierre = new Date(fechaInicio);
    fechaCierre.setDate(fechaCierre.getDate() + 45);

    const becaIdx = c % becasActualizadas.length;
    const beca = becasActualizadas[becaIdx];
    const esUniv = beca.nombre.includes('Excelencia') || beca.nombre.includes('Permanencia') || beca.nombre.includes('Investigación');
    const montoBase = esUniv ? 12000 : (beca.nombre.includes('Primaria') ? 2000 : beca.nombre.includes('Técnica') || beca.nombre.includes('Tecnico') ? 5000 : 6000);

    // Determinar estado según ciclo
    let estado = 'EN_EVALUACION';
    if (c === total - 1) estado = 'ARCHIVADA';
    else if (c < 3) estado = 'RESUELTA';
    else if (c === 3) estado = 'ABIERTA'; // Una ABIERTA con Excelencia para E2E

    const convocatoria = await prisma.convocatoria.create({
      data: {
        nombre: `${beca.nombre} - Ciclo ${cicloIdx + 1} 202${cicloIdx === 3 ? '5' : '6'}`,
        descripcion: `Convocatoria del ciclo ${cicloIdx + 1} para ${beca.nombre.toLowerCase()}.`,
        becaId: beca.id,
        estado: estado as any,
        fechaApertura: fechaInicio,
        fechaCierre,
        montoBase,
        moneda: 'GTQ',
        permiteParcial: true,
        usarReglasMonto: true,
        formulario: JSON.stringify([]),
        reglasMonto: {
          create: [
            {
              nombre: 'Regla tramo bajo',
              tipo: 'PORCENTAJE',
              porcentaje: 0.5,
              prioridad: 1,
              ingresoMin: 0,
              ingresoMax: 5000,
              activo: true,
            },
            {
              nombre: 'Regla tramo medio',
              tipo: 'PORCENTAJE',
              porcentaje: 0.75,
              prioridad: 2,
              ingresoMin: 5000,
              ingresoMax: 10000,
              activo: true,
            },
            {
              nombre: 'Regla tramo alto',
              tipo: 'FIJO',
              montoFijo: Math.round(montoBase * 0.6),
              prioridad: 3,
              ingresoMin: 10000,
              ingresoMax: 15000,
              activo: true,
            },
            {
              nombre: 'Regla monto completo',
              tipo: 'COMPLETO',
              prioridad: 0,
              ingresoMin: 0,
              ingresoMax: 3000,
              activo: true,
            },
          ],
        },
      },
      include: { reglasMonto: true },
    });

    nuevasIds.push(convocatoria.id);

    const tiposDoc = await prisma.documentoTipo.findMany();
    for (const tipo of tiposDoc) {
      await prisma.convocatoriaDocRequerido.create({
        data: {
          convocatoriaId: convocatoria.id,
          documentoTipoId: tipo.id,
          obligatorio: tipo.nombre !== 'Carta de recomendación',
        },
      });
    }

    convocatorias.push(convocatoria);
  }

  console.log(`✅ ${convocatorias.length} convocatorias aseguradas (${nuevasIds.length} nuevas)`);
  return { convocatorias, nuevasIds };
}

// ==========================================
// FUNCIONES AUXILIARES PARA ESCENARIOS
// ==========================================

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