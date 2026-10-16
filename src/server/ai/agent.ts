/**
 * ARK TOOLS — AI Agent & Tool Orchestrator
 *
 * Coordina la interacción con Cloudflare Workers AI (`env.AI`).
 * Implementa el ciclo de Agentic Tool-Calling:
 * 1. Envía mensajes y catálogo de herramientas al modelo.
 * 2. Si el modelo solicita `tool_calls`, las valida y ejecuta de forma segura contra D1/recursos.
 * 3. Reenvía los resultados al modelo para generar la síntesis final al usuario.
 */

import type { Env } from '../../index';
import { AI_TOOLS_CATALOG, executeAiTool } from './tools';
import type { AiChatMessage, AiToolCall } from './types';

export const DEFAULT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
export const FAST_MODEL = '@cf/meta/llama-3.1-8b-instruct';

export interface RunAgentOptions {
  messages: AiChatMessage[];
  tenantId: string;
  model?: string;
  stream?: boolean;
}

export async function runAiAgent(
  env: Env,
  options: RunAgentOptions
): Promise<Response> {
  const ai = env.AI;
  if (!ai) {
    return Response.json(
      {
        error: 'Workers AI Binding Not Configured',
        message: 'El binding [ai] (env.AI) no está disponible en este Worker.',
      },
      { status: 503 }
    );
  }

  let selectedModel = (options.model || DEFAULT_MODEL) as Parameters<typeof ai.run>[0];
  const tenantId = options.tenantId;

  // Formatear catálogo a estándar OpenAI / Cloudflare Tools
  const formattedTools = AI_TOOLS_CATALOG.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));

  const systemPrompt = `Eres ARK Contable AI, el asistente inteligente y especializado de la suite ARK TOOLS para despachos y contadores en México.
Tienes acceso a herramientas para consultar el progreso de la Guía SAT/IMSS, el Ledger de auditoría y notas de Activos Virtuales de este despacho (Tenant: ${tenantId}), así como calcular finiquitos según la LFT.
Directrices:
1. Cuando el usuario pregunte por sus datos, estado de trámites, auditorías o notas, usa las herramientas correspondientes.
2. Si te piden un cálculo laboral (finiquito, aguinaldo, liquidación), invoca la herramienta "calcular_finiquito_lft".
3. Sé preciso, profesional, claro y fundamenta en la legislación fiscal y laboral mexicana aplicable (LFT, CFF, LISR, LIVA).
4. Nunca inventes datos del cliente; consulta las herramientas disponibles.`;

  // Asegurar que el mensaje de sistema esté presente
  const currentMessages: AiChatMessage[] = [];
  if (!options.messages.some((m) => m.role === 'system')) {
    currentMessages.push({ role: 'system', content: systemPrompt });
  }
  currentMessages.push(...options.messages);

  try {
    // 1. Primera llamada: Determinar si el modelo necesita invocar herramientas
    let aiResponse: any;
    try {
      aiResponse = await (ai as any).run(selectedModel, {
        messages: currentMessages,
        tools: formattedTools,
      });
    } catch (modelErr) {
      // Fallback automático al modelo rápido 8B si el 70B no está disponible
      if (selectedModel !== FAST_MODEL) {
        selectedModel = FAST_MODEL as Parameters<typeof ai.run>[0];
        aiResponse = await (ai as any).run(selectedModel, {
          messages: currentMessages,
          tools: formattedTools,
        });
      } else {
        throw modelErr;
      }
    }

    // Detectar si el modelo solicitó ejecutar herramientas
    const toolCalls: AiToolCall[] =
      aiResponse.tool_calls ||
      aiResponse.choices?.[0]?.message?.tool_calls ||
      [];

    if (toolCalls.length > 0) {
      // 2. Normalizar tool_calls al estándar OpenAI/Cloudflare
      const normalizedToolCalls = toolCalls.map((call, idx) => {
        const callId = call.id || (call as any).tool_call_id || `call_${Date.now()}_${idx}`;
        const name = call.name || (call as any).function?.name;
        const rawArgs = call.arguments || (call as any).function?.arguments || {};
        const argsStr = typeof rawArgs === 'string' ? rawArgs : JSON.stringify(rawArgs);

        return {
          id: callId,
          type: 'function',
          function: {
            name,
            arguments: argsStr,
          },
          _rawArgs: rawArgs,
          _toolName: name,
        };
      });

      currentMessages.push({
        role: 'assistant',
        content: aiResponse.response || aiResponse.choices?.[0]?.message?.content || '',
        tool_calls: normalizedToolCalls.map((t) => ({
          id: t.id,
          type: 'function',
          function: t.function,
        })) as any,
      });

      for (const call of normalizedToolCalls) {
        const executionResult = await executeAiTool(call._toolName, call._rawArgs, env, tenantId);

        currentMessages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: call._toolName,
          content: JSON.stringify(executionResult),
        } as any);
      }

      // 3. Segunda llamada: Generar respuesta final con los datos de las herramientas
      if (options.stream) {
        const streamResponse = await (ai as any).run(selectedModel, {
          messages: currentMessages,
          stream: true,
        });

        return new Response(streamResponse as ReadableStream, {
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

      const finalResponse: any = await (ai as any).run(selectedModel, {
        messages: currentMessages,
      });

      return Response.json({
        model: selectedModel,
        tenant_id: tenantId,
        tools_executed: toolCalls.map((t) => t.name || (t as any).function?.name),
        result: finalResponse.response || finalResponse.choices?.[0]?.message?.content || finalResponse,
      });
    }

    // Si no hubo tool calls y se pidió streaming
    if (options.stream) {
      const directStream = await (ai as any).run(selectedModel, {
        messages: currentMessages,
        stream: true,
      });

      return new Response(directStream as ReadableStream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Respuesta directa en JSON
    return Response.json({
      model: selectedModel,
      tenant_id: tenantId,
      result: aiResponse.response || aiResponse.choices?.[0]?.message?.content || aiResponse,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return Response.json(
      {
        error: 'Workers AI Execution Error',
        message: errorMsg,
      },
      { status: 500 }
    );
  }
}
