import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  getActiveBrandId,
  getBrandConfig,
  ARK_BRAND_CONFIG,
  CANACO_MERIDA_BRAND_CONFIG,
} from './index';
import { CanacoLogo } from '@/components/brand/CanacoLogo';
import { BrandLogo } from '@/components/brand/BrandLogo';

describe('Brand Configuration Engine & White-Label Support', () => {
  it('resuelve ARK LEDGER como marca activa por defecto', () => {
    const brandId = getActiveBrandId();
    expect(brandId).toBe('ark');

    const brand = getBrandConfig();
    expect(brand).toBe(ARK_BRAND_CONFIG);
    expect(brand.id).toBe('ark');
    expect(brand.brandName).toBe('ARK LEDGER');
    expect(brand.legalEntity).toBe('Substrate Holdings LLC');
    expect(brand.colors.primary).toBe('#002B7F');
    expect(brand.allowedTools).toBeUndefined(); // Sin restricción: 19/19 tools
  });

  it('obtiene la configuración de CANACO SERVYTUR MÉRIDA con herramientas curadas y ventanilla activa', () => {
    const brand = getBrandConfig('canaco_merida');
    expect(brand).toBe(CANACO_MERIDA_BRAND_CONFIG);
    expect(brand.id).toBe('canaco_merida');
    expect(brand.brandName).toBe('CANACO SERVYTUR MÉRIDA');
    expect(brand.legalEntity).toBe('Cámara Nacional de Comercio, Servicios y Turismo de Mérida');
    expect(brand.colors.primary).toBe('#1A3A5C');
    expect(brand.features.ventanillaPagos).toBe(true);
    expect(brand.features.superAdminCrm).toBe(false);

    // Debe incluir herramientas prioritarias para el comercio
    expect(brand.allowedTools).toBeDefined();
    expect(brand.allowedTools).toContain('resico');
    expect(brand.allowedTools).toContain('nomina');
    expect(brand.allowedTools).toContain('isn');
    expect(brand.allowedTools).toContain('recargos');
    expect(brand.allowedTools).toContain('modalidad40');
    // Herramientas de nicho de auditoría corporativa deben estar excluidas
    expect(brand.allowedTools).not.toContain('auditor-cobranza');
    expect(brand.allowedTools).not.toContain('mapa-activos');
  });

  it('renderiza CanacoLogo en variante compacta (symbol) y variante completa (full)', () => {
    const { container: symbolContainer } = render(<CanacoLogo size={48} variant="symbol" />);
    const symbolSvg = symbolContainer.querySelector('svg');
    expect(symbolSvg).toBeInTheDocument();
    expect(symbolSvg?.getAttribute('aria-label')).toContain('CANACO SERVYTUR MÉRIDA — Isotipo');

    const { container: fullContainer } = render(<CanacoLogo size={120} variant="full" />);
    expect(screen.getByText('CANACO SERVYTUR')).toBeInTheDocument();
    expect(screen.getByText('MÉRIDA')).toBeInTheDocument();
    const fullSvg = fullContainer.querySelector('svg');
    expect(fullSvg?.getAttribute('aria-label')).toContain(
      'CANACO SERVYTUR MÉRIDA — Logotipo Oficial'
    );
  });

  it('BrandLogo renderiza dinámicamente según la marca solicitada', () => {
    const { container: arkContainer } = render(<BrandLogo brandId="ark" size={40} />);
    // El logo de Ark tiene la letra 'A' en el centro del cubo
    expect(arkContainer.querySelector('.orbitron')).toHaveTextContent('A');

    const { container: canacoContainer } = render(
      <BrandLogo brandId="canaco_merida" size={40} variant="symbol" />
    );
    expect(canacoContainer.querySelector('svg')).toHaveAttribute(
      'aria-label',
      'CANACO SERVYTUR MÉRIDA — Isotipo'
    );
  });

  it('conmuta a CANACO mediante query param ?brand=canaco y persiste en sessionStorage', () => {
    const originalLocation = window.location;
    try {
      delete (window as any).location;
      (window as any).location = new URL('https://ledger.arksystems.site/?brand=canaco');

      const brandId = getActiveBrandId();
      expect(brandId).toBe('canaco_merida');
      expect(sessionStorage.getItem('ark_active_brand')).toBe('canaco_merida');

      // Conmuta de vuelta a ark con ?brand=ark
      (window as any).location = new URL('https://ledger.arksystems.site/?brand=ark');
      const resetBrandId = getActiveBrandId();
      expect(resetBrandId).toBe('ark');
      expect(sessionStorage.getItem('ark_active_brand')).toBeNull();
    } finally {
      (window as any).location = originalLocation;
      sessionStorage.clear();
    }
  });
});
