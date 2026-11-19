/**
 * ARK LEDGER — Brand Configuration Engine
 *
 * Resuelve y administra los perfiles de marca blanca (ARK LEDGER vs CANACO SERVYTUR MERIDA)
 * mediante detección de host de dominio o parámetro explícito de URL.
 */

import type { BrandConfig, BrandId } from './types';
import { ARK_BRAND_CONFIG } from './ark';
import { CANACO_MERIDA_BRAND_CONFIG } from './canacoMerida';

export * from './types';
export { ARK_BRAND_CONFIG } from './ark';
export { CANACO_MERIDA_BRAND_CONFIG } from './canacoMerida';

/** Registro de marcas soportadas */
export const BRAND_REGISTRY: Record<BrandId, BrandConfig> = {
  ark: ARK_BRAND_CONFIG,
  canaco_merida: CANACO_MERIDA_BRAND_CONFIG,
};

/**
 * Resuelve el identificador de la marca activa segun URL o hostname.
 * Regla: por defecto ARK; solo CANACO si ?brand=canaco (o dominio CANACO).
 */
export function getActiveBrandId(): BrandId {
  // 1. Parámetro de URL explícito
  if (typeof window !== 'undefined' && window.location?.search) {
    try {
      const params = new URLSearchParams(window.location.search);
      const qBrand = params.get('brand')?.toLowerCase();
      if (qBrand === 'canaco' || qBrand === 'canaco_merida') {
        return 'canaco_merida';
      }
      if (qBrand === 'ark' || qBrand === 'default' || qBrand === 'reset') {
        return 'ark';
      }
    } catch {
      // Ignorar si URLSearchParams no está disponible
    }
  }

  // 2. Detección por Hostname (dominios dedicados de CANACO)
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('canacomerida') || host.includes('canaco.')) {
      return 'canaco_merida';
    }
  }

  // 3. Fallback canónico: ARK LEDGER (la raíz siempre es ARK por defecto)
  return 'ark';
}

/**
 * Retorna la configuración completa de la marca activa o especificada.
 */
export function getBrandConfig(brandId?: BrandId): BrandConfig {
  const targetId = brandId || getActiveBrandId();
  return BRAND_REGISTRY[targetId] || ARK_BRAND_CONFIG;
}

/**
 * Configuración de marca activa en tiempo de ejecución.
 */
export const currentBrand: BrandConfig = getBrandConfig();
