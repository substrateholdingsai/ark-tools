/**
 * CANACO SERVYTUR MÉRIDA — Perfil de Marca Blanca
 *
 * Configuración institucional de la Ventanilla Digital y Suite Fiscal
 * para los asociados de la Cámara Nacional de Comercio, Servicios y Turismo de Mérida.
 */

import type { BrandConfig } from './types';

export const CANACO_MERIDA_BRAND_CONFIG: BrandConfig = {
  id: 'canaco_merida',
  brandName: 'CANACO SERVYTUR MÉRIDA',
  shortName: 'CANACO',
  legalEntity: 'Cámara Nacional de Comercio, Servicios y Turismo de Mérida',
  tagline: 'Ventanilla Digital y Suite de Servicios Fiscales del Asociado',
  headerSubtitle: 'PORTAL DEL ASOCIADO & SUITE FISCAL',
  description:
    'Ventanilla digital de trámites, pago de cuotas de afiliación, emisión de CFDI y suite de cálculo fiscal de alta precisión para los comercios y prestadores de servicios de Mérida y Yucatán.',
  supportEmail: 'afiliaciones@canacomerida.com.mx',
  supportPhone: '+52 999 925 3060',
  whatsappLink:
    'https://wa.me/529999253060?text=Hola,%20solicito%20atenci%C3%B3n%20sobre%20el%20Portal%20del%20Asociado%20CANACO',
  portalUrl: 'https://socios.canacomerida.com.mx',
  colors: {
    primary: '#1A3A5C', // Añil CANACO (Henequén System)
    primaryDark: '#132D47', // Añil profundo
    accent: '#B85C38', // Terracota cultural
    accentLight: '#EFE7D8', // Sisal claro
    textInk: '#2C2C2C', // Grafito
  },
  theme: 'light',
  // Catálogo curado de alto impacto para el comercio y MiPyMEs de Yucatán
  allowedTools: [
    'resico',
    'nomina',
    'finiquitos',
    'isn',
    'xml-excel',
    'validador',
    'recargos',
    'modalidad40',
    'cierre-nomina',
    'anexo24',
    'spei',
    'timbrado',
  ],
  features: {
    ventanillaPagos: true,
    superAdminCrm: false,
    workersAi: false,
    onboardingDemo: true,
  },
  footer: {
    confidenceNotice:
      'Plataforma institucional de CANACO SERVYTUR MÉRIDA diseñada para impulsar la modernización contable y la certeza tributaria de los comercios afiliados en Yucatán.',
    complianceBadge: 'Afiliación Oficial CANACO SERVYTUR Mérida',
    disclaimer:
      'Los servicios de cálculo tributario y emisión de cédulas de trabajo son proporcionados como un beneficio de valor agregado para los socios afiliados a CANACO SERVYTUR MÉRIDA conforme a la legislación fiscal mexicana vigente.',
  },
};
