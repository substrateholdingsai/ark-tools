/**
 * ARK LEDGER — Webhook de Facturación y Activación Automática (Clip / SPEI)
 *
 * Expone endpoints:
 * - POST /api/billing/webhook  (Activación automática ante pagos aprobados de Clip / SPEI)
 * - GET  /api/billing/status   (Consulta de estatus Pro y vigencia para la SPA)
 * - POST /api/billing/manual-activate (Activación manual para Super Admin)
 */

import type { Env } from '../../index';
import type { AuthPrincipal } from '../auth';
import { getTenantSubscription, activateProSubscription } from './subscriptions';

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

  // ─────────────────────────────────────────────────────────────────
  // GET /api/billing/status?tenant_id=...
  // ─────────────────────────────────────────────────────────────────
  if (url.pathname === '/api/billing/status' && request.method === 'GET') {
    const tenantId =
      url.searchParams.get('tenant_id') || request.headers.get('x-tenant-id') || 'ark';

    const isSuperAdmin = authPrincipal?.platformRole === 'super_admin';
    const sub = await getTenantSubscription(env, tenantId, isSuperAdmin);

    return Response.json(
      {
        ok: true,
        subscription: sub,
        is_pro: sub.isPro,
        plan: sub.plan,
        payment_url: 'https://pago.clip.mx/v3/bc5ff8d9-dacb-4f36-b006-78d0348bbb65',
      },
      { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /api/billing/webhook (Activación automática de pagos)
  // ─────────────────────────────────────────────────────────────────
  if (url.pathname === '/api/billing/webhook' && request.method === 'POST') {
    try {
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

      // Manejar formato Clip o formato genérico
      const isApproved =
        body.status === 'approved' ||
        body.status === 'paid' ||
        body.status === 'COMPLETED' ||
        body.event === 'payment.approved' ||
        !body.status; // si mandan payload directo de activación

      if (!isApproved) {
        return Response.json(
          { ok: true, message: 'Evento de pago no relevante o pendiente.' },
          { headers: corsHeaders }
        );
      }

      // Resolver tenant_id: desde payload o buscando usuario por correo
      let tenantId = body.tenant_id;
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
        tenantId = 'ark'; // Fallback a tenant principal
      }

      const monto = Number(body.amount || body.monto || 399);
      const extId =
        body.payment_id || body.reference || `PAY-${Date.now().toString(36).toUpperCase()}`;
      const provider = body.provider || 'clip';

      const result = await activateProSubscription(env, {
        tenantId,
        billingProvider: provider,
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

  // ─────────────────────────────────────────────────────────────────
  // POST /api/billing/manual-activate (Solo Super Admin)
  // ─────────────────────────────────────────────────────────────────
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
