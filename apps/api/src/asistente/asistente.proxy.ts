import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FallbackProveedor } from './providers/fallback.provider';
import { OpenAIProveedor } from './providers/openai.provider';
import { ProveedorIA, RespuestaIA, ContextoIA } from './asistente.types';

/**
 * Enruta la pregunta al proveedor activo. Sin AI_API_KEY usa el fallback
 * por reglas/KB (por defecto y en CI); con AI_API_KEY usa el LLM opcional
 * y, si este falla o excede el timeout, degrada automáticamente a fallback.
 */
@Injectable()
export class AsistenteIAProxy {
  private readonly logger = new Logger(AsistenteIAProxy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly fallback: FallbackProveedor,
    private readonly openai: OpenAIProveedor,
  ) {}

  async responder(pregunta: string, contexto: ContextoIA): Promise<RespuestaIA> {
    const nombre = this.obtenerProveedor();
    const proveedor = this.resolver(nombre);

    if (nombre === 'fallback-kb') {
      return proveedor.responder(pregunta, contexto);
    }

    try {
      return await proveedor.responder(pregunta, contexto);
    } catch (e) {
      this.logger.warn(
        `Proveedor ${nombre} no disponible (${(e as Error).message}), degradando a fallback-kb`,
      );
      return this.fallback.responder(pregunta, contexto);
    }
  }

  private resolver(nombre: string): ProveedorIA {
    switch (nombre) {
      case 'openai':
        return this.openai;
      default:
        return this.fallback;
    }
  }

  private obtenerProveedor(): string {
    const apiKey = this.configService.get<string>('AI_API_KEY');
    return apiKey ? 'openai' : 'fallback-kb';
  }
}