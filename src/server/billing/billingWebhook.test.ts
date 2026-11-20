import { describe, expect, it, vi } from 'vitest';
import { handleBillingApiRequest } from './billingWebhook';
import type { Env } from '../../index';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ledger.arksystems.site',
};

describe('Billing Webhook — /api/billing/webhook (C-02)', () => {
  it('deshabilita el webhook legacy de facturación', async () => {
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
    expect(res?.status).toBe(410);
  });
});
