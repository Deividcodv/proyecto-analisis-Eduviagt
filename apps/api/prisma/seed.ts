import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface InstitucionSeed {
  nombre: string;
  nivel: string;
  sector?: string;
  departamento?: string;
  municipio?: string;
}

const INSTITUCIONES_EDUCATIVAS: InstitucionSeed[] = [
  // ==================== UNIVERSITARIOS ====================
  { nombre: 'Universidad de San Carlos de Guatemala', nivel: 'UNIVERSITARIO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Universidad Rafael Landívar', nivel: 'UNIVERSITARIO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad del Valle de Guatemala', nivel: 'UNIVERSITARIO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad Mariano Gálvez de Guatemala', nivel: 'UNIVERSITARIO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad Francisco Marroquín', nivel: 'UNIVERSITARIO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad Rural de Guatemala', nivel: 'UNIVERSITARIO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad del Istmo', nivel: 'UNIVERSITARIO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad Panamericana de Guatemala', nivel: 'UNIVERSITARIO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad Mesoamericana', nivel: 'UNIVERSITARIO', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'PRIVADO' },
  { nombre: 'Universidad Galileo', nivel: 'UNIVERSITARIO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad San Pablo de Guatemala', nivel: 'UNIVERSITARIO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad InterNaciones', nivel: 'UNIVERSITARIO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad de Occidente', nivel: 'UNIVERSITARIO', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'PRIVADO' },
  { nombre: 'Universidad Da Vinci de Guatemala', nivel: 'UNIVERSITARIO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad Regional de Guatemala', nivel: 'UNIVERSITARIO', departamento: 'Escuintla', municipio: 'Escuintla', sector: 'PRIVADO' },
  { nombre: 'Universidad Juan José Arévalo Bermejo', nivel: 'UNIVERSITARIO', departamento: 'Sololá', municipio: 'Sololá', sector: 'PRIVADO' },
  { nombre: 'Universidad Americana', nivel: 'UNIVERSITARIO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad de la Guardia de Honor Presidencial', nivel: 'UNIVERSITARIO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Universidad de las Fuerzas Armadas - ESFOR', nivel: 'UNIVERSITARIO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },

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

  // ==================== BÁSICO ====================
  { nombre: 'Escuela Oficial Rural Mixta "Liceo Guatemala"', nivel: 'BASICO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Urbana Mixta "Rafael Aqueche"', nivel: 'BASICO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Urbana Mixta "Manuel Estrada Cabrera"', nivel: 'BASICO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Colegio San Carlos', nivel: 'BASICO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Colegio Miguel Ángel Asturias', nivel: 'BASICO', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Escuela Oficial Rural Mixta de Mixco', nivel: 'BASICO', departamento: 'Guatemala', municipio: 'Mixco', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Villa Nueva', nivel: 'BASICO', departamento: 'Guatemala', municipio: 'Villa Nueva', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Quetzaltenango', nivel: 'BASICO', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Cobán', nivel: 'BASICO', departamento: 'Alta Verapaz', municipio: 'Cobán', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Salamá', nivel: 'BASICO', departamento: 'Baja Verapaz', municipio: 'Salamá', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Chimaltenango', nivel: 'BASICO', departamento: 'Chimaltenango', municipio: 'Chimaltenango', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Chiquimula', nivel: 'BASICO', departamento: 'Chiquimula', municipio: 'Chiquimula', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Escuintla', nivel: 'BASICO', departamento: 'Escuintla', municipio: 'Escuintla', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Huehuetenango', nivel: 'BASICO', departamento: 'Huehuetenango', municipio: 'Huehuetenango', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Puerto Barrios', nivel: 'BASICO', departamento: 'Izabal', municipio: 'Puerto Barrios', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Jalapa', nivel: 'BASICO', departamento: 'Jalapa', municipio: 'Jalapa', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Jutiapa', nivel: 'BASICO', departamento: 'Jutiapa', municipio: 'Jutiapa', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Flores', nivel: 'BASICO', departamento: 'Petén', municipio: 'Flores', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Retalhuleu', nivel: 'BASICO', departamento: 'Retalhuleu', municipio: 'Retalhuleu', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Antigua Guatemala', nivel: 'BASICO', departamento: 'Sacatepéquez', municipio: 'Antigua Guatemala', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de San Marcos', nivel: 'BASICO', departamento: 'San Marcos', municipio: 'San Marcos', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Cuilapa', nivel: 'BASICO', departamento: 'Santa Rosa', municipio: 'Cuilapa', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Sololá', nivel: 'BASICO', departamento: 'Sololá', municipio: 'Sololá', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Mazatenango', nivel: 'BASICO', departamento: 'Suchitepéquez', municipio: 'Mazatenango', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Totonicapán', nivel: 'BASICO', departamento: 'Totonicapán', municipio: 'Totonicapán', sector: 'OFICIAL' },
  { nombre: 'Escuela Oficial Rural Mixta de Zacapa', nivel: 'BASICO', departamento: 'Zacapa', municipio: 'Zacapa', sector: 'OFICIAL' },

  // ==================== PREPRIMARIA ====================
  { nombre: 'Centro de Educación Inicial "Santa María"', nivel: 'PREPRIMARIA', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'OFICIAL' },
  { nombre: 'Centro de Educación Inicial "San José"', nivel: 'PREPRIMARIA', departamento: 'Guatemala', municipio: 'Guatemala', sector: 'PRIVADO' },
  { nombre: 'Centro de Educación Inicial "Los Ángeles"', nivel: 'PREPRIMARIA', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', sector: 'OFICIAL' },
  { nombre: 'Centro de Educación Inicial "San Pedro"', nivel: 'PREPRIMARIA', departamento: 'Alta Verapaz', municipio: 'Cobán', sector: 'OFICIAL' },
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
    // Auditoría
    { modulo: 'auditoria', accion: 'ver' },
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
  await prisma.genero.deleteMany({
    where: { nombre: { startsWith: 'Smoke' } },
  });
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
  console.log(`✅ Municipios creados (${Object.values(MUNICIPIOS_POR_DEPARTAMENTO).flat().length} en 22 departamentos)`);
  await prisma.municipio.deleteMany({
    where: { departamento: { nombre: 'El Proverbio' } },
  });
  await prisma.departamento.deleteMany({ where: { nombre: 'El Proverbio' } });

  // ==========================================
  // TIPOS DE DOCUMENTO
  // ==========================================
  const documentos = [
    'Certificado académico',
    'Constancia de estudios',
    'Cédula de depleción',
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
  console.log('✅ Instituciones obsoletas eliminadas');

  // ==========================================
  // USUARIO ADMIN POR DEFECTO
  // ==========================================
  const adminRoleData = await prisma.rol.findUnique({ where: { nombre: 'ADMIN' } });
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  await prisma.usuario.upsert({
    where: { cui: '1234567890123' },
    update: { nombres: 'Administrador EDUVIAGT' },
    create: {
      cui: '1234567890123',
      nombres: 'Administrador EDUVIAGT',
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

  // ==========================================
  // ASISTENTE IA - BASE DE CONOCIMIENTO (US-37/US-39)
  // ==========================================
  const conocimiento = [
    {
      titulo: '¿Qué es una beca?',
      contenido: 'Una beca es un apoyo económico otorgado al estudiante para cubrir gastos de estudios, como matrícula, colegiatura o materiales. En EDUVIAGT el Ministerio de Educación administra las becas mediante convocatorias públicas.',
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
      contenido: 'Una solicitud pasa por los estados: BORRADOR, ENVIADA, EN_REVISION, EVALUADA, APROBADA y RECHAZADA. Si un documento es rechazado, la solicitud vuelve a necesitar correcciones antes de ser enviada nuevamente.',
      tags: ['estados', 'solicitud', 'borrador', 'enviada', 'aprobada', 'rechazada'],
    },
    {
      titulo: 'Documentos requeridos típicos',
      contenido: 'Los documentos solicitados típicamente son: certificado académico, constancia de inscripción, DPI o constancia de identidad, comprobante de ingresos familiares y carta de recomendación. Cada convocatoria define su propio listado obligatorio y opcional.',
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
      contenido: 'La beca de excelencia académica está dirigida a estudiantes con alto promedio (generalmente 85 puntos o más). Incluye apoyo para matrícula y una asignación mensual. Debes presentar certificado académico y constancia de inscripción.',
      tags: ['excelencia', 'promedio', '85', 'matrícula'],
    },
    {
      titulo: 'Beca de permanencia',
      contenido: 'La beca de permanencia apoya a estudiantes que mantienen un rendimiento académico satisfactorio y demuestran necesidad socioeconómica. El perfil financiero es clave en este tipo de beca.',
      tags: ['permanencia', 'rendimiento', 'socioeconomico'],
    },
    {
      titulo: 'Criterios de evaluación de la beca 2',
      contenido: 'La beca 2 evalúa: rendimiento académico (peso 50%), situación socioeconómica (peso 30%) y actividad extracurriculares (peso 20%). Los puntajes se calculan sobre 100.',
      tags: ['beca 2', 'criterios', 'rendimiento', 'socioeconomico', 'extracurricular', 'pesos'],
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
      titulo: '¿Cancela o eliminar una solicitud?',
      contenido: 'Mientras la solicitud esté en BORRADOR puedes eliminar documentos y no enviarla. Una vez enviada, la solicitud se procesa y no puede cancelarse desde el portal; el estado final llegará tras la evaluación.',
      tags: ['cancelar', 'eliminar', 'solicitud'],
    },
    {
      titulo: 'Contraseña olvidada',
      contenido: 'Si olvidaste tu contraseña, contacta al administrador del sistema o al personal de soporte del Ministerio de Educación para restablecer el acceso a tu cuenta.',
      tags: ['contraseña', 'olvidada', 'password', 'soporte'],
    },
    {
      titulo: 'Soporte y contactos',
      contenido: 'Para dudas sobre tu postulación contacta al equipo de EDUVIAGT del Ministerio de Educación durante horario de atención. El sistema registra cada acción sensible para auditoría.',
      tags: ['soporte', 'contacto', 'ayuda', 'atencion'],
    },
    {
      titulo: 'Seguridad de datos',
      contenido: 'EDUVIAGT protege tus datos personales: las contraseñas se guardan encriptadas, los accesos se registran y cada transición sensible queda en el registro de auditoría.',
      tags: ['seguridad', 'datos', 'privacidad', 'auditoria'],
    },
    {
      titulo: 'Roles del sistema',
      contenido: 'EDUVIAGT tiene los roles ADMIN, POSTULANTE, EVALUADOR, COORDINADOR_COMITE y MIEMBRO_COMITE. Cada rol tiene permisos asignados; el ADMIN gestiona roles y permisos.',
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
      contenido: 'Las becas pueden estar dirigidas a niveles como básico, diversificado, técnico o universitario. Para becas de "otro" nivel puedes indicarlo manualmente en el perfil académico.',
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
        data: { contenido: kb.contenido, tags: kb.tags, activo: true },
      });
    } else {
      await prisma.asistenteBaseConocimiento.create({ data: kb });
    }
  }
  console.log('✅ Base de conocimiento del asistente creada (US-37/US-39)');

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
