/**
 * AUDITOR DE COMPORTAMIENTOS ATÍPICOS EN CFDI (Herramienta 20)
 * Definición canónica de tipos para gestión multi-RFC, ingesta local,
 * conciliación de metadata y auditoría forense con matriz de riesgo.
 */

export interface Contribuyente {
  rfc: string;
  razonSocial: string;
  regimenFiscal: string;
  ejercicio: number;
  actividadEconomica: string;
}

export type TipoComprobante = 'I' | 'E' | 'N' | 'P' | 'T';
export type ClasificacionCFDI = 'EMITIDO' | 'RECIBIDO';

export interface ConceptoCFDI {
  claveProdServ: string;
  claveUnidad?: string;
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
  importe: number;
}

export interface CFDIRelacionado {
  uuid: string;
  tipoRelacion: string;
}

export interface CFDIExtraido {
  uuid: string;
  serie?: string;
  folio?: string;
  fechaEmision: string; // ISO
  fechaTimbrado?: string; // ISO
  rfcEmisor: string;
  nombreEmisor: string;
  rfcReceptor: string;
  nombreReceptor: string;
  regimenEmisor?: string;
  regimenReceptor?: string;
  usoCFDI?: string;
  metodoPago?: string; // PUE | PPD
  formaPago?: string; // 01, 03, 04, etc.
  moneda: string;
  tipoCambio: number;
  subtotal: number;
  descuento: number;
  total: number;
  impuestosTrasladados: number;
  impuestosRetenidos: number;
  tipoComprobante: TipoComprobante;
  clasificacion: ClasificacionCFDI;
  conceptos: ConceptoCFDI[];
  cfdiRelacionados: CFDIRelacionado[];
  tieneNomina?: boolean;
  tienePago?: boolean;
  tieneCartaPorte?: boolean;
  // Campos cruzados con metadata
  enMetadata?: boolean;
  canceladoEnSAT?: boolean;
  fechaCancelacionSAT?: string;
  montoMetadata?: number;
}

export interface SATMetadataItem {
  uuid: string;
  rfcEmisor: string;
  nombreEmisor: string;
  rfcReceptor: string;
  nombreReceptor: string;
  rfcPac: string;
  fechaEmision: string;
  fechaCertificacionSat: string;
  monto: number;
  efectoComprobante: string;
  estatus: '0' | '1'; // 0 = Cancelado, 1 = Vigente
  fechaCancelacion?: string;
}

export type NivelRiesgo = 'Bajo' | 'Moderado' | 'Alto' | 'Crítico';

export interface HallazgoRiesgo {
  id: string;
  criterioId: string;
  criterioNombre: string;
  descripcion: string;
  periodo: string; // Ej: "2026-03", "Anual 2026"
  comprobantesUUIDs: string[];
  importeInvolucrado: number;
  probabilidad: 1 | 2 | 3 | 4 | 5;
  impacto: 1 | 2 | 3 | 4 | 5;
  nivelRiesgo: NivelRiesgo;
  posibleConsecuenciaFiscal: string;
  recomendacion: string;
  estatusSeguimiento: 'pendiente' | 'en_revision' | 'aclarado' | 'corregido';
}

export interface CriterioAtipicoConfig {
  id: string;
  nombre: string;
  descripcion: string;
  fundamento: string;
  activo: boolean;
  umbral: number;
}

export interface CeldaMallaMes {
  mes: number; // 1-12
  nombreMes: string;
  emitidos: {
    importe: number;
    count: number;
    canceladosCount: number;
    canceladosImporte: number;
  };
  recibidos: {
    importe: number;
    count: number;
    canceladosCount: number;
    canceladosImporte: number;
  };
  totalNeto: number;
  zScoreImporte: number;
  esAtipico: boolean;
}

export interface ResumenConciliacionMetadata {
  totalXML: number;
  totalMetadata: number;
  vigentesAmbos: number;
  canceladosEnSAT: number;
  faltantesEnXML: number;
  huerfanosEnMetadata: number;
  diferenciasMonto: number;
  cancelacionesExtemporaneas29A: number;
  canceladosConPagoRelacionado: number;
}

export interface EstadoAuditoria {
  contribuyenteActivo: Contribuyente;
  todosContribuyentes: Contribuyente[];
  cfdis: CFDIExtraido[];
  metadata: SATMetadataItem[];
  criterios: CriterioAtipicoConfig[];
  hallazgos: HallazgoRiesgo[];
  ultimoRespaldo: string | null;
}
