/**
 * ARK LEDGER — Configuración centralizada de Billing y Monetización
 *
 * Única fuente de verdad para precios, límites de IA, URLs de pago
 * y parámetros de suscripción Pro.
 */

export const FREE_AI_QUOTA = 10;
export const PRO_PRICE_MXN = 399;
export const DEFAULT_PRO_DAYS = 30;
export const INSTITUTIONAL_PRO_DAYS = 365;

// URL de pago por defecto (Clip)
export const DEFAULT_PRO_PAYMENT_URL =
  'https://pago.clip.mx/v3/bc5ff8d9-dacb-4f36-b006-78d0348bbb65';

export function getProPaymentUrl(env?: { CLIP_PAYMENT_URL?: string }): string {
  return env?.CLIP_PAYMENT_URL || DEFAULT_PRO_PAYMENT_URL;
}

export interface BillingConfig {
  freeAiQuota: number;
  proPriceMxn: number;
  defaultProDays: number;
  institutionalProDays: number;
  paymentUrl: string;
}

export function getBillingConfig(env?: {
  CLIP_PAYMENT_URL?: string;
  PRO_PRICE_MXN?: string;
}): BillingConfig {
  const proPriceMxn = env?.PRO_PRICE_MXN ? Number(env.PRO_PRICE_MXN) : PRO_PRICE_MXN;
  return {
    freeAiQuota: FREE_AI_QUOTA,
    proPriceMxn: isNaN(proPriceMxn) ? PRO_PRICE_MXN : proPriceMxn,
    defaultProDays: DEFAULT_PRO_DAYS,
    institutionalProDays: INSTITUTIONAL_PRO_DAYS,
    paymentUrl: getProPaymentUrl(env),
  };
}
