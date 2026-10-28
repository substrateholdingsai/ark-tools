/**
 * BrandLogo
 *
 * Componente unificado de logotipo institucional.
 * Renderiza el Cubo 3D de ARK LEDGER o el Emblema de CANACO SERVYTUR MÉRIDA
 * de forma reactiva según la marca activa configurada.
 */

import { Logo } from '@/components/Logo';
import { CanacoLogo } from './CanacoLogo';
import { getBrandConfig, type BrandId } from '@/config/brand';

interface BrandLogoProps {
  /** Tamaño en px. Default: 40 */
  size?: number;
  /** Variante específica para logos vectoriales que lo soporten */
  variant?: 'symbol' | 'full';
  /** Forzar una marca específica. Si se omite, se usa la marca activa global */
  brandId?: BrandId;
  className?: string;
}

export function BrandLogo({ size = 40, variant = 'symbol', brandId, className }: BrandLogoProps) {
  const brand = getBrandConfig(brandId);

  if (brand.id === 'canaco_merida') {
    return <CanacoLogo size={size} variant={variant} className={className} />;
  }

  // Fallback: Cubo isométrico ARK LEDGER
  return <Logo size={size} className={className} />;
}
