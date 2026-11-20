/**
 * ARK LEDGER — Configuración centralizada de Billing y Monetización
 *
 * Única fuente de verdad para precios, límites de IA, URLs de pago
 * y parámetros de suscripción Pro.
 */

export const FREE_AI_QUOTA = 10;
export const DEFAULT_PRO_PRICE_MXN = 399;
export const DEFAULT_PRO_DAYS = 30;
export const INSTITUTIONAL_PRO_DAYS = 365;

export type PaymentsProvider = 'legacy' | 'shadow' | 'caja';

export function getPaymentsProvider(env?: { PAYMENTS_PROVIDER?: string }): PaymentsProvider {
  const raw = (env?.PAYMENTS_PROVIDER || 'legacy').trim().toLowerCase();
  if (raw === 'legacy' || raw === 'shadow' || raw === 'caja') return raw;
  // Fail-closed: valor inválido -> error de arranque/configuración
  throw new Error(`Invalid PAYMENTS_PROVIDER: ${env?.PAYMENTS_PROVIDER ?? '(empty)'}`);
}

export function getProPriceMxn(env?: { PRO_PRICE_MXN?: string }): number {
  const raw = env?.PRO_PRICE_MXN;
  if (raw == null || String(raw).trim() === '') return DEFAULT_PRO_PRICE_MXN;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid PRO_PRICE_MXN: ${raw}`);
  }
  return n;
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
  PAYMENTS_PROVIDER?: string;
}): BillingConfig {
  return {
    freeAiQuota: FREE_AI_QUOTA,
    proPriceMxn: getProPriceMxn(env),
    defaultProDays: DEFAULT_PRO_DAYS,
    institutionalProDays: INSTITUTIONAL_PRO_DAYS,
    paymentUrl: getProPaymentUrl(env),
    paymentsProvider: getPaymentsProvider(env),
  };
}
