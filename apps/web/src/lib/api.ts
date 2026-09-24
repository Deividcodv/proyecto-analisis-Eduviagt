export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export interface Beca {
  id: string;
  nombre: string;
}

export interface Convocatoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  fechaApertura: string;
  fechaCierre: string;
  beca: Beca;
  _count?: { solicitudes?: number };
}

export interface DocumentoTipo {
  id: string;
  nombre: string;
}

export interface ConvocatoriaDocRequerido {
  id: string;
  documentoTipo: DocumentoTipo;
  obligatorio: boolean;
}

export interface CriterioEvaluacion {
  id: string;
  nombre: string;
  peso: number;
}

export interface ConvocatoriaDetalle extends Convocatoria {
  documentosRequeridos: ConvocatoriaDocRequerido[];
  beca: Beca & { criteriosEvaluacion: CriterioEvaluacion[] };
}

export interface HistorialEstado {
  estado: string;
  comentario: string | null;
  fecha: string;
}

export interface Solicitud {
  id: string;
  convocatoriaId: string;
  estado: string;
  correccionesCount: number;
  createdAt: string;
  updatedAt: string;
  convocatoria: {
    id: string;
    nombre: string;
    beca: Beca;
  };
  _count?: { documentos?: number };
}

export interface SolicitudPerfilAcademico {
  generoId: string | null;
  generoOtro: string | null;
  nivelAcademicoId: string | null;
  nivelAcademicoOtro: string | null;
  institucion: string | null;
  carrera: string | null;
  promedio: number | null;
  departamentoId: string | null;
  departamentoOtro: string | null;
  municipioId: string | null;
  municipioOtro: string | null;
}

export interface SolicitudPerfilFinanciero {
  ingresoFamiliar: number | null;
  numeroDependientes: number | null;
  becasAnteriores: boolean;
  descripcionSituacion: string | null;
}

export interface SolicitudDetalle extends Solicitud {
  perfilAcademico?: SolicitudPerfilAcademico | null;
  perfilFinanciero?: SolicitudPerfilFinanciero | null;
  documentos?: {
    id: string;
    documentoTipoId: string;
    archivoUrl: string;
    estado: string;
    version: number;
    documentoTipo: DocumentoTipo;
  }[];
  historial?: HistorialEstado[];
}

export interface SolicitudChecklistDocumento {
  documentoTipoId: string;
  nombre: string;
  obligatorio: boolean;
  cargado: boolean;
  archivoUrl: string | null;
}

export interface SolicitudChecklist {
  solicitudId: string;
  estado: string;
  perfilAcademico: boolean;
  perfilFinanciero: boolean;
  documentos: SolicitudChecklistDocumento[];
  pendientes: string[];
  completo: boolean;
}

export interface ConsultaSolicitud {
  codigo: string;
  estado: string;
  beca: string | null;
  convocatoria: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  historial: HistorialEstado[];
}

export interface Genero {
  id: string;
  nombre: string;
}

export interface NivelAcademico {
  id: string;
  nombre: string;
}

export interface Municipio {
  id: string;
  nombre: string;
}

export interface Departamento {
  id: string;
  nombre: string;
  municipios?: Municipio[];
}

export interface UsuarioSimplificado {
  id: string;
  cui: string;
  nombres: string;
  email: string;
  estado: string;
  rol: { nombre: string };
}

export interface Comite {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { miembros?: number };
}

export interface ComiteMiembro {
  id: string;
  rol: string;
  activo: boolean;
  usuario: { id: string; nombres: string; email: string; cui: string };
}

export interface ComiteDetalle extends Comite {
  miembros: ComiteMiembro[];
}

export interface Sesion {
  id: string;
  comiteId: string;
  fecha: string;
  lugar: string | null;
  estado: string;
  quorumMinimo: number | null;
  createdAt: string;
  updatedAt: string;
  comite?: { id: string; nombre: string };
  _count?: { agenda?: number; votos?: number };
}

export interface SesionVoto {
  id: string;
  voto: string;
  observaciones: string | null;
  createdAt: string;
  usuario?: { id: string; nombres: string };
  solicitud?: { id: string };
}

export interface SesionAgendaItem {
  id: string;
  solicitud: {
    id: string;
    estado: string;
    usuario: { nombres: string; cui: string };
  };
}

export interface Decision {
  id: string;
  solicitudId: string;
  sesionId: string;
  resultado: string;
  observaciones: string | null;
  fecha: string;
}

export interface SesionDetalle extends Sesion {
  agenda: SesionAgendaItem[];
  votos: SesionVoto[];
  decisiones: Decision[];
}

export interface EvaluadorScore {
  evaluador: { id: string; nombres: string };
  criterios: {
    id: string;
    nombre: string;
    peso: number;
    puntaje: number;
  }[];
  completados: number;
  total: number;
  completo: boolean;
  score: number | null;
}

export interface ScoreSolicitud {
  solicitudId: string;
  score: number | null;
  completo: boolean;
  evaluadores: EvaluadorScore[];
}

export interface ListaResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

export async function fetcher<T>(path: string): Promise<T> {
  return http<T>(path);
}

export async function http<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    body?: unknown;
    isFormData?: boolean;
    token?: string | null;
  } = {},
): Promise<T> {
  const { method = 'GET', body, isFormData = false, token } = options;

  const headers: Record<string, string> = { accept: 'application/json' };
  if (!isFormData && body !== undefined) {
    headers['content-type'] = 'application/json';
  }
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const mensaje =
      (data as { message?: string } | null)?.message ??
      `La API respondió con estado ${res.status}`;
    throw new Error(Array.isArray(mensaje) ? mensaje.join(', ') : mensaje);
  }

  return (await res.json()) as T;
}

export async function httpData<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    body?: unknown;
    isFormData?: boolean;
    token?: string | null;
  } = {},
): Promise<T> {
  const res = await http<{ data: T }>(path, options);
  return res.data;
}

export function formatearFecha(fecha: string) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
