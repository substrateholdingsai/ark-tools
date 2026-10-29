import { describe, it, expect, vi } from 'vitest';
import { handleBillingApiRequest } from './billingWebhook';
import { getTenantSubscription, activateProSubscription } from './subscriptions';
import type { Env } from '../../index';

function createMockEnv(overrides: Partial<Env> = {}): Env {
  const dbRunMock = vi.fn().mockResolvedValue({ success: true });
  const dbFirstMock = vi.fn().mockResolvedValue(null);
  const dbBindMock = vi.fn().mockReturnValue({
    run: dbRunMock,
    first: dbFirstMock,
    all: vi.fn().mockResolvedValue({ results: [] }),
  });
  const dbPrepareMock = vi.fn().mockReturnValue({ bind: dbBindMock, run: dbRunMock });

  return {
    ASSETS: {} as any,
    ENVIRONMENT: 'development',
    APP_NAME: 'ARK LEDGER',
    APP_VERSION: '1.0.0',
    APP_URL: 'https://ledger.arksystems.site',
    COMPANY_NAME: 'Substrate Holdings LLC',
    COMPANY_EMAIL: 'pavel@arksystems.site',
    SUPPORT_URL: 'https://wa.me/525657062511',
    ARK_TOOLS_DB: {
      prepare: dbPrepareMock,
    } as any,
    ...overrides,
  };
}

describe('ARK LEDGER — Sistema de Suscripciones y Facturación Pro', () => {
  describe('Servicio de Suscripciones (subscriptions.ts)', () => {
    it('otorga estatus Pro permanente a CANACO Mérida y Super Admin', async () => {
      const env = createMockEnv();
      const subCanaco = await getTenantSubscription(env, 'canaco_merida', false);
      expect(subCanaco.isPro).toBe(true);
      expect(subCanaco.plan).toBe('pro');

      const subSuperAdmin = await getTenantSubscription(env, 'cualquier_tenant', true);
      expect(subSuperAdmin.isPro).toBe(true);
      expect(subSuperAdmin.plan).toBe('enterprise');
    });

    it('retorna plan Free por defecto para tenants sin suscripción', async () => {
      const env = createMockEnv();
      const sub = await getTenantSubscription(env, 'despacho_nuevo', false);
      expect(sub.isPro).toBe(false);
      expect(sub.plan).toBe('free');
    });

    it('activa suscripción Pro, actualiza ai_usage y genera vigencia de 30 días', async () => {
      const env = createMockEnv();
      const res = await activateProSubscription(env, {
        tenantId: 'despacho_perez',
        billingProvider: 'clip',
        monto: 399,
        externalId: 'CLIP-TRANS-12345',
      });

      expect(res.success).toBe(true);
      expect(res.subscription.isPro).toBe(true);
      expect(res.subscription.plan).toBe('pro');
      expect(res.subscription.billingProvider).toBe('clip');
      expect(res.subscription.currentPeriodEnd).toBeDefined();
    });
  });

  describe('Endpoints de Facturación (billingWebhook.ts)', () => {
    it('GET /api/billing/status retorna estatus y link de pago Clip', async () => {
      const env = createMockEnv();
      const req = new Request(
        'https://ledger.arksystems.site/api/billing/status?tenant_id=despacho_demo',
        {
          method: 'GET',
        }
      );

      const res = await handleBillingApiRequest(req, env, {}, null);
      expect(res).not.toBeNull();
      expect(res?.status).toBe(200);

      const json = (await res?.json()) as any;
      expect(json.ok).toBe(true);
      expect(json.payment_url).toContain('clip.mx');
    });

    it('POST /api/billing/webhook procesa pago aprobado de Clip y activa la suscripción', async () => {
      const env = createMockEnv();
      const payload = {
        event: 'payment.approved',
        status: 'approved',
        tenant_id: 'despacho_peninsular',
        amount: 399,
        payment_id: 'CLIP-PAY-998877',
        provider: 'clip',
      };

      const req = new Request('https://ledger.arksystems.site/api/billing/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await handleBillingApiRequest(req, env, {}, null);
      expect(res?.status).toBe(200);

      const json = (await res?.json()) as any;
      expect(json.ok).toBe(true);
      expect(json.subscription.isPro).toBe(true);
      expect(json.subscription.tenantId).toBe('despacho_peninsular');
    });

    it('POST /api/billing/manual-activate permite a Super Admin activar un despacho', async () => {
      const env = createMockEnv();
      const superAdminPrincipal = {
        id: 'user_admin',
        email: 'pavel@arksystems.site',
        fullName: 'Pavel Gómez',
        platformRole: 'super_admin' as const,
      };

      const req = new Request('https://ledger.arksystems.site/api/billing/manual-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: 'despacho_invitado', dias: 90 }),
      });

      const res = await handleBillingApiRequest(req, env, {}, superAdminPrincipal);
      expect(res?.status).toBe(200);

      const json = (await res?.json()) as any;
      expect(json.ok).toBe(true);
      expect(json.subscription.isPro).toBe(true);
    });

    it('POST /api/billing/manual-activate rechaza usuarios sin rol Super Admin', async () => {
      const env = createMockEnv();
      const memberPrincipal = {
        id: 'user_member',
        email: 'member@despacho.com',
        fullName: 'Miembro Despacho',
        platformRole: 'user' as const,
      };

      const req = new Request('https://ledger.arksystems.site/api/billing/manual-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: 'despacho_1' }),
      });

      const res = await handleBillingApiRequest(req, env, {}, memberPrincipal);
      expect(res?.status).toBe(403);
    });
  });
});
