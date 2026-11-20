/**
 * ARK LEDGER — Configuración centralizada de Billing y Monetización
 *
 * Única fuente de verdad para precios, límites de IA, URLs de pago
 * y parámetros de suscripción Pro.
 */

export const FREE_AI_QUOTA = 10;
export const DEFAULT_PRO_DAYS = 30;
export const INSTITUTIONAL_PRO_DAYS = 365;
export const PRO_PRICES = {
  tier_1: 399,
  tier_2: 499,
} as const;
export const DEFAULT_PRO_PRICE_MXN = PRO_PRICES.tier_1;

export type ProTier = keyof typeof PRO_PRICES;

export type PaymentsProvider = 'legacy' | 'shadow' | 'caja';

export function getPaymentsProvider(env?: { PAYMENTS_PROVIDER?: string }): PaymentsProvider {
  const raw = (env?.PAYMENTS_PROVIDER || 'legacy').trim().toLowerCase();
  if (raw === 'legacy' || raw === 'shadow' || raw === 'caja') return raw;
  // Fail-closed: valor inválido -> error de arranque/configuración
  throw new Error(`Invalid PAYMENTS_PROVIDER: ${env?.PAYMENTS_PROVIDER ?? '(empty)'}`);
}

function parseProPrice(value: unknown, fallback: number, variableName: string): number {
  const raw = value;
  if (raw == null || String(raw).trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid ${variableName}: ${raw}`);
  }
  return n;
}

export function getProPrice(
  env:
    | {
        PRO_PRICE_MXN?: string;
        PRO_PRICE_MXN_TIER_1?: string;
        PRO_PRICE_MXN_TIER_2?: string;
      }
    | undefined,
  tier: ProTier
): number {
  if (tier === 'tier_2') {
    return parseProPrice(env?.PRO_PRICE_MXN_TIER_2, PRO_PRICES.tier_2, 'PRO_PRICE_MXN_TIER_2');
  }
  return parseProPrice(
    env?.PRO_PRICE_MXN_TIER_1 ?? env?.PRO_PRICE_MXN,
    PRO_PRICES.tier_1,
    'PRO_PRICE_MXN_TIER_1'
  );
}

export function getProPriceMxn(env?: { PRO_PRICE_MXN?: string; PRO_PRICE_MXN_TIER_1?: string }) {
  return getProPrice(env, 'tier_1');
}

export function getProPaymentUrl(env?: {
  CLIP_PAYMENT_URL?: string;
  PRO_PAYMENT_URL?: string;
}): string {
  // Cero hardcoding de URL de pago: viene de env (Clip legacy) o vacío si no configurada.
  return env?.PRO_PAYMENT_URL || env?.CLIP_PAYMENT_URL || '';
}

export interface BillingConfig {
  freeAiQuota: number;
  proPriceMxn: number;
  defaultProDays: number;
  institutionalProDays: number;
  paymentUrl: string;
  paymentsProvider: PaymentsProvider;
}

export function getBillingConfig(env?: {
  CLIP_PAYMENT_URL?: string;
  PRO_PAYMENT_URL?: string;
  PRO_PRICE_MXN?: string;
  PRO_PRICE_MXN_TIER_1?: string;
  PRO_PRICE_MXN_TIER_2?: string;
  PAYMENTS_PROVIDER?: string;
}): BillingConfig {
  return {
    freeAiQuota: FREE_AI_QUOTA,
    proPriceMxn: getProPrice(env, 'tier_1'),
    defaultProDays: DEFAULT_PRO_DAYS,
    institutionalProDays: INSTITUTIONAL_PRO_DAYS,
    paymentUrl: getProPaymentUrl(env),
    paymentsProvider: getPaymentsProvider(env),
  };
}
