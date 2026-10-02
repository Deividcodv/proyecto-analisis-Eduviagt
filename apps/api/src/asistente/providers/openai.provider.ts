import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProveedorIA, RespuestaIA, ContextoIA } from '../asistente.types';

interface Mensaje {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Proveedor LLM opcional (API compatible OpenAI). Activado solo si existe
 * AI_API_KEY en el entorno; nunca se versiona. Si el proveedor falla o
 * excede AI_TIMEOUT_MS, el proxy degrada a FallbackProveedor.
 */
@Injectable()
export class OpenAIProveedor implements ProveedorIA {
  readonly nombre = 'openai';

  constructor(private readonly configService: ConfigService) {}

  async responder(pregunta: string, contexto: ContextoIA): Promise<RespuestaIA> {
    const base = this.configService.get<string>('AI_BASE_URL') ?? 'https://api.openai.com/v1';
    const model = this.configService.get<string>('AI_MODEL') ?? 'gpt-4o-mini';
    const apiKey = this.configService.get<string>('AI_API_KEY') ?? '';
    const timeoutMs = Number(this.configService.get<string>('AI_TIMEOUT_MS') ?? '15000') || 15000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${base.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: this.construirMensajes(pregunta, contexto),
          temperature: 0.3,
          max_tokens: 500,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const detalle = await res.text().catch(() => '');
        throw new Error(`OpenAI HTTP ${res.status}${detalle ? `: ${detalle.slice(0, 120)}` : ''}`);
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const texto = data.choices?.[0]?.message?.content?.trim();
      if (!texto) {
        throw new Error('OpenAI sin contenido en la respuesta');
      }
      return { respuesta: texto, fuentes: [] };
    } finally {
      clearTimeout(timer);
    }
  }

  private construirMensajes(pregunta: string, contexto: ContextoIA): Mensaje[] {
    const system = contexto.rol
      ? `Eres el asistente de SIGEB (becas del Ministerio de Educación de Guatemala). El usuario autenticado tiene el rol ${contexto.rol}. Responde en español, de forma acotada, sin inventar datos. No reveles información de otros usuarios, puntajes internos ni decisiones de comités.`
      : `Eres el asistente público de SIGEB (becas del Ministerio de Educación de Guatemala). El usuario NO está autenticado. Responde en español, de forma acotada, usando solo información general sobre convocatorias, requisitos y el proceso de postulación. Nunca indiques datos personales ni información interna del sistema.`;
    return [
      { role: 'system', content: system },
      { role: 'user', content: pregunta },
    ];
  }
}