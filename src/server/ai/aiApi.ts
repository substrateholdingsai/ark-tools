/**
 * ARK TOOLS — Workers AI API Handler
 *
 * Expone endpoints REST para interactuar con Workers AI:
 * - POST /api/ai/chat  (Inferencia con soporte de Agentic Tools y Streaming)
 * - GET  /api/ai/models (Catálogo de modelos disponibles y recomendados)
 * - GET  /api/ai/tools  (Esquema de herramientas expuestas al modelo)
 * - GET  /api/ai/status (Verificación del binding env.AI)
 */

import type { Env } from '../../index';
import { runAiAgent, DEFAULT_MODEL, FAST_MODEL } from './agent';
import { AI_TOOLS_CATALOG } from './tools';
import type { AiChatRequestBody } from './types';

export async function handleAiApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  const url = new URL(request.url);

  if (!url.pathname.startsWith('/api/ai')) {
    return null;
  }

  // 1. GET /api/ai/status — Chequeo del binding AI
  if (url.pathname === '/api/ai/status' && request.method === 'GET') {
    const isAiConfigured = Boolean(env.AI);
    const isD1Configured = Boolean(env.ARK_TOOLS_DB);

    return Response.json(
      {
        status: isAiConfigured ? 'available' : 'unconfigured',
        binding_ai: isAiConfigured,
        binding_d1: isD1Configured,
        default_model: DEFAULT_MODEL,
        timestamp: new Date().toISOString(),
      },
      {
        status: isAiConfigured ? 200 : 503,
        headers: corsHeaders,
      }
    );
  }

  // 2. GET /api/ai/models — Lista de modelos soportados
  if (url.pathname === '/api/ai/models' && request.method === 'GET') {
    return Response.json(
      {
        default: DEFAULT_MODEL,
        fast: FAST_MODEL,
        models: [
          {
            id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
            name: 'Llama 3.3 70B Instruct (FP8 Fast)',
            category: 'Text Generation / Reasoning / Tool-Calling',
            recommended_for: 'Consultas contables complejas, análisis fiscal y ejecución de tools.',
          },
          {
            id: '@cf/meta/llama-3.1-8b-instruct',
            name: 'Llama 3.1 8B Instruct',
            category: 'Text Generation / Fast',
            recommended_for: 'Respuestas ultra rápidas, resúmenes breves y bajo costo.',
          },
          {
            id: '@cf/baai/bge-m3',
            name: 'BGE-M3 (Multilingual Embeddings)',
            category: 'Embeddings / Vector Search (RAG)',
            recommended_for: 'Búsqueda semántica en leyes fiscales y normativas SAT en español.',
          },
        ],
      },
      { headers: corsHeaders }
    );
  }

  // 3. GET /api/ai/tools — Catálogo de herramientas disponibles
  if (url.pathname === '/api/ai/tools' && request.method === 'GET') {
    return Response.json(
      {
        tools_count: AI_TOOLS_CATALOG.length,
        tools: AI_TOOLS_CATALOG,
      },
      { headers: corsHeaders }
    );
  }

  // 4. POST /api/ai/chat — Chat / Inferencia con Tools
  if (url.pathname === '/api/ai/chat' && request.method === 'POST') {
    if (!env.AI) {
      return Response.json(
        {
          error: 'Workers AI Not Bound',
          message: 'El binding [ai] no está presente en este Worker. Revisa wrangler.toml.',
        },
        { status: 503, headers: corsHeaders }
      );
    }

    try {
      const body = (await request.json()) as AiChatRequestBody;

      if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
        return Response.json(
          { error: 'El cuerpo debe incluir un arreglo "messages" con al menos un mensaje.' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Obtener tenantId de cabecera o cuerpo (por defecto tenant general)
      const headerTenant = request.headers.get('x-tenant-id');
      const tenantId = headerTenant || body.tenant_id || 'tenant_default';

      const response = await runAiAgent(env, {
        messages: body.messages,
        tenantId,
        model: body.model,
        stream: body.stream ?? false,
      });

      // Si es streaming SSE, preservar sus headers y añadir CORS
      if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
        const streamHeaders = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([k, v]) => streamHeaders.set(k, v));
        return new Response(response.body, {
          status: response.status,
          headers: streamHeaders,
        });
      }

      // Respuesta JSON estándar
      const data = await response.json();
      return Response.json(data, {
        status: response.status,
        headers: corsHeaders,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return Response.json(
        { error: 'Error procesando solicitud de IA', details: errorMsg },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  return null;
}
