/**
 * ARK LEDGER — Servicio de Suscripciones y Gestión del Plan Pro
 *
 * Administra el ciclo de vida de membresías SaaS para despachos y organizaciones en D1:
 * - Consulta de estatus Pro / Enterprise
 * - Activación automática ante pagos Clip / SPEI
 * - Sincronización con ai_usage para desbloqueo inmediato de Noah AI
 */

import type { Env } from '../../index';

export type PlanType = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled';

export interface TenantSubscriptionInfo {
  tenantId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  isPro: boolean;
  billingProvider: string | null;
  currentPeriodEnd: string | null;
  montoMensual: number;
}

export interface ActivateProParams {
  tenantId: string;
  billingProvider?: 'clip' | 'spei_arkangel' | 'manual';
  externalId?: string;
  monto?: number;
  email?: string;
  duracionDias?: number;
}

/**
 * Consulta el estado de suscripción de un tenant en D1.
 * Si es Super Admin o tenant 'ark' o 'canaco_merida', otorga estatus Pro/Enterprise permanente.
 */
export async function getTenantSubscription(
  env: Env,
  tenantId: string,
  isSuperAdmin = false
): Promise<TenantSubscriptionInfo> {
  // Super Admin o tenants institucionales principales tienen Pro ilimitado
  if (isSuperAdmin || tenantId === 'canaco_merida' || tenantId === 'ark') {
    return {
      tenantId,
      plan: isSuperAdmin ? 'enterprise' : 'pro',
      status: 'active',
      isPro: true,
      billingProvider: 'institutional',
      currentPeriodEnd: '2099-12-31T23:59:59Z',
      montoMensual: 0,
    };
  }

  const db = env.ARK_TOOLS_DB;
  if (!db) {
    return {
      tenantId,
      plan: 'free',
      status: 'active',
      isPro: false,
      billingProvider: null,
      currentPeriodEnd: null,
      montoMensual: 0,
    };
  }

  try {
    const row = await db
      .prepare(
        `SELECT plan, status, billing_provider, external_id, monto_mensual, current_period_end 
         FROM tenant_subscriptions 
         WHERE tenant_id = ?`
      )
      .bind(tenantId)
      .first<{
        plan: string;
        status: string;
        billing_provider: string | null;
        external_id: string | null;
        monto_mensual: number;
        current_period_end: string | null;
      }>();

    if (!row) {
      // Verificar si tiene is_pro en ai_usage como fallback
      const aiUsageRow = await db
        .prepare(`SELECT is_pro FROM ai_usage WHERE tenant_id = ? ORDER BY period DESC LIMIT 1`)
        .bind(tenantId)
        .first<{ is_pro: number }>();

      const isProFallback = Boolean(aiUsageRow?.is_pro);

      return {
        tenantId,
        plan: isProFallback ? 'pro' : 'free',
        status: 'active',
        isPro: isProFallback,
        billingProvider: null,
        currentPeriodEnd: null,
        montoMensual: isProFallback ? 399 : 0,
      };
    }

    const isPro = (row.plan === 'pro' || row.plan === 'enterprise') && row.status === 'active';

    return {
      tenantId,
      plan: (row.plan as PlanType) || 'free',
      status: (row.status as SubscriptionStatus) || 'active',
      isPro,
      billingProvider: row.billing_provider,
      currentPeriodEnd: row.current_period_end,
      montoMensual: row.monto_mensual || (isPro ? 399 : 0),
    };
  } catch (err) {
    console.warn('[Subscriptions] Error al consultar D1:', err);
    return {
      tenantId,
      plan: 'free',
      status: 'active',
      isPro: false,
      billingProvider: null,
      currentPeriodEnd: null,
      montoMensual: 0,
    };
  }
}

/**
 * Activa o renueva la suscripción Pro en D1 y sincroniza con ai_usage.
 */
export async function activateProSubscription(
  env: Env,
  params: ActivateProParams
): Promise<{ success: boolean; subscription: TenantSubscriptionInfo }> {
  const db = env.ARK_TOOLS_DB;
  if (!db) {
    throw new Error('Base de datos D1 no disponible.');
  }

  const now = new Date();
  const duracion = params.duracionDias || 30;
  const periodEnd = new Date(now.getTime() + duracion * 24 * 60 * 60 * 1000);
  const periodEndIso = periodEnd.toISOString();
  const monto = params.monto || 399.0;
  const provider = params.billingProvider || 'clip';
  const extId = params.externalId || `CLIP-${Date.now().toString(36).toUpperCase()}`;

  // 1. Upsert en tenant_subscriptions
  await db
    .prepare(
      `INSERT INTO tenant_subscriptions 
        (tenant_id, plan, status, billing_provider, external_id, monto_mensual, current_period_start, current_period_end, updated_at)
       VALUES (?, 'pro', 'active', ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(tenant_id) DO UPDATE SET 
         plan = 'pro',
         status = 'active',
         billing_provider = excluded.billing_provider,
         external_id = excluded.external_id,
         monto_mensual = excluded.monto_mensual,
         current_period_end = excluded.current_period_end,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(params.tenantId, provider, extId, monto, periodEndIso)
    .run();

  // 2. Sincronizar ai_usage para desbloqueo instantáneo de Noah AI
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  await db
    .prepare(
      `INSERT INTO ai_usage (tenant_id, period, query_count, is_pro, updated_at)
       VALUES (?, ?, 0, 1, ?)
       ON CONFLICT(tenant_id, period) DO UPDATE SET 
         is_pro = 1,
         updated_at = excluded.updated_at`
    )
    .bind(params.tenantId, currentPeriod, Date.now())
    .run();

  // 3. Notificación opcional por correo vía Resend
  if (params.email && env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.AUTH_EMAIL_FROM || 'ARK LEDGER <no-reply@mail.arksystems.site>',
          to: [params.email.trim()],
          subject: '¡Tu suscripción a ARK Despacho Pro está activa! 🚀',
          html: `<div style="font-family: sans-serif; padding: 24px; color: #0f172a;">
            <h2 style="color: #002b7f;">¡Bienvenido a ARK Despacho Pro!</h2>
            <p>Tu cuenta ha sido activada exitosamente con acceso ilimitado.</p>
            <ul>
              <li><strong>Plan:</strong> Despacho Pro ($${monto.toLocaleString('es-MX')} MXN/mes)</li>
              <li><strong>Vigencia:</strong> Hasta ${periodEnd.toLocaleDateString('es-MX')}</li>
              <li><strong>Folio de Pago:</strong> ${extId}</li>
            </ul>
            <p>Ya puedes descargar todas las Cédulas Oficiales Carta con Sello SHA-256 + QR y consultar a Noah AI sin límite de mensajes.</p>
            <p><a href="${env.APP_URL}" style="display: inline-block; background-color: #002b7f; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Ir al Portal</a></p>
          </div>`,
        }),
      }).catch((e) => console.warn('[Subscription Email Warning]:', e));
    } catch {
      // no bloqueante
    }
  }

  const subscription: TenantSubscriptionInfo = {
    tenantId: params.tenantId,
    plan: 'pro',
    status: 'active',
    isPro: true,
    billingProvider: provider,
    currentPeriodEnd: periodEndIso,
    montoMensual: monto,
  };

  return { success: true, subscription };
}
