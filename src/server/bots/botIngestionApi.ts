/**
 * ARK LEDGER & CLOUDFLARE PIPELINE — Ingesta y Clasificación de Bots (Grok / Hermes)
 *
 * Endpoint dedicado montado sobre Hono para recibir payloads de agentes autónomos y bots:
 * - Grok (xAI)
 * - Hermes (Nous Research / OpenRouter)
 * - Bots genéricos / Webhooks de automatización
 *
 * Implementa clasificación inteligente en el borde (Edge) mediante Workers AI
 * (Llama) con fallback determinista, encolamiento condicional (Queues) y
 * persistencia inmutable en Cloudflare D1 con sellado criptográfico SHA-256.
 *
 * Filosofía "Modo Sarita":
 * La interfaz de usuario permanece sumamente limpia (1-click: "Iniciar Recordatorio Masivo").
 * La ingesta de nuevos machotes, plantillas y HTMLs no exige código para usuarios no técnicos:
 * Sarita envía sus documentos a pavel@arksystems.site y el pipeline backend los procesa.
 */

import { Hono } from 'hono';
import type { Env } from '../../index';

export type BotSource = 'grok' | 'hermes' | 'nous_research' | 'generic_agent' | 'sarita_pipeline';

export type BotPayloadCategory =
  | 'comprobante_pago'
  | 'datos_fiscales'
  | 'texto_legal'
  | 'plantilla_contenido'
  | 'consulta_general';

export interface BotClassificationResult {
  categoria: BotPayloadCategory;
  confianza: number;
  resumen: string;
  datos_extraidos: {
    rfc?: string;
    razon_social?: string;
    monto?: number;
    folio_rastreo?: string;
    fecha?: string;
    banco_origen?: string;
    metodo?: string;
    regimen_fiscal?: string;
    asunto_legal?: string;
    plantilla_tipo?: string;
    campos_personalizados?: Record<string, any>;
  };
}

export interface IngestRequestBody {
  bot?: string;
  source?: BotSource;
  tenant_id?: string;
  text?: string;
  payload?: any;
  metadata?: Record<string, any>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidad Criptográfica: Sello SHA-256 inmutable
// ─────────────────────────────────────────────────────────────────────────────
export async function computeSha256(text: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return 'SHA256:' + hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Clasificador Rápido Determinista / Heurístico (Fallback si Workers AI no responde)
// ─────────────────────────────────────────────────────────────────────────────
export function classifyPayloadDeterministic(
  text: string,
  rawPayload: any
): BotClassificationResult {
  const fullText = (text + ' ' + JSON.stringify(rawPayload || {})).toLowerCase();

  // 1. Detección de RFC (Persona Moral: 3 letras + 6 dígitos + 3 homoclave; Persona Física: 4 letras + 6 dígitos + 3 homoclave)
  const rfcMatch = (text + ' ' + JSON.stringify(rawPayload || {})).match(
    /[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}/i
  );
  const rfc = rfcMatch ? rfcMatch[0].toUpperCase() : undefined;

  // 2. Detección de Monto
  const montoMatch = fullText.match(
    /\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|\b[0-9]{3,6}(?:\.[0-9]{2})?\b)\s*(?:mxn|pesos)?/
  );
  let monto: number | undefined;
  if (montoMatch && montoMatch[1]) {
    const parsed = parseFloat(montoMatch[1].replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) monto = parsed;
  }

  // 3. Comprobante de pago o transferencia SPEI
  if (
    fullText.includes('spei') ||
    fullText.includes('transferencia') ||
    fullText.includes('comprobante') ||
    fullText.includes('deposito') ||
    fullText.includes('folio de rastreo') ||
    fullText.includes('cuenta clabe') ||
    fullText.includes('liquidaci') ||
    (monto !== undefined && (fullText.includes('pago') || fullText.includes('cuota')))
  ) {
    const folioMatch = (text + ' ' + JSON.stringify(rawPayload || {})).match(
      /(?:folio|rastreo|referencia)[:\s#]+([A-Z0-9-]{6,25})/i
    );
    return {
      categoria: 'comprobante_pago',
      confianza: 0.95,
      resumen: `Comprobante de pago detectado${monto ? ` por $${monto} MXN` : ''}${rfc ? ` (${rfc})` : ''}`,
      datos_extraidos: {
        rfc,
        monto,
        folio_rastreo: folioMatch ? folioMatch[1] : undefined,
        metodo: fullText.includes('spei') ? 'SPEI' : 'Transferencia',
      },
    };
  }

  // 4. Datos fiscales / CSF
  if (
    fullText.includes('sat') ||
    fullText.includes('constancia de situacion fiscal') ||
    fullText.includes('csf') ||
    fullText.includes('regimen fiscal') ||
    fullText.includes('codigo postal') ||
    (rfc !== undefined && (fullText.includes('razon social') || fullText.includes('domicilio')))
  ) {
    return {
      categoria: 'datos_fiscales',
      confianza: 0.92,
      resumen: `Datos de identificación fiscal y registro de contribuyente (${rfc || 'RFC pendiente'})`,
      datos_extraidos: {
        rfc,
        regimen_fiscal: fullText.includes('resico')
          ? 'RESICO'
          : fullText.includes('general de ley')
            ? 'Régimen General PM'
            : undefined,
      },
    };
  }

  // 5. Plantilla / Machote de Contenido ("Modo Sarita")
  if (
    fullText.includes('machote') ||
    fullText.includes('plantilla') ||
    fullText.includes('asunto:') ||
    fullText.includes('estimado socio') ||
    fullText.includes('circular') ||
    fullText.includes('comunicado') ||
    fullText.includes('boletin') ||
    fullText.includes('html') ||
    fullText.includes('pavel@arksystems.site')
  ) {
    return {
      categoria: 'plantilla_contenido',
      confianza: 0.9,
      resumen: 'Plantilla de comunicación gremial o contenido institucional (Pipeline Modo Sarita)',
      datos_extraidos: {
        plantilla_tipo: fullText.includes('circular') ? 'Circular Gremial' : 'Correo Transaccional',
        asunto_legal: 'Comunicación oficial a socios de cámara',
      },
    };
  }

  // 6. Texto legal o regulatorio
  if (
    fullText.includes('articulo') ||
    fullText.includes('ley federal') ||
    fullText.includes('cff') ||
    fullText.includes('lisr') ||
    fullText.includes('lft') ||
    fullText.includes('siem') ||
    fullText.includes('dof')
  ) {
    return {
      categoria: 'texto_legal',
      confianza: 0.88,
      resumen: 'Documento legal, fundamentación regulatoria o dictamen jurídico DOF',
      datos_extraidos: {
        asunto_legal: 'Fundamentación regulatoria LFT / LISR / Ley de Cámaras',
      },
    };
  }

  // 7. Consulta general / Entrada de Agente
  return {
    categoria: 'consulta_general',
    confianza: 0.75,
    resumen: 'Consulta general o mensaje entrante de agente IA',
    datos_extraidos: {
      rfc,
      monto,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Clasificación Inteligente en el Edge con Workers AI (Llama 3.1 / 3.3)
// ─────────────────────────────────────────────────────────────────────────────
export async function classifyWithWorkersAi(
  env: Env,
  text: string,
  rawPayload: any
): Promise<BotClassificationResult> {
  const fallback = classifyPayloadDeterministic(text, rawPayload);

  if (!env.AI) {
    return fallback;
  }

  const prompt = `Eres el clasificador de payloads de ARK LEDGER en el Edge.
Analiza el siguiente texto recibido de un bot externo (Grok / Hermes) y responde ÚNICAMENTE con un JSON válido con la siguiente estructura:
{
  "categoria": "comprobante_pago" | "datos_fiscales" | "texto_legal" | "plantilla_contenido" | "consulta_general",
  "confianza": número entre 0.0 y 1.0,
  "resumen": "descripción de 1 línea",
  "datos_extraidos": {
    "rfc": "RFC si existe o null",
    "razon_social": "Nombre de empresa si existe o null",
    "monto": número o null,
    "folio_rastreo": "folio o null",
    "metodo": "SPEI / Tarjeta / null"
  }
}

Texto a analizar:
"""${text.slice(0, 1500)}"""`;

  try {
    const aiRes = (await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content:
            'Eres un clasificador JSON estricto. Solo devuelves JSON puro sin markdown ni explicaciones.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 350,
      temperature: 0.1,
    })) as { response?: string };

    if (aiRes && aiRes.response) {
      const cleaned = aiRes.response
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/, '')
        .trim();
      const parsed = JSON.parse(cleaned) as BotClassificationResult;
      if (parsed.categoria && parsed.resumen) {
        return {
          categoria: parsed.categoria,
          confianza: typeof parsed.confianza === 'number' ? parsed.confianza : 0.9,
          resumen: parsed.resumen,
          datos_extraidos: {
            ...fallback.datos_extraidos,
            ...parsed.datos_extraidos,
          },
        };
      }
    }
  } catch (err) {
    console.warn('[Bot Ingest AI] Fallback a clasificador determinista:', err);
  }

  return fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hono Router de Ingesta y Clasificación (Prefijo /api/bots)
// ─────────────────────────────────────────────────────────────────────────────
export const botApp = new Hono<{ Bindings: Env }>().basePath('/api/bots');

// GET /api/bots/health — Estado del servicio y directivas operativas
botApp.get('/health', (c) => {
  const env = c.env;
  return c.json({
    ok: true,
    service: 'ARK LEDGER — Bot & Agent Ingestion Pipeline',
    status: 'operational',
    edge_ai: Boolean(env.AI),
    d1_ready: Boolean(env.ARK_TOOLS_DB),
    supported_bots: ['grok', 'hermes', 'nous_research', 'generic_agent', 'sarita_pipeline'],
    modo_sarita: {
      activo: true,
      descripcion:
        'Operación 1-click para usuarios no técnicos. Carga de machotes y plantillas gestionada vía pavel@arksystems.site.',
    },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/bots/ingest — Ingesta, clasificación y persistencia inmutable
botApp.post('/ingest', async (c) => {
  const env = c.env;
  const db = env.ARK_TOOLS_DB;

  // 1. Verificación opcional de Token de Bot si está configurado en entorno
  const botSecret = env.BOT_INGEST_SECRET;
  if (botSecret) {
    const authHeader =
      c.req.header('Authorization') ||
      c.req.header('X-Bot-Token') ||
      c.req.header('X-Agent-Secret');
    const expected = `Bearer ${botSecret}`;
    if (authHeader !== botSecret && authHeader !== expected) {
      return c.json({ error: 'Token de bot o agente no autorizado.' }, 401);
    }
  }

  // 2. Extracción de Payload
  let body: IngestRequestBody;
  let rawText = '';
  try {
    const contentType = c.req.header('Content-Type') || '';
    if (contentType.includes('application/json')) {
      body = await c.req.json<IngestRequestBody>();
      rawText =
        body.text ||
        (typeof body.payload === 'string' ? body.payload : JSON.stringify(body.payload || body));
    } else {
      rawText = await c.req.text();
      body = {
        bot: 'generic_agent',
        text: rawText,
      };
    }
  } catch (err: any) {
    return c.json({ error: 'Payload inválido o JSON malformado.', details: err.message }, 400);
  }

  if (!rawText.trim()) {
    return c.json({ error: 'El contenido del payload no puede estar vacío.' }, 400);
  }

  const botSource: BotSource = body.source || (body.bot as BotSource) || 'generic_agent';
  const tenantId = body.tenant_id || 'canaco_merida';
  const nowIso = new Date().toISOString();
  const payloadId = `BOT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // 3. Sello criptográfico inmutable SHA-256
  const selloSha256 = await computeSha256(rawText);

  // 4. Clasificación inteligente en el Edge (Workers AI con Llama o Fallback determinista)
  const classification = await classifyWithWorkersAi(env, rawText, body.payload);

  // 5. Encolamiento condicional (Cloudflare Queues si existe el binding)
  let queueEnqueued = false;
  if ((env as any).BOT_PAYLOADS_QUEUE) {
    try {
      await (env as any).BOT_PAYLOADS_QUEUE.send({
        payloadId,
        botSource,
        tenantId,
        classification,
        selloSha256,
        timestamp: nowIso,
      });
      queueEnqueued = true;
    } catch (qErr) {
      console.warn('[Bot Ingest] Falla al encolar en Queues:', qErr);
    }
  }

  // 6. Persistencia Inmutable en Cloudflare D1
  let d1Persisted = false;
  if (db) {
    try {
      // Asegurar existencia de tabla de auditoría para bots
      await db
        .prepare(
          `CREATE TABLE IF NOT EXISTS bot_payloads_log (
             id TEXT PRIMARY KEY,
             bot_source TEXT NOT NULL,
             categoria TEXT NOT NULL,
             confianza REAL DEFAULT 1.0,
             payload_raw TEXT NOT NULL,
             datos_extraidos TEXT NOT NULL,
             sello_sha256 TEXT NOT NULL,
             tenant_id TEXT DEFAULT 'canaco_merida',
             status TEXT DEFAULT 'procesado',
             created_at DATETIME DEFAULT CURRENT_TIMESTAMP
           )`
        )
        .run();

      // Guardar log inmutable
      await db
        .prepare(
          `INSERT INTO bot_payloads_log (id, bot_source, categoria, confianza, payload_raw, datos_extraidos, sello_sha256, tenant_id, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          payloadId,
          botSource,
          classification.categoria,
          classification.confianza,
          rawText.slice(0, 10000), // límite de seguridad
          JSON.stringify(classification.datos_extraidos),
          selloSha256,
          tenantId,
          'procesado'
        )
        .run();

      // Si es un comprobante de pago o datos fiscales y detectó RFC, actualizar/enlazar en leads_ark_tools
      const rfc = classification.datos_extraidos.rfc;
      if (
        rfc &&
        (classification.categoria === 'comprobante_pago' ||
          classification.categoria === 'datos_fiscales')
      ) {
        const leadExistente = await db
          .prepare(
            `SELECT id, notas FROM leads_ark_tools WHERE tenant_id = ? AND (notas LIKE ? OR web LIKE ?)`
          )
          .bind(tenantId, `%${rfc}%`, `%${rfc}%`)
          .first<{ id: string; notas: string | null }>();

        if (leadExistente) {
          const nuevaNota = `${leadExistente.notas || ''} | Bot ${botSource} [${classification.categoria}]: ${classification.resumen} (Sello ${selloSha256.slice(0, 18)})`;
          const nuevoStatus =
            classification.categoria === 'comprobante_pago' ? 'Socio Activo' : undefined;

          if (nuevoStatus) {
            await db
              .prepare(
                `UPDATE leads_ark_tools SET status = ?, notas = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
              )
              .bind(nuevoStatus, nuevaNota, leadExistente.id)
              .run();
          } else {
            await db
              .prepare(
                `UPDATE leads_ark_tools SET notas = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
              )
              .bind(nuevaNota, leadExistente.id)
              .run();
          }
        }
      }

      d1Persisted = true;
    } catch (dbErr) {
      console.error('[Bot Ingest D1 Error]:', dbErr);
    }
  }

  // 7. Respuesta estructurada
  return c.json(
    {
      success: true,
      payload_id: payloadId,
      bot: botSource,
      tenant_id: tenantId,
      classification,
      sello_sha256: selloSha256,
      d1_persisted: d1Persisted,
      queue_enqueued: queueEnqueued,
      timestamp: nowIso,
    },
    201
  );
});

// GET /api/bots/logs — Auditoría de payloads recibidos
botApp.get('/logs', async (c) => {
  const env = c.env;
  const db = env.ARK_TOOLS_DB;
  if (!db) {
    return c.json({ logs: [] });
  }

  try {
    const { results } = await db
      .prepare(
        `SELECT id, bot_source, categoria, confianza, datos_extraidos, sello_sha256, tenant_id, status, created_at 
         FROM bot_payloads_log 
         ORDER BY created_at DESC 
         LIMIT 50`
      )
      .all();

    return c.json({ logs: results || [] });
  } catch {
    return c.json({ logs: [] });
  }
});
