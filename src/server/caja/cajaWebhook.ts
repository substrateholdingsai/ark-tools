import type { Env } from '../../index';
import { timingSafeEqual } from '../canacoConektaService';
import { activateProSubscription } from '../billing/subscriptions';
import { getPaymentsProvider, getProPriceMxn } from '../../config/billing';
import { activateCanacoSocioByPayment } from '../canacoLifecycle';
import { logStayPuftAudit } from '../staypuft/staypuftConnector';

/**
 * Webhook entrante de Caja: POST /api/webhooks/caja
 * Firma: HMAC-SHA256 hex sobre `${timestamp}.${rawBody}` con CAJA_WEBHOOK_SECRET.
 * Headers: X-Caja-Signature, X-Caja-Timestamp. Anti-replay ±300s.
 * Idempotencia: billing_webhook_events.external_id = event_id (0011:8, UNIQUE).
 * Fail-closed en firma inválida, timeout/ausencia de timestamp, o datos insuficientes.
 *
 * CONFIRMAR CON CAJA: formato exacto de firma (asumido `${timestamp}.${rawBody}`),
 * validación de callback URL, y nombres/tipos de eventos CoDi.
 */

type CajaRail = 'codi' | 'spei' | 'paypal';

interface CajaWebhookPayload {
  event_id?: string;
  event_type?: string;
  caja_order_id?: string;
  tenant_id?: string;
  amount_cents?: number;
  currency?: string;
  rail?: CajaRail;
  concept?: string;
  tenant_name?: string;
  metadata?: Record<string, any>;
  data?: {
    caja_order_id?: string;
    tenant_id?: string;
    amount_cents?: number;
    rail?: CajaRail;
    concept?: string;
    tenant_name?: string;
    metadata?: Record<string, any>;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

function asString(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return null;
}

function asNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isProUpgradeConcept(concept: string | null, metadata?: Record<string, any>): boolean {
  const c = (concept || '').toLowerCase();
  if (c === 'ark_pro_upgrade' || c === 'pro_upgrade' || c === 'pro') return true;
  const m = (metadata?.concept || metadata?.kind || '').toString().toLowerCase();
  return m === 'ark_pro_upgrade' || m === 'pro_upgrade' || m === 'pro';
}

function isCanacoConcept(concept: string | null): boolean {
  const c = (concept || '').toLowerCase();
  return c === 'canaco_membership' || c === 'canaco_socio' || c === 'canaco';
}

async function auditInvalidCajaSignature(
  env: Env,
  timestamp: string | null,
  cajaOrderId: string | null,
  reason: string
): Promise<void> {
  try {
    await logStayPuftAudit(env, {
      action: 'security.caja_webhook_invalid_signature',
      method: 'POST',
      path: '/api/webhooks/caja',
      statusCode: 401,
      result: 'rejected',
      details: JSON.stringify({
        timestamp,
        caja_order_id: cajaOrderId,
        reason,
      }),
    });
  } catch {
    // best-effort
  }
  console.error('[CajaWebhook] firma inválida', { timestamp, caja_order_id: cajaOrderId, reason });
}

async function markBillingEventFailed(
  db: D1Database,
  eventRowId: string,
  reason: string
): Promise<void> {
  try {
    await db
      .prepare(`UPDATE billing_webhook_events SET status = 'error', error_reason = ? WHERE id = ?`)
      .bind(reason.slice(0, 500), eventRowId)
      .run();
  } catch {
    // no-op
  }
}

async function verifyCajaSignature(
  secret: string,
  timestamp: string,
  rawBody: string,
  signature: string
): Promise<boolean> {
  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tsNum) > 300) return false;
  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return timingSafeEqual(signature, expected);
}

export async function processCajaWebhookRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const secret = env.CAJA_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json(
      { ok: false, error: 'CAJA_WEBHOOK_SECRET no configurado.' },
      { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  const signature =
    request.headers.get('X-Caja-Signature') || request.headers.get('x-caja-signature');
  const timestamp =
    request.headers.get('X-Caja-Timestamp') || request.headers.get('x-caja-timestamp');
  if (!signature || !timestamp) {
    await auditInvalidCajaSignature(env, null, null, 'missing_headers');
    return Response.json(
      { ok: false, error: 'Firma o timestamp de webhook ausente.' },
      { status: 401, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  const rawBody = await request.text();
  const valid = await verifyCajaSignature(secret, timestamp, rawBody, signature);
  if (!valid) {
    await auditInvalidCajaSignature(env, timestamp, null, 'invalid_signature_or_replay');
    return Response.json(
      { ok: false, error: 'Firma de webhook inválida.' },
      { status: 401, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  let payload: CajaWebhookPayload;
  try {
    payload = JSON.parse(rawBody || '{}') as CajaWebhookPayload;
  } catch {
    return Response.json(
      { ok: false, error: 'JSON inválido.' },
      { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  const eventId = asString(payload.event_id);
  const eventType = asString(payload.event_type) || '';
  const data = payload.data || {};
  if (!eventId) {
    return Response.json(
      { ok: false, error: 'event_id requerido.' },
      { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  const cajaOrderId = asString(data.caja_order_id ?? payload.caja_order_id);
  const tenantId = asString(data.tenant_id ?? payload.tenant_id);
  const amountCents = asNumber(data.amount_cents ?? payload.amount_cents);
  const rail = (data.rail ?? payload.rail ?? null) as CajaRail | null;
  const concept = asString(data.concept ?? payload.concept);
  const metadata = (data.metadata ?? payload.metadata) as Record<string, any> | undefined;

  const db = env.ARK_TOOLS_DB;
  if (!db) {
    return Response.json(
      { ok: false, error: 'Base de datos no disponible.' },
      { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  const paymentsProvider = getPaymentsProvider(env);
  const shouldActivate = paymentsProvider === 'caja';

  const existing = await db
    .prepare('SELECT id FROM billing_webhook_events WHERE external_id = ? LIMIT 1')
    .bind(eventId)
    .first<{ id: string }>();
  if (existing) {
    return Response.json(
      { ok: true, idempotent: true, event_id: eventId },
      { status: 200, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  const eventRowId = crypto.randomUUID();
  try {
    await db
      .prepare(
        `INSERT INTO billing_webhook_events
         (id, provider, external_id, event_type, tenant_id, amount_mxn, status, caja_order_id, rail)
         VALUES (?, 'caja', ?, ?, ?, ?, 'processed', ?, ?)`
      )
      .bind(
        eventRowId,
        eventId,
        eventType || null,
        tenantId || null,
        Number.isFinite(amountCents) ? amountCents / 100 : null,
        cajaOrderId || null,
        rail
      )
      .run();
  } catch {
    const again = await db
      .prepare('SELECT id FROM billing_webhook_events WHERE external_id = ? LIMIT 1')
      .bind(eventId)
      .first<{ id: string }>();
    if (again) {
      return Response.json(
        { ok: true, idempotent: true, event_id: eventId },
        { status: 200, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    return Response.json(
      { ok: false, error: 'Error registrando evento.' },
      { status: 500, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  const nowSecTs = Math.floor(Date.now() / 1000);
  const database = db;

  async function updatePaymentOrderStatus(nextStatus: string, paid: boolean) {
    if (!cajaOrderId) return;
    try {
      await database
        .prepare(
          `UPDATE payment_orders
           SET status = ?, updated_at = ?, webhook_event_id = COALESCE(webhook_event_id, ?),
               paid_at = CASE WHEN ? = 1 THEN COALESCE(paid_at, ?) ELSE paid_at END
           WHERE caja_order_id = ?`
        )
        .bind(nextStatus, nowSecTs, eventId, paid ? 1 : 0, nowSecTs, cajaOrderId)
        .run();
    } catch {
      // no-op (tabla puede no existir si migración 0019 no aplicada)
    }
  }

  if (eventType === 'order.paid') {
    await updatePaymentOrderStatus('paid', true);

    const isProUpgrade = isProUpgradeConcept(concept, metadata);
    const isCanaco = isCanacoConcept(concept);

    if (!shouldActivate) {
      return Response.json(
        {
          ok: true,
          processed: true,
          activated: false,
          reason: 'shadow_or_legacy_mode',
          event_id: eventId,
        },
        { status: 200, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    if (isProUpgrade) {
      if (!tenantId) {
        await markBillingEventFailed(db, eventRowId, 'tenant_id faltante para ark_pro_upgrade');
        return Response.json(
          { ok: false, error: 'tenant_id requerido para activar Pro.' },
          { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }
      try {
        const monto = Number.isFinite(amountCents) ? amountCents / 100 : getProPriceMxn(env);
        const result = await activateProSubscription(env, {
          tenantId,
          billingProvider: 'caja',
          externalId: cajaOrderId || eventId,
          monto,
        });
        await updatePaymentOrderStatus('activated', true);
        return Response.json(
          { ok: true, activated: true, kind: 'ark_pro_upgrade', subscription: result.subscription },
          { status: 200, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      } catch (err: any) {
        await markBillingEventFailed(db, eventRowId, err?.message || 'activation_error');
        return Response.json(
          { ok: false, error: err?.message || 'Error activando suscripción Pro.' },
          { status: 500, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }
    }

    if (isCanaco) {
      try {
        const ext = cajaOrderId || eventId;
        const leadId = asString(metadata?.lead_id ?? metadata?.leadId);
        const intentId = asString(
          metadata?.intent_id ?? metadata?.intentId ?? metadata?.paymentIntentId
        );
        await activateCanacoSocioByPayment(env.DB!, {
          provider: 'conekta',
          signatureVerified: true,
          eventType: 'order.paid',
          leadId: leadId || '',
          intentId: intentId || '',
          transactionReference: ext,
          eventId,
          amountCents: amountCents,
          currency: 'MXN',
          environment: 'production',
          paidAt: asString(payload.paid_at) || new Date().toISOString(),
        });
        await updatePaymentOrderStatus('activated', true);
        return Response.json(
          { ok: true, activated: true, kind: 'canaco_socio', tenant_id: tenantId },
          { status: 200, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      } catch (err: any) {
        await markBillingEventFailed(db, eventRowId, err?.message || 'canaco_activation_error');
        return Response.json(
          { ok: false, error: err?.message || 'Error activando socio CANACO.' },
          { status: 500, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }
    }

    await updatePaymentOrderStatus('paid', true);
    return Response.json(
      { ok: true, activated: false, reason: 'unknown_concept' },
      { status: 200, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  if (
    eventType === 'order.failed' ||
    eventType === 'order.expired' ||
    eventType === 'order.refunded'
  ) {
    const map: Record<string, string> = {
      'order.failed': 'failed',
      'order.expired': 'expired',
      'order.refunded': 'refunded',
    };
    const next = map[eventType] || 'failed';
    await updatePaymentOrderStatus(next, false);
    return Response.json(
      { ok: true, processed: true, event_type: eventType, status: next },
      { status: 200, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  return Response.json(
    { ok: true, ignored: true, event_type: eventType },
    { status: 200, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
  );
}

export async function handleCajaWebhookRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== '/api/webhooks/caja' || request.method !== 'POST') {
    return null;
  }
  return processCajaWebhookRequest(request, env, corsHeaders);
}
