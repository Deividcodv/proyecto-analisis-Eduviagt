import { PrismaClient, SolicitudEstado, Rol } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// CONSTANTES DE DISTRIBUCIÓN
// ==========================================

/** 30 solicitudes repartidas en 8 estados (según especificación del resumen). */
export const DISTRIBUCION_ESTADOS: Record<SolicitudEstado, number> = {
  BORRADOR: 3,
  ENVIADA: 2,
  EN_REVISION: 3,
  CORRECCION: 1,
  EVALUADA: 3,
  PENDIENTE_SEGUNDA_APROBACION: 2,
  APROBADA: 11,
  RECHAZADA: 5,
};

/** 7 convocatorias: 3 existentes + 4 nuevas/clonadas + 1 archivada. */
export const TOTAL_CONVOCATORIAS = 7;

/** 20 postulantes únicos. */
export const TOTAL_POSTULANTES = 20;

/** 5 evaluadores. */
export const TOTAL_EVALUADORES = 5;

/** 10 miembros de comité. */
export const TOTAL_MIEMBROS_COMITE = 10;

/** 4 ciclos a lo largo de ~12 meses. */
export const CICLOS = 4;

// ==========================================
// DATOS BASE: POSTULANTES, EVALUADORES, MIEMBROS
// ==========================================

const APELLIDOS = [
  'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez',
  'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Reyes', 'Morales',
  'Jiménez', 'Herrera', 'Medina', 'Castro', 'Ortiz', 'Rojas', 'Guzmán', 'Ruiz',
  'Álvarez', 'Méndez', 'Castillo', 'Suárez', 'Gutiérrez', 'Romero', 'Vargas',
];

const NOMBRES_MASC = [
  'Carlos', 'Juan', 'José', 'Luis', 'Miguel', 'Pedro', 'Jorge', 'Manuel',
  'Francisco', 'Antonio', 'Alejandro', 'Daniel', 'Pablo', 'Adrián', 'Raúl',
  'Óscar', 'Andrés', 'Fernando', 'Sergio', 'Diego', 'Javier', 'Roberto',
  'Alberto', 'Enrique', 'Vicente', 'Iván', 'Rubén', 'Gabriel', 'Eduardo',
];

const NOMBRES_FEM = [
  'María', 'Ana', 'Laura', 'Sofía', 'Isabel', 'Carmen', 'Lucía', 'Paula',
  'Elena', 'Claudia', 'Patricia', 'Verónica', 'Andrea', 'Natalia', 'Mariana',
  'Gabriela', 'Valeria', 'Daniela', 'Alejandra', 'Camila', 'Fernanda', 'Ximena',
  'Jimena', 'Renata', 'Regina', 'Montserrat', 'Xóchitl', 'Itzel', 'Yaretzi',
];

const CARRERAS_UNIV = [
  'Medicina', 'Ingeniería Civil', 'Ingeniería de Sistemas', 'Derecho',
  'Arquitectura', 'Administración de Empresas', 'Contaduría Pública',
  'Psicología', 'Enfermería', 'Odontología', 'Ingeniería Industrial',
  'Ingeniería Mecánica', 'Ingeniería Química', 'Comunicación Social',
  'Diseño Gráfico', 'Economía', 'Relaciones Internacionales', 'Biología',
  'Química', 'Física', 'Matemáticas', 'Pedagogía', 'Trabajo Social',
];

const CARRERAS_DIV = [
  'Bachillerato en Ciencias y Letras', 'Bachillerato en Computación',
  'Bachillerato en Contabilidad', 'Bachillerato en Secretariado',
  'Bachillerato en Dibujo Arquitectónico', 'Bachillerato en Electrónica',
  'Bachillerato en Mecánica Automotriz', 'Bachillerato en Turismo',
  'Bachillerato en Agropecuaria', 'Bachillerato en Enfermería',
];

/** Perfil académico generado para un postulante (se usa al crear su solicitud). */
export interface PerfilAcademicoGenerado {
  generoId: string | null;
  generoOtro: string | null;
  nivelAcademicoId: string | null;
  nivelAcademicoOtro: string | null;
  institucion: string;
  carrera: string;
  promedio: number;
  departamentoId: string | null;
  departamentoOtro: string | null;
  municipioId: string | null;
  municipioOtro: string | null;
}

/** Perfil financiero generado para un postulante (se usa al crear su solicitud). */
export interface PerfilFinancieroGenerado {
  ingresoFamiliar: number;
  numeroDependientes: number;
  becasAnteriores: boolean;
  descripcionSituacion: string | null;
}

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

function emailAleatorio(nombre: string, idx: number): string {
  const base = nombre.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
  return `${base}${idx}@demo.gt`;
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

/**
 * Genera un perfil académico aleatorio para un postulante.
 */
export function generarPerfilAcademico(
  generos: { id: string; nombre: string }[],
  niveles: { id: string; nombre: string }[],
  departamentos: { id: string; nombre: string }[],
  municipios: { id: string; nombre: string; departamentoId: string }[],
  instituciones: { id: string; nombre: string; nivel: string; departamento: string | null; municipio: string | null }[]
): PerfilAcademicoGenerado {
  const esUniv = Math.random() > 0.3;
  const institucionesFiltradas = instituciones.filter(
    inst => (esUniv && inst.nivel === 'UNIVERSIDAD') || (!esUniv && inst.nivel === 'DIVERSIFICADO')
  );
  const institucion = institucionesFiltradas[Math.floor(Math.random() * institucionesFiltradas.length)] || instituciones[0];
  const carreras = esUniv ? CARRERAS_UNIV : CARRERAS_DIV;

  const generoFemenino = generos.find(g => g.nombre === 'Femenino');
  const generoMasculino = generos.find(g => g.nombre === 'Masculino');
  const generoAleatorio = Math.random() > 0.5 ? generoFemenino : generoMasculino;

  const nivelNombre = esUniv ? 'Universitario' : 'Diversificado';
  const nivelAcademico = niveles.find(n => n.nombre === nivelNombre);

  let departamentoId: string | null = null;
  let municipioId: string | null = null;
  if (institucion?.departamento) {
    const dep = departamentos.find(d => d.nombre === institucion.departamento);
    if (dep) departamentoId = dep.id;
  }
  if (institucion?.municipio) {
    const mun = municipios.find(m => m.nombre === institucion.municipio && m.departamentoId === departamentoId);
    if (mun) municipioId = mun.id;
  }

  return {
    generoId: generoAleatorio?.id || null,
    generoOtro: null,
    nivelAcademicoId: nivelAcademico?.id || null,
    nivelAcademicoOtro: null,
    institucion: institucion?.nombre || 'Institución Demo',
    carrera: carreras[Math.floor(Math.random() * carreras.length)],
    promedio: Math.round((Math.random() * 20 + 70) * 100) / 100,
    departamentoId,
    departamentoOtro: null,
    municipioId,
    municipioOtro: null,
  };
}

/**
 * Genera un perfil financiero aleatorio para un postulante.
 */
export function generarPerfilFinanciero(esUniv: boolean): PerfilFinancieroGenerado {
  const ingresoBase = esUniv ? 4000 : 2500;
  const ingresoFamiliar = Math.round((ingresoBase + Math.random() * 12000) * 100) / 100;
  const numeroDependientes = Math.floor(Math.random() * 5) + 1;
  const becasAnteriores = Math.random() > 0.7;
  const descripcionSituacion = Math.random() > 0.5
    ? 'Situación económica familiar difícil, ingresos irregulares.'
    : null;

  return {
    ingresoFamiliar,
    numeroDependientes,
    becasAnteriores,
    descripcionSituacion,
  };
}

/** Genera fecha relativa a hoy (días negativos = pasado, positivos = futuro). */
export function fechaRelativa(dias: number, horas = 0, minutos = 0): Date {
  const f = new Date();
  f.setDate(f.getDate() + dias);
  f.setHours(f.getHours() + horas);
  f.setMinutes(f.getMinutes() + minutos);
  f.setSeconds(0);
  f.setMilliseconds(0);
  return f;
}

/** Elige un elemento aleatorio de un array. */
export function elegirUno<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Baraja un array (Fisher-Yates). */
export function barajar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Crea usuarios postulantes con perfiles realistas.
 * Retorna array de { usuario, perfilAcademico, perfilFinanciero, esUniv }.
 */
export async function crearPostulantes(cantidad: number, rolPostulante: Rol) {
  const postulantes: Array<{
    usuario: { id: string; cui: string };
    perfilAcademico: PerfilAcademicoGenerado;
    perfilFinanciero: PerfilFinancieroGenerado;
    esUniv: boolean;
  }> = [];

  const generos = await prisma.genero.findMany();
  const niveles = await prisma.nivelAcademico.findMany();
  const departamentos = await prisma.departamento.findMany();
  const municipios = await prisma.municipio.findMany();
  const instituciones = await prisma.institucionEducativa.findMany({ where: { activa: true } });

  for (let i = 0; i < cantidad; i++) {
    const genero = Math.random() > 0.5 ? 'M' : 'F';
    const nombre = nombreAleatorio(genero);
    const cui = cuiAleatorio();
    const email = emailAleatorio(nombre, i);
    const hashedPassword = await import('bcrypt').then(b => b.hash('Postulante123!', 10));

    const usuario = await prisma.usuario.upsert({
      where: { cui },
      update: { nombres: nombre, email },
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

    const esUniv = Math.random() > 0.3;
    const perfilAcademico = generarPerfilAcademico(generos, niveles, departamentos, municipios, instituciones);
    const perfilFinanciero = generarPerfilFinanciero(esUniv);

    postulantes.push({ usuario, perfilAcademico, perfilFinanciero, esUniv });
  }

  console.log(`✅ ${postulantes.length} postulantes creados`);
  return postulantes;
}

/**
 * Crea usuarios evaluadores.
 * Usa dominio @seed.demo.gt para evitar conflictos con usuarios base.
 */
export async function crearEvaluadores(cantidad: number, rolEvaluador: Rol) {
  const evaluadores = [];
  const hashedPassword = await import('bcrypt').then(b => b.hash('Admin123!', 10));
  for (let i = 0; i < cantidad; i++) {
    const genero = Math.random() > 0.5 ? 'M' : 'F';
    const nombre = `Eval ${nombreAleatorio(genero)}`;
    const cui = cuiAleatorio();
    const email = `eval${i + 1}@seed.demo.gt`;

    // Usar email como clave única para upsert (evita conflicto por email duplicado con CUI distinto)
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

/**
 * Crea usuarios miembros de comité.
 * Usa dominio @seed.demo.gt para evitar conflictos con usuarios base.
 */
export async function crearMiembrosComite(cantidad: number, rolMiembro: Rol) {
  const miembros = [];
  const hashedPassword = await import('bcrypt').then(b => b.hash('Admin123!', 10));
  for (let i = 0; i < cantidad; i++) {
    const genero = Math.random() > 0.5 ? 'M' : 'F';
    const nombre = `Miembro ${nombreAleatorio(genero)}`;
    const cui = cuiAleatorio();
    const email = `miembro${i + 10}@seed.demo.gt`;

    // Usar email como clave única para upsert
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

/**
 * Crea usuarios coordinadores de comité y jefe de becas.
 */
export async function crearRolesEspeciales(
  rolCoordinador: Rol,
  rolJefeBecas: Rol,
  rolAdmin: Rol
) {
  const hashedPassword = await import('bcrypt').then(b => b.hash('Admin123!', 10));

  const coord = await prisma.usuario.upsert({
    where: { cui: '7777777777777' },
    update: {},
    create: {
      cui: '7777777777777',
      nombres: 'Coordinador Principal Demo',
      email: 'coordinador@demo.gt',
      passwordHash: hashedPassword,
      rolId: rolCoordinador.id,
      estado: 'ACTIVO',
    },
  });

  const jefe = await prisma.usuario.upsert({
    where: { cui: '5555555555555' },
    update: {},
    create: {
      cui: '5555555555555',
      nombres: 'Jefa de Becas Principal',
      email: 'jefebecas@demo.gt',
      passwordHash: hashedPassword,
      rolId: rolJefeBecas.id,
      estado: 'ACTIVO',
    },
  });

  const dir = await prisma.usuario.upsert({
    where: { cui: '4444444444444' },
    update: {},
    create: {
      cui: '4444444444444',
      nombres: 'Director de Becas Principal',
      email: 'director@demo.gt',
      passwordHash: hashedPassword,
      rolId: rolAdmin.id,
      estado: 'ACTIVO',
    },
  });

  console.log('✅ Roles especiales creados (coordinador, jefebecas, director)');
  return { coord, jefe, dir };
}

/**
 * Obtiene las convocatorias existentes y crea las adicionales para llegar a 7.
 * Retorna { convocatorias: todas, nuevasIds: IDs de las recién creadas }.
 */
export async function asegurarConvocatorias(total: number) {
  const existentes = await prisma.convocatoria.findMany({ orderBy: { createdAt: 'asc' } });
  const convocatorias = [...existentes];
  const nuevasIds: string[] = [];

  const becas = await prisma.beca.findMany({ where: { activa: true } });
  if (becas.length === 0) throw new Error('No hay becas activas');

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
    const fechaEvaluacion = new Date(fechaCierre);
    fechaEvaluacion.setDate(fechaEvaluacion.getDate() + 15);
    const fechaResultado = new Date(fechaEvaluacion);
    fechaResultado.setDate(fechaResultado.getDate() + 20);

    const beca = becas[c % becas.length];
    const esUniv = beca.nombre.includes('Excelencia') || beca.nombre.includes('Permanencia');
    const montoBase = esUniv ? 12000 : 6000;

    const convocatoria = await prisma.convocatoria.create({
      data: {
        nombre: `${beca.nombre} - Ciclo ${cicloIdx + 1} 202${cicloIdx === 3 ? '5' : '6'}`,
        descripcion: `Convocatoria del ciclo ${cicloIdx + 1} para ${beca.nombre.toLowerCase()}.`,
        becaId: beca.id,
        estado: c === total - 1 ? 'ARCHIVADA' : (c < 3 ? 'RESUELTA' : 'EN_EVALUACION'),
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
              nombre: 'Regla tramo alto (monto fijo Q8000)',
              tipo: 'FIJO',
              montoFijo: 8000,
              prioridad: 3,
              ingresoMin: 10000,
              ingresoMax: 15000,
              activo: true,
            },
            {
              nombre: 'Regla monto completo (ingresos muy bajos)',
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