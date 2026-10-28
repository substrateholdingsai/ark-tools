/**
 * Brand Configuration Types
 *
 * Define el contrato de configuración de marca blanca (White-Label)
 * para permitir el despliegue tanto de ARK LEDGER como de instancias
 * institucionales dedicadas (ej. CANACO SERVYTUR MÉRIDA).
 */

import type { ToolId } from '@/App';

export type BrandId = 'ark' | 'canaco_merida';

export interface BrandColors {
  /** Color primario institucional (ej. #002B7F para Ark, #1a467e para Canaco) */
  primary: string;
  /** Tono oscuro para fondos, cabeceras o acentos contrastados */
  primaryDark: string;
  /** Color de acento (ej. #FFD700 dorado Ark, #c49a45 dorado sobrio o acento secundario) */
  accent: string;
  /** Tono tenue de acento para fondos o badges */
  accentLight: string;
  /** Color de texto de marca */
  textInk: string;
}

export interface BrandFeatures {
  /** Ventanilla digital para cobro de cuotas, refrendo SIEM y afiliación */
  ventanillaPagos: boolean;
  /** CRM de prospectos de Super Admin (exclusivo ARK) */
  superAdminCrm: boolean;
  /** Asistente inteligente con Cloudflare Workers AI */
  workersAi: boolean;
  /** Modo sandbox demo de onboarding en 60s */
  onboardingDemo: boolean;
}

export interface BrandFooter {
  /** Texto del bloque superior de confianza y privacidad */
  confidenceNotice: string;
  /** Badge fiscal o institucional en el footer */
  complianceBadge: string;
  /** Leyenda jurídica de responsabilidad al pie */
  disclaimer: string;
}

export interface BrandConfig {
  /** Identificador único de la marca */
  id: BrandId;
  /** Nombre completo de la plataforma (ej. "ARK LEDGER" o "PORTAL EMPRESARIAL CANACO") */
  brandName: string;
  /** Nombre corto o acrónimo para espacios reducidos (ej. "ARK" o "CANACO") */
  shortName: string;
  /** Razón social o entidad jurídica emisora */
  legalEntity: string;
  /** Eslogan institucional */
  tagline: string;
  /** Subtítulo corto para header */
  headerSubtitle: string;
  /** Descripción general para landing y meta tags */
  description: string;
  /** Correo oficial de mesa de ayuda / soporte */
  supportEmail: string;
  /** Teléfono institucional */
  supportPhone: string;
  /** Enlace directo de atención por WhatsApp */
  whatsappLink: string;
  /** URL pública de producción de la instancia */
  portalUrl: string;
  /** Esquema de color institucional */
  colors: BrandColors;
  /** Tema base de la interfaz ('dark' para estilo cyber-institutional, 'light' para institucional diurno) */
  theme: 'dark' | 'light';
  /**
   * Catálogo de herramientas activas para esta marca.
   * Si es `undefined`, todas las herramientas del catálogo canónico están disponibles.
   */
  allowedTools?: ToolId[];
  /** Banderas de características habilitadas */
  features: BrandFeatures;
  /** Configuración de pie de página institucional */
  footer: BrandFooter;
}
