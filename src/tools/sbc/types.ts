/**
 * ARK LEDGER — Calculadora SBC 2026
 * Tipos TypeScript
 */

export type ZonaSalarial = 'general' | 'frontera';

/**
 * Tipo de tope aplicado al SBC.
 * - 'max': SBC bruto supera el tope de 25 UMAs (LSS Art. 28, límite superior)
 * - 'min': SBC bruto inferior al salario mínimo del área geográfica (LSS Art. 28, límite inferior)
 * - null: Dentro del rango
 */
export type TipoTope = 'max' | 'min' | null;

export interface ParametrosSBC {
  salarioDiario: number;
  diasVacaciones: number;
  primaVacacional: number;
  diasAguinaldo: number;
  /** Zona salarial para el límite inferior LSS Art. 28. Default: 'general'. */
  zona?: ZonaSalarial;
  /** Años de antigüedad (para derivar vacaciones Art. 76 LFT). Informativo/UI. */
  aniosAntiguedad?: number;
  /** true si el trabajador tiene < 1 año (vacaciones proporcionales). */
  menorDeUnAnio?: boolean;
}

export interface FactorIntegracion {
  factor: number;
  aporteVacaciones: number;
  aporteAguinaldo: number;
  diasPrimaVacacional: number;
  diasIntegracion: number;
}

export interface ResultadoSBC {
  factor: number;
  sbcBruto: number;
  sbcFinal: number;
  tipoTope: TipoTope;
  desglose: FactorIntegracion;
  porcentajeDelTope: number;
  /** Salario mínimo de la zona aplicado como límite inferior (LSS Art. 28). */
  salarioMinimoAplicado: number;
  zona: ZonaSalarial;
}

export interface ConstantesIMSS {
  umaDiaria: number;
  topeUmas: number;
  topePesos: number;
  salarioMinimoGeneral: number;
  salarioMinimoFrontera: number;
}
