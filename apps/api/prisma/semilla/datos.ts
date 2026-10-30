import { Prisma, PrismaClient, SolicitudEstado, Rol } from '@prisma/client';

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

/**
 * 51 convocatorias: 35 ABIERTAS (5 por cada uno de los 7 niveles del
 * catálogo), 15 cerradas/históricas y 1 BORRADOR base.
 */
export const TOTAL_CONVOCATORIAS = 51;

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
  {
    id: '00000000-0000-4000-8000-000000000040',
    nombre: 'Beca de Excelencia en Diversificado Avanzado',
    descripcion: 'Beca de alto monto para estudiantes de diversificado con excelencia academica sostenida y alto compromiso comunitario.',
    nivel: 'DIVERSIFICADO',
    cobertura: 'COMPLETA',
    montoBase: 12000,
    criterios: [
      { nombre: 'Rendimiento academico', peso: 0.6 },
      { nombre: 'Participacion comunitaria', peso: 0.25 },
      { nombre: 'Situacion socioeconomica', peso: 0.15 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000041',
    nombre: 'Beca de Excelencia en Primaria Avanzada',
    descripcion: 'Beca de alto monto para estudiantes de primaria con excelencia sostenida.',
    nivel: 'PRIMARIA',
    cobertura: 'COMPLETA',
    montoBase: 12000,
    criterios: [
      { nombre: 'Rendimiento academico', peso: 0.6 },
      { nombre: 'Participacion comunitaria', peso: 0.25 },
      { nombre: 'Situacion socioeconomica', peso: 0.15 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000042',
    nombre: 'Beca de Excelencia en Basico Avanzado',
    descripcion: 'Beca de alto monto para estudiantes de basico con excelencia sostenida.',
    nivel: 'BASICO',
    cobertura: 'COMPLETA',
    montoBase: 12000,
    criterios: [
      { nombre: 'Rendimiento academico', peso: 0.6 },
      { nombre: 'Participacion comunitaria', peso: 0.25 },
      { nombre: 'Situacion socioeconomica', peso: 0.15 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000043',
    nombre: 'Beca de Excelencia en Secundaria Avanzada',
    descripcion: 'Beca de alto monto para estudiantes de secundaria con excelencia sostenida.',
    nivel: 'SECUNDARIA',
    cobertura: 'COMPLETA',
    montoBase: 12000,
    criterios: [
      { nombre: 'Rendimiento academico', peso: 0.6 },
      { nombre: 'Participacion comunitaria', peso: 0.25 },
      { nombre: 'Situacion socioeconomica', peso: 0.15 },
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
  // ===== NUEVAS BECAS =====
  {
    id: '00000000-0000-4000-8000-000000000020',
    nombre: 'Beca de Arte y Cultura',
    descripcion: 'Apoyo para estudiantes destacados en artes visuales, música, teatro y danza.',
    nivel: 'DIVERSIFICADO',
    cobertura: 'PARCIAL',
    montoBase: 4000,
    criterios: [
      { nombre: 'Talento artístico', peso: 0.5 },
      { nombre: 'Situación socioeconómica', peso: 0.3 },
      { nombre: 'Participación cultural', peso: 0.2 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000021',
    nombre: 'Beca Deportiva',
    descripcion: 'Apoyo para estudiantes-atletas con alto rendimiento deportivo y académico.',
    nivel: 'SECUNDARIA',
    cobertura: 'COMPLETA',
    montoBase: 5000,
    criterios: [
      { nombre: 'Rendimiento deportivo', peso: 0.5 },
      { nombre: 'Rendimiento académico', peso: 0.3 },
      { nombre: 'Situación socioeconómica', peso: 0.2 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000022',
    nombre: 'Beca de Liderazgo Comunitario',
    descripcion: 'Apoyo para estudiantes que lideran proyectos comunitarios y sociales.',
    nivel: 'UNIVERSIDAD',
    cobertura: 'PARCIAL',
    montoBase: 8000,
    criterios: [
      { nombre: 'Liderazgo comunitario', peso: 0.4 },
      { nombre: 'Rendimiento académico', peso: 0.3 },
      { nombre: 'Situación socioeconómica', peso: 0.3 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000023',
    nombre: 'Beca de Innovación Tecnológica',
    descripcion: 'Apoyo para estudiantes que desarrollan soluciones tecnológicas innovadoras.',
    nivel: 'TECNICO',
    cobertura: 'COMPLETA',
    montoBase: 9000,
    criterios: [
      { nombre: 'Innovación tecnológica', peso: 0.5 },
      { nombre: 'Rendimiento académico', peso: 0.3 },
      { nombre: 'Situación socioeconómica', peso: 0.2 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000024',
    nombre: 'Beca de Inclusión Educativa',
    descripcion: 'Apoyo para estudiantes con discapacidad o en situación de vulnerabilidad.',
    nivel: 'PRIMARIA',
    cobertura: 'COMPLETA',
    montoBase: 3500,
    criterios: [
      { nombre: 'Necesidad socioeconómica', peso: 0.5 },
      { nombre: 'Rendimiento académico', peso: 0.3 },
      { nombre: 'Situación de vulnerabilidad', peso: 0.2 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000025',
    nombre: 'Beca de Emprendimiento',
    descripcion: 'Apoyo para estudiantes que desarrollan proyectos de emprendimiento.',
    nivel: 'DIVERSIFICADO',
    cobertura: 'PARCIAL',
    montoBase: 5500,
    criterios: [
      { nombre: 'Proyecto de emprendimiento', peso: 0.45 },
      { nombre: 'Rendimiento académico', peso: 0.3 },
      { nombre: 'Situación socioeconómica', peso: 0.25 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000026',
    nombre: 'Beca de Educación Ambiental',
    descripcion: 'Apoyo para estudiantes que desarrollan proyectos de conservación ambiental.',
    nivel: 'SECUNDARIA',
    cobertura: 'PARCIAL',
    montoBase: 4500,
    criterios: [
      { nombre: 'Proyecto ambiental', peso: 0.4 },
      { nombre: 'Rendimiento académico', peso: 0.35 },
      { nombre: 'Situación socioeconómica', peso: 0.25 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000027',
    nombre: 'Beca de Salud Comunitaria',
    descripcion: 'Apoyo para estudiantes de carreras de salud que sirven en comunidades rurales.',
    nivel: 'UNIVERSIDAD',
    cobertura: 'COMPLETA',
    montoBase: 10000,
    criterios: [
      { nombre: 'Compromiso comunitario', peso: 0.4 },
      { nombre: 'Rendimiento académico', peso: 0.35 },
      { nombre: 'Situación socioeconómica', peso: 0.25 },
    ],
  },
  // ===== BÁSICO =====
  {
    id: '00000000-0000-4000-8000-000000000028',
    nombre: 'Beca de Apoyo a Estudios Básicos',
    descripcion: 'Apoyo económico para estudiantes del ciclo básico con necesidad socioeconómica.',
    nivel: 'BASICO',
    cobertura: 'PARCIAL',
    montoBase: 3000,
    criterios: [
      { nombre: 'Rendimiento académico', peso: 0.55 },
      { nombre: 'Situación socioeconómica', peso: 0.45 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000029',
    nombre: 'Beca de Excelencia en Básico',
    descripcion: 'Beca completa para estudiantes del ciclo básico con alto rendimiento académico.',
    nivel: 'BASICO',
    cobertura: 'COMPLETA',
    montoBase: 4000,
    criterios: [
      { nombre: 'Rendimiento académico', peso: 0.65 },
      { nombre: 'Situación socioeconómica', peso: 0.35 },
    ],
  },
  // ===== POSGRADO =====
  {
    id: '00000000-0000-4000-8000-000000000030',
    nombre: 'Beca de Investigación de Posgrado',
    descripcion: 'Apoyo para estudiantes de posgrado que desarrollan proyectos de investigación aplicada.',
    nivel: 'POSGRADO',
    cobertura: 'COMPLETA',
    montoBase: 18000,
    criterios: [
      { nombre: 'Calidad de la investigación', peso: 0.5 },
      { nombre: 'Rendimiento académico', peso: 0.3 },
      { nombre: 'Situación socioeconómica', peso: 0.2 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000031',
    nombre: 'Beca de Excelencia en Posgrado',
    descripcion: 'Beca parcial para profesionales que cursan un posgrado con alto rendimiento.',
    nivel: 'POSGRADO',
    cobertura: 'PARCIAL',
    montoBase: 12000,
    criterios: [
      { nombre: 'Rendimiento académico', peso: 0.55 },
      { nombre: 'Trayectoria profesional', peso: 0.25 },
      { nombre: 'Situación socioeconómica', peso: 0.2 },
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
      // Se reactiva: un evaluador que quedó inactivo en una corrida
      // anterior volvería a aparecer como no disponible.
      update: { nombres: nombre, estado: 'ACTIVO' },
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
      // Igual que los evaluadores: el miembro del comité queda disponible.
      update: { nombres: nombre, estado: 'ACTIVO' },
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

/** Niveles del catálogo y el nombre que usa la semilla en `BECAS_POR_NIVEL`. */
const NIVELES_CATALOGO = [
  { semilla: 'PRIMARIA', nombre: 'Primaria' },
  { semilla: 'BASICO', nombre: 'Básico' },
  { semilla: 'DIVERSIFICADO', nombre: 'Diversificado' },
  { semilla: 'SECUNDARIA', nombre: 'Secundaria' },
  { semilla: 'TECNICO', nombre: 'Técnico' },
  { semilla: 'UNIVERSIDAD', nombre: 'Universitario' },
  { semilla: 'POSGRADO', nombre: 'Posgrado' },
] as const;

const ABIERTAS_POR_NIVEL = 5;
const CERRADAS_POR_NIVEL = 2;

/** Segunda convocatoria cerrada de cada nivel. Cuatro quedan RESUELTA para los ciclos. */
const SEGUNDO_ESTADO_POR_NIVEL: Record<
  string,
  { estado: 'CERRADA' | 'EN_EVALUACION' | 'RESUELTA' | 'ABIERTA'; apertura: number; cierre: number }
> = {
  Primaria: { estado: 'RESUELTA', apertura: -240, cierre: -150 },
  Básico: { estado: 'RESUELTA', apertura: -240, cierre: -150 },
  Diversificado: { estado: 'RESUELTA', apertura: -240, cierre: -150 },
  Secundaria: { estado: 'RESUELTA', apertura: -240, cierre: -150 },
  Técnico: { estado: 'EN_EVALUACION', apertura: -150, cierre: -60 },
  Universitario: { estado: 'EN_EVALUACION', apertura: -150, cierre: -60 },
  Posgrado: { estado: 'ABIERTA', apertura: -90, cierre: -30 },
};

export async function asegurarConvocatorias(total: number) {
  const hoy = new Date();
  const existentes = await prisma.convocatoria.findMany({
    orderBy: { createdAt: 'asc' },
    include: { nivelAcademico: true },
  });
  const convocatorias = [...existentes];
  const nuevasIds: string[] = [];
  let becasCreadas = 0;

  // 1. Crear/actualizar las 23 becas canónicas y sus criterios.
  for (const beca of BECAS_POR_NIVEL) {
    const existe = await prisma.beca.findUnique({ where: { id: beca.id } });
    if (!existe) {
      await prisma.beca.create({
        data: {
          id: beca.id,
          nombre: beca.nombre,
          descripcion: beca.descripcion,
          activa: true,
          montoBase: beca.montoBase,
        },
      });

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
      becasCreadas++;
    } else {
      await prisma.beca.update({
        where: { id: beca.id },
        data: { activa: true, montoBase: beca.montoBase },
      });
    }
  }

  // Las becas que no pertenecen al catálogo canónico son datos legacy de
  // versiones anteriores de la demo. Se desactivan para no ofrecerlas en el
  // portal ni en el formulario de convocatorias nuevas.
  const idsCanonicos = [
    // Becas base que usa `prisma/seed.ts` en las convocatorias iniciales.
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000003',
    ...BECAS_POR_NIVEL.map((beca) => beca.id),
  ];
  await prisma.beca.updateMany({
    where: { id: { notIn: idsCanonicos } },
    data: { activa: false },
  });

  const becasActualizadas = await prisma.beca.findMany({
    where: { id: { in: idsCanonicos }, activa: true },
  });
  console.log(
    `✅ ${becasActualizadas.length} becas canónicas activas (${becasCreadas} nuevas)`,
  );

  // 2. Índice de becas canónicas por nombre de nivel del catálogo.
  type DefinicionBeca = (typeof BECAS_POR_NIVEL)[number];
  const becasPorNivel = new Map<string, DefinicionBeca[]>();
  for (const definicion of BECAS_POR_NIVEL) {
    const nivel = NIVELES_CATALOGO.find((n) => n.semilla === definicion.nivel);
    if (!nivel) continue;
    const lista = becasPorNivel.get(nivel.nombre) ?? [];
    lista.push(definicion);
    becasPorNivel.set(nivel.nombre, lista);
  }

  const nivelesDb = await prisma.nivelAcademico.findMany();
  const nivelPorNombre = new Map(
    nivelesDb.map((nivel) => [nivel.nombre, nivel]),
  );

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

  const abiertasPorNivel = new Map<string, number>();
  const cerradasPorNivel = new Map<string, number>();
  for (const conv of existentes) {
    const nivel = conv.nivelAcademico?.nombre;
    if (!nivel) continue;
    if (estaAbierta(conv)) {
      abiertasPorNivel.set(nivel, (abiertasPorNivel.get(nivel) ?? 0) + 1);
    }
    if (estaCerrada(conv)) {
      cerradasPorNivel.set(nivel, (cerradasPorNivel.get(nivel) ?? 0) + 1);
    }
  }

  // Evaluador por defecto para las convocatorias nuevas: evaluador@demo.gt
  // (id fijo del seed). Si no existe, se deja null y la UI permite asignar.
  const evaluadorPorDefecto = await prisma.usuario.findUnique({ where: { email: 'evaluador@demo.gt' } });
  const evaluadorPorDefectoId = evaluadorPorDefecto?.id ?? null;

  // 3. Crear convocatorias. El correlativo mantiene nombres únicos dentro de
  // la demo y evita que dos niveles compartan el mismo "Ciclo N".
  let correlativo = existentes.length;

  const crearConvocatoria = async (params: {
    beca: DefinicionBeca;
    nivelNombre: string;
    estado: 'ABIERTA' | 'CERRADA' | 'EN_EVALUACION' | 'RESUELTA' | 'ARCHIVADA';
    aperturaDias: number;
    cierreDias: number;
    anio: number;
  }) => {
    correlativo += 1;
    const montoBase = params.beca.montoBase;

    const convocatoria = await prisma.convocatoria.create({
      data: {
        nombre: `${params.beca.nombre} - Ciclo ${correlativo} ${params.anio}`,
        descripcion: `Convocatoria del ciclo ${correlativo} para ${params.beca.nombre.toLowerCase()}.`,
        becaId: params.beca.id,
        nivelAcademicoId: nivelPorNombre.get(params.nivelNombre)?.id ?? null,
        cobertura: params.beca.cobertura,
        // Todas las convocatorias quedan con evaluador por defecto: es lo
        // que dispara la autoasignación al iniciar la revisión.
        evaluadorPorDefectoId: evaluadorPorDefectoId ?? null,
        estado: params.estado,
        fechaApertura: fechaRelativa(params.aperturaDias),
        fechaCierre: fechaRelativa(params.cierreDias),
        montoBase,
        moneda: 'GTQ',
        permiteParcial: true,
        usarReglasMonto: true,
        formulario: [] as Prisma.InputJsonValue,
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
              montoFijo: montoBase,
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
              ingresoMax: 5000,
              activo: true,
            },
          ],
        },
      },
      include: { reglasMonto: true, nivelAcademico: true },
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
    return convocatoria;
  };

  for (const nivel of NIVELES_CATALOGO) {
    const becasNivel = becasPorNivel.get(nivel.nombre) ?? [];
    if (becasNivel.length === 0) {
      throw new Error(`No hay becas canónicas para el nivel ${nivel.nombre}`);
    }
    if (!nivelPorNombre.has(nivel.nombre)) {
      throw new Error(`No existe el nivel académico ${nivel.nombre}`);
    }

    // 5 abiertas por nivel, contando las que ya existan de la semilla base.
    const abiertasActuales = abiertasPorNivel.get(nivel.nombre) ?? 0;
    const faltanAbiertas = Math.max(0, ABIERTAS_POR_NIVEL - abiertasActuales);
    for (let i = 0; i < faltanAbiertas; i++) {
      const beca = becasNivel[(abiertasActuales + i) % becasNivel.length];
      await crearConvocatoria({
        beca,
        nivelNombre: nivel.nombre,
        estado: 'ABIERTA',
        aperturaDias: -10,
        cierreDias: 30,
        anio: 2026,
      });
    }

    // 2 cerradas por nivel: una CERRADA y otra histórica (RESUELTA,
    // EN_EVALUACION o ABIERTA vencida).
    const cerradasActuales = cerradasPorNivel.get(nivel.nombre) ?? 0;
    const faltanCerradas = Math.max(0, CERRADAS_POR_NIVEL - cerradasActuales);
    for (let i = 0; i < faltanCerradas; i++) {
      const beca = becasNivel[i % becasNivel.length];
      if (i === 0) {
        await crearConvocatoria({
          beca,
          nivelNombre: nivel.nombre,
          estado: 'CERRADA',
          aperturaDias: -60,
          cierreDias: -10,
          anio: 2025,
        });
      } else {
        const segundo = SEGUNDO_ESTADO_POR_NIVEL[nivel.nombre] ?? {
          estado: 'CERRADA' as const,
          apertura: -60,
          cierre: -10,
        };
        await crearConvocatoria({
          beca: becasNivel.reduce((a, b) => a.montoBase > b.montoBase ? a : b),
          nivelNombre: nivel.nombre,
          estado: segundo.estado,
          aperturaDias: segundo.apertura,
          cierreDias: segundo.cierre,
          anio: 2025,
        });
      }
    }
  }

  // 4. Una convocatoria ARCHIVADA global para el histórico del portal.
  const becaArchivada = becasPorNivel.get('Universitario')?.[0];
  if (becaArchivada) {
    await crearConvocatoria({
      beca: becaArchivada,
      nivelNombre: 'Universitario',
      estado: 'ARCHIVADA',
      aperturaDias: -360,
      cierreDias: -300,
      anio: 2024,
    });
  }

  // 5. Garantizar al menos 4 convocatorias RESUELTA para los ciclos de
  // escenarios. En una semilla limpia ya se crearon exactamente 4.
  const resueltas = convocatorias.filter((conv) => conv.estado === 'RESUELTA');
  if (resueltas.length < 4) {
    for (let i = resueltas.length; i < 4; i++) {
      const nivel = NIVELES_CATALOGO[i % NIVELES_CATALOGO.length];
      const beca = becasPorNivel.get(nivel.nombre)?.[0];
      if (!beca) continue;
      await crearConvocatoria({
        beca,
        nivelNombre: nivel.nombre,
        estado: 'RESUELTA',
        aperturaDias: -240,
        cierreDias: -150,
        anio: 2025,
      });
    }
  }

  // 6. Backfill del evaluador por defecto. Las convocatorias creadas en
  // corridas anteriores del seed pueden no tener el campo (se agregó
  // después); sin completarlo, la autoasignación al iniciar la revisión
  // nunca ocurre y la solicitud queda sin ningún evaluador.
  if (evaluadorPorDefectoId) {
    const sinDefault = convocatorias.filter((conv) => !conv.evaluadorPorDefectoId);
    for (const conv of sinDefault) {
      await prisma.convocatoria.update({
        where: { id: conv.id },
        data: { evaluadorPorDefectoId },
      });
      conv.evaluadorPorDefectoId = evaluadorPorDefectoId;
    }
    if (sinDefault.length > 0) {
      console.log(
        `♻️  Evaluador por defecto aplicado a ${sinDefault.length} convocatoria(s) preexistentes`,
      );
    }
  }

  const aviso =
    convocatorias.length === total
      ? ''
      : ` (se esperaban ${total})`;
  console.log(
    `✅ ${convocatorias.length} convocatorias aseguradas${aviso} (${nuevasIds.length} nuevas)`,
  );
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