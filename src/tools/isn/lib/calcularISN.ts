/**
 * ARK TOOLS — Calculadora ISN 2026
 * Lógica de cálculo del Impuesto Sobre Nómina
 *
 * El ISN se calcula sobre la base gravable (suma de percepciones gravadas)
 * multiplicada por la tasa del estado correspondiente.
 *
 * Base legal: Códigos Fiscales Estatales 2026
 */

import type { ConceptoPercepcion, Estado, ResultadoISN } from '../types';

/**
 * Calcula la suma de percepciones gravadas.
 * Solo considera conceptos con `gravado > 0`.
 */
export function calcularBaseGravable(conceptos: ConceptoPercepcion[]): number {
  return conceptos.reduce((total, c) => total + (c.gravado || 0), 0);
}

/**
 * Calcula la suma de percepciones exentas.
 * Solo considera conceptos con `exento > 0`.
 */
export function calcularTotalExento(conceptos: ConceptoPercepcion[]): number {
  return conceptos.reduce((total, c) => total + (c.exento || 0), 0);
}

/**
 * Calcula el ISN a pagar.
 *
 * Fórmula: ISN = Base Gravable × (Tasa / 100)
 *
 * Redondeo: 2 decimales (centavos).
 */
export function calcularISN(baseGravable: number, tasa: number): number {
  if (baseGravable <= 0 || tasa <= 0) return 0;
  const isn = baseGravable * (tasa / 100);
  return Math.round(isn * 100) / 100;
}

/**
 * Calcula el resultado completo del ISN.
 * Función principal que agrupa todos los cálculos.
 */
export function calcularResultadoISN(
  conceptos: ConceptoPercepcion[],
  estado: Estado
): ResultadoISN {
  const baseGravable = calcularBaseGravable(conceptos);
  const totalExento = calcularTotalExento(conceptos);
  const totalPercepciones = baseGravable + totalExento;
  const isn = calcularISN(baseGravable, estado.tasa);

  return {
    baseGravable,
    totalExento,
    totalPercepciones,
    tasa: estado.tasa,
    isn,
  };
}

/**
 * Formatea un número como moneda MXN.
 * Ej: 45280.5 → "$45,280.50"
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
 * Formatea un número como porcentaje.
 * Ej: 3 → "3.0%"
 */
export function formatearPorcentaje(valor: number): string {
  return `${valor.toFixed(1)}%`;
}

/**
 * Formatea un número con separadores de miles, sin símbolo de moneda.
 * Ej: 45280.5 → "45,280.50"
 */
export function formatearNumero(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}
