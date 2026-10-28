/**
 * ARK LEDGER — Brand Configuration Engine
 *
 * Resuelve y administra los perfiles de marca blanca (ARK LEDGER vs CANACO SERVYTUR MÉRIDA)
 * mediante variables de entorno o detección de host de dominio.
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
 * Resuelve el identificador de la marca activa según entorno o hostname.
 */
export function getActiveBrandId(): BrandId {
  // 1. Variable de entorno Vite (para builds dedicados o empaquetado de instancia)
  const envBrand = (
    typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_BRAND : undefined
  )?.toLowerCase();

  if (envBrand === 'canaco' || envBrand === 'canaco_merida') {
    return 'canaco_merida';
  }

  // 2. Detección por Hostname en navegador
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('canacomerida') || host.includes('canaco.')) {
      return 'canaco_merida';
    }
  }

  // 3. Fallback canónico: ARK LEDGER
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
