import type { Env } from '../../index';
import type { AuthPrincipal } from '../auth';
import { getTenantSubscription, activateProSubscription } from './subscriptions';
import { timingSafeEqual } from '../canacoConektaService';
import { getBillingConfig, getPaymentsProvider } from '../../config/billing';
import { processCajaWebhookRequest } from '../caja/cajaWebhook';

/**
 * Billing API:
 * - GET /api/billing/status
 * - POST /api/billing/webhook (legacy Clip/SPEI) o delegación a Caja según PAYMENTS_PROVIDER
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
    const provider = getPaymentsProvider(env);
    const hasCajaSig = Boolean(
      request.headers.get('X-Caja-Signature') || request.headers.get('x-caja-signature')
    );

    if (provider === 'caja') {
      // Modo caja: solo webhooks firmados de Caja; no activar vía legacy.
      return processCajaWebhookRequest(request, env, corsHeaders);
    }

    if (provider === 'shadow' && hasCajaSig) {
      // Shadow: Caja registra sin activar (cajaWebhook respeta provider!=caja). No caer a legacy.
      return processCajaWebhookRequest(request, env, corsHeaders);
    }

    // legacy, o shadow sin firma Caja: flujo legacy intacto (shadow permite que legacy active).
    try {
      const webhookSecret = env.BILLING_WEBHOOK_SECRET || env.CLIP_API_SECRET;
      if (webhookSecret) {
        const authHeader =
          request.headers.get('Authorization') ||
          request.headers.get('X-Webhook-Secret') ||
          request.headers.get('x-webhook-secret') ||
          '';
        const tokenCandidate = authHeader.startsWith('Bearer ')
          ? authHeader.slice(7).trim()
          : authHeader.trim();
        if (!tokenCandidate || !timingSafeEqual(tokenCandidate, webhookSecret)) {
          return Response.json(
            { ok: false, error: 'Firma o secreto de webhook de facturación inválido.' },
            { status: 401, headers: corsHeaders }
          );
        }
      } else if (env.ENVIRONMENT === 'production') {
        return Response.json(
          { ok: false, error: 'Webhook de facturación no configurado en producción.' },
          { status: 503, headers: corsHeaders }
        );
      }

      const body = (await request.json().catch(() => ({}))) as {
        event?: string;
        status?: string;
        tenant_id?: string;
        email?: string;
        amount?: number;
        monto?: number;
        payment_id?: string;
        reference?: string;
        provider?: 'clip' | 'spei_arkangel' | 'manual';
      };

      const isApproved =
        body.status === 'approved' ||
        body.status === 'paid' ||
        body.status === 'COMPLETED' ||
        body.event === 'payment.approved';

      if (!isApproved) {
        return Response.json(
          { ok: true, message: 'Evento de pago no relevante o pendiente.' },
          { headers: corsHeaders }
        );
      }

      let tenantId = body.tenant_id?.trim();
      const email = body.email?.trim().toLowerCase();

      if (!tenantId && email && env.ARK_TOOLS_DB) {
        const userRow = await env.ARK_TOOLS_DB.prepare(
          `SELECT u.id, tm.tenant_id 
           FROM users u 
           LEFT JOIN tenant_memberships tm ON u.id = tm.user_id 
           WHERE LOWER(u.email) = ? 
           LIMIT 1`
        )
          .bind(email)
          .first<{ id: string; tenant_id: string | null }>();

        tenantId = userRow?.tenant_id || userRow?.id;
      }

      if (!tenantId) {
        return Response.json(
          {
            ok: false,
            error: 'No se pudo identificar el despacho (tenant_id) para acreditar el pago.',
          },
          { status: 400, headers: corsHeaders }
        );
      }

      const cfg = getBillingConfig(env);
      const monto = Number(body.amount || body.monto || cfg.proPriceMxn);
      const extId =
        body.payment_id || body.reference || `PAY-${Date.now().toString(36).toUpperCase()}`;
      const providerBody = body.provider || 'clip';

      const result = await activateProSubscription(env, {
        tenantId,
        billingProvider: providerBody,
        externalId: extId,
        monto,
        email,
      });

      return Response.json(
        {
          ok: true,
          message: 'Suscripción activada exitosamente.',
          subscription: result.subscription,
        },
        { status: 200, headers: corsHeaders }
      );
    } catch (err: any) {
      console.error('[Billing Webhook Error]:', err);
      return Response.json(
        { ok: false, error: err.message || 'Error al procesar webhook de facturación.' },
        { status: 500, headers: corsHeaders }
      );
    }
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
