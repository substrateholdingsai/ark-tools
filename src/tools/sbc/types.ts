/**
 * ARK LEDGER — Calculadora SBC 2026
 * Tipos TypeScript
 */

/**
 * Tipo de tope aplicado al SBC.
 * - 'max': La base supera el tope de 25 UMAs
 * - 'min': La base cae bajo el salario mínimo
 * - null: Dentro del rango IMSS
 */
export type TipoTope = 'max' | 'min' | null;

/**
 * Parámetros de entrada del cálculo.
 */
export interface ParametrosSBC {
  /** Salario diario en MXN */
  salarioDiario: number;
  /** Días de vacaciones por antigüedad (6 a 32) */
  diasVacaciones: number;
  /** Prima vacacional en porcentaje (mínimo 25%) */
  primaVacacional: number;
  /** Días de aguinaldo (mínimo 15) */
  diasAguinaldo: number;
}

/**
 * Resultado del cálculo del factor de integración.
 */
export interface FactorIntegracion {
  /** Factor total (ej. 1.0452) */
  factor: number;
  /** Aporte proporcional de vacaciones */
  aporteVacaciones: number;
  /** Aporte proporcional de aguinaldo */
  aporteAguinaldo: number;
  /** Días de prima vacacional pagados */
  diasPrimaVacacional: number;
  /** Días totales de integración anual */
  diasIntegracion: number;
}

/**
 * Resultado completo del cálculo SBC.
 */
export interface ResultadoSBC {
  /** Factor de integración con 4 decimales */
  factor: number;
  /** SBC bruto (antes de topes) */
  sbcBruto: number;
  /** SBC final (después de topes) */
  sbcFinal: number;
  /** Si se aplicó un tope (max, min, o ninguno) */
  tipoTope: TipoTope;
  /** Desglose del factor */
  desglose: FactorIntegracion;
  /** Porcentaje del tope que representa el SBC (0-100) */
  porcentajeDelTope: number;
}

/**
 * Constantes del sistema IMSS 2026.
 */
export interface ConstantesIMSS {
  /** UMA diaria 2026 */
  umaDiaria: number;
  /** Tope: 25 UMAs */
  topeUmas: number;
  /** Tope en pesos */
  topePesos: number;
  /** Salario mínimo general (frontera) */
  salarioMinimo: number;
}
