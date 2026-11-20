import type { Env } from '../../index';
import type { AuthPrincipal } from '../auth';
import { getTenantSubscription, activateProSubscription } from './subscriptions';
import { getBillingConfig } from '../../config/billing';

/**
 * Billing API:
 * - GET /api/billing/status
 * - POST /api/billing/webhook (legacy Clip/SPEI) o delegaci�n a Caja seg�n PAYMENTS_PROVIDER
 * - POST /api/billing/manual-activate
 */
export async function handleBillingApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  authPrincipal: AuthPrincipal | null
): Promise<Response | null> {
  const url = new URL(request.url);

  if (!url.pathname.startsWith('/api/billing')) {
    return null;
  }

  if (url.pathname === '/api/billing/status' && request.method === 'GET') {
    const tenantId =
      url.searchParams.get('tenant_id') || request.headers.get('x-tenant-id') || 'ark';

    const isSuperAdmin = authPrincipal?.platformRole === 'super_admin';
    const sub = await getTenantSubscription(env, tenantId, isSuperAdmin);
    const cfg = getBillingConfig(env);

    return Response.json(
      {
        ok: true,
        subscription: sub,
        is_pro: sub.isPro,
        plan: sub.plan,
        payment_url: cfg.paymentUrl,
      },
      { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  if (url.pathname === '/api/billing/webhook' && request.method === 'POST') {
    return Response.json(
      { ok: false, error: 'Webhook de facturaci�n legacy deshabilitado; usar Caja.' },
      { status: 410, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  if (url.pathname === '/api/billing/manual-activate' && request.method === 'POST') {
    if (authPrincipal?.platformRole !== 'super_admin') {
      return Response.json(
        { error: 'Se requieren permisos de Super Admin.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      tenant_id?: string;
      email?: string;
      dias?: number;
    };

    if (!body.tenant_id?.trim()) {
      return Response.json(
        { error: 'tenant_id es requerido.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await activateProSubscription(env, {
      tenantId: body.tenant_id.trim(),
      billingProvider: 'manual',
      tier: 'tier_1',
      externalId: `ADMIN-OVERRIDE-${Date.now().toString(36).toUpperCase()}`,
      monto: 0,
      email: body.email,
      duracionDias: body.dias || 365,
    });

    return Response.json(
      {
        ok: true,
        message: 'Plan Pro activado manualmente por Super Admin.',
        subscription: result.subscription,
      },
      { headers: corsHeaders }
    );
  }

  return Response.json({ error: 'Endpoint no encontrado.' }, { status: 404, headers: corsHeaders });
}
