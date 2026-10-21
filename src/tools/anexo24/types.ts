/**
 * ARK TOOLS — Herramienta #16: Motor de Conciliación Anexo 24
 * Tipos de datos para cruce de CFDI, Metadata SAT y Contabilidad Electrónica
 */

import type { FacturaCFDI } from '@/tools/xml-excel/types';

export type EstatusSAT = 'VIGENTE' | 'CANCELADO' | 'NO_VERIFICADO';

export interface MetadataItem {
  uuid: string;
  rfcEmisor: string;
  nombreEmisor?: string;
  rfcReceptor: string;
  nombreReceptor?: string;
  rfcPac?: string;
  fechaEmision?: string;
  fechaCertificacionSat?: string;
  monto: number;
  efectoComprobante?: string;
  estatus: 'Vigente' | 'Cancelado';
  fechaCancelacion?: string;
}

export interface MetadataParseResult {
  totalRegistros: number;
  vigentes: number;
  cancelados: number;
  mapaPorUUID: Map<string, MetadataItem>;
  uuidsCancelados: Set<string>;
  uuidsVigentes: Set<string>;
  errores: string[];
}

export type TipoCuentaAnexo24 =
  'activo' | 'pasivo' | 'capital' | 'ingreso' | 'costo_gasto' | 'orden' | 'otro';

export interface CuentaAnexo24 {
  codigoAgrupador: string; // Ej: "401.01", "208.01", "105.01"
  numCta: string; // Ej: "4010-001"
  descripcion: string; // Ej: "Ventas y/o servicios gravados al 16%"
  subCtaDe?: string;
  nivel: number;
  naturaleza: 'D' | 'A';
  saldoInicial?: number;
  debe?: number;
  haber?: number;
  saldoFinal?: number;
  tipo: TipoCuentaAnexo24;
}

export interface CatalogoBalanzaAnexo24 {
  rfc: string;
  mes: string | number;
  anio: number;
  tipoEnvio?: string; // N: Normal, C: Complementaria
  cuentas: CuentaAnexo24[];
  cuentasPorCodAgrup: Map<string, CuentaAnexo24>;
  cuentasPorNumCta: Map<string, CuentaAnexo24>;
}

export type TipoPartida =
  | 'cliente'
  | 'ingreso_16'
  | 'ingreso_8'
  | 'ingreso_0'
  | 'ingreso_exento'
  | 'iva_trasladado'
  | 'retencion_isr'
  | 'retencion_iva'
  | 'devolucion'
  | 'otro';

export interface PartidaPoliza {
  id: string;
  cfdiUuid?: string;
  cfdiFolio?: string;
  codigoAgrupador: string;
  numCta: string;
  nombreCuenta: string;
  concepto: string;
  tipoPartida: TipoPartida;
  debe: number; // Cargo
  haber: number; // Abono
  estatus: 'cuadrado' | 'pendiente';
}

export interface PolizaIngreso {
  id: string;
  tipo: 'Ingresos' | 'Diario' | 'Egreso';
  folio: number | string;
  fecha: string;
  concepto: string;
  cfdiUuid: string;
  cfdiFolio: string;
  rfcReceptor: string;
  nombreReceptor: string;
  partidas: PartidaPoliza[];
  totalDebe: number;
  totalHaber: number;
  cuadrada: boolean;
  diferencia: number;
}

export interface ItemCFDIConciliado {
  uuid: string;
  folio: string;
  serie: string;
  fecha: string;
  rfcEmisor: string;
  rfcReceptor: string;
  nombreReceptor: string;
  total: number;
  subtotal: number;
  descuento: number;
  iva16: number;
  iva8: number;
  iva0: number;
  ivaExento: number;
  retencionIsr: number;
  retencionIva: number;
  metodoPago: string;
  formaPago: string;
  tipoComprobante: string;
  estatusSAT: EstatusSAT;
  descartado: boolean;
  motivoDescarte?: string;
  poliza?: PolizaIngreso;
}

export interface ResumenConciliacion {
  totalCFDIsProcesados: number;
  totalCFDIsVigentes: number;
  totalCFDIsCancelados: number;
  totalImporteFacturado: number;
  totalSubtotal16: number;
  totalSubtotal8: number;
  totalSubtotal0: number;
  totalSubtotalExento: number;
  totalIVA16: number;
  totalIVA8: number;
  totalRetenciones: number;
  totalPolizasGeneradas: number;
  totalDebe: number;
  totalHaber: number;
  diferencia: number;
  cuadrado: boolean;
}

export interface DescarteMetadata {
  uuid: string;
  folio?: string;
  razon: string;
  monto?: number;
  rfcReceptor?: string;
}

export interface CuentaUtilizada {
  codigoAgrupador: string;
  numCta: string;
  descripcion: string;
  debe: number;
  haber: number;
}

export interface ResultadoConciliacion {
  resumen: ResumenConciliacion;
  polizas: PolizaIngreso[];
  partidasConciliadas: PartidaPoliza[];
  cfdisDetalle: ItemCFDIConciliado[];
  descartesMetadata: DescarteMetadata[];
  cuentasUtilizadas: CuentaUtilizada[];
  timestamp: string;
}

export type { FacturaCFDI };
