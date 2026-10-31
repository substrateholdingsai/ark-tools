/**
-- ARK LEDGER — Integración Edge con Sentinela Legal (RegTech)
--
-- Receptor de webhooks y API de consulta para alertas regulatorias del DOF,
-- SAT, CONDUSEF, CNBV y BANXICO despachadas por el worker sentinela-legal.
*/

import type { Env } from '../../index';

export interface SentinelaWebhookPayload {
  event: 'regulatory.update_detected' | string;
  timestamp: string;
  data: {
    id: string;
    channel: 'fiscal' | 'laboral' | 'cobranza' | 'fintech_banca' | string;
    source: string;
    source_url?: string;
    severity: 'critico' | 'alto' | 'medio' | 'bajo' | string;
    title: string;
    effective_date?: string;
    summary: string;
    laws_affected?: string[];
    action_required?: string;
  };
}

export interface StoredRegulatoryEvent {
  id: string;
  channel: string;
  source: string;
  source_url: string | null;
  severity: string;
  title: string;
  summary: string;
  effective_date: string | null;
  laws_affected: string[];
  action_required: string | null;
  created_at: string;
  read_status: number;
}

/**
 * Calcula la firma HMAC-SHA256 en formato hexadecimal usando Web Crypto.
 */
export async function calculateHmacSha256Hex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Valida la firma enviada por Sentinela en la cabecera 'X-Sentinela-Signature'.
 * Formato esperado: sha256=<hex> o <hex>
 */
export async function verifySentinelaSignature(
  secret: string,
  rawBody: string,
  headerValue: string | null | undefined
): Promise<boolean> {
  if (!secret || !headerValue) return false;
  const signatureHex = headerValue.startsWith('sha256=')
    ? headerValue.slice(7).trim()
    : headerValue.trim();

  const expectedHex = await calculateHmacSha256Hex(secret, rawBody);
  if (signatureHex.length !== expectedHex.length) return false;

  // Comparación en tiempo constante
  let diff = 0;
  for (let i = 0; i < signatureHex.length; i++) {
    diff |= signatureHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Procesa y almacena un evento regulatorio proveniente de Sentinela.
 */
export async function storeRegulatoryEvent(
  db: D1Database,
  eventData: SentinelaWebhookPayload['data']
): Promise<void> {
  const lawsJson = JSON.stringify(eventData.laws_affected ?? []);

  await db
    .prepare(
      `INSERT INTO sentinela_events (
        id, channel, source, source_url, severity, title, summary,
        effective_date, laws_affected, action_required, created_at, read_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)
      ON CONFLICT(id) DO UPDATE SET
        channel = excluded.channel,
        source = excluded.source,
        source_url = excluded.source_url,
        severity = excluded.severity,
        title = excluded.title,
        summary = excluded.summary,
        effective_date = excluded.effective_date,
        laws_affected = excluded.laws_affected,
        action_required = excluded.action_required`
    )
    .bind(
      eventData.id,
      eventData.channel,
      eventData.source,
      eventData.source_url ?? null,
      eventData.severity,
      eventData.title,
      eventData.summary,
      eventData.effective_date ?? null,
      lawsJson,
      eventData.action_required ?? null
    )
    .run();
}

/**
 * Consulta la lista de eventos regulatorios almacenados en D1.
 */
export async function listStoredRegulatoryEvents(
  db: D1Database,
  options: {
    channel?: string;
    severity?: string;
    limit?: number;
  } = {}
): Promise<StoredRegulatoryEvent[]> {
  const conds: string[] = [];
  const binds: any[] = [];

  if (options.channel) {
    conds.push('channel = ?');
    binds.push(options.channel);
  }
  if (options.severity) {
    conds.push('severity = ?');
    binds.push(options.severity);
  }

  const whereClause = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  binds.push(limit);

  const query = `
    SELECT * FROM sentinela_events
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ?
  `;

  const rows = await db
    .prepare(query)
    .bind(...binds)
    .all<any>();
  return (rows.results ?? []).map((row) => {
    let laws: string[] = [];
    try {
      laws = JSON.parse(row.laws_affected || '[]');
    } catch {
      laws = [];
    }
    return {
      id: row.id,
      channel: row.channel,
      source: row.source,
      source_url: row.source_url,
      severity: row.severity,
      title: row.title,
      summary: row.summary,
      effective_date: row.effective_date,
      laws_affected: laws,
      action_required: row.action_required,
      created_at: row.created_at,
      read_status: row.read_status ?? 0,
    };
  });
}

/**
 * Enrutador principal para los endpoints de Sentinela en ARK LEDGER.
 * - POST /api/webhooks/sentinela
 * - GET  /api/regulatory/events
 */
export async function handleSentinelaApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  const url = new URL(request.url);

  // ─────────────────────────────────────────────────────────────────
  // 1. RECEPTOR DE WEBHOOKS: POST /api/webhooks/sentinela
  // ─────────────────────────────────────────────────────────────────
  if (url.pathname === '/api/webhooks/sentinela' && request.method === 'POST') {
    const rawBody = await request.text();

    // Verificación criptográfica HMAC-SHA256 (si el secreto está configurado)
    if (env.SENTINELA_WEBHOOK_SECRET) {
      const signatureHeader =
        request.headers.get('X-Sentinela-Signature') ||
        request.headers.get('x-sentinela-signature');

      const isValid = await verifySentinelaSignature(
        env.SENTINELA_WEBHOOK_SECRET,
        rawBody,
        signatureHeader
      );

      if (!isValid) {
        return Response.json(
          { error: 'Firma de webhook de Sentinela inválida o ausente.' },
          { status: 401, headers: corsHeaders }
        );
      }
    }

    let payload: SentinelaWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return Response.json(
        { error: 'Payload JSON inválido.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!payload?.data?.id || !payload?.data?.title || !payload?.data?.channel) {
      return Response.json(
        { error: 'Estructura de evento regulatorio incompleta (id, title, channel requeridos).' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (env.ARK_TOOLS_DB) {
      try {
        await storeRegulatoryEvent(env.ARK_TOOLS_DB, payload.data);
      } catch (err: any) {
        console.error('Error almacenando evento de Sentinela en D1:', err);
        return Response.json(
          { error: 'Error persistiendo evento regulatorio en D1.', detalle: err?.message },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    return Response.json(
      {
        ok: true,
        message: 'Evento regulatorio recibido y procesado exitosamente por ARK LEDGER.',
        event_id: payload.data.id,
        channel: payload.data.channel,
        severity: payload.data.severity,
      },
      { status: 200, headers: corsHeaders }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. CONSULTA DE EVENTOS: GET /api/regulatory/events
  // ─────────────────────────────────────────────────────────────────
  if (url.pathname === '/api/regulatory/events' && request.method === 'GET') {
    if (!env.ARK_TOOLS_DB) {
      return Response.json(
        { ok: true, events: [], total: 0, note: 'D1 no configurado en este entorno.' },
        { headers: corsHeaders }
      );
    }

    try {
      const channel = url.searchParams.get('channel') || undefined;
      const severity = url.searchParams.get('severity') || undefined;
      const limitParam = url.searchParams.get('limit');
      const limit = limitParam ? parseInt(limitParam, 10) : 20;

      const events = await listStoredRegulatoryEvents(env.ARK_TOOLS_DB, {
        channel,
        severity,
        limit,
      });

      return Response.json(
        {
          ok: true,
          total: events.length,
          events,
        },
        {
          headers: {
            ...corsHeaders,
            'Cache-Control': 'public, max-age=60, s-maxage=120',
          },
        }
      );
    } catch (err: any) {
      console.error('Error listando eventos regulatorios:', err);
      return Response.json(
        { error: 'Error consultando eventos regulatorios en D1.', detalle: err?.message },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  return null;
}
