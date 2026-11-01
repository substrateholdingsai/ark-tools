import { describe, expect, it, vi } from 'vitest';
import { handleBillingApiRequest } from './billingWebhook';
import type { Env } from '../../index';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ledger.arksystems.site',
};

describe('Billing Webhook — /api/billing/webhook (C-02)', () => {
  it('rechaza con 401 cuando el webhook secret no coincide', async () => {
    const env = {
      ENVIRONMENT: 'production',
      BILLING_WEBHOOK_SECRET: 'whsec_real_secret_123',
      ARK_TOOLS_DB: { prepare: vi.fn() } as any,
    } as unknown as Env;

    const req = new Request('https://ledger.arksystems.site/api/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'whsec_wrong_secret',
      },
      body: JSON.stringify({ status: 'approved', tenant_id: 'tenant-1' }),
    });

    const res = await handleBillingApiRequest(req, env, corsHeaders, null);
    expect(res?.status).toBe(401);
  });

  it('no activa la suscripción cuando el payload no trae un estado explícito de pago aprobado', async () => {
    const env = {
      ENVIRONMENT: 'development',
      BILLING_WEBHOOK_SECRET: 'whsec_dev_secret',
      ARK_TOOLS_DB: { prepare: vi.fn() } as any,
    } as unknown as Env;

    const req = new Request('https://ledger.arksystems.site/api/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'whsec_dev_secret',
      },
      body: JSON.stringify({ tenant_id: 'tenant-1' }),
    });

    const res = await handleBillingApiRequest(req, env, corsHeaders, null);
    expect(res?.status).toBe(200);
    const json = (await res?.json()) as any;
    expect(json.message).toContain('Evento de pago no relevante');
    expect(json.subscription).toBeUndefined();
  });

  it('retorna 400 cuando no se puede determinar el tenant_id en lugar de activar el tenant ark', async () => {
    const env = {
      ENVIRONMENT: 'development',
      BILLING_WEBHOOK_SECRET: 'whsec_dev_secret',
      ARK_TOOLS_DB: { prepare: vi.fn() } as any,
    } as unknown as Env;

    const req = new Request('https://ledger.arksystems.site/api/billing/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'whsec_dev_secret',
      },
      body: JSON.stringify({ status: 'approved' }),
    });

    const res = await handleBillingApiRequest(req, env, corsHeaders, null);
    expect(res?.status).toBe(400);
  });
});
