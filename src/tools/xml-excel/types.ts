/**
 * ARK LEDGER — Conversor XML a Excel (CFDI 4.0)
 * Tipos de datos para el procesamiento y extracción de comprobantes fiscales
 */

export type TipoComprobante = 'I' | 'E' | 'T' | 'N' | 'P' | 'Desconocido';

export interface ConceptoCFDI {
  claveProdServ: string;
  cantidad: number;
  claveUnidad: string;
  descripcion: string;
  valorUnitario: number;
  importe: number;
  descuento?: number;
}

export interface FacturaCFDI {
  /** ID interno único generado en el cliente */
  id: string;
  /** Nombre del archivo XML subido */
  fileName: string;
  /** Versión del CFDI (ej. '4.0', '3.3') */
  version: string;
  /** UUID / Folio Fiscal asignado por el SAT / PAC */
  uuid: string;
  /** Fecha y hora de emisión (ISO o formato SAT) */
  fecha: string;
  /** Clave de tipo de comprobante: I (Ingreso), E (Egreso), N (Nómina), P (Pago), T (Traslado) */
  tipoComprobante: TipoComprobante;
  /** Descripción legible del tipo de comprobante */
  tipoComprobanteDesc: string;
  /** Serie del comprobante */
  serie: string;
  /** Folio interno del emisor */
  folio: string;
  /** Clave de moneda (MXN, USD, EUR, etc.) */
  moneda: string;
  /** Tipo de cambio si aplica */
  tipoCambio: number;
  /** Forma de pago SAT (ej. 01, 03, 99) */
  formaPago: string;
  /** Método de pago SAT (PUE, PPD) */
  metodoPago: string;
  /** Código postal de expedición */
  lugarExpedicion: string;

  // Emisor
  rfcEmisor: string;
  nombreEmisor: string;
  regimenFiscalEmisor: string;

  // Receptor
  rfcReceptor: string;
  nombreReceptor: string;
  regimenFiscalReceptor: string;
  usoCFDI: string;

  // Importes
  subtotal: number;
  descuento: number;
  totalImpuestosTrasladados: number;
  totalImpuestosRetenidos: number;
  total: number;

  // Desglose de impuestos específicos si aplican
  iva16: number;
  iva8: number;
  ivaRetenido: number;
  isrRetenido: number;
  ieps: number;

  // Desglose de bases / subtotales por tasa si aplican (Anexo 24 / Fiscal)
  subtotal16?: number;
  subtotal8?: number;
  subtotal0?: number;
  subtotalExento?: number;

  // Conceptos
  conceptosCount: number;
  descripcionResumen: string;

  // Estado del parseo
  estado: 'valido' | 'advertencia' | 'error';
  mensajeError?: string;
}

export interface ResumenLoteXML {
  totalArchivos: number;
  totalValidos: number;
  totalConError: number;
  sumaSubtotal: number;
  sumaDescuento: number;
  sumaImpuestosTrasladados: number;
  sumaImpuestosRetenidos: number;
  sumaTotal: number;
  sumaIVA16: number;
  sumaIVARetenido: number;
  sumaISRRetenido: number;
  conteoIngresos: number;
  conteoEgresos: number;
  conteoNomina: number;
  conteoOtros: number;
}

export type FiltroTipo = 'TODOS' | 'I' | 'E' | 'N' | 'P' | 'OTROS';
