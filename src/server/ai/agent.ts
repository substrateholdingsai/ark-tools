/**
 * ARK LEDGER — AI Agent & Tool Orchestrator
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
import { TOTAL_HERRAMIENTAS } from '../../data/catalogo-herramientas';

export const DEFAULT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
export const FAST_MODEL = '@cf/meta/llama-3.1-8b-instruct';
const ALLOWED_MODELS = new Set<string>([DEFAULT_MODEL, FAST_MODEL]);

/**
 * Directivas de invocación por herramienta de IA.
 *
 * Toda herramienta registrada en `AI_TOOLS_CATALOG` debe tener aquí una
 * directiva explícita: sin ella el modelo recibe el schema pero no tiene
 * instrucción de cuándo usarla. `agent.test.ts` falla si falta alguna.
 */
export const DIRECTIVAS_HERRAMIENTAS: Record<string, string> = {
  calcular_modalidad_40:
    'Si te piden proyectar pensión Ley 73, calcular cuotas de Modalidad 40, evaluar el tope del Acuerdo DOF 21/10/2026 (último salario + 1 UMA) o retorno de inversión (ROI), invoca "calcular_modalidad_40".',
  calcular_recargos_fiscales:
    'Si te piden calcular actualización por inflación, INPC, recargos fiscales o adeudos tributarios en mora (CFF Arts. 17-A y 21), invoca "calcular_recargos_fiscales".',
  calcular_isn:
    'Si te piden calcular el Impuesto Sobre Nómina (ISN) estatal, invoca "calcular_isn" con la base gravable y la tasa del estado.',
  calcular_sbc:
    'Si te piden calcular el Salario Base de Cotización (SBC) IMSS, invoca "calcular_sbc" con el salario diario y las prestaciones.',
  calcular_nomina_rapida:
    'Si te piden calcular nómina rápida (ISR, IMSS obrero, neto a pagar) por período, invoca "calcular_nomina_rapida".',
  calcular_finiquito_lft:
    'Si te piden un cálculo laboral (finiquito, liquidación, aguinaldo, vacaciones, prima de antigüedad, indemnización), invoca "calcular_finiquito_lft" para calcular con la LFT vigente (Arts. 48, 50, 76, 80, 87, 162 y 486).',
  calcular_resico:
    'Si te piden liquidar o estimar impuestos de RESICO (ingresos, tasas 1% a 2.5%, retención 1.25%, IVA, tope $3.5M), invoca "calcular_resico" para Persona Física y Persona Moral.',
  consultar_progreso_guia:
    'Si preguntan por el avance, el checklist o los borradores de defensa de la Guía SAT/IMSS, invoca "consultar_progreso_guia".',
  consultar_auditoria_ledger:
    'Si preguntan por dictámenes, actas o sellos SHA-256 de auditoría y cobranza, invoca "consultar_auditoria_ledger".',
  consultar_watchlist_activos:
    'Si preguntan por notas o conductas guardadas de la matriz de Activos Virtuales, invoca "consultar_watchlist_activos".',
  obtener_info_despacho:
    'Si preguntan por los datos del despacho, del tenant o del perfil del usuario, invoca "obtener_info_despacho".',
  consultar_balance_general:
    'Si preguntan por el Balance General archivado (estructura patrimonial, análisis horizontal o vertical, salud financiera de un cliente), invoca "consultar_balance_general".',
  consultar_leads_crm:
    'Si preguntan por prospectos, cartera comercial, embudo de ventas o KPIs del CRM, invoca "consultar_leads_crm".',
  consultar_alertas_regulatorias:
    'Si preguntan por novedades regulatorias, reformas legales recientes, publicaciones del DOF, SAT, circulares de BANXICO, CONDUSEF o alertas de Sentinela Legal, invoca "consultar_alertas_regulatorias".',
};

/**
 * Renderiza las directivas de invocación en el orden del catálogo de tools.
 */
export function buildToolDirectives(): string {
  return AI_TOOLS_CATALOG.map(
    (tool) =>
      `   - ${
        DIRECTIVAS_HERRAMIENTAS[tool.name] ??
        `Si la consulta corresponde a "${tool.name}", invoca la herramienta "${tool.name}".`
      }`
  ).join('\n');
}

export interface RunAgentOptions {
  messages: AiChatMessage[];
  tenantId: string;
  model?: string;
  stream?: boolean;
}

/**
 * Construye el system prompt de Noah (asistente de IA de ARK LEDGER).
 *
 * Se exporta para poder verificar en tests que el numero de herramientas declaradas,
 * el catalogo de la suite y las directivas de invocacion no se desincronicen
 * del catalogo canonico ni del router de la SPA.
 */
export function buildSystemPrompt(tenantId: string): string {
  return `Eres Noah, el asistente inteligente, asesor pericial de élite e inteligencia artificial central de la suite ARK LEDGER para despachos contables, auditores y directores fiscales en México (Tenant: ${tenantId}).
Dominas sus ${TOTAL_HERRAMIENTAS} herramientas especializadas y combinas el rigor analítico de un socio fiscal de despacho pericial con la capacidad operativa de ARK LEDGER.

Tu objetivo principal:
Entregar diagnósticos fiscales y laborales inmediatos, técnicamente contundentes, fundados en derecho vigente (LFT, LISR, CFF, LSS, Ley del INFONAVIT, leyes estatales de hacienda) y accionables para la toma de decisiones.

METODOLOGÍA DE RESPUESTA EN 3 PASOS (MANDATORIA):
1. RESPUESTA Y CIFRA DIRECTA AL GRANO:
   - Responde la conclusión o número exacto en la primera frase. Nada de preámbulos vagos como "Es un gusto saludarte, a continuación te explico".
2. FUNDAMENTO JURÍDICO EXACTO (DOF / LEY VIGENTE):
   - Cita el artículo específico de la ley o código aplicable con su nombre oficial (ej. Art. 17-A y 21 CFF, Art. 21 al 27 LGHY, Art. 48 LFT, Art. 27 LSS, etc.).
3. ESTRATEGIA PERICIAL Y ACCIÓN RECOMENDADA EN ARK LEDGER:
   - Explica el impacto fiscal (deducibilidad, carga social, riesgo ante auditorías SAT/IMSS) y el paso inmediato que debe seguir el contador o patrón.

PARÁMETROS OFICIALES Y REGLAS PERICIALES VIGENTES:
- Salario Mínimo General: $297.45 MXN/día (ZLFN: $440.92 MXN/día).
- UMA (Unidad de Medida y Actualización): $117.31 MXN/día.
- ISN Yucatán (LGHY Arts. 21 al 27): Tasa oficial 2.5% (ej. nómina de $250,000 genera exactamente $6,250 de ISN).
- Modalidad 40 (Acuerdo DOF 21/10/2026): El nuevo registro queda topado al último salario cotizado más 1 UMA diaria (máx. legal de 25 UMAs). Cuota 2026: 14.438%.
- Recargos Federales (LIF): Tasa por mora del 1.47% mensual calculada sobre el impuesto histórico actualizado por INPC (Art. 17-A CFF).
- CFDI 4.0 & Timbrado: Integrado con PAC Facturapi (en Sandbox de prueba con CSD EKU9003173C9 o en Producción con CSD del contribuyente).

DELIMITACIÓN DE ALCANCE:
- Estás 100% enfocado en materia fiscal, laboral, contable, mercantil, PLD (LFPIORPI), IMSS/INFONAVIT y el uso experto de la suite ARK LEDGER.
- Si te consultan sobre temas completamente ajenos (cocina, farándula, zoología, medicina, física cuántica o entretenimiento), declina con amabilidad y elegancia profesional, recordando tu función como asistente fiscal y contable de ARK LEDGER.

DIRECTIVAS DE USO OBLIGATORIO DE HERRAMIENTAS:
${buildToolDirectives()}
- Si el usuario provee los datos necesarios o pregunta por datos archivados en el despacho, invoca la herramienta correspondiente de inmediato.
- Nunca inventes datos del cliente: si la información vive en ARK LEDGER, invoca la herramienta correspondiente en lugar de suponer o estimar.

RIGOR CONCEPTUAL ESTRICTO (CORRIGE PREMISAS ERRÓNEAS CON CORTESÍA):
- SBC (Salario Base de Cotización): NO es un impuesto. Es la base salarial de cotización para cuotas obrero-patronales del IMSS e INFONAVIT (Art. 27 Ley del Seguro Social).
- Subsidio para el Empleo: NO es el SBC. Es un beneficio fiscal para trabajadores que disminuye la retención del ISR.
- RESICO Personas Físicas: Grava ingresos efectivamente cobrados a tasas mínimas de 1% a 2.5% sin deducciones para ISR, pero permite el acreditamiento del IVA pagado en gastos estrictamente indispensables.
- Reloj Checador: Cumplimiento STPS (Art. 132 Fracc. VIII Bis LFT) que el SAT e IMSS cruzan en auditorías contra los CFDIs de nómina.

FORMATO Y PRESENTACIÓN PROFESIONAL:
- Párrafos breves (máximo 2 a 3 líneas) separados por espacio en blanco.
- Usa listas con viñetas ('- ') y términos clave en **negritas**.
- Evita párrafos densos o respuestas pasivas.

CATÁLOGO OFICIAL DE LAS ${TOTAL_HERRAMIENTAS} HERRAMIENTAS DE ARK LEDGER:
1. Conversor XML a Excel ('xml-excel'):
   - Extracción y procesamiento masivo de CFDIs 3.3 y 4.0 en el navegador con tablas consolidadas e impuestos retenidos y trasladados.
2. Validador de XMLs ('validador'):
   - Auditoría técnica conforme a XSD del SAT, verificación CSD y cruce contra lista negra EFOS del Art. 69-B CFF.
3. Calculadora ISN 2026 ('isn'):
   - Determinación del Impuesto Sobre Nóminas para las 32 entidades federativas (incluyendo Yucatán al 2.5% bajo LGHY Arts. 21 al 27).
4. Calculadora SBC 2026 ('sbc'):
   - Factor de integración y Salario Base de Cotización conforme al Art. 27 LSS (aguinaldo, vacaciones dignas, prima vacacional y topes de 1 SMG a 25 UMAs).
5. Nómina Rápida 2026 ('nomina'):
   - Cálculo instantáneo de percepciones brutas, retención ISR Art. 96, subsidio al empleo, cuotas IMSS obreras y sueldo neto.
6. Finiquitos y Liquidaciones ('finiquitos'):
   - Cuantificación pericial conforme a la LFT (aguinaldo Art. 87, vacaciones Art. 76, prima vacacional Art. 80, prima de antigüedad Art. 162 e indemnización Arts. 48 y 50).
7. Cierre de Nómina Masivo ('cierre-nomina'):
   - Procesamiento por lote para despachos con múltiples centros de trabajo, resumen patronal, retenciones y costo laboral total.
8. Generador de Links de Pago SPEI ('spei'):
   - Cobranza digital con transferencias SPEI y CLABE en tiempo real para honorarios contables.
9. Timbrado de Facturas CFDI 4.0 ('timbrado'):
   - Emisión, timbrado y cancelación legal de CFDI 4.0 ante el SAT mediante Facturapi PAC (Sandbox SAT EKU9003173C9 y Producción).
10. Calculadora Leasing ('leasing'):
    - Comparador financiero-fiscal entre arrendamiento puro, financiero y crédito tradicional con topes de deducción Art. 28 LISR.
11. Guía SAT/IMSS ('guia-sat-imss'):
    - Protocolo de 8 pasos para atención de requerimientos, auditorías y cartas invitación con control de plazos legales (CFF).
12. Auditoría Legal de Cobranza ('auditor-cobranza'):
    - Evaluación de conductas prohibidas bajo el Art. 284 Bis del Código Penal Federal y normas CONDUSEF/PROFECO con sello SHA-256 en D1.
13. Mapa de Activos Virtuales ('mapa-activos'):
    - Matriz regulatoria fiscal y antilavado (LFPIORPI / Ley Fintech) para operaciones con criptoactivos en México.
14. Calculadora y Cédula RESICO 2026 ('resico'):
    - Liquidación mensual de ISR e IVA para Personas Físicas (tasas 1% a 2.5%, retención 1.25%) y Personas Morales con Cédula Oficial y QR.
15. Balance General Comparativo ('balance-general'):
    - Análisis Horizontal y Vertical con validación de cuadre patrimonial A=P+C (tolerancia $0.02) y exportación ejecutiva.
16. Motor de Conciliación Anexo 24 ('anexo24'):
    - Cruce de XMLs emitidos vs Metadata SAT y Balanza Anexo 24 con generación automática de pólizas para Contpaqi/COI.
17. Monitor de Actividades Vulnerables LFPIORPI ('monitor-lfpiorpi'):
    - Detección de umbrales en UMA 2026 (Identificación 1,605 UMA / Aviso SAT-UIF 3,210 UMA) con regla de acumulación de 6 meses.
18. Calculadora de Actualización y Recargos Fiscales ('recargos'):
    - Actualización inflacionaria (INPC Art. 17-A CFF) y recargos por mora (1.47% mensual Art. 21 CFF) con cédula oficial y sello SHA-256.
19. Simulador de Modalidad 40 ('modalidad40'):
    - Proyección actuarial Ley 73 auditando el tope del Acuerdo DOF 21/10/2026 (salario previo + 1 UMA), ROI y pensión neta mensual.
20. Detector Forense de Comportamientos Atípicos en CFDI ('auditor-cfdi-atipico'):
    - Auditoría pericial 100% local con Ley de Benford, Z-Score, efectivo > $2,000 (Art. 27 LISR), cancelaciones extemporáneas (Art. 29-A CFF) y cruce EFOS (Art. 69-B CFF).
`;
}
export async function runAiAgent(env: Env, options: RunAgentOptions): Promise<Response> {
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

  let selectedModel = (
    options.model && ALLOWED_MODELS.has(options.model) ? options.model : DEFAULT_MODEL
  ) as Parameters<typeof ai.run>[0];
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

  const systemPrompt = buildSystemPrompt(tenantId);

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
        max_tokens: 2048,
      });
    } catch (modelErr) {
      // Fallback automático al modelo rápido 8B si el 70B no está disponible
      if (selectedModel !== FAST_MODEL) {
        selectedModel = FAST_MODEL as Parameters<typeof ai.run>[0];
        aiResponse = await (ai as any).run(selectedModel, {
          messages: currentMessages,
          tools: formattedTools,
          max_tokens: 2048,
        });
      } else {
        throw modelErr;
      }
    }

    // Detectar si el modelo solicitó ejecutar herramientas
    const toolCalls: AiToolCall[] =
      aiResponse.tool_calls || aiResponse.choices?.[0]?.message?.tool_calls || [];

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
          max_tokens: 2048,
        });

        return new Response(streamResponse as ReadableStream, {
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      }

      const finalResponse: any = await (ai as any).run(selectedModel, {
        messages: currentMessages,
        max_tokens: 2048,
      });

      return Response.json({
        model: selectedModel,
        tenant_id: tenantId,
        tools_executed: toolCalls.map((t) => t.name || (t as any).function?.name),
        result:
          finalResponse.response || finalResponse.choices?.[0]?.message?.content || finalResponse,
      });
    }

    // Si no hubo tool calls y se pidió streaming
    if (options.stream) {
      const directStream = await (ai as any).run(selectedModel, {
        messages: currentMessages,
        stream: true,
        max_tokens: 2048,
      });

      return new Response(directStream as ReadableStream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
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
