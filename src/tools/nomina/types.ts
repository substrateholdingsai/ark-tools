/**
 * ARK LEDGER — Calculadora Nómina Rápida 2026
 * Tipos TypeScript
 */

// ─────────────────────────────────────────────────────────────────────
// PERÍODOS
// ─────────────────────────────────────────────────────────────────────

export type Periodo = 'diario' | 'semanal' | 'quincenal' | 'mensual';

export interface PeriodoInfo {
  id: Periodo;
  label: string;
  dias: number;
  vecesAlAnio: number;
}

// ─────────────────────────────────────────────────────────────────────
// ISR
// ─────────────────────────────────────────────────────────────────────

export interface RangoISR {
  limiteInferior: number;
  limiteSuperior: number | null;
  cuotaFija: number;
  tasaExcedente: number;
}

export interface RangoSubsidio {
  limiteInferior: number;
  limiteSuperior: number | null;
  subsidio: number;
}

export interface ResultadoISR {
  /** Base gravable sobre la que se aplicó ISR */
  baseGravable: number;
  /** ISR según tarifa (antes de subsidio) */
  isrTarifa: number;
  /** Subsidio al empleo aplicado */
  subsidio: number;
  /** ISR final a retener (puede ser 0 si subsidio > tarifa) */
  isrFinal: number;
  /** Rango de la tarifa aplicado */
  rangoTarifa: RangoISR;
  /** Rango de subsidio aplicado (o null si no aplica) */
  rangoSubsidio: RangoSubsidio | null;
}

// ─────────────────────────────────────────────────────────────────────
// IMSS OBRERO
// ─────────────────────────────────────────────────────────────────────

export type BaseCalculo = 'sbc' | 'uma' | 'sbc_excedente';

export interface CuotaIMSS {
  /** Nombre del ramo */
  ramo: string;
  /** Fundamento legal */
  fundamento: string;
  /** Porcentaje de la cuota (ej. 0.25) */
  porcentaje: number;
  /** Base sobre la que se calcula */
  base: BaseCalculo;
  /** Monto calculado (se llena al calcular) */
  monto: number;
}

export interface ResultadoIMSS {
  /** Cuotas por ramo */
  cuotas: CuotaIMSS[];
  /** Total IMSS obrero */
  total: number;
  /** SBC usado para el cálculo */
  sbc: number;
  /** Días del período */
  dias: number;
}

// ─────────────────────────────────────────────────────────────────────
// NÓMINA COMPLETA
// ─────────────────────────────────────────────────────────────────────

export interface ParametrosNomina {
  /** Período de pago */
  periodo: Periodo;
  /** Sueldo bruto del período (en pesos) */
  sueldoBruto: number;
  /** Días trabajados (para prorrateo) */
  diasTrabajados: number;
  /** Días del período completo (ej. 30 para mensual) */
  diasPeriodo: number;
  /** SBC diario (para calcular IMSS obrero). Si no se especifica, se estima. */
  sbcDiario: number;
}

export interface ResultadoNomina {
  sueldoBruto: number;
  baseISR: number;
  isr: ResultadoISR;
  imss: ResultadoIMSS;
  totalDeducciones: number;
  neto: number;
  periodo: PeriodoInfo;
}
