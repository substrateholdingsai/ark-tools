import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../src/index';
import { createCajaOrder } from '../src/server/caja/cajaClient';
import { processCajaWebhookRequest } from '../src/server/caja/cajaWebhook';
import { handleCanacoConektaApiRequest } from '../src/server/canacoConektaService';

const mocked = vi.hoisted(() => ({
  activatePro: vi.fn(),
  activateCanaco: vi.fn(),
  audit: vi.fn(),
}));

vi.mock('../src/server/billing/subscriptions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/server/billing/subscriptions')>()),
  activateProSubscription: mocked.activatePro,
}));

vi.mock('../src/server/canacoLifecycle', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/server/canacoLifecycle')>()),
  activateCanacoSocioByPayment: mocked.activateCanaco,
}));

vi.mock('../src/server/staypuft/staypuftConnector', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/server/staypuft/staypuftConnector')>()),
  logStayPuftAudit: mocked.audit,
}));

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ledger.arksystems.site',
};

async function hmacSignature(secret: string, rawBody: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function makeLead(numEmpleados = 15) {
  return {
    id: 'lead-caja-1',
    web: 'https://example.test',
    whatsapp: '9999999999',
    email: 'pagos@example.test',
    ciudad: 'Mérida',
    especialidad: 'comercio',
    status: 'Registrado',
    lifecycle_stage: 'registrado',
    canonical_rfc: 'CPM2106158A1',
    contacto_nombre: 'Comercializadora del Mayab',
    notas:
      'Razón Social: COMERCIALIZADORA DEL MAYAB | Folio SIEM: SIEM-MID-2026-CPM2-PEQ-4242 | Empleados: 15',
    num_empleados: numEmpleados,
  };
}

function makeDb(options: { existingEvent?: boolean; employees?: number } = {}) {
  const lead = makeLead(options.employees);
  return {
    prepare: vi.fn((query: string) => {
      const statement = {
        bind: vi.fn(() => statement),
        first: vi.fn(async () => {
          if (query.includes('SELECT id FROM billing_webhook_events')) {
            return options.existingEvent ? { id: 'event-row-1' } : null;
          }
          if (query.includes('INSERT INTO auth_rate_limits')) return { attempts: 1 };
          if (query.includes('SELECT id, order_id, checkout_url')) return null;
          if (query.includes('SELECT id, web, whatsapp')) return lead;
          return null;
        }),
        run: vi.fn(async () => ({ success: true, meta: { changes: 1 } })),
      };
      return statement;
    }),
    batch: vi.fn(async (statements: unknown[]) =>
      statements.map(() => ({ success: true, meta: { changes: 1 } }))
    ),
  };
}

function makeEnv(provider: 'legacy' | 'shadow' | 'caja', db: ReturnType<typeof makeDb>) {
  return {
    APP_URL: 'https://ledger.arksystems.site',
    PAYMENTS_PROVIDER: provider,
    CAJA_WEBHOOK_SECRET: 'caja-webhook-secret',
    CAJA_WORKER_URL: 'https://caja.example.test',
    CAJA_PAYMENTS_INTERNAL_KEY: 'internal-key',
    ARK_TOOLS_DB: db,
    DB: db,
    CONEKTA_PRIVATE_KEY: 'conekta-key',
    CONEKTA_ENVIRONMENT: 'production',
    CANACO_PRICING_CONFIRMED: 'true',
    PRO_PRICE_MXN_TIER_1: '399',
    PRO_PRICE_MXN_TIER_2: '499',
  } as unknown as Env;
}

async function cajaWebhookRequest(
  payload: Record<string, unknown>,
  options: { signature?: string; timestamp?: string; secret?: string } = {}
) {
  const rawBody = JSON.stringify(payload);
  const timestamp = options.timestamp ?? String(Math.floor(Date.now() / 1000));
  const signature =
    options.signature ?? (await hmacSignature(options.secret ?? 'caja-webhook-secret', rawBody));
  return new Request('https://ledger.arksystems.site/api/webhooks/caja', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Caja-Signature': signature,
      'X-Caja-Timestamp': timestamp,
    },
    body: rawBody,
  });
}

function paidPayload(concept: string) {
  return {
    event_id: `evt-${crypto.randomUUID()}`,
    event_type: 'event.paid',
    caja_order_id: 'caja-order-1',
    tenant_id: 'tenant-1',
    amount_cents: 39900,
    currency: 'MXN',
    rail: 'codi',
    concept,
    paid_at: new Date().toISOString(),
    metadata: {
      lead_id: 'lead-caja-1',
      intent_id: 'intent-caja-1',
    },
  };
}

beforeEach(() => {
  mocked.activatePro.mockReset().mockResolvedValue({
    success: true,
    subscription: { tenantId: 'tenant-1', plan: 'pro' },
  });
  mocked.activateCanaco.mockReset().mockResolvedValue({ activated: true, replay: false });
  mocked.audit.mockReset().mockResolvedValue({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Pagos Caja — webhook y cliente', () => {
  it('rechaza una firma HMAC inválida', async () => {
    const request = await cajaWebhookRequest(paidPayload('ark_pro_upgrade'), {
      signature: '0'.repeat(64),
    });
    const response = await processCajaWebhookRequest(
      request,
      makeEnv('caja', makeDb()),
      corsHeaders
    );

    expect(response.status).toBe(401);
    expect(mocked.audit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'security.caja_webhook_invalid_signature' })
    );
  });

  it('rechaza un timestamp fuera de la ventana anti-replay', async () => {
    const request = await cajaWebhookRequest(paidPayload('ark_pro_upgrade'), {
      timestamp: String(Math.floor(Date.now() / 1000) - 301),
    });
    const response = await processCajaWebhookRequest(
      request,
      makeEnv('caja', makeDb()),
      corsHeaders
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ ok: false });
  });

  it('verifica la firma contra el body crudo sin prefijar el timestamp', async () => {
    const payload = { event_id: 'evt-raw-body', event_type: 'order.ignored' };
    const request = await cajaWebhookRequest(payload);
    const response = await processCajaWebhookRequest(
      request,
      makeEnv('caja', makeDb()),
      corsHeaders
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ignored: true });
  });

  it('activa una suscripción Pro con event.paid en modo caja', async () => {
    const response = await processCajaWebhookRequest(
      await cajaWebhookRequest(paidPayload('ark_pro_upgrade')),
      makeEnv('caja', makeDb()),
      corsHeaders
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ activated: true, kind: 'ark_pro_upgrade' });
    expect(mocked.activatePro).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ billingProvider: 'caja', tenantId: 'tenant-1' })
    );
  });

  it('activa Ark Pro Tier 1 con amount_cents 39900', async () => {
    const payload = { ...paidPayload('ark_pro_upgrade'), event_type: 'order.paid' };
    const response = await processCajaWebhookRequest(
      await cajaWebhookRequest(payload),
      makeEnv('caja', makeDb()),
      corsHeaders
    );

    expect(response.status).toBe(200);
    expect(mocked.activatePro).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tier: 'tier_1' })
    );
  });

  it('activa Ark Pro Tier 2 con amount_cents 49900', async () => {
    const payload = {
      ...paidPayload('ark_pro_upgrade'),
      event_type: 'order.paid',
      amount_cents: 49900,
    };
    const response = await processCajaWebhookRequest(
      await cajaWebhookRequest(payload),
      makeEnv('caja', makeDb()),
      corsHeaders
    );

    expect(response.status).toBe(200);
    expect(mocked.activatePro).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tier: 'tier_2' })
    );
  });

  it('activa una membresía CANACO con event.paid en modo caja', async () => {
    const response = await processCajaWebhookRequest(
      await cajaWebhookRequest(paidPayload('canaco_membership')),
      makeEnv('caja', makeDb()),
      corsHeaders
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ activated: true, kind: 'canaco_socio' });
    expect(mocked.activateCanaco).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        signatureVerified: true,
        leadId: 'lead-caja-1',
        intentId: 'intent-caja-1',
        transactionReference: 'caja-order-1',
      })
    );
  });

  it('responde idempotente sin reactivar un evento ya registrado', async () => {
    const response = await processCajaWebhookRequest(
      await cajaWebhookRequest(paidPayload('ark_pro_upgrade')),
      makeEnv('caja', makeDb({ existingEvent: true })),
      corsHeaders
    );

    expect(await response.json()).toMatchObject({ ok: true, idempotent: true });
    expect(mocked.activatePro).not.toHaveBeenCalled();
    expect(mocked.activateCanaco).not.toHaveBeenCalled();
  });

  it('registra pero no activa pagos de Caja durante shadow', async () => {
    const response = await processCajaWebhookRequest(
      await cajaWebhookRequest(paidPayload('ark_pro_upgrade')),
      makeEnv('shadow', makeDb()),
      corsHeaders
    );

    expect(await response.json()).toMatchObject({
      ok: true,
      activated: false,
      reason: 'shadow_or_legacy_mode',
    });
    expect(mocked.activatePro).not.toHaveBeenCalled();
  });

  it('acepta HTTP 201 al crear una orden nueva en Caja', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      Response.json(
        { caja_order_id: 'caja-new', checkout_url: 'https://pay.example/new' },
        { status: 201 }
      )
    );

    const result = await createCajaOrder(makeEnv('caja', makeDb()), {
      tenant_id: 'canaco_merida',
      concept: 'canaco_membership',
      amount_cents: 200000,
      currency: 'MXN',
      rail_preference: 'codi',
      callback_url: 'https://ledger.arksystems.site/api/webhooks/caja',
      idempotency_key: 'idem-new',
    });

    expect(result).toMatchObject({ ok: true, caja_order_id: 'caja-new' });
  });

  it('acepta HTTP 200 para una orden idempotente en Caja', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      Response.json({ caja_order_id: 'caja-existing', status: 'pending' }, { status: 200 })
    );

    const result = await createCajaOrder(makeEnv('caja', makeDb()), {
      tenant_id: 'tenant-1',
      concept: 'ark_pro_upgrade',
      amount_cents: 39900,
      currency: 'MXN',
      rail_preference: 'codi',
      callback_url: 'https://ledger.arksystems.site/api/webhooks/caja',
      idempotency_key: 'idem-existing',
    });

    expect(result).toMatchObject({ ok: true, caja_order_id: 'caja-existing' });
  });

  it('preserva paypal_order_id sin exigir checkout_url para PayPal', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      Response.json(
        {
          caja_order_id: 'caja-paypal',
          paypal_order_id: 'paypal-order-1',
          rail_selected: 'paypal',
        },
        { status: 201 }
      )
    );

    const result = await createCajaOrder(makeEnv('caja', makeDb()), {
      tenant_id: 'canaco_merida',
      concept: 'canaco_membership',
      amount_cents: 1200000,
      currency: 'MXN',
      rail_preference: 'paypal',
      callback_url: 'https://ledger.arksystems.site/api/webhooks/caja',
      idempotency_key: 'idem-paypal',
    });

    expect(result).toMatchObject({ ok: true, paypal_order_id: 'paypal-order-1' });
    expect(result).not.toHaveProperty('checkout_url');
  });
});

describe('Pagos Caja — provider CANACO', () => {
  it('mantiene Conekta como único creador de checkout en legacy', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        Response.json({ id: 'conekta-legacy', checkout: { url: 'https://checkout.test/legacy' } })
      );
    const response = await handleCanacoConektaApiRequest(
      new Request('https://ledger.arksystems.site/api/canaco/conekta/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ leadId: 'lead-caja-1', metodoPago: 'tarjeta' }),
      }),
      makeEnv('legacy', makeDb()),
      corsHeaders
    );

    expect(await response?.json()).toMatchObject({ ok: true, orderId: 'conekta-legacy' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0][0])).toContain('api.conekta.io');
  });

  it('crea en Caja y Conekta en shadow, pero devuelve Conekta', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (String(input).includes('api.conekta.io')) {
        return Response.json({
          id: 'conekta-primary',
          checkout: { url: 'https://checkout.test/primary' },
        });
      }
      return Response.json(
        { caja_order_id: 'caja-shadow', checkout_url: 'https://caja.test/shadow' },
        { status: 201 }
      );
    });
    const response = await handleCanacoConektaApiRequest(
      new Request('https://ledger.arksystems.site/api/canaco/conekta/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ leadId: 'lead-caja-1', metodoPago: 'spei' }),
      }),
      makeEnv('shadow', makeDb()),
      corsHeaders
    );

    expect(await response?.json()).toMatchObject({ ok: true, orderId: 'conekta-primary' });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const cajaCall = fetchSpy.mock.calls.find(([url]) => String(url).includes('caja.example.test'));
    expect(JSON.parse(String(cajaCall?.[1]?.body))).toMatchObject({ rail_preference: 'codi' });
  });

  it('usa Caja exclusivamente y selecciona PayPal sólo para montos mayores a $8k', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        Response.json(
          { caja_order_id: 'caja-primary', paypal_order_id: 'paypal-primary' },
          { status: 201 }
        )
      );
    const response = await handleCanacoConektaApiRequest(
      new Request('https://ledger.arksystems.site/api/canaco/conekta/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ leadId: 'lead-caja-1', metodoPago: 'paypal' }),
      }),
      makeEnv('caja', makeDb({ employees: 500 })),
      corsHeaders
    );
    const result = await response?.json();

    expect(result).toMatchObject({
      ok: true,
      orderId: 'caja-primary',
      paypalOrderId: 'paypal-primary',
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toMatchObject({
      rail_preference: 'paypal',
    });
  });

  it('ignora webhooks Conekta en modo caja antes de validar su firma', async () => {
    const response = await handleCanacoConektaApiRequest(
      new Request('https://ledger.arksystems.site/api/canaco/conekta/webhook', {
        method: 'POST',
        body: JSON.stringify({ id: 'evt-conekta', type: 'order.paid' }),
      }),
      makeEnv('caja', makeDb()),
      corsHeaders
    );

    expect(response?.status).toBe(200);
    expect(await response?.json()).toMatchObject({
      ok: true,
      ignored: true,
      provider: 'caja',
    });
  });
});
