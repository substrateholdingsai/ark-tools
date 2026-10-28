/**
 * ARK LEDGER — Perfil de Marca Canónico
 *
 * Configuración estándar para ARK LEDGER (Suite Fiscal & Financiera MX).
 */

import type { BrandConfig } from './types';

export const ARK_BRAND_CONFIG: BrandConfig = {
  id: 'ark',
  brandName: 'ARK LEDGER',
  shortName: 'ARK',
  legalEntity: 'Substrate Holdings LLC',
  tagline: 'Suite Fiscal, Laboral y de Compliance MX',
  headerSubtitle: 'SUITE FISCAL & FINANCIERA MX',
  description:
    'Plataforma de alta precisión en cálculo tributario, nómina y cumplimiento CFDI. Desarrollada para contadores independientes, firmas de auditoría y directores financieros en México.',
  supportEmail: 'pavel@arksystems.site',
  supportPhone: '+52 56 5706 2511',
  whatsappLink:
    'https://wa.me/525657062511?text=Hola,%20solicito%20atenci%C3%B3n%20sobre%20ARK%20TOOLS',
  portalUrl: 'https://ledger.arksystems.site',
  colors: {
    primary: '#002B7F', // Navy Ark
    primaryDark: '#001C55',
    accent: '#FFD700', // Gold
    accentLight: '#FFF8E1',
    textInk: '#0B132B',
  },
  theme: 'dark',
  allowedTools: undefined, // Todas las 19 herramientas disponibles
  features: {
    ventanillaPagos: false,
    superAdminCrm: true,
    workersAi: true,
    onboardingDemo: true,
  },
  footer: {
    confidenceNotice:
      'El análisis y procesamiento de tus XMLs, nóminas y CFDI se ejecuta de forma segura en tu navegador. Tus datos no se transfieren ni se comercializan.',
    complianceBadge: 'Tablas Fiscales 2026 Vigentes',
    disclaimer:
      'ARK LEDGER provee herramientas analíticas y de auditoría. Los resultados emitidos constituyen papeles de trabajo internos orientados a facilitar la toma de decisiones contables y fiscales. No sustituyen la asesoría legal o contable colegiada.',
  },
};
