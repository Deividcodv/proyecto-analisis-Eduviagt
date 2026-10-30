import { Prisma, PrismaClient } from '@prisma/client';
import type { Permiso, Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Seed de EDUVIAGT.
 *
 * Nota importante: los nombres de modelo que usa Prisma son los del
 * `schema.prisma` (snake_case en las tablas hijas: `rol_permiso`,
 * `nivel_academico`, `documento_tipo`, `institucion_educativa`,
 * `criterio_evaluacion`, `convocatoria_doc_requerido`, ...). Además, los
 * modelos con `id` sin `@default` y `updatedAt` sin `@updatedAt` requieren que
 * se envíen explícitamente.
 */

const prisma = new PrismaClient();

interface InstitucionSeed {
  nombre: string;
  /**
   * Nivel en el formato que usa el portal para filtrar instituciones
   * (`UNIVERSIDAD`, `DIVERSIFICADO`, `TECNICO`, `SECUNDARIA`, `PRIMARIA`).
   * Debe coincidir con lo que devuelve `PasoPerfilAcademico` al mapear el
   * nombre del nivel académico del catálogo.
   */
  nivel: string;
  sector?: string;
  departamento?: string;
  municipio?: string;
}

const INSTITUCIONES_EDUCATIVAS: InstitucionSeed[] = [
  // ==================== UNIVERSIDAD ====================
  { nombre: 'Universidad de San Carlos de Guatemala', nivel: 'UNIVERSIDAD', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Universidad Rafael Landívar', nivel: 'UNIVERSIDAD', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad del Valle de Guatemala', nivel: 'UNIVERSIDAD', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad Mariano Gálvez de Guatemala', nivel: 'UNIVERSIDAD', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad Francisco Marroquín', nivel: 'UNIVERSIDAD', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad Rural de Guatemala', nivel: 'UNIVERSIDAD', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad del Istmo', nivel: 'UNIVERSIDAD', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad Panamericana de Guatemala', nivel: 'UNIVERSIDAD', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad Mesoamericana', nivel: 'UNIVERSIDAD', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'PRIVADO' },
  { nombre: 'Universidad Galileo', nivel: 'UNIVERSIDAD', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad San Pablo de Guatemala', nivel: 'UNIVERSIDAD', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad InterNaciones', nivel: 'UNIVERSIDAD', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad de Occidente', nivel: 'UNIVERSIDAD', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'PRIVADO' },
  { nombre: 'Universidad Da Vinci de Guatemala', nivel: 'UNIVERSIDAD', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad Regional de Guatemala', nivel: 'UNIVERSIDAD', departamento: 'Escuintla', municipio: 'Escuintla', sector: 'PRIVADO' },
  { nombre: 'Universidad Juan José Arévalo Bermejo', nivel: 'UNIVERSIDAD', departamento: 'Sololá', municipio: 'Sololá', sector: 'PRIVADO' },
  { nombre: 'Universidad Americana', nivel: 'UNIVERSIDAD', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad de la Guardia de Honor Presidencial', nivel: 'UNIVERSIDAD', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad de las Fuerzas Armadas - ESFOR', nivel: 'UNIVERSIDAD', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },

  // ==================== DIVERSIFICADO ====================
  { nombre: 'Instituto Nacional de Educación Radiofonica (INER)', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Instituto Rafael Aqueche', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Instituto Normal para Señoritas de Oriente', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Instituto de Educación Básica por Contacto', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Liceo Guatemala', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Colegio Americano de Guatemala', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Colegio San José de la Salle', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Colegio Don Bosco', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Colegio Loyola', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Colegio Maria Montessori', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Colegio Monte Carmelo', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Instituto Técnico y Vocacional Pedro Molina', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Instituto Técnico Central', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional Mixto de Educación de Quetzaltenango', nivel: 'DIVERSIFICADO', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'OFICIAL' },
  { nombre: 'Instituto de Secundaria Varones "Manuel Estrada Cabrera"', nivel: 'DIVERSIFICADO', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'OFICIAL' },
  { nombre: 'Colegio San Atanasio', nivel: 'DIVERSIFICADO', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'PRIVADO' },
  { nombre: 'Liceo de Quetzaltenango', nivel: 'DIVERSIFICADO', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'PRIVADO' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto "Luis Toledo Guzmán"', nivel: 'DIVERSIFICADO', departamento: 'Alta Verapaz', municipio: 'Cobán', sector: 'OFICIAL' },
  { nombre: 'Instituto Bilingüe "Joaquín Noé Salazar"', nivel: 'DIVERSIFICADO', departamento: 'Alta Verapaz', municipio: 'Cobán', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de Salamá', nivel: 'DIVERSIFICADO', departamento: 'Baja Verapaz', municipio: 'Salamá', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de Chimaltenango', nivel: 'DIVERSIFICADO', departamento: 'Chimaltenango', municipio: 'Chimaltenango', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de Chiquimula', nivel: 'DIVERSIFICADO', departamento: 'Chiquimula', municipio: 'Chiquimula', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de Escuintla', nivel: 'DIVERSIFICADO', departamento: 'Escuintla', municipio: 'Escuintla', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de Huehuetenango', nivel: 'DIVERSIFICADO', departamento: 'Huehuetenango', municipio: 'Huehuetenango', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de Puerto Barrios', nivel: 'DIVERSIFICADO', departamento: 'Izabal', municipio: 'Puerto Barrios', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de Jalapa', nivel: 'DIVERSIFICADO', departamento: 'Jalapa', municipio: 'Jalapa', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de Jutiapa', nivel: 'DIVERSIFICADO', departamento: 'Jutiapa', municipio: 'Jutiapa', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de Flores', nivel: 'DIVERSIFICADO', departamento: 'Petén', municipio: 'Flores', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de Retalhuleu', nivel: 'DIVERSIFICADO', departamento: 'Retalhuleu', municipio: 'Retalhuleu', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de Antigua Guatemala', nivel: 'DIVERSIFICADO', departamento: 'Sacatepéquez', municipio: 'Antigua Guatemala', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de San Marcos', nivel: 'DIVERSIFICADO', departamento: 'San Marcos', municipio: 'San Marcos', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de Cuilapa', nivel: 'DIVERSIFICADO', departamento: 'Santa Rosa', municipio: 'Cuilapa', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de Sololá', nivel: 'DIVERSIFICADO', departamento: 'Sololá', municipio: 'Sololá', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de Mazatenango', nivel: 'DIVERSIFICADO', departamento: 'Suchitepéquez', municipio: 'Mazatenango', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de Totonicapán', nivel: 'DIVERSIFICADO', departamento: 'Totonicapán', municipio: 'Totonicapán', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica Mixto de Zacapa', nivel: 'DIVERSIFICADO', departamento: 'Zacapa', municipio: 'Zacapa', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional Central para Varones', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional para Señoritas "Belén"', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Escuela Normal Mixta Intercultural "Vida Nueva"', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Centro Educativo Técnico Laboral KINAL', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Liceo Javier', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Colegio La Salle de Guatemala', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Colegio Suizo Americano', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Mixco', sector: 'PRIVADO' },
  { nombre: 'Colegio Bilingüe Villalobos', nivel: 'DIVERSIFICADO', departamento: 'Guatemala', municipio: 'Villa Nueva', sector: 'PRIVADO' },
  { nombre: 'Instituto Normal de Occidente', nivel: 'DIVERSIFICADO', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'OFICIAL' },
  { nombre: 'Colegio Mixto Quetzalteco', nivel: 'DIVERSIFICADO', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'PRIVADO' },
  { nombre: 'Instituto Nacional de Ciencias Comerciales (INCC)', nivel: 'DIVERSIFICADO', departamento: 'Escuintla', municipio: 'Escuintla', sector: 'OFICIAL' },
  { nombre: 'Instituto ITC San Benito', nivel: 'DIVERSIFICADO', departamento: 'Petén', municipio: 'San Benito', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Diversificada de Huehuetenango', nivel: 'DIVERSIFICADO', departamento: 'Huehuetenango', municipio: 'Huehuetenango', sector: 'OFICIAL' },
  { nombre: 'Colegio Le Kuali', nivel: 'DIVERSIFICADO', departamento: 'Huehuetenango', municipio: 'Huehuetenango', sector: 'PRIVADO' },
  { nombre: 'Instituto Nacional Mixto de Educación Básica de Antigua Guatemala', nivel: 'DIVERSIFICADO', departamento: 'Sacatepéquez', municipio: 'Antigua Guatemala', sector: 'OFICIAL' },
  { nombre: 'Colegio Integral San José', nivel: 'DIVERSIFICADO', departamento: 'Sacatepéquez', municipio: 'Antigua Guatemala', sector: 'PRIVADO' },
  { nombre: 'Instituto Nacional de Educación Básica de Chiquimula', nivel: 'DIVERSIFICADO', departamento: 'Chiquimula', municipio: 'Chiquimula', sector: 'OFICIAL' },
  { nombre: 'Colegio Mixto Rosaura Recinos', nivel: 'DIVERSIFICADO', departamento: 'Chiquimula', municipio: 'Chiquimula', sector: 'PRIVADO' },
  { nombre: 'Instituto Nacional de Educación Básica de Jutiapa', nivel: 'DIVERSIFICADO', departamento: 'Jutiapa', municipio: 'Jutiapa', sector: 'OFICIAL' },
  { nombre: 'Instituto Adolfo V. Hall de Occidente', nivel: 'DIVERSIFICADO', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'OFICIAL' },

  // ==================== BÁSICO / PRIMARIA ====================
  { nombre: 'Escuela Oficial Rural Mixta "Liceo Guatemala"', nivel: 'PRIMARIA', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Urbana Mixta "Rafael Aqueche"', nivel: 'PRIMARIA', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Urbana Mixta "Manuel Estrada Cabrera"', nivel: 'PRIMARIA', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Colegio San Carlos', nivel: 'PRIMARIA', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Colegio Miguel Ángel Asturias', nivel: 'PRIMARIA', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Escuela Oficial Rural Mixta de Mixco', nivel: 'PRIMARIA', departamento: 'Guatemala', municipio: 'Mixco', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Villa Nueva', nivel: 'PRIMARIA', departamento: 'Guatemala', municipio: 'Villa Nueva', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Quetzaltenango', nivel: 'PRIMARIA', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Cobán', nivel: 'PRIMARIA', departamento: 'Alta Verapaz', municipio: 'Cobán', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Salamá', nivel: 'PRIMARIA', departamento: 'Baja Verapaz', municipio: 'Salamá', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Chimaltenango', nivel: 'PRIMARIA', departamento: 'Chimaltenango', municipio: 'Chimaltenango', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Chiquimula', nivel: 'PRIMARIA', departamento: 'Chiquimula', municipio: 'Chiquimula', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Escuintla', nivel: 'PRIMARIA', departamento: 'Escuintla', municipio: 'Escuintla', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Huehuetenango', nivel: 'PRIMARIA', departamento: 'Huehuetenango', municipio: 'Huehuetenango', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Puerto Barrios', nivel: 'PRIMARIA', departamento: 'Izabal', municipio: 'Puerto Barrios', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Jalapa', nivel: 'PRIMARIA', departamento: 'Jalapa', municipio: 'Jalapa', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Jutiapa', nivel: 'PRIMARIA', departamento: 'Jutiapa', municipio: 'Jutiapa', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Flores', nivel: 'PRIMARIA', departamento: 'Petén', municipio: 'Flores', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Retalhuleu', nivel: 'PRIMARIA', departamento: 'Retalhuleu', municipio: 'Retalhuleu', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Antigua Guatemala', nivel: 'PRIMARIA', departamento: 'Sacatepéquez', municipio: 'Antigua Guatemala', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de San Marcos', nivel: 'PRIMARIA', departamento: 'San Marcos', municipio: 'San Marcos', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Cuilapa', nivel: 'PRIMARIA', departamento: 'Santa Rosa', municipio: 'Cuilapa', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Sololá', nivel: 'PRIMARIA', departamento: 'Sololá', municipio: 'Sololá', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Mazatenango', nivel: 'PRIMARIA', departamento: 'Suchitepéquez', municipio: 'Mazatenango', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Totonicapán', nivel: 'PRIMARIA', departamento: 'Totonicapán', municipio: 'Totonicapán', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Zacapa', nivel: 'PRIMARIA', departamento: 'Zacapa', municipio: 'Zacapa', sector: 'OFICIAL' },

  // ==================== PREPRIMARIA ====================
  { nombre: 'Centro de Educación Inicial "Santa María"', nivel: 'PRIMARIA', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Centro de Educación Inicial "San José"', nivel: 'PRIMARIA', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Centro de Educación Inicial "Los Ángeles"', nivel: 'PRIMARIA', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'OFICIAL' },
  { nombre: 'Centro de Educación Inicial "San Pedro"', nivel: 'PRIMARIA', departamento: 'Alta Verapaz', municipio: 'Cobán', sector: 'OFICIAL' },

  // ==================== SECUNDARIA ====================
  { nombre: 'Escuela Oficial Urbana Mixta "Los Próceres"', nivel: 'SECUNDARIA', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Urbana Mixta "Simón Bolívar"', nivel: 'SECUNDARIA', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Urbana Mixta "José María Carrera"', nivel: 'SECUNDARIA', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Urbana Mixta "Guatemala"', nivel: 'SECUNDARIA', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica "Andrés Avelino Cáceres"', nivel: 'SECUNDARIA', departamento: 'Huehuetenango', municipio: 'Huehuetenango', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica "San Francisco de Asís"', nivel: 'SECUNDARIA', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'OFICIAL' },
  { nombre: 'Instituto Nacional de Educación Básica "Julio César Montenegro"', nivel: 'SECUNDARIA', departamento: 'Chimaltenango', municipio: 'Chimaltenango', sector: 'OFICIAL' },
  { nombre: 'Colegio Bilingüe "San Pablo"', nivel: 'SECUNDARIA', departamento: 'Guatemala', municipio: 'Villa Nueva', sector: 'PRIVADO' },
  { nombre: 'Colegio "Los Nietos"', nivel: 'SECUNDARIA', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },

  // ==================== TÉCNICO ====================
  { nombre: 'Instituto Técnico y Vocacional "Don Bosco"', nivel: 'TECNICO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Instituto Técnico y Vocacional "La Ciudadela"', nivel: 'TECNICO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Instituto Técnico Industrial "Paul Harris"', nivel: 'TECNICO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Instituto Técnico y Vocacional "Aprofamily"', nivel: 'TECNICO', departamento: 'Huehuetenango', municipio: 'Huehuetenango', sector: 'PRIVADO' },
  { nombre: 'Centro de Educación Técnica "San Ignacio"', nivel: 'TECNICO', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'PRIVADO' },
];

const MUNICIPIOS_POR_DEPARTAMENTO: Record<string, string[]> = {
  'Alta Verapaz': [
    'Cobán', 'Santa Cruz Verapaz', 'San Cristóbal Verapaz', 'Tactic', 'Tamahú',
    'San Miguel Tucurú', 'Panzós', 'Senahú', 'San Pedro Carchá', 'San Juan Chamelco',
    'Lanquín', 'Cahabón', 'Chisec', 'Chahal', 'Fray Bartolomé de las Casas',
    'Santa Catalina La Tinta', 'Raxruhá',
  ],
  'Baja Verapaz': [
    'Salamá', 'San Miguel Chicaj', 'Rabinal', 'Cubulco', 'Granados', 'El Chol',
    'San Jerónimo', 'Purulhá',
  ],
  'Chimaltenango': [
    'Chimaltenango', 'San José Poaquil', 'San Martín Jilotepeque', 'San Juan Comalapa',
    'Santa Apolonia', 'Tecpán Guatemala', 'Patzún', 'Pochuta', 'Patzicía',
    'San Andrés Itzapa', 'Santa Cruz Balanyá', 'Acatenango', 'Yepocapa', 'Zaragoza',
    'El Tejar', 'Parramos',
  ],
  'Chiquimula': [
    'Chiquimula', 'Camotán', 'Jocotán', 'San Juan Ermita', 'San José La Arada',
    'San Jacinto', 'Ipala', 'Esquipulas', 'Concepción Las Minas', 'Quezaltepeque', 'Olopa',
  ],
  'El Progreso': [
    'Guastatoya', 'El Jícaro', 'San Agustín Acasaguastlán', 'San Cristóbal Acasaguastlán',
    'Sansare', 'Sanarate', 'San Antonio La Paz', 'Morazán',
  ],
  'Escuintla': [
    'Escuintla', 'Santa Lucía Cotzumalguapa', 'La Democracia', 'Siquinalá', 'Masagua',
    'Tiquisate', 'La Gomera', 'Guanagazapa', 'San José', 'Iztapa', 'Palín',
    'San Vicente Pacaya', 'Nueva Concepción',
  ],
  'Guatemala': [
    'Guatemala', 'Amatitlán', 'Chinautla', 'Chuarrancho', 'Fraijanes', 'Mixco',
    'Palencia', 'San José del Golfo', 'San José Pinula', 'San Juan Sacatepéquez',
    'San Miguel Petapa', 'San Pedro Ayampuc', 'San Pedro Sacatepéquez', 'San Raymundo',
    'Santa Catarina Pinula', 'Villa Canales', 'Villa Nueva',
  ],
  'Huehuetenango': [
    'Huehuetenango', 'Chiantla', 'Malacatancito', 'Cuilco', 'Nentón', 'San Pedro Soloma',
    'San Juan Ixcoy', 'San Rafael La Independencia', 'San Antonio Huista',
    'San Sebastián Huehuetenango', 'Santa Bárbara', 'San Pedro Necta',
    'Santiago Chimaltenango', 'Aguacatán', 'San Miguel Acatán', 'San Rafael Petzal',
    'San Mateo Ixtatán', 'Colotenango', 'San Ildefonso Ixtahuacán', 'San Gaspar Ixchil',
    'San Juan Atitán', 'Santa Eulalia', 'Todos Santos Cuchumatán', 'Concepción Huista',
    'Jacaltenango', 'La Democracia', 'La Libertad', 'Santa Ana Huista', 'Tectitán',
    'Santa Cruz Barillas', 'San Sebastián Coatán', 'Unión Cantinil', 'Petatán',
  ],
  'Izabal': [
    'Puerto Barrios', 'Morales', 'Los Amates', 'Livingston', 'El Estor',
  ],
  'Jalapa': [
    'Jalapa', 'San Pedro Pinula', 'San Luis Jilotepeque', 'San Manuel Chaparrón',
    'San Carlos Alzatate', 'Monjas', 'Mataquescuintla',
  ],
  'Jutiapa': [
    'Jutiapa', 'Agua Blanca', 'Asunción Mita', 'Atescatempa', 'Comapa', 'Conguaco',
    'El Adelanto', 'El Progreso', 'Jalpatagua', 'Jerez', 'Moyuta', 'Pasaco',
    'Quesada', 'San José Acatempa', 'Santa Catarina Mita', 'Yupiltepeque', 'Zapotitlán',
  ],
  'Petén': [
    'Flores', 'San Benito', 'Santa Ana', 'Dolores', 'San Francisco', 'San José',
    'La Libertad', 'San Andrés', 'Sayaxché', 'Melchor de Mencos', 'Poptún',
    'San Luis', 'Las Cruces', 'El Chal',
  ],
  'Quetzaltenango': [
    'Quetzaltenango', 'Salcajá', 'Olintepeque', 'San Carlos Sija', 'Sibilia',
    'Cabricán', 'Cajolá', 'San Miguel Sigüilá', 'San Juan Ostuncalco', 'San Mateo',
    'Concepción Chiquirichapa', 'San Martín Sacatepéquez', 'Almolonga', 'Cantel',
    'Huitán', 'Zunil', 'Colomba', 'San Francisco La Unión', 'El Palmar',
    'Coatepeque', 'Génova', 'Flores Costa Cuca', 'La Esperanza', 'Palestina de Los Altos',
  ],
  'Quiché': [
    'Santa Cruz del Quiché', 'Chiché', 'Chinique', 'Zacualpa', 'Chichicastenango',
    'Patzité', 'San Antonio Ilotenango', 'San Pedro Jocopilas', 'Cunén',
    'San Juan Cotzal', 'Chajul', 'San Bartolomé Jocotenango', 'Sacapulas', 'Nebaj',
    'Canillá', 'Joyabaj', 'Ixcán', 'Pachalum', 'Uspantán', 'Chicamán',
    'San Andrés Sajcabajá',
  ],
  'Retalhuleu': [
    'Retalhuleu', 'San Sebastián', 'Santa Cruz Muluá', 'San Martín Zapotitlán',
    'San Felipe', 'San Andrés Villa Seca', 'Champerico', 'Nuevo San Carlos', 'El Asintal',
  ],
  'Sacatepéquez': [
    'Antigua Guatemala', 'Jocotenango', 'Pastores', 'Sumpango', 'Santo Domingo Xenacoj',
    'Santiago Sacatepéquez', 'San Bartolomé Milpas Altas', 'San Lucas Sacatepéquez',
    'Santa Lucía Milpas Altas', 'Magdalena Milpas Altas', 'Santa María de Jesús',
    'Ciudad Vieja', 'San Miguel Dueñas', 'Alotenango', 'San Antonio Aguas Calientes',
    'Santa Catarina Barahona',
  ],
  'San Marcos': [
    'San Marcos', 'San Pedro Sacatepéquez', 'Comitancillo', 'San Antonio Sacatepéquez',
    'San Miguel Ixtahuacán', 'Concepción Tutuapa', 'Tacaná', 'Sibinal', 'Tajumulco',
    'San José Ojetenam', 'San José El Rodeo', 'San Lorenzo', 'Sipacapa', 'Malacatán',
    'Catarina', 'Ayutla', 'Ocós', 'Pajapita', 'El Tumbador', 'El Quetzal',
    'La Reforma', 'Nuevo Progreso', 'San Cristóbal Cucho', 'Tejutla', 'La Blanca',
    'Río Blanco', 'San Rafael Pie de la Cuesta', 'Ixchiguán', 'Esquipulas Palo Gordo',
    'San Pablo',
  ],
  'Santa Rosa': [
    'Cuilapa', 'Barberena', 'Santa Rosa de Lima', 'Casillas', 'San Rafael Las Flores',
    'Oratorio', 'San Juan Tecuaco', 'Chiquimulilla', 'Guazacapán', 'Pueblo Nuevo Viñas',
    'Santa María Ixhuatán', 'Taxisco', 'Nueva Santa Rosa', 'Santa Cruz Naranjo',
  ],
  'Sololá': [
    'Sololá', 'San José Chacayá', 'Santa María Visitación', 'Santa Lucía Utatlán',
    'Nahualá', 'Santa Catarina Ixtahuacán', 'Santa Clara La Laguna', 'Concepción',
    'San Andrés Semetabaj', 'Panajachel', 'Santa Catarina Palopó', 'San Antonio Palopó',
    'San Lucas Tolimán', 'San Juan La Laguna', 'San Pedro La Laguna', 'Santiago Atitlán',
    'San Pablo La Laguna', 'San Marcos La Laguna', 'Santa Cruz La Laguna',
  ],
  'Suchitepéquez': [
    'Mazatenango', 'Cuyotenango', 'San Francisco Zapotitlán', 'San Bernardino',
    'San José El Ídolo', 'Santo Domingo Suchitepéquez', 'San Lorenzo', 'Samayac',
    'San Pablo Jocopilas', 'San Antonio Suchitepéquez', 'San Miguel Panán',
    'San Gabriel', 'Chicacao', 'Patulul', 'Santa Bárbara', 'Santo Tomás La Unión',
    'Río Bravo', 'Pueblo Nuevo', 'Zunilito', 'San Juan Bautista', 'San José La Máquina',
  ],
  'Totonicapán': [
    'Totonicapán', 'San Cristóbal Totonicapán', 'San Francisco El Alto',
    'San Andrés Xecul', 'Momostenango', 'Santa María Chiquimula', 'Santa Lucía La Reforma',
    'San Bartolo',
  ],
  'Zacapa': [
    'Zacapa', 'Estanzuela', 'Río Hondo', 'Gualán', 'Teculután', 'Usumatlán',
    'Cabañas', 'San Diego', 'La Unión', 'Huité', 'San Jorge',
  ],
};

/** Criterios de evaluación por beca, con su peso relativo. */
const BECAS = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    nombre: 'Beca de Excelencia Académica',
    descripcion:
      'Apoyo económico integral para estudiantes universitarios con alto rendimiento académico, para distinguirse por su desempeño y compromiso con su comunidad de estudio.',
    cobertura: 'COMPLETA' as const,
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
    descripcion:
      'Beca de apoyo para estudiantes universitarios que se encuentran en riesgo de deserción por razones económicas o académicas, orientada a garantizar su continuidad en la university.',
    cobertura: 'PARCIAL' as const,
    montoBase: 6000,
    criterios: [
      { nombre: 'Desempeño académico', peso: 0.45 },
      { nombre: 'Necesidad socioeconómica', peso: 0.35 },
      { nombre: 'Participación comunitaria', peso: 0.2 },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    nombre: 'Beca de Apoyo a Estudios de Diversificado',
    descripcion:
      'Beca parcial para estudiantes de educación diversificada que requieren asegurar la continuidad de sus estudios y la reincorporación de quienes interrumpieron su bachillerato.',
    cobertura: 'PARCIAL' as const,
    montoBase: 3000,
    criterios: [
      { nombre: 'Rendimiento en diversificado', peso: 0.55 },
      { nombre: 'Condición socioeconómica del hogar', peso: 0.45 },
    ],
  },
];

/** Tipos de documento soportados por el portal. */
const TIPOS_DOCUMENTO = [
  'Certificado académico',
  'Constancia de inscripción',
  'Copia de DPI',
  'Fotografía de frente',
  'Comprobante de ingresos familiares',
  'Carta de recomendación',
];

/**
 * Formulario dinámico de la convocatoria de Excelencia: los campos se
 * se guardan con el snapshot de la convocatoria al momento de postular.
 */
const FORMULARIO_EXCELENCIA = [
  {
    id: 'promedioGeneral',
    seccion: 'academico',
    etiqueta: 'Promedio general del último ciclo',
    tipo: 'numero',
    requerido: true,
    ayuda: 'Promedio ponderado de 0 a 100 según el boletin o transcripto oficial.',
    claveBase: 'promedio',
  },
  {
    id: 'carrera',
    seccion: 'academico',
    etiqueta: 'Carrera o programa que estudias',
    tipo: 'texto',
    requerido: true,
    ayuda: 'Escribe el nombre completo tal como aparece en tu matricula.',
  },
  {
    id: 'anoAcademico',
    seccion: 'academico',
    etiqueta: 'Año académico en el que te encuentras',
    tipo: 'seleccion',
    requerido: true,
    opciones: ['Primer año', 'Segundo año', 'Tercer año', 'Cuarto año', 'Quinto año o más'],
  },
  {
    id: 'ingresoMensual',
    seccion: 'socioeconomico',
    etiqueta: 'Ingreso familiar mensual (Q)',
    tipo: 'numero',
    requerido: true,
    ayuda: 'Suma de los ingresos de todas las personas que viven en tu hogar.',
    claveBase: 'ingresoFamiliar',
  },
  {
    id: 'numeroDependientes',
    seccion: 'socioeconomico',
    etiqueta: 'Número de dependientes económicos',
    tipo: 'numero',
    requerido: true,
    ayuda: 'Personas que dependen economically de tu hogar.',
    claveBase: 'numeroDependientes',
  },
  {
    id: 'tipoVivienda',
    seccion: 'personal',
    etiqueta: 'Tipo de vivienda donde vives',
    tipo: 'seleccion',
    requerido: true,
    opciones: ['Propia o de familiares', 'Alquilada', 'Prestada', 'Vivienda de familiar'],
  },
  {
    id: 'responsableEmpleoFormal',
    seccion: 'personal',
    etiqueta: '¿Alguna persona responsable de tu hogar tiene empleo formal?',
    tipo: 'booleano',
    requerido: false,
  },
  {
    id: 'motivacion',
    seccion: 'adicional',
    etiqueta: 'Motivación para continuar tus estudios',
    tipo: 'textarea',
    requerido: true,
    ayuda: 'Máximo 500 caracteres. Cuéntanos por qué te mereces esta beca.',
  },
  {
    id: 'actividades',
    seccion: 'adicional',
    etiqueta: 'Actividades extracurriculares o comunitarias',
    tipo: 'textarea',
    requerido: false,
    ayuda: 'Participa en asociaciones, equipos, volunteer trabajo comunitario u otras actividades.',
  },
];

const FORMULARIO_PERMANENCIA = [
  {
    id: 'promedioGeneral',
    seccion: 'academico',
    etiqueta: 'Promedio general del último ciclo',
    tipo: 'numero',
    requerido: true,
    ayuda: 'Promedio ponderado de 0 a 100.',
    claveBase: 'promedio',
  },
  {
    id: 'carrera',
    seccion: 'academico',
    etiqueta: 'Carrera o programa que estudias',
    tipo: 'texto',
    requerido: true,
  },
  {
    id: 'ingresoMensual',
    seccion: 'socioeconomico',
    etiqueta: 'Ingreso familiar mensual (Q)',
    tipo: 'numero',
    requerido: true,
    ayuda: 'Suma de los ingresos de todas las personas que viven en tu hogar.',
    claveBase: 'ingresoFamiliar',
  },
  {
    id: 'numeroDependientes',
    seccion: 'socioeconomico',
    etiqueta: 'Número de dependientes económicos',
    tipo: 'numero',
    requerido: true,
    claveBase: 'numeroDependientes',
  },
  {
    id: 'motivoIngreso',
    seccion: 'adicional',
    etiqueta: 'Motivo por el que suspendiste o retrasaste tus estudios',
    tipo: 'textarea',
    requerido: true,
    ayuda: 'Máximo 500 caracteres.',
  },
];

const FORMULARIO_DIVERSIFICADO = [
  {
    id: 'promedioGeneral',
    seccion: 'academico',
    etiqueta: 'Promedio general de diversificado',
    tipo: 'numero',
    requerido: true,
    claveBase: 'promedio',
  },
  {
    id: 'ultimoGrado',
    seccion: 'academico',
    etiqueta: 'Último grado cursado',
    tipo: 'seleccion',
    requerido: true,
    opciones: ['Noveno grado', 'Décimo grado', 'Décimo primero grado', 'Bachillerato concluido'],
  },
  {
    id: 'ingresoMensual',
    seccion: 'socioeconomico',
    etiqueta: 'Ingreso familiar mensual (Q)',
    tipo: 'numero',
    requerido: true,
    claveBase: 'ingresoFamiliar',
  },
  {
    id: 'numeroDependientes',
    seccion: 'socioeconomico',
    etiqueta: 'Número de dependientes económicos',
    tipo: 'numero',
    requerido: true,
    claveBase: 'numeroDependientes',
  },
];

/** Comités evaluadores de demostración. */
const COMITES = [
  {
    id: '00000000-0000-4000-8000-000000000031',
    nombre: 'Comité Evaluador de Excelencia Académica 2026',
    descripcion:
      'Comité encargado de evaluar las postulaciones a la Beca de Excelencia Académica. Sesiona cada semana para revisar las solicitudes ya calificadas.',
  },
  {
    id: '00000000-0000-4000-8000-000000000032',
    nombre: 'Comité Evaluador de Permanencia Universitaria 2026',
    descripcion:
      'Comité encargado de evaluar las postulaciones a la Beca de Permanencia Universitaria y los casos de riesgo de deserción.',
  },
  {
    id: '00000000-0000-4000-8000-000000000033',
    nombre: 'Comité Evaluador de Básico 2026',
    descripcion: 'Comité encargado de evaluar las postulaciones a becas de nivel básico.',
  },
  {
    id: '00000000-0000-4000-8000-000000000034',
    nombre: 'Comité Evaluador de Diversificado 2026',
    descripcion: 'Comité encargado de evaluar las postulaciones a becas de nivel diversificado.',
  },
  {
    id: '00000000-0000-4000-8000-000000000035',
    nombre: 'Comité Evaluador de Técnico 2026',
    descripcion: 'Comité encargado de evaluar las postulaciones a becas de nivel técnico.',
  },
  {
    id: '00000000-0000-4000-8000-000000000036',
    nombre: 'Comité Evaluador de Universitario 2026',
    descripcion: 'Comité encargado de evaluar las postulaciones a becas de nivel universitario.',
  },
  {
    id: '00000000-0000-4000-8000-000000000037',
    nombre: 'Comité Evaluador de Posgrado 2026',
    descripcion: 'Comité encargado de evaluar las postulaciones a becas de posgrado.',
  },
  {
    id: '00000000-0000-4000-8000-000000000038',
    nombre: 'Comité Evaluador de Primaria 2026',
    descripcion: 'Comité encargado de evaluar las postulaciones a becas de nivel primario.',
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // ==========================================
  // ROLES
  // ==========================================
  const definicionesRoles = [
    { id: '00000000-0000-4000-8000-000000000001', nombre: 'ADMIN', descripcion: 'Administrador del sistema con acceso total' },
    { id: '00000000-0000-4000-8000-000000000002', nombre: 'POSTULANTE', descripcion: 'Estudiante que postula a becas' },
    { id: '00000000-0000-4000-8000-000000000003', nombre: 'EVALUADOR', descripcion: 'Persona que evalúa solicitudes' },
    { id: '00000000-0000-4000-8000-000000000004', nombre: 'COORDINADOR_COMITE', descripcion: 'Coordina comités evaluadores y sesiones' },
    { id: '00000000-0000-4000-8000-000000000005', nombre: 'MIEMBRO_COMITE', descripcion: 'Miembro de un comité evaluador' },
    { id: '00000000-0000-4000-8000-000000000006', nombre: 'STAFF', descripcion: 'Personal administrativo del MINEDUC' },
    // Sprint 8 (US-806): rol con autoridad para crear/publicar convocatorias,
    // hacer la primera aprobación y ajustar montos con justificación.
    { id: '00000000-0000-4000-8000-000000000007', nombre: 'JEFE_BECAS', descripcion: 'Jefe de becas: crea y publica convocatorias, aprueba en primera instancia y ajusta montos' },
  ];

  const roles: Rol[] = [];
  for (const rol of definicionesRoles) {
    roles.push(
      await prisma.rol.upsert({
        where: { nombre: rol.nombre },
        update: { descripcion: rol.descripcion },
        create: { ...rol },
      }),
    );
  }
  // Se retiran los roles de prueba que dejaron los scripts de humo: no
  // pertenecen a ningún flujo real y ensucian la administración.
  await prisma.rol.deleteMany({
    where: { nombre: { startsWith: 'TESTSMOKE' } },
  });

  console.log('✅ Roles creados');

  const rolPorNombre = (nombre: string) => roles.find((r) => r.nombre === nombre)!;

  // ==========================================
  // PERMISOS
  // ==========================================
  const permisosData = [
    // Convocatorias
    { modulo: 'convocatoria', accion: 'crear' },
    { modulo: 'convocatoria', accion: 'editar' },
    { modulo: 'convocatoria', accion: 'ver' },
    { modulo: 'convocatoria', accion: 'publicar' },
    // Solicitudes
    { modulo: 'solicitud', accion: 'crear' },
    { modulo: 'solicitud', accion: 'editar' },
    { modulo: 'solicitud', accion: 'ver' },
    // Sprint 8 (US-802/803/806): control de montos y de las dos instancias
    // de aprobación. La separación real la garantiza que el segundo
    // aprobador sea una persona distinta al primero.
    { modulo: 'solicitud', accion: 'aprobar-primera' },
    { modulo: 'solicitud', accion: 'aprobar-segunda' },
    { modulo: 'solicitud', accion: 'montos-override' },
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
    // Auditoría
    { modulo: 'auditoria', accion: 'ver' },
    // Seguridad
    { modulo: 'permiso', accion: 'editar' },
    // Catálogos (S-013: permiso propio en lugar de reutilizar `permiso:editar`)
    { modulo: 'catalogo', accion: 'gestionar' },
    // Personal: listar usuarios con un rol (para asignar evaluadores/miembros
    // de comité) sin exponer la gestión de roles/permisos.
    { modulo: 'personal', accion: 'ver' },
  ];

  const permisos: Permiso[] = [];
  for (const p of permisosData) {
    permisos.push(
      await prisma.permiso.upsert({
        where: { modulo_accion: { modulo: p.modulo, accion: p.accion } },
        update: {},
        create: { ...p },
      }),
    );
  }
  console.log('✅ Permisos creados');

  // ==========================================
  // ASIGNAR PERMISOS A ROLES
  // ==========================================
  const filtrosPorRol: Array<[string, (p: (typeof permisos)[number]) => boolean]> = [
    ['ADMIN', () => true],
    [
      'POSTULANTE',
      (p) =>
        ['solicitud', 'documento'].includes(p.modulo) ||
        (p.modulo === 'convocatoria' && p.accion === 'ver'),
    ],
    [
      'EVALUADOR',
      (p) =>
        p.modulo === 'evaluacion' ||
        (p.modulo === 'solicitud' && p.accion === 'ver'),
    ],
    [
      'COORDINADOR_COMITE',
      (p) =>
        ['comite', 'sesion', 'decision', 'evaluacion', 'solicitud', 'documento', 'reporte', 'personal'].includes(
          p.modulo,
        ),
    ],
    [
      'MIEMBRO_COMITE',
      (p) =>
        p.modulo === 'voto' ||
        // El miembro del comité participa en la revisión: inicia revisiones,
        // asigna evaluadores y pide correcciones. No firma aprobaciones
        // (eso es del jefe de becas o del coordinador) ni califica
        // postulaciones (eso es del evaluador).
        (p.modulo === 'solicitud' && ['ver', 'editar'].includes(p.accion)) ||
        // Ver los puntajes y las observaciones de las postulaciones que
        // revisa (el comité decide con ese detalle).
        (p.modulo === 'evaluacion' && p.accion === 'ver') ||
        (p.modulo === 'evaluacion' && p.accion === 'crear') ||
        (p.accion === 'ver' && ['sesion', 'comite'].includes(p.modulo)) ||
        (p.modulo === 'reporte' && p.accion === 'ver'),
    ],
    // Sprint 8 (US-806): el jefe de becas administra las convocatorias y
    // participa en las dos instancias de aprobación. Que el segundo
    // aprobador sea OTRO usuario lo garantiza el servicio, no el permiso.
    [
      'JEFE_BECAS',
      (p) =>
        (p.modulo === 'convocatoria' &&
          ['crear', 'editar', 'ver', 'publicar'].includes(p.accion)) ||
        (p.modulo === 'solicitud' &&
          // `editar` es el permiso que hoy habilita las transiciones sobre
          // una solicitud (igual que para el coordinador del comité).
          ['ver', 'editar', 'aprobar-primera', 'aprobar-segunda', 'montos-override'].includes(
            p.accion,
          )) ||
        (p.modulo === 'decision' && ['crear', 'ver'].includes(p.accion)) ||
        (p.modulo === 'reporte' && p.accion === 'ver') ||
        (p.modulo === 'comite' &&
          ['crear', 'editar', 'ver'].includes(p.accion)) ||
        (p.modulo === 'sesion' &&
          ['crear', 'editar', 'ver'].includes(p.accion)) ||
        (p.modulo === 'evaluacion' &&
          ['crear', 'editar', 'ver'].includes(p.accion)) ||
        (p.modulo === 'documento' &&
          ['crear', 'ver', 'editar', 'eliminar'].includes(p.accion)) ||
        (p.modulo === 'catalogo' && p.accion === 'gestionar') ||
        (p.modulo === 'personal' && p.accion === 'ver') ||
        (p.modulo === 'auditoria' && p.accion === 'ver'),
    ],
  ];

  for (const [rolNombre, filtro] of filtrosPorRol) {
    const rol = rolPorNombre(rolNombre);
    const permitidos = permisos.filter(filtro).map((p) => p.id);
    await prisma.rolPermiso.deleteMany({ where: { rolId: rol.id } });
    if (permitidos.length > 0) {
      await prisma.rolPermiso.createMany({
        data: permitidos.map((permisoId) => ({
          rolId: rol.id,
          permisoId,
        })),
      });
    }
    console.log(`✅ Permisos asignados a ${rolNombre}`);
  }

  // ==========================================
  // GÉNEROS
  // ==========================================
  await prisma.genero.deleteMany({ where: { nombre: { startsWith: 'Smoke' } } });
  await prisma.genero.updateMany({
    where: { nombre: 'Otro' },
    data: { nombre: 'Prefiero no especificar' },
  });
  const generos = ['Masculino', 'Femenino', 'Prefiero no especificar'];
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
  const niveles = [
    'Primaria',
    'Básico',
    'Diversificado',
    'Secundaria',
    'Técnico',
    'Universitario',
    'Posgrado',
  ];
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
    'El Progreso', 'Escuintla', 'Guatemala', 'Huehuetenango',
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
  // MUNICIPIOS (catálogo completo por departamento)
  // ==========================================
  await prisma.municipio.deleteMany({
    where: {
      departamento: { nombre: 'Guatemala' },
      nombre: { in: ['Quetzaltenango', 'Florida'] },
    },
  });
  for (const [nombreDepartamento, municipios] of Object.entries(
    MUNICIPIOS_POR_DEPARTAMENTO,
  )) {
    const departamento = await prisma.departamento.findUnique({
      where: { nombre: nombreDepartamento },
    });
    if (!departamento) continue;
    for (const nombre of municipios) {
      await prisma.municipio.upsert({
        where: {
          nombre_departamentoId: { nombre, departamentoId: departamento.id },
        },
        update: {},
        create: { nombre, departamentoId: departamento.id },
      });
    }
  }
  console.log(
    `✅ Municipios creados (${Object.values(MUNICIPIOS_POR_DEPARTAMENTO).flat().length} en 22 departamentos)`,
  );
  await prisma.municipio.deleteMany({
    where: { departamento: { nombre: 'El Proverbio' } },
  });
  await prisma.departamento.deleteMany({ where: { nombre: 'El Proverbio' } });

  // ==========================================
  // TIPOS DE DOCUMENTO
  // ==========================================
  for (const nombre of TIPOS_DOCUMENTO) {
    await prisma.documentoTipo.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  // Se retiran los tipos antiguos que ya no se solicitan (p. ej. el que tenía
  // el error de tipeo "Cédula de depleción"). El borrado se hace más abajo,
  // cuando ya se limpiaron las convocatorias que los referenciaban.
  console.log('✅ Tipos de documento creados');

  // ==========================================
  // INSTITUCIONES EDUCATIVAS
  // ==========================================
  for (const inst of INSTITUCIONES_EDUCATIVAS) {
    const existente = await prisma.institucionEducativa.findFirst({
      where: { nombre: inst.nombre, nivel: inst.nivel },
    });
    if (existente) {
      await prisma.institucionEducativa.update({
        where: { id: existente.id },
        data: {
          sector: inst.sector ?? null,
          departamento: inst.departamento ?? null,
          municipio: inst.municipio ?? null,
          activa: true,
        },
      });
    } else {
      await prisma.institucionEducativa.create({
        data: {
          nombre: inst.nombre,
          nivel: inst.nivel,
          sector: inst.sector ?? null,
          departamento: inst.departamento ?? null,
          municipio: inst.municipio ?? null,
          activa: true,
        },
      });
    }
  }
  console.log(
    `✅ Instituciones educativas creadas (${INSTITUCIONES_EDUCATIVAS.length})`,
  );
  const INSTITUCIONES_ELIMINADAS = [
    'Universidad Autónoma de Quetzaltenango',
    'Universidad Guatemala de América del Norte',
    'Universidad Landívar',
    'Universidad Popular de la Ciudad de Guatemala',
    'Universidad Regional Autónoma de los Andes',
    'Universidad da Vinci de Guatemala',
  ];
  await prisma.institucionEducativa.deleteMany({
    where: { nombre: { in: INSTITUCIONES_ELIMINADAS } },
  });
  // Se retiran las instituciones que quedaron con un nivel distinto al que
  // usa el portal para filtrar (p. ej. las que estaban como `UNIVERSITARIO`).
  await prisma.institucionEducativa.deleteMany({
    where: {
      nivel: {
        notIn: ['UNIVERSIDAD', 'DIVERSIFICADO', 'TECNICO', 'SECUNDARIA', 'PRIMARIA'],
      },
    },
  });
  console.log('✅ Instituciones obsoletas eliminadas');

  // ==========================================
  // LIMPIEZA DE CONVOCATORIAS Y SOLICITUDES
  // ==========================================
  // El orden importa: hay relaciones sin `onDelete: Cascade` (por ejemplo
  // `evaluacion.criterioEvaluacionId` o `decision.solicitudId`).
  await prisma.decision.deleteMany({});
  await prisma.voto.deleteMany({});
  await prisma.sesionAgenda.deleteMany({});
  await prisma.evaluacion.deleteMany({});
  await prisma.solicitudDocumento.deleteMany({});
  await prisma.solicitudPerfilAcademico.deleteMany({});
  await prisma.solicitudPerfilFinanciero.deleteMany({});
  await prisma.historialEstado.deleteMany({});
  await prisma.solicitud.deleteMany({});
  await prisma.notificacion.deleteMany({});
  await prisma.sesion.deleteMany({});
  await prisma.convocatoriaDocRequerido.deleteMany({});
  await prisma.convocatoria.deleteMany({});
  console.log('✅ Convocatorias y solicitudes anteriores eliminadas');

  // ==========================================
  // BECAS Y CRITERIOS DE EVALUACIÓN
  // ==========================================
  for (const beca of BECAS) {
    await prisma.beca.upsert({
      where: { id: beca.id },
      update: {
        nombre: beca.nombre,
        descripcion: beca.descripcion,
        activa: true,
        montoBase: beca.montoBase != null ? new Prisma.Decimal(beca.montoBase) : null,
      },
      create: {
        id: beca.id,
        nombre: beca.nombre,
        descripcion: beca.descripcion,
        activa: true,
        montoBase: beca.montoBase != null ? new Prisma.Decimal(beca.montoBase) : null,
      },
    });

    // Se reemplazan los criterios de la beca para que el conjunto de pesos
    // siempre sume 1 y no queden criterios de rebajas anteriores.
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
  console.log(`✅ Becas creadas (${BECAS.length}) con sus criterios de evaluación`);

  // Ahora que ninguna convocatoria referencia los tipos de documento
  // antiguos, se pueden retirar del catálogo.
  await prisma.documentoTipo.deleteMany({
    where: { nombre: { notIn: TIPOS_DOCUMENTO } },
  });
  console.log('✅ Tipos de documento obsoletos eliminados');

  // ==========================================
  // USUARIOS BASE (necesarios antes de crear comités)
  // ==========================================
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const adminRole = rolPorNombre('ADMIN');
  await prisma.usuario.upsert({
    where: { cui: '1234567890123' },
    update: {
      nombres: 'Administrador EDUVIAGT',
      email: 'admin@sigeb.gov.gt',
      passwordHash: hashedPassword,
      rolId: adminRole.id,
      estado: 'ACTIVO',
    },
    create: {
      cui: '1234567890123',
      nombres: 'Administrador EDUVIAGT',
      email: 'admin@sigeb.gov.gt',
      passwordHash: hashedPassword,
      rolId: adminRole.id,
      estado: 'ACTIVO',
    },
  });
  console.log('✅ Usuario admin creado (admin@sigeb.gov.gt / Admin123!)');

  const postulanteRole = rolPorNombre('POSTULANTE');
  await prisma.usuario.upsert({
    where: { cui: '9999999999999' },
    update: {
      nombres: 'Postulante Demo',
      email: 'postulante@demo.gt',
      passwordHash: hashedPassword,
      rolId: postulanteRole.id,
      estado: 'ACTIVO',
    },
    create: {
      cui: '9999999999999',
      nombres: 'Postulante Demo',
      email: 'postulante@demo.gt',
      passwordHash: hashedPassword,
      rolId: postulanteRole.id,
      estado: 'ACTIVO',
    },
  });
  console.log('✅ Usuario postulante creado (postulante@demo.gt / Admin123!)');

  const usuariosDemo = [
    { cui: '8888888888888', nombres: 'Evaluador Demo', email: 'evaluador@demo.gt', rol: 'EVALUADOR' },
    // La convocatoria de Excelencia exige 3 evaluaciones completas: hacen
    // falta tres evaluadores distintos para poder evaluarla.
    { cui: '3333333333333', nombres: 'Evaluadora Segundo Demo', email: 'evaluador2@demo.gt', rol: 'EVALUADOR' },
    { cui: '2222222222222', nombres: 'Evaluador Tercero Demo', email: 'evaluador3@demo.gt', rol: 'EVALUADOR' },
    { cui: '7777777777777', nombres: 'Coordinador Demo', email: 'coordinador@demo.gt', rol: 'COORDINADOR_COMITE' },
    { cui: '6666666666666', nombres: 'Miembro Comité Demo', email: 'miembro@demo.gt', rol: 'MIEMBRO_COMITE' },
    // Sprint 8 (US-806): dos personas distintas para las dos instancias de
    // aprobación (la segunda nunca puede firmarla quien aprobó la primera).
    { cui: '5555555555555', nombres: 'Jefa de Becas Demo', email: 'jefebecas@demo.gt', rol: 'JEFE_BECAS' },
    { cui: '4444444444444', nombres: 'Director de Becas Demo', email: 'director@demo.gt', rol: 'ADMIN' },
  ];

  const usuariosPorCui: Record<string, { id: string }> = {};
  for (const usuario of usuariosDemo) {
    const creado = await prisma.usuario.upsert({
      where: { cui: usuario.cui },
      update: {
        nombres: usuario.nombres,
        email: usuario.email,
        passwordHash: hashedPassword,
        rolId: rolPorNombre(usuario.rol).id,
        estado: 'ACTIVO',
      },
      create: {
        cui: usuario.cui,
        nombres: usuario.nombres,
        email: usuario.email,
        passwordHash: hashedPassword,
        rolId: rolPorNombre(usuario.rol).id,
        estado: 'ACTIVO',
      },
    });
    usuariosPorCui[usuario.cui] = creado;
  }
  console.log('✅ Usuarios demo creados (evaluador/coordinador/miembro/jefebecas/director@demo.gt / Admin123!)');

  // ==========================================
  // COMITÉS EVALUADORES
  // ==========================================
  await prisma.comiteMiembro.deleteMany({});
  await prisma.comite.deleteMany({});

  for (const comite of COMITES) {
    await prisma.comite.create({
      data: {
        id: comite.id,
        nombre: comite.nombre,
        descripcion: comite.descripcion,
        activo: true,
      },
    });
  }

  const miembrosPorComite: Record<string, Array<{ usuarioId: string; rol: string }>> = {
    '00000000-0000-4000-8000-000000000031': [
      { usuarioId: usuariosPorCui['7777777777777'].id, rol: 'PRESIDENTE' },
      { usuarioId: usuariosPorCui['8888888888888'].id, rol: 'VOCAL' },
      { usuarioId: usuariosPorCui['6666666666666'].id, rol: 'VOCAL' },
    ],
    '00000000-0000-4000-8000-000000000032': [
      { usuarioId: usuariosPorCui['7777777777777'].id, rol: 'PRESIDENTE' },
      { usuarioId: usuariosPorCui['6666666666666'].id, rol: 'VOCAL' },
    ],
    '00000000-0000-4000-8000-000000000033': [
      { usuarioId: usuariosPorCui['7777777777777'].id, rol: 'PRESIDENTE' },
      { usuarioId: usuariosPorCui['8888888888888'].id, rol: 'VOCAL' },
      { usuarioId: usuariosPorCui['6666666666666'].id, rol: 'VOCAL' },
    ],
    '00000000-0000-4000-8000-000000000034': [
      { usuarioId: usuariosPorCui['7777777777777'].id, rol: 'PRESIDENTE' },
      { usuarioId: usuariosPorCui['8888888888888'].id, rol: 'VOCAL' },
      { usuarioId: usuariosPorCui['6666666666666'].id, rol: 'VOCAL' },
    ],
    '00000000-0000-4000-8000-000000000035': [
      { usuarioId: usuariosPorCui['7777777777777'].id, rol: 'PRESIDENTE' },
      { usuarioId: usuariosPorCui['8888888888888'].id, rol: 'VOCAL' },
      { usuarioId: usuariosPorCui['6666666666666'].id, rol: 'VOCAL' },
    ],
    '00000000-0000-4000-8000-000000000036': [
      { usuarioId: usuariosPorCui['7777777777777'].id, rol: 'PRESIDENTE' },
      { usuarioId: usuariosPorCui['8888888888888'].id, rol: 'VOCAL' },
      { usuarioId: usuariosPorCui['6666666666666'].id, rol: 'VOCAL' },
    ],
    '00000000-0000-4000-8000-000000000037': [
      { usuarioId: usuariosPorCui['7777777777777'].id, rol: 'PRESIDENTE' },
      { usuarioId: usuariosPorCui['8888888888888'].id, rol: 'VOCAL' },
      { usuarioId: usuariosPorCui['6666666666666'].id, rol: 'VOCAL' },
    ],
    '00000000-0000-4000-8000-000000000038': [
      { usuarioId: usuariosPorCui['7777777777777'].id, rol: 'PRESIDENTE' },
      { usuarioId: usuariosPorCui['8888888888888'].id, rol: 'VOCAL' },
      { usuarioId: usuariosPorCui['6666666666666'].id, rol: 'VOCAL' },
    ],
  };

  for (const [comiteId, miembros] of Object.entries(miembrosPorComite)) {
    for (const miembro of miembros) {
      await prisma.comiteMiembro.create({
        data: { comiteId, ...miembro, activo: true },
      });
    }
  }
  console.log(`✅ Comités evaluadores creados (${COMITES.length})`);

  // ==========================================
  // CONVOCATORIAS REALISTAS
  // ==========================================
  const nivelAcademicoPorNombre = async (nombre: string) =>
    prisma.nivelAcademico.findUnique({ where: { nombre } });

  const documentoPorNombre = async (nombre: string) =>
    prisma.documentoTipo.findUnique({ where: { nombre } });

  const hoy = new Date();
  const dias = (n: number) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() + n);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const definicionesConvocatorias = [
    {
      id: '00000000-0000-4000-8000-000000000021',
      nombre: 'Convocatoria Nacional 2026 — Beca de Excelencia Académica',
      descripcion:
        'El sistema abre la convocatoria nacional 2026 de la Beca de Excelencia Académica, dirigida a estudiantes inscritos en universidades del país que acreditan un promedio igual o superior a 85 puntos. La beca cubre matrícula, colegiatura y un apoyo mensual de Q800.00 durante los diez meses del ciclo lectivo. La evaluación se realiza por comité mediante criterios ponderados de rendimiento académico (50%), situación socioeconómica (30%) y actividades extracurriculares (20%).',
      becaId: '00000000-0000-4000-8000-000000000001',
      nivel: 'Universitario',
      cobertura: 'COMPLETA' as const,
      estado: 'ABIERTA' as const,
      fechaApertura: dias(-18),
      fechaCierre: dias(25),
      evaluadoresMinimos: 3,
      maxCorrecciones: 2,
      // Montos (Sprint 8): el monto base supera los Q10,000, así que las
      // solicitudes de esta convocatoria exigen segunda aprobación.
      montoBase: 12000,
      permiteParcial: true,
      reglasMonto: [
        {
          nombre: 'Ingreso familiar hasta Q3,000 — monto completo',
          ingresoMin: null,
          ingresoMax: 3000,
          tipo: 'COMPLETO',
          montoFijo: null,
          porcentaje: null,
          prioridad: 1,
        },
        {
          nombre: 'Ingreso familiar de Q3,001 a Q6,000 — monto parcial',
          ingresoMin: 3000.01,
          ingresoMax: 6000,
          tipo: 'FIJO',
          montoFijo: 6000,
          porcentaje: null,
          prioridad: 2,
        },
        {
          nombre: 'Ingreso familiar superior a Q6,000 — 40% del monto base',
          ingresoMin: 6000.01,
          ingresoMax: null,
          tipo: 'PORCENTAJE',
          montoFijo: null,
          porcentaje: 0.4,
          prioridad: 3,
        },
      ],
      formulario: FORMULARIO_EXCELENCIA,
      documentos: [
        { nombre: 'Certificado académico', obligatorio: true },
        { nombre: 'Constancia de inscripción', obligatorio: true },
        { nombre: 'Copia de DPI', obligatorio: true },
        { nombre: 'Comprobante de ingresos familiares', obligatorio: true },
        { nombre: 'Fotografía de frente', obligatorio: false },
        { nombre: 'Carta de recomendación', obligatorio: false },
      ],
    },
    {
      id: '00000000-0000-4000-8000-000000000022',
      nombre: 'Convocatoria 2026 — Beca de Permanencia Universitaria',
      descripcion:
        'Convocatoria de la Beca de Permanencia Universitaria 2026 para estudiantes que reprobaron o interrumpieron un ciclo por motivos económicos o laborales y buscan reincorporarse a sus estudios. La beca es parcial: cubre la matrícula del ciclo en curso y un apoyo de Q500.00 mensuales. Se evaluarán el desempeño académico previo (45%), la necesidad socioeconómica (35%) y la participación comunitaria (20%).',
      becaId: '00000000-0000-4000-8000-000000000002',
      nivel: 'Universitario',
      cobertura: 'PARCIAL' as const,
      estado: 'ABIERTA' as const,
      fechaApertura: dias(-10),
      fechaCierre: dias(14),
      evaluadoresMinimos: 2,
      maxCorrecciones: 3,
      // Montaje bajo el umbral: no exige segunda aprobación.
      montoBase: 6000,
      permiteParcial: true,
      reglasMonto: [
        {
          nombre: 'Ingreso familiar hasta Q4,000 — monto completo',
          ingresoMin: null,
          ingresoMax: 4000,
          tipo: 'COMPLETO',
          montoFijo: null,
          porcentaje: null,
          prioridad: 1,
        },
        {
          nombre: 'Ingreso familiar superior a Q4,000 — monto parcial',
          ingresoMin: 4000.01,
          ingresoMax: null,
          tipo: 'FIJO',
          montoFijo: 3500,
          porcentaje: null,
          prioridad: 2,
        },
      ],
      formulario: FORMULARIO_PERMANENCIA,
      documentos: [
        { nombre: 'Certificado académico', obligatorio: true },
        { nombre: 'Constancia de inscripción', obligatorio: true },
        { nombre: 'Copia de DPI', obligatorio: true },
        { nombre: 'Comprobante de ingresos familiares', obligatorio: true },
        { nombre: 'Carta de recomendación', obligatorio: false },
      ],
    },
    {
      id: '00000000-0000-4000-8000-000000000023',
      nombre: 'Convocatoria 2027 — Beca de Apoyo a Estudios de Diversificado (preparatoria)',
      descripcion:
        'Convocatoria preliminar de la Beca de Apoyo a Estudios de Diversificado para el ciclo 2027. Está dirigida a estudiantes de nivel básico y diversificado de instituciones educativas públicas y privadas que han finalizado el último año de diversificado y buscan reincorporarse al bachillerato. La beca cubre matrícula y materiales de estudio. La convocatoria se encuentra en preparación: el sistema publicará la fecha de apertura definitiva.',
      becaId: '00000000-0000-4000-8000-000000000003',
      nivel: 'Diversificado',
      cobertura: 'PARCIAL' as const,
      estado: 'BORRADOR' as const,
      fechaApertura: dias(40),
      fechaCierre: dias(70),
      evaluadoresMinimos: 2,
      maxCorrecciones: 3,
      montoBase: 3000,
      permiteParcial: true,
      reglasMonto: [],
      formulario: FORMULARIO_DIVERSIFICADO,
      documentos: [
        { nombre: 'Certificado académico', obligatorio: true },
        { nombre: 'Copia de DPI', obligatorio: true },
        { nombre: 'Comprobante de ingresos familiares', obligatorio: false },
      ],
    },
  ];

  // Evaluador por defecto para las postulaciones de estas convocatorias.
  const evaluadorPorDefecto = await prisma.usuario.findUnique({ where: { email: 'evaluador@demo.gt' } });
  const evaluadorPorDefectoId = evaluadorPorDefecto?.id ?? null;

  for (const conv of definicionesConvocatorias) {
    const nivel = await nivelAcademicoPorNombre(conv.nivel);

    await prisma.convocatoria.create({
      data: {
        id: conv.id,
        nombre: conv.nombre,
        descripcion: conv.descripcion,
        becaId: conv.becaId,
        estado: conv.estado,
        fechaApertura: conv.fechaApertura,
        fechaCierre: conv.fechaCierre,
        evaluadoresMinimos: conv.evaluadoresMinimos,
        maxCorrecciones: conv.maxCorrecciones,
        cobertura: conv.cobertura,
        formulario: conv.formulario as unknown as Prisma.InputJsonValue,
        nivelAcademicoId: nivel?.id ?? null,
        evaluadorPorDefectoId,
        // Montos (Sprint 8 - US-801)
        moneda: 'GTQ',
        montoBase: conv.montoBase != null ? new Prisma.Decimal(conv.montoBase) : null,
        permiteParcial: conv.permiteParcial,
        usarReglasMonto: conv.reglasMonto.length > 0,
      },
    });

    for (const doc of conv.documentos) {
      const tipo = await documentoPorNombre(doc.nombre);
      if (!tipo) continue;
      await prisma.convocatoriaDocRequerido.create({
        data: {
          convocatoriaId: conv.id,
          documentoTipoId: tipo.id,
          obligatorio: doc.obligatorio,
        },
      });
    }

    // Reglas por tramo de ingreso familiar (Sprint 8 - US-801)
    for (const regla of conv.reglasMonto) {
      await prisma.convocatoriaReglaMonto.create({
        data: {
          convocatoriaId: conv.id,
          nombre: regla.nombre,
          ingresoMin:
            regla.ingresoMin != null ? new Prisma.Decimal(regla.ingresoMin) : null,
          ingresoMax:
            regla.ingresoMax != null ? new Prisma.Decimal(regla.ingresoMax) : null,
          tipo: regla.tipo,
          montoFijo: regla.montoFijo != null ? new Prisma.Decimal(regla.montoFijo) : null,
          porcentaje: regla.porcentaje ?? null,
          prioridad: regla.prioridad,
          activo: true,
        },
      });
    }
  }
  console.log(`✅ Convocatorias creadas (${definicionesConvocatorias.length}) con documentos, formulario y montos`);

  // ==========================================
  // ASISTENTE IA - BASE DE CONOCIMIENTO (US-37/US-39)
  // ==========================================
  const conocimiento = [
    {
      titulo: '¿Qué es una beca?',
      contenido: 'Una beca es un apoyo económico otorgado al estudiante para cubrir gastos de estudios, como matrícula, colegiatura o materiales. En EDUVIAGT las becas se administran mediante convocatorias públicas.',
      tags: ['beca', 'definicion', 'que es'],
    },
    {
      titulo: 'Requisitos generales para postular',
      contenido: 'Los requisitos generales incluyen: ser ciudadano guatemalteco con DPI vigente, tener un número de CUI válido, contar con un correo electrónico personal, cumplir con el nivel académico que pida la convocatoria y tener los documentos requeridos listos en formato PDF, JPG o PNG de máximo 5 MB.',
      tags: ['requisitos', 'postular', 'documentos', 'CUI'],
    },
    {
      titulo: 'Cómo crear una cuenta en EDUVIAGT',
      contenido: 'El proceso comienza en el módulo de Registro. Debes ingresar tu número de CUI (13 dígitos), nombres completos según DPI y un correo electrónico activo. Con esos datos el sistema te asigna el rol POSTULANTE y podrás iniciar sesión en la plataforma.',
      tags: ['registro', 'crear cuenta', 'cui', 'usuario'],
    },
    {
      titulo: 'Cómo iniciar sesión',
      contenido: 'En el módulo de Login ingresa el correo electrónico y la contraseña con los que te registraste. El sistema valida que el usuario esté ACTIVO y las credenciales sean correctas.',
      tags: ['login', 'sesion', 'iniciar sesion', 'contraseña'],
    },
    {
      titulo: 'Proceso de postulación paso a paso',
      contenido: 'El proceso de postulación en EDUVIAGT es: 1) Registrarse e iniciar sesión como postulante. 2) Seleccionar una convocatoria ABIERTA. 3) Crear la solicitud (inicia en BORRADOR). 4) Completar el perfil académico y financiero. 5) Cargar los documentos requeridos. 6) Revisar el checklist y enviar la solicitud. 7) Esperar la evaluación.',
      tags: ['proceso', 'postulación', 'pasos', 'solicitud', 'como postular'],
    },
    {
      titulo: 'Estados de una solicitud',
      contenido: 'Una solicitud pasa por los estados: BORRADOR, ENVIADA, EN_REVISION, CORRECCION, EVALUADA, APROBADA y RECHAZADA. Si un documento es rechazado, la solicitud vuelve a necesitar correcciones antes de ser enviada nuevamente.',
      tags: ['estados', 'solicitud', 'borrador', 'enviada', 'aprobada', 'rechazada'],
    },
    {
      titulo: 'Documentos requeridos típicos',
      contenido: 'Los documentos solicitados típicamente son: certificado académico, constancia de inscripción, copia de DPI, comprobante de ingresos familiares y carta de recomendación. Cada convocatoria define su propio listado obligatorio y opcional.',
      tags: ['documentos', 'certificado', 'constancia', 'dpi'],
    },
    {
      titulo: 'Formato de los documentos',
      contenido: 'Los documentos se cargan en formato PDF, JPG o PNG. El tamaño máximo por archivo es de 5 MB. Cada tipo de documento admite una sola versión activa, y las versiones anteriores se conservan para trazabilidad.',
      tags: ['pdf', 'jpg', 'png', 'tamaño', '5 mb', 'formato'],
    },
    {
      titulo: 'Cómo corregir una solicitud rechazada o con documentos rechazados',
      contenido: 'Cuando un documento es rechazado o la solicitud requiere correcciones, debes entrar a tu solicitud, reemplazar el documento y volver a enviar. El checklist te indica qué falta corregir.',
      tags: ['corregir', 'rechazado', 'documento rechazado', 'reenviar'],
    },
    {
      titulo: 'Qué es el checklist de la solicitud',
      contenido: 'El checklist es un resumen que muestra si completaste el perfil académico, el perfil financiero y todos los documentos obligatorios. Solo puedes enviar la solicitud cuando el checklist esté completo.',
      tags: ['checklist', 'completitud', 'validacion', 'enviar'],
    },
    {
      titulo: 'Fechas de convocatoria',
      contenido: 'Cada convocatoria tiene fechas de apertura, cierre y evaluación definidas por el Ministerio. Las convocatorias ABIERTAS se muestran públicamente; una vez cerrada no se aceptan nuevas solicitudes.',
      tags: ['fechas', 'convocatoria', 'abierta', 'cerrada', 'plazo'],
    },
    {
      titulo: 'Estados de una convocatoria',
      contenido: 'Las convocatorias pasan por: BORRADOR, ABIERTA, CERRADA, EN_EVALUACION, RESUELTA y ARCHIVADA. Solo en ABIERTA se pueden crear solicitudes.',
      tags: ['convocatoria', 'estados', 'borrador', 'abierta', 'resuelta'],
    },
    {
      titulo: 'Cómo aplicar a más de una beca',
      contenido: 'Puedes postularte a todas las convocatorias que estén ABIERTA y para las que cumplas los requisitos. Cada convocatoria genera una solicitud independiente.',
      tags: ['multiples becas', 'mas de una', 'varias'],
    },
    {
      titulo: 'Evaluación de la solicitud',
      contenido: 'Después del envío, la solicitud entra a revisión. Un comité asigna evaluadores que califican criterios (como rendimiento académico y situación socioeconómica) con puntajes de 0 a 100. El sistema calcula el puntaje ponderado automáticamente.',
      tags: ['evaluacion', 'evaluadores', 'criterios', 'puntaje'],
    },
    {
      titulo: 'Cómo se toma la decisión final',
      contenido: 'Los miembros del comité votan en una sesión formal. Se requiere quórum mínimo para decidir. El resultado de cada solicitud es APROBADA o RECHAZADA según la mayoría de votos, y la convocatoria pasa a RESUELTA.',
      tags: ['decision', 'votacion', 'sesion', 'comite', 'aprobada', 'rechazada'],
    },
    {
      titulo: 'Cómo consultar el estado de mi solicitud',
      contenido: 'Inicia sesión en EDUVIAGT y entra a tus solicitudes. Ahí verás el estado actual (BORRADOR, ENVIADA, EN_REVISION, EVALUADA, APROBADA o RECHAZADA) y el historial de cambios.',
      tags: ['consultar estado', 'seguimiento', 'estado'],
    },
    {
      titulo: 'Beca de excelencia académica',
      contenido: 'La beca de excelencia académica está dirigida a estudiantes universitarios con alto promedio (generalmente 85 puntos o más). Incluye apoyo para matrícula, colegiatura y una asignación mensual de Q800.00. Debes presentar certificado académico, constancia de inscripción, copia de DPI y comprobante de ingresos familiares.',
      tags: ['excelencia', 'promedio', '85', 'matrícula'],
    },
    {
      titulo: 'Beca de permanencia universitaria',
      contenido: 'La beca de permanencia apoya a estudiantes que mantienen un rendimiento académico satisfactorio y demuestran necesidad socioeconómica. Cubre la matrícula del ciclo en curso y entrega Q500.00 mensuales. El perfil financiero es clave en este tipo de beca.',
      tags: ['permanencia', 'rendimiento', 'socioeconomico'],
    },
    {
      titulo: 'Criterios de evaluación por beca',
      contenido: 'Cada beca define sus propios criterios y pesos: la Beca de Excelencia evalúa rendimiento académico (50%), situación socioeconómica (30%) y actividades extracurriculares (20%); la Beca de Permanencia evalúa desempeño académico (45%), necesidad socioeconómica (35%) y participación comunitaria (20%).',
      tags: ['criterios', 'pesos', 'rendimiento', 'socioeconomico', 'extracurricular'],
    },
    {
      titulo: 'Perfil académico',
      contenido: 'El perfil académico incluye tu género (desde tu cuenta), nivel académico, institución, carrera y promedio. Para el nivel académico y la institución puedes seleccionar opciones predefinidas o la opción "otro" y escribir tu propia respuesta.',
      tags: ['perfil academico', 'genero', 'nivel', 'promedio', 'institucion'],
    },
    {
      titulo: 'Perfil financiero',
      contenido: 'El perfil financiero incluye el ingreso familiar mensual y el número de dependientes. Esta información se usa para evaluar la necesidad socioeconómica y es confidencial.',
      tags: ['perfil financiero', 'ingresos', 'dependientes', 'economico'],
    },
    {
      titulo: '¿Puedo editar mi solicitud después de enviarla?',
      contenido: 'No directamente. Una solicitud ENVIADA pasa de inmediato a revisión. Si se requieren correcciones, el sistema la regresa a BORRADOR y podrás editarla nuevamente.',
      tags: ['editar', 'enviada', 'modificar', 'correcciones'],
    },
    {
      titulo: '¿Se puede cancelar o eliminar una solicitud?',
      contenido: 'Mientras la solicitud esté en BORRADOR puedes eliminar documentos y no enviarla. Una vez enviada, la solicitud se procesa y no puede cancelarse desde el portal; el estado final llegará tras la evaluación.',
      tags: ['cancelar', 'eliminar', 'solicitud'],
    },
    {
      titulo: 'Contraseña olvidada',
      contenido: 'Si olvidaste tu contraseña, contacta al administrador del sistema o al personal de soporte para restablecer el acceso a tu cuenta.',
      tags: ['contraseña', 'olvidada', 'password', 'soporte'],
    },
    {
      titulo: 'Soporte y contactos',
      contenido: 'Para dudas sobre tu postulación contacta al equipo de EDUVIAGT durante el horario de atención. El sistema registra cada acción sensible para auditoría.',
      tags: ['soporte', 'contacto', 'ayuda', 'atencion'],
    },
    {
      titulo: 'Seguridad de datos',
      contenido: 'EDUVIAGT protege tus datos personales: las contraseñas se guardan encriptadas, los accesos se registran y cada transición sensible queda en el registro de auditoría.',
      tags: ['seguridad', 'datos', 'privacidad', 'auditoria'],
    },
    {
      titulo: 'Roles del sistema',
      contenido: 'EDUVIAGT tiene los roles ADMIN, POSTULANTE, EVALUADOR, COORDINADOR_COMITE, MIEMBRO_COMITE y STAFF. Cada rol tiene permisos asignados; el ADMIN gestiona roles y permisos.',
      tags: ['roles', 'permisos', 'admin', 'evaluador', 'coordinador', 'miembro'],
    },
    {
      titulo: 'Comités evaluadores',
      contenido: 'Un comité es el grupo que evalúa solicitudes. Tiene un coordinador, un presidente y miembros. El comité organiza sesiones y vota las decisiones de aprobación o rechazo.',
      tags: ['comite', 'evaluador', 'miembros', 'sesion'],
    },
    {
      titulo: '¿Qué es una sesión de evaluación?',
      contenido: 'Una sesión reúne a los miembros de un comité para deliberar solicitudes ya evaluadas. En la sesión se requieren votos de al menos el quórum definido y se generan las decisiones finales.',
      tags: ['sesion', 'quorum', 'votos', 'decisiones'],
    },
    {
      titulo: 'Resultados y notificaciones',
      contenido: 'Los resultados de las convocatorias se publican una vez la convocatoria está RESUELTA. Revisa el estado de tus solicitudes en tu perfil para conocer el resultado.',
      tags: ['resultados', 'publicacion', 'resuelta', 'notificacion'],
    },
    {
      titulo: 'Descarga de reportes',
      contenido: 'El administrador puede generar reportes de solicitudes por estado, de convocatorias y de evaluaciones, así como exportarlos a CSV con formato compatible con Excel (con BOM UTF-8).',
      tags: ['reportes', 'csv', 'excel', 'exportar', 'admin'],
    },
    {
      titulo: 'Requisitos del DPI y CUI',
      contenido: 'El CUI es el número único de identificación de 13 dígitos. Debe coincidir con tu DPI. Si hay errores de digitación, el sistema rechaza el registro por duplicado o inconsistencia.',
      tags: ['dpi', 'cui', 'identificacion', '13 digitos'],
    },
    {
      titulo: 'Niveles académicos válidos',
      contenido: 'Las becas pueden estar dirigidas a niveles como primario, básico, diversificado, secundario, técnico o universitario. Para becas de "otro" nivel puedes indicarlo manualmente en el perfil académico.',
      tags: ['niveles', 'basico', 'diversificado', 'tecnico', 'universitario'],
    },
  ];

  for (const kb of conocimiento) {
    const existente = await prisma.asistenteBaseConocimiento.findFirst({
      where: { titulo: kb.titulo },
    });
    if (existente) {
      await prisma.asistenteBaseConocimiento.update({
        where: { id: existente.id },
        data: {
          contenido: kb.contenido,
          tags: kb.tags,
          activo: true,
        },
      });
    } else {
      await prisma.asistenteBaseConocimiento.create({
        data: { ...kb, activo: true },
      });
    }
  }
  console.log('✅ Base de conocimiento del asistente creada (US-37/US-39)');

  // ==========================================
  // ESCENARIOS COMPLETOS DE DEMOSTRACIÓN
  // ==========================================
  const { generarEscenarios } = await import('./semilla/escenarios');
  await generarEscenarios();

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
