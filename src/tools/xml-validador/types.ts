/**
 * ARK LEDGER — Validador de XMLs CFDI 4.0 & 3.3
 * Tipos de datos para el motor de auditoría y validación fiscal
 */

export type TipoSeveridad = 'error' | 'advertencia' | 'exito';

export type CategoriaRegla = 'estructura' | 'timbre' | 'fiscal' | 'aritmetica' | 'vigencia';

export interface ReglaAuditoria {
  codigo: string;
  categoria: CategoriaRegla;
  titulo: string;
  descripcion: string;
  severidad: TipoSeveridad;
  fundamentoLegal?: string;
  detalleValor?: string;
}

export type EstatusDictamen = 'aprobado' | 'advertencia' | 'rechazado';

export interface DictamenCFDI {
  id: string;
  fileName: string;
  version: string;
  uuid: string;
  rfcEmisor: string;
  nombreEmisor: string;
  rfcReceptor: string;
  nombreReceptor: string;
  tipoComprobante: string;
  fecha: string;
  subtotal: number;
  total: number;
  moneda: string;
  score: number; // 0 a 100
  estatusGeneral: EstatusDictamen;
  reglas: ReglaAuditoria[];
  erroresCount: number;
  advertenciasCount: number;
  exitosCount: number;
}

export interface ResumenAuditoriaLote {
  totalAnalizados: number;
  aprobados: number;
  conAdvertencias: number;
  rechazados: number;
  promedioScore: number;
  totalErrores: number;
  totalAdvertencias: number;
}
