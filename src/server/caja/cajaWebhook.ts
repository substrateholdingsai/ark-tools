import type { Env } from '../../index';
import { timingSafeEqual } from '../canacoConektaService';
import { activateProSubscription } from '../billing/subscriptions';
import { getPaymentsProvider, getProPrice, type ProTier } from '../../config/billing';
import { activateCanacoSocioByPayment } from '../canacoLifecycle';
import { logStayPuftAudit } from '../staypuft/staypuftConnector';

/**
 * Webhook entrante de Caja: POST /api/webhooks/caja
 * Firma: HMAC-SHA256 hex sobre el body crudo con CAJA_WEBHOOK_SECRET.
 * Headers: X-Caja-Signature, X-Caja-Timestamp. Anti-replay ±300s.
 * Idempotencia: billing_webhook_events.external_id = event_id (0011:8, UNIQUE).
 * Fail-closed en firma inválida, timeout/ausencia de timestamp, o datos insuficientes.
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
  paid_at?: string;
  metadata?: Record<string, any>;
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

function getProTierFromAmountCents(env: Env, amountCents: number): ProTier | null {
  if (!Number.isInteger(amountCents)) return null;
  if (amountCents === Math.round(getProPrice(env, 'tier_1') * 100)) return 'tier_1';
  if (amountCents === Math.round(getProPrice(env, 'tier_2') * 100)) return 'tier_2';
  return null;
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
  rawBody: string,
  signature: string
): Promise<boolean> {
  const expected = await hmacSha256Hex(secret, rawBody);
  return timingSafeEqual(signature, expected);
}

function isCajaTimestampFresh(timestamp: string): boolean {
  if (!/^\d+$/.test(timestamp)) return false;
  const tsNum = Number(timestamp);
  if (!Number.isSafeInteger(tsNum) || tsNum <= 0) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return Math.abs(nowSec - tsNum) <= 300;
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

  if (!isCajaTimestampFresh(timestamp)) {
    await auditInvalidCajaSignature(env, timestamp, null, 'invalid_or_stale_timestamp');
    return Response.json(
      { ok: false, error: 'Timestamp de webhook inválido o fuera de ventana.' },
      { status: 401, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  const rawBody = await request.text();
  const valid = await verifyCajaSignature(secret, rawBody, signature);
  if (!valid) {
    await auditInvalidCajaSignature(env, timestamp, null, 'invalid_signature');
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
  if (!eventId) {
    return Response.json(
      { ok: false, error: 'event_id requerido.' },
      { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  const cajaOrderId = asString(payload.caja_order_id);
  const tenantId = asString(payload.tenant_id);
  const amountCents = asNumber(payload.amount_cents);
  const currencyRaw = asString(payload.currency);
  const currency = currencyRaw ? currencyRaw.toUpperCase() : '';
  const rail = (payload.rail ?? null) as CajaRail | null;
  const concept = asString(payload.concept);
  const metadata = payload.metadata;

  if (!currency || currency !== 'MXN') {
    return Response.json(
      { ok: false, error: 'currency requerida y debe ser MXN.' },
      { status: 422, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

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

  if (cajaOrderId) {
    const storedOrder = await db
      .prepare(
        `SELECT tenant_id, amount_cents, currency, concept
         FROM payment_orders
         WHERE caja_order_id = ?
         LIMIT 1`
      )
      .bind(cajaOrderId)
      .first<{
        tenant_id: string | null;
        amount_cents: number | null;
        currency: string | null;
        concept: string | null;
      }>();

    if (!storedOrder) {
      await markBillingEventFailed(db, eventRowId, 'payment_order_not_found');
      return Response.json(
        { ok: false, error: 'Orden de pago Caja no encontrada.' },
        { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    if (storedOrder.tenant_id && tenantId && storedOrder.tenant_id !== tenantId) {
      await markBillingEventFailed(db, eventRowId, 'tenant_mismatch');
      return Response.json(
        { ok: false, error: 'El tenant de la orden no coincide.' },
        { status: 422, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    if (
      storedOrder.amount_cents != null &&
      Number.isFinite(amountCents) &&
      storedOrder.amount_cents !== amountCents
    ) {
      await markBillingEventFailed(db, eventRowId, 'amount_mismatch');
      return Response.json(
        { ok: false, error: 'El importe de la orden no coincide.' },
        { status: 422, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    if (storedOrder.currency && storedOrder.currency.toUpperCase() !== currency) {
      await markBillingEventFailed(db, eventRowId, 'currency_mismatch');
      return Response.json(
        { ok: false, error: 'La moneda de la orden no coincide.' },
        { status: 422, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    if (storedOrder.concept && concept && storedOrder.concept !== concept) {
      await markBillingEventFailed(db, eventRowId, 'concept_mismatch');
      return Response.json(
        { ok: false, error: 'El concepto de la orden no coincide.' },
        { status: 422, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
  }

  if (eventType === 'event.paid' || eventType === 'order.paid') {
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
        const tier = getProTierFromAmountCents(env, amountCents);
        if (!tier) {
          await markBillingEventFailed(db, eventRowId, 'amount_cents no coincide con un tier Pro');
          return Response.json(
            { ok: false, error: 'El importe no coincide con un tier Ark Pro válido.' },
            { status: 422, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
          );
        }
        const result = await activateProSubscription(env, {
          tenantId,
          billingProvider: 'caja',
          tier,
          externalId: cajaOrderId || eventId,
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
        await activateCanacoSocioByPayment(env.ARK_TOOLS_DB!, {
          provider: 'caja',
          signatureVerified: true,
          eventType: 'order.paid',
          leadId: leadId || '',
          intentId: intentId || '',
          transactionReference: ext,
          eventId,
          amountCents: amountCents,
          currency: currency,
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
