/**
 * ARK TOOLS — Calculadora SBC 2026
 * Lógica de cálculo del Salario Base de Cotización
 *
 * Base legal:
 * - LSS Art. 27: Integración del SBC
 * - LSS Art. 28: Tope de 25 UMAs
 * - LFT Art. 76-81: Vacaciones y prima vacacional
 * - LFT Art. 87: Aguinaldo
 *
 * Fórmula:
 *   Factor = 1 + (diasVacaciones × primaVacacional% + diasAguinaldo) / 365
 *   SBC bruto = salarioDiario × Factor
 *   SBC final = clamp(SBC bruto, salarioMinimo, 25 UMAs)
 */

import type {
  FactorIntegracion,
  ParametrosSBC,
  ResultadoSBC,
  TipoTope,
} from '../types';
import { CONSTANTES_IMSS } from '../data/uma';

// ─────────────────────────────────────────────────────────────────────
// CÁLCULO DEL FACTOR DE INTEGRACIÓN
// ─────────────────────────────────────────────────────────────────────

/**
 * Calcula el factor de integración y su desglose.
 *
 * Fórmula IMSS:
 *   Factor = 1 + (diasVacaciones × primaVacacional/100 + diasAguinaldo) / 365
 */
export function calcularFactorIntegracion(
  parametros: ParametrosSBC
): FactorIntegracion {
  const { diasVacaciones, primaVacacional, diasAguinaldo } = parametros;

  // Días de prima vacacional (proporcional)
  const diasPrimaVacacional = diasVacaciones * (primaVacacional / 100);

  // Aporte proporcional diario de cada prestación
  const aporteVacaciones = diasPrimaVacacional / 365;
  const aporteAguinaldo = diasAguinaldo / 365;

  // Factor total
  const factor = 1 + aporteVacaciones + aporteAguinaldo;

  return {
    factor,
    aporteVacaciones,
    aporteAguinaldo,
    diasPrimaVacacional,
    diasIntegracion: diasPrimaVacacional + diasAguinaldo,
  };
}

// ─────────────────────────────────────────────────────────────────────
// CÁLCULO DEL SBC CON TOPES
// ─────────────────────────────────────────────────────────────────────

/**
 * Calcula el SBC final aplicando topes de mínimo y máximo.
 */
export function calcularSBCFinal(
  sbcBruto: number,
  salarioMinimo: number = CONSTANTES_IMSS.salarioMinimo,
  topePesos: number = CONSTANTES_IMSS.topePesos
): { sbcFinal: number; tipoTope: TipoTope } {
  // Caso 0: sin salario
  if (sbcBruto <= 0) {
    return { sbcFinal: 0, tipoTope: null };
  }

  // Tope máximo: 25 UMAs
  if (sbcBruto > topePesos) {
    return { sbcFinal: topePesos, tipoTope: 'max' };
  }

  // Tope mínimo: salario mínimo
  if (sbcBruto < salarioMinimo) {
    return { sbcFinal: salarioMinimo, tipoTope: 'min' };
  }

  // Dentro de rango
  return { sbcFinal: sbcBruto, tipoTope: null };
}

// ─────────────────────────────────────────────────────────────────────
// CÁLCULO COMPLETO
// ─────────────────────────────────────────────────────────────────────

/**
 * Calcula el resultado completo del SBC.
 * Función principal que agrupa todos los cálculos.
 */
export function calcularResultadoSBC(
  parametros: ParametrosSBC
): ResultadoSBC {
  const desglose = calcularFactorIntegracion(parametros);

  // SBC bruto = salario diario × factor
  const sbcBruto = parametros.salarioDiario * desglose.factor;

  // Aplicar topes
  const { sbcFinal, tipoTope } = calcularSBCFinal(sbcBruto);

  // Porcentaje del tope (0-100)
  const porcentajeDelTope = Math.min(
    100,
    (sbcFinal / CONSTANTES_IMSS.topePesos) * 100
  );

  return {
    factor: desglose.factor,
    sbcBruto,
    sbcFinal,
    tipoTope,
    desglose,
    porcentajeDelTope,
  };
}

// ─────────────────────────────────────────────────────────────────────
// HELPERS DE FORMATEO
// ─────────────────────────────────────────────────────────────────────

/**
 * Formatea un número con 4 decimales (para el factor).
 * Ej: 1.0452054... → "1.0452"
 */
export function formatearFactor(valor: number): string {
  return valor.toFixed(4);
}

/**
 * Formatea un número como moneda MXN.
 */
export function formatearMXN(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * Formatea un número sin símbolo de moneda, con separadores.
 */
export function formatearNumero(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * Genera el texto de resumen para copiar al portapapeles.
 */
export function generarResumenTexto(
  parametros: ParametrosSBC,
  resultado: ResultadoSBC
): string {
  const partes = [
    `SBC 2026: ${formatearMXN(resultado.sbcFinal)}`,
    `Factor: ${formatearFactor(resultado.factor)}`,
    `Salario: $${parametros.salarioDiario}`,
    `Vac: ${parametros.diasVacaciones}d`,
    `Prima: ${parametros.primaVacacional}%`,
    `Aguinaldo: ${parametros.diasAguinaldo}d`,
  ];
  return partes.join(' | ');
}
