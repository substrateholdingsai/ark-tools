/**
 * Cliente interno para consumir el contrato de pagos de Caja.
 * Fail-closed: timeout, 4xx/5xx o respuesta sin caja_order_id -> { ok:false } sin persistir.
 */

import type { Env } from '../../index';

export interface CajaOrderRequest {
  tenant_id: string;
  user_id?: string | null;
  concept: 'canaco_membership' | 'ark_pro_upgrade';
  amount_cents: number;
  currency: 'MXN';
  rail_preference: 'codi' | 'spei' | 'paypal';
  metadata?: Record<string, unknown>;
  callback_url: string;
  idempotency_key: string;
}

export interface CajaOrderResponse {
  ok: true;
  caja_order_id: string;
  rail_selected?: 'codi' | 'spei' | 'paypal';
  checkout_url?: string;
  paypal_order_id?: string;
  status?: string;
  expires_at?: number;
  [key: string]: unknown;
}

export interface CajaError {
  ok: false;
  error: string;
  status?: number;
  detail?: unknown;
}

export type CreateCajaOrderResult = CajaOrderResponse | CajaError;

export async function createCajaOrder(
  env: Env,
  params: CajaOrderRequest
): Promise<CreateCajaOrderResult> {
  const baseUrl = env.CAJA_WORKER_URL?.trim();
  const internalKey = env.CAJA_PAYMENTS_INTERNAL_KEY?.trim();
  if (!baseUrl || !internalKey) {
    return { ok: false, error: 'caja_not_configured' };
  }

  const timeoutMs = (() => {
    const raw = (env as any).CAJA_TIMEOUT_MS;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 10000;
  })();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/internal/payments/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Caja-Internal-Key': internalKey,
        'X-Caja-Client-Id': 'ledger',
        'Idempotency-Key': params.idempotency_key,
      },
      body: JSON.stringify({
        tenant_id: params.tenant_id,
        user_id: params.user_id ?? null,
        concept: params.concept,
        amount_cents: params.amount_cents,
        currency: params.currency,
        rail_preference: params.rail_preference,
        metadata: params.metadata || {},
        callback_url: params.callback_url,
      }),
      signal: controller.signal,
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (res.status !== 200 && res.status !== 201) {
      return { ok: false, error: 'caja_http_error', status: res.status, detail: data };
    }

    const cajaOrderId = data?.caja_order_id;
    if (!cajaOrderId || typeof cajaOrderId !== 'string') {
      return { ok: false, error: 'caja_missing_order_id', status: res.status, detail: data };
    }

    return { ok: true, ...(data as Record<string, unknown>), caja_order_id: cajaOrderId };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { ok: false, error: 'caja_timeout' };
    }
    return { ok: false, error: 'caja_request_failed', detail: err?.message || String(err) };
  } finally {
    clearTimeout(timeoutId);
  }
}
