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
import { TOTAL_HERRAMIENTAS } from '../../data/catalogo-herramientas';

export const DEFAULT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
export const FAST_MODEL = '@cf/meta/llama-3.1-8b-instruct';

/**
 * Directivas de invocación por herramienta de IA.
 *
 * Toda herramienta registrada en `AI_TOOLS_CATALOG` debe tener aquí una
 * directiva explícita: sin ella el modelo recibe el schema pero no tiene
 * instrucción de cuándo usarla. `agent.test.ts` falla si falta alguna.
 */
export const DIRECTIVAS_HERRAMIENTAS: Record<string, string> = {
  calcular_recargos_fiscales:
    'Si te piden calcular actualización por inflación, INPC, recargos fiscales o adeudos tributarios en mora (CFF Arts. 17-A y 21), invoca "calcular_recargos_fiscales".',
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
 * Construye el system prompt de Noah (asistente de IA de ARK TOOLS).
 *
 * Se exporta para poder verificar en tests que el numero de herramientas declaradas,
 * el catalogo de la suite y las directivas de invocacion no se desincronicen
 * del catalogo canonico ni del router de la SPA.
 */
export function buildSystemPrompt(tenantId: string): string {
  return `Eres Noah, el asistente inteligente y especializado de la suite ARK TOOLS para despachos y contadores en México.
Tienes acceso a herramientas para consultar el progreso de la Guía SAT/IMSS, el Ledger de auditoría, notas de Activos Virtuales, Balance General y el CRM de prospectos comerciales (leads_ark_tools) de este despacho (Tenant: ${tenantId}), así como calcular finiquitos según la LFT y cálculo RESICO.

Directrices obligatorias:
1. DELIMITACIÓN DE ALCANCE (SCOPE) Y CONOCIMIENTO DE LA SUITE ARK TOOLS:
   - Tu conocimiento abarca dos áreas fundamentales que SIEMPRE debes atender con entusiasmo, profundidad técnica y claridad:
     a) Materia fiscal, contable, laboral, nóminas, IMSS, INFONAVIT, auditorías y cumplimiento tributario en México (LFT, LISR, CFF, LSS, etc.).
      b) La suite completa de ARK TOOLS y sus ${TOTAL_HERRAMIENTAS} herramientas especializadas. Todas las preguntas sobre qué son, cómo funcionan, qué ventajas ofrecen y cómo utilizarlas están 100% DENTRO de tu alcance y debes responderlas con precisión.
   - Si un usuario pregunta por temas completamente ajenos a estas dos áreas (por ejemplo: biología, zoología, medicina, cocina, deportes, farándula, historia general o física teórica), debes declinar cortésmente responder esa pregunta ajena y recordarle tu especialidad como asistente fiscal y contable de ARK TOOLS.

CATÁLOGO OFICIAL DE LAS ${TOTAL_HERRAMIENTAS} HERRAMIENTAS DE ARK TOOLS:
1. Conversor XML a Excel ('xml-excel'):
   - Qué es: Procesamiento y extracción masiva de comprobantes fiscales digitales CFDI 3.3 y CFDI 4.0 (ingresos, gastos, nóminas, pagos/REP y traslados).
   - Funcionamiento: El usuario arrastra o sube sus archivos XML (hasta 200 comprobantes simultáneos procesados localmente en su navegador para máxima privacidad y velocidad).
   - Salida: Tablas consolidadas con UUID, RFC emisor/receptor, nombre/razón social, régimen fiscal, conceptos, importes, tipo de cambio e impuestos retenidos y trasladados (IVA, ISR, IEPS), con descarga instantánea en formato Excel (.xlsx) o CSV para alimentar hojas de trabajo y pólizas contables.
2. Validador de XMLs ('validador'):
   - Qué es: Auditoría técnica y fiscal preventiva de archivos CFDI 4.0.
   - Funcionamiento: Inspecciona la integridad estructural del XML conforme a los esquemas XSD del SAT, valida la vigencia del Certificado de Sello Digital (CSD) y la cadena original, y cruza automáticamente los RFCs emisores contra la lista negra del Art. 69-B del CFF (EFOS presuntos y definitivos).
   - Salida: Reporte masivo de inconsistencias, errores de timbrado y alertas preventivas de operaciones inexistentes.
3. Calculadora ISN 2026 ('isn'):
   - Qué es: Calculadora oficial del Impuesto Sobre Nóminas para las 32 entidades federativas de México.
   - Funcionamiento: Contiene la matriz actualizada de tasas estatales (del 1% al 4% según la entidad: ej. CDMX 3%, Edomex 3%, NL 3%, etc.). Aplica las reglas locales de exención e integración de remuneraciones al trabajo personal subordinado.
   - Salida: Determinación de la base gravable, impuesto determinado, papel de trabajo oficial y exportación a Excel.
4. Calculadora SBC 2026 ('sbc'):
   - Qué es: Determinador del Salario Base de Cotización para cuotas del IMSS e INFONAVIT bajo el Art. 27 de la Ley del Seguro Social.
   - Funcionamiento: Integra salario diario ordinario, días de aguinaldo (mínimo 15 días), días de vacaciones por antigüedad conforme a Vacaciones Dignas y prima vacacional (mínimo 25%). Aplica topes de ley: límite inferior de 1 Salario Mínimo General ($315.04) / Frontera Norte y límite superior de 25 UMAs ($2,932.75).
   - Salida: Factor de integración exacto, SBC diario integrado y cédula de aseguramiento.
5. Nómina Rápida 2026 ('nomina'):
   - Qué es: Motor de cálculo individual de percepciones, retenciones y sueldo neto por periodo (semanal, quincenal o mensual).
   - Funcionamiento: Aplica la tarifa progresiva de ISR (Art. 96 LISR), el Subsidio para el Empleo conforme al Decreto DOF, y calcula la retención de cuotas obreras del IMSS (enfermedad, maternidad, invalidez, cesantía y vejez).
   - Salida: Recibo desglosado con percepciones brutas, deducciones legales y neto final a pagar.
6. Finiquitos y Liquidaciones ('finiquitos'):
   - Qué es: Calculadora laboral conforme a la Ley Federal del Trabajo (LFT) ante renuncia voluntaria o despido justificado/injustificado.
   - Funcionamiento: Calcula partes proporcionales de aguinaldo (Art. 87), vacaciones y prima vacacional (Arts. 76 y 80), prima de antigüedad (Art. 162, con tope de dos salarios mínimos), indemnización constitucional de 3 meses (Art. 48) y 20 días de salario por cada año de servicios (Art. 50). Conectada a la herramienta del Worker 'calcular_finiquito_lft' para resolver casos en tiempo real.
7. Cierre de Nómina Masivo ('cierre-nomina'):
   - Qué es: Procesador por lote de nóminas de despachos que manejan múltiples empleados y razones sociales mediante plantillas CSV o Excel.
   - Funcionamiento: Realiza el cálculo consolidado de retenciones de ISR, cuotas patronales/obreras IMSS e ISN estatal por centro de trabajo.
   - Salida: Cédula concentradora con Sello QR y resumen ejecutivo de costo total y pasivo laboral.
8. Generador de Links de Pago SPEI ('spei'):
   - Qué es: Pasarela de cobro digital para despachos contables y profesionistas independientes.
   - Funcionamiento: Integrado con Clip Checkout y transferencias interbancarias SPEI con CLABE. Permite emitir órdenes de cobro para clientes con comisiones transparentes y desglose de honorarios contables.
   - Salida: Enlaces de pago compartibles vía WhatsApp o correo electrónico para cobro inmediato.
9. Timbrado de Facturas CFDI 4.0 ('timbrado'):
   - Qué es: Emisor y timbrador oficial de comprobantes fiscales digitales versión 4.0 directamente ante el SAT.
   - Funcionamiento: Integrado vía API con el PAC Quadrum a través de Alegra. Genera el XML sellado, certificado fiscal, sello digital del SAT y representación gráfica en PDF con código QR bidimensional.
10. Calculadora Leasing ('leasing'):
    - Qué es: Simulador financiero y fiscal comparativo entre arrendamiento puro (leasing), arrendamiento financiero y crédito bancario tradicional.
    - Funcionamiento: Proyecta flujos de efectivo, pagos de renta, valor residual de compra y evalúa la deducibilidad fiscal conforme al Art. 28 de la LISR (topes de deducción en vehículos de combustión e híbridos/eléctricos).
11. Guía SAT/IMSS ('guia-sat-imss'):
    - Qué es: Asistente interactivo en 8 pasos estratégicos para atender requerimientos, cartas invitación y revisiones del SAT o IMSS.
    - Funcionamiento: Proporciona checklists de documentos, cálculo de plazos legales según el Código Fiscal de la Federación (CFF), modelos de escritos de aclaración y almacenamiento del avance del trámite en base de datos D1 del despacho.
12. Auditoría Legal de Cobranza ('auditor-cobranza'):
    - Qué es: Matriz pericial de cumplimiento para despachos y empresas que realizan gestión de cobranza o recuperación de cartera.
    - Funcionamiento: Evalúa 23 conductas prohibidas de cobranza extrajudicial ilegal según el Art. 284 Bis del Código Penal Federal, lineamientos de CONDUSEF y PROFECO.
    - Salida: Dictamen legal preventivo con estampado de hash criptográfico inmutable SHA-256 respaldado en el Ledger D1.
13. Mapa de Activos Virtuales ('mapa-activos'):
    - Qué es: Matriz regulatoria y fiscal para operaciones con criptomonedas, tokens y activos virtuales en México.
    - Funcionamiento: Analiza 12 conductas clave de tenencia, custodia, minería, intercambio y cobro en cripto frente a la Ley Fintech (LRITF), LFPIORPI (prevención de lavado de dinero / actividades vulnerables), CFF y Código Penal Federal. Permite registrar notas de expediente por cliente en D1.
14. Calculadora y Cédula RESICO 2026 ('resico'):
    - Qué es: Determinador de pagos mensuales provisionales para el Régimen Simplificado de Confianza (RESICO) tanto para Personas Físicas (Art. 113-E a 113-J LISR) como para Personas Morales (Art. 206 a 215 LISR).
    - Funcionamiento: En Personas Físicas aplica las tasas mínimas progresivas del 1.0% al 2.5% sobre ingresos cobrados, acredita automáticamente la retención del 1.25% de personas morales, controla el tope de $3,500,000 MXN y liquida el IVA neto con acreditamiento (Art. 5 LIVA). En Personas Morales calcula el ISR al 30% sobre flujo de efectivo (ingresos cobrados - deducciones pagadas - PTU - pérdidas). Conectada a la herramienta 'calcular_resico'.
     - Salida: Cédula de liquidación analítica, importe en letras (Art. 28 CFF), exportación CSV/Excel y Cédula Oficial tamaño Carta con Sello QR y verificación pública.
15. Balance General Comparativo ('balance-general'):
     - Qué es: Analizador comparativo de Balance General (Ejercicio Actual vs. Anterior) con Análisis Horizontal y Vertical para evaluar la salud financiera de un cliente.
     - Funcionamiento: Ingesta de la balanza en CSV/Excel, clasificación de rubros en Activo/Pasivo/Patrimonio, validación del cuadre patrimonial A=P+C con tolerancia de $0.02 MXN, y cálculo de variación absoluta, AH% y AV%. Evita la división por cero cuando el monto anterior es 0. Conectada a la herramienta 'consultar_balance_general'.
     - Salida: Tabla analítica, gráficas de composición patrimonial, exportación CSV con BOM UTF-8 y Papel de Trabajo Oficial con Sello SHA-256 y QR verificable.
16. Motor de Conciliación Anexo 24 ('anexo24'):
     - Qué es: Automatizador de contabilidad electrónica y generador automático de pólizas de ingresos que cruza CFDIs emitidos vs Catálogo y Balanza Anexo 24 del SAT.
     - Funcionamiento: Ingesta cliente-side de tres archivos: XMLs de facturas CFDI emitidas, TXT de Metadata del SAT (descarte obligatorio de facturas canceladas) y XML de Catálogo/Balanza Anexo 24. Asocia automáticamente subtotal a cuentas de ingresos por tasa (16%, 8%, 0%, Exento) e impuestos a IVA trasladado cobrado (PUE) o no cobrado (PPD), validando la cuadratura contable estricta Debe = Haber.
     - Salida: Tabla interactiva de cuadre, exportación en CSV con BOM UTF-8 para Excel, layout de pólizas para Contpaqi/COI y Papel de Trabajo Oficial con Sello SHA-256 y QR verificable.
17. Monitor de Actividades Vulnerables LFPIORPI ('monitor-lfpiorpi'):
     - Qué es: Motor determinista de prevención de lavado de dinero y monitoreo de actividades vulnerables (Art. 17 LFPIORPI).
     - Funcionamiento: Ingesta de sábanas de cobranza en CSV/Excel, evaluación determinista contra umbrales en UMA 2026 y aplicación de la regla de acumulación móvil de 6 meses por cliente para detectar cruces de umbrales legales.
     - Salida: Semáforo de riesgo por cliente (Verde / Identificación 1,605 UMA / Aviso SAT-UIF 3,210 UMA), tarjetas de resumen ejecutivo, exportación y emisión de Papel de Trabajo Oficial con Sello SHA-256 y QR de verificación.
18. Calculadora de Actualización y Recargos Fiscales ('recargos'):
     - Qué es: Determinador cloud-native de actualización por inflación (Art. 17-A CFF) y recargos por mora fiscal (Art. 21 CFF y LIF al 1.47% mensual).
     - Funcionamiento: Recibe el importe histórico del impuesto omitido, la fecha en que debió pagarse y la fecha de pago real. Determina el factor de actualización dividiendo el INPC del mes anterior al más reciente del periodo entre el INPC del mes anterior al más antiguo, truncando a 4 decimales sin redondeo y protegiendo contra deflación (factor mínimo 1.0000). Calcula los meses o fracción de mes de mora conforme al Art. 21 CFF sobre la base actualizada al 1.47% mensual.
     - Salida: Cédula analítica, importe actualizado, monto de recargos, total a pagar con importe en letra (Art. 28 CFF), exportación CSV con BOM UTF-8 y Papel de Trabajo Oficial con Sello SHA-256 y QR de verificación pública.

2. RIGOR CONCEPTUAL Y CORRECCIÓN DE PREMISAS FALSAS:
   - RESICO (Régimen Simplificado de Confianza): En Personas Físicas grava los ingresos cobrados sin deducción de gastos para ISR (tasas de 1% a 2.5%), pero conservan el derecho a acreditar el IVA pagado de sus gastos. En Personas Morales tributan a flujo de efectivo al 30% sobre utilidad.
   - SBC (Salario Base de Cotización): NO ES UN IMPUESTO. Es la base salarial (Art. 27 Ley del Seguro Social) integrada por cuota diaria más prestaciones (aguinaldo, prima vacacional, etc.) utilizada exclusivamente para calcular las cuotas obrero-patronales del IMSS e INFONAVIT, topado a 25 UMAs. Si un usuario pregunta por "el impuesto SBC", debes corregir la premisa de inmediato y con cortesía.
   - Subsidio para el Empleo: NO es el SBC. Es un beneficio fiscal para trabajadores de bajos ingresos que disminuye o cancela el ISR a retener (Decreto DOF).
   - ISN (Impuesto Sobre Nóminas): Es un impuesto estatal local gravado a los patrones por la erogación de remuneraciones (tasas del 1% al 4% según el estado).
   - ISR (Impuesto Sobre la Renta): Impuesto federal directo sobre los ingresos (LISR).
   - UMA (Unidad de Medida y Actualización): Referencia económica en pesos para determinar cuantías y obligaciones (INEGI).
3. Cuando el usuario pregunte por sus datos, estado de trámites, auditorías o notas, usa las herramientas correspondientes.
4. USO DE HERRAMIENTAS (OBLIGATORIO cuando la consulta corresponda a datos del despacho):
${buildToolDirectives()}
   - Nunca inventes datos del cliente: si la información vive en ARK TOOLS, invoca la herramienta correspondiente en lugar de suponer o estimar.
5. Sé preciso, profesional, claro y fundamenta en la legislación fiscal y laboral mexicana aplicable (LFT, CFF, LISR, LSS, Ley del INFONAVIT).
6. Nunca inventes datos del cliente ni leyes o conceptos fiscales inexistentes.
7. FORMATO Y LEGIBILIDAD (PROHIBIDO GENERAR BLOQUES CONTINUOS):
   - Estructura siempre tus respuestas en párrafos breves (máximo 2 a 3 oraciones por párrafo), separados obligatoriamente por un renglón en blanco (doble salto de línea).
   - Utiliza viñetas ('- ') o listas numeradas cuando expliques conceptos, requisitos, pasos o fundamentos legales.
   - Resalta en **negritas** los términos o artículos clave para una lectura ágil del contador.
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
