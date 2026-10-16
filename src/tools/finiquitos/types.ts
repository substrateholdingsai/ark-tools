/**
 * ARK TOOLS — Calculadora de Finiquitos y Liquidaciones
 * Tipos de entrada, parámetros LFT y resultados del cálculo.
 * Fundamento: LFT Arts. 50, 76 (ref. 2023), 79, 80, 87, 162, 486.
 */

export type TipoBaja = 'finiquito' | 'liquidacion';

export interface EntradaFiniquito {
  /** Naturaleza de la terminación laboral */
  tipoBaja: TipoBaja;

  /** Fecha de ingreso (ISO YYYY-MM-DD) */
  fechaIngreso: string;

  /** Fecha de baja (ISO YYYY-MM-DD) */
  fechaBaja: string;

  /** Salario diario ordinario (MXN) */
  salarioDiario: number;

  /** Salario Diario Integrado para indemnizaciones (MXN) */
  sdi: number;

  /** Días de vacaciones pendientes de ejercer (default: 0) */
  vacacionesPendientes: number;

  /** Días de aguinaldo pendientes de períodos anteriores (default: 0) */
  aguinaldoPendiente: number;

  /** Prima vacacional en porcentaje (default: 25) */
  primaVacacionalPct: number;

  /** Activar prima de antigüedad (Art. 162) */
  incluirPrimaAntiguedad: boolean;

  /** Activar indemnización 90 días (solo liquidación, Art. 50) */
  incluirIndem90Dias: boolean;

  /** Activar 20 días por año (Art. 79, sujeto a reinstalación) */
  incluir20DiasAnio: boolean;
}

export interface DesgloseConcepto {
  /** Nombre del concepto (Aguinaldo, Vacaciones, etc.) */
  concepto: string;

  /** Fórmula aplicada en texto legible */
  formula: string;

  /** Días aplicables (opcional) */
  dias?: number;

  /** Importe en MXN */
  importe: number;

  /** Fundamento legal (Art. X LFT) */
  fundamento: string;

  /** Marcar como concepto de liquidación (se muestra con acento oro) */
  esLiquidacion?: boolean;

  /** Concepto deshabilitado por configuración */
  deshabilitado?: boolean;
}

export interface ResultadoFiniquito {
  // === Antigüedad ===
  diasAntiguedad: number;
  aniosExactos: number;
  aniosCompletos: number;
  diasTrabajadosAnio: number;

  // === Vacaciones ===
  tablaVacaciones: number;         // días por año según tabla LFT 2023
  vacacionesProporcionales: number;

  // === Salario ===
  salarioMensual: number;          // salarioDiario × 30.4
  salarioTope: number;             // min(salarioDiario, 2×SMG) para Art. 486

  // === Conceptos ===
  aguinaldoProporcionalDias: number;
  totalAguinaldoDias: number;
  importeAguinaldo: number;

  totalVacacionesDias: number;
  importeVacaciones: number;

  importePrimaVacacional: number;
  importePrimaAntiguedad: number;

  importeIndem90: number;
  importe20dias: number;

  // === Totales ===
  totalFiniquito: number;          // finiquito sin indemnización
  totalLiquidacion: number;        // finiquito + indemnización + 20d

  /** Desglose completo listo para render */
  desglose: DesgloseConcepto[];
}

/** Error de validación de entrada */
export interface ErrorCalculo {
  campo: string;
  mensaje: string;
}

export type ResultadoCalculo =
  | { ok: true; valor: ResultadoFiniquito }
  | { ok: false; errores: ErrorCalculo[] };
