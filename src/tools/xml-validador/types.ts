/**
 * ARK LEDGER — Validador de XMLs CFDI 4.0 & 3.3
 * Tipos de datos para el motor de auditoría y validación fiscal
 */

export type TipoSeveridad = 'error' | 'advertencia' | 'exito';

export const CODIGOS_REGLA_VALIDADOR = [
  'ESTR-01',
  'VIG-01',
  'TIMB-01',
  'TIMB-02',
  'TIMB-03',
  'TIMB-04',
  'FISC-01',
  'FISC-02',
  'FISC-03',
  'FISC-04',
  'FISC-05',
  'FISC-06',
  'FISC-07',
  'ARIT-01',
  'MON-01',
] as const;

export type CodigoReglaAuditoria =
  (typeof CODIGOS_REGLA_VALIDADOR)[number] | 'ESTR-ERR' | 'ESTR-IO';

export const AVISO_SCORE_INTERNO =
  'El score es max(0, 100 − 30×errores − 10×advertencias); si hay errores y el resultado supera 60, se fija en 50. Cualquier error implica rechazado; sin errores, las advertencias implican advertencia. Es una evaluación interna, no una certificación del SAT ni una garantía de deducibilidad.';

export const AVISO_TOLERANCIA_ARITMETICA =
  'Tolerancia interna de $1.00 en cuadratura y traslados; no es un criterio oficial del SAT.';

export const AVISO_ALCANCE_DICTAMEN = `${AVISO_SCORE_INTERNO} ${AVISO_TOLERANCIA_ARITMETICA}`;

export type CategoriaRegla = 'estructura' | 'timbre' | 'fiscal' | 'aritmetica' | 'vigencia';

export interface ReglaAuditoria {
  codigo: CodigoReglaAuditoria;
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
  avisoAlcance: typeof AVISO_ALCANCE_DICTAMEN;
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
