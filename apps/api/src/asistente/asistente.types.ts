export interface ContextoIA {
  rol?: string | null;
  sesionId?: string | null;
}

export interface RespuestaIA {
  respuesta: string;
  fuentes: string[];
}

export interface ProveedorIA {
  responder(pregunta: string, contexto: ContextoIA): Promise<RespuestaIA>;
  readonly nombre: string;
}