/**
 * ARK TOOLS — Calculadora Nómina Rápida 2026
 * Cálculo del ISR (Impuesto Sobre la Renta)
 *
 * Estrategia:
 *   1. Convertir el sueldo del período a mensual (para usar tabla mensual)
 *   2. Aplicar tarifa ISR mensual (10 rangos progresivos)
 *   3. Aplicar subsidio al empleo (11 rangos)
 *   4. Reconvenir el ISR a la periodicidad original
 *
 * Base legal: Art. 96 LISR + Anexo 8 RMF 2026
 */

import type { Periodo, RangoISR, RangoSubsidio, ResultadoISR } from '../types';
import { TABLA_ISR_MENSUAL, TABLA_SUBSIDIO_MENSUAL } from '../data/tablasISR';
import { factorMensual } from '../data/periodos';

// ─────────────────────────────────────────────────────────────────────
// BÚSQUEDA EN TABLAS
// ─────────────────────────────────────────────────────────────────────

/**
 * Encuentra el rango de la tabla ISR que corresponde a una base mensual.
 * Si la base excede todos los rangos, retorna el último.
 */
export function encontrarRangoISR(baseMensual: number): RangoISR {
  for (const rango of TABLA_ISR_MENSUAL) {
    const dentroDeRango =
      baseMensual >= rango.limiteInferior &&
      (rango.limiteSuperior === null || baseMensual <= rango.limiteSuperior);

    if (dentroDeRango) return rango;
  }
  // Fallback: retornar el último rango (para bases muy altas)
  return TABLA_ISR_MENSUAL[TABLA_ISR_MENSUAL.length - 1]!;
}

/**
 * Encuentra el rango de subsidio al empleo que corresponde a una base mensual.
 * Retorna null si no aplica (base > último límite).
 */
export function encontrarRangoSubsidio(baseMensual: number): RangoSubsidio | null {
  for (const rango of TABLA_SUBSIDIO_MENSUAL) {
    const dentroDeRango =
      baseMensual >= rango.limiteInferior &&
      (rango.limiteSuperior === null || baseMensual <= rango.limiteSuperior);

    if (dentroDeRango) {
      // Si el subsidio es 0, no aplica
      return rango.subsidio > 0 ? rango : null;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// CÁLCULO DE TARIFA Y SUBSIDIO (MENSUAL)
// ─────────────────────────────────────────────────────────────────────

/**
 * Calcula el ISR según tarifa mensual (antes de subsidio).
 *
 * Fórmula:
 *   ISR tarifa = cuotaFija + (baseMensual - limiteInferior) × tasaExcedente/100
 */
export function calcularISRTarifaMensual(baseMensual: number): {
  isrTarifa: number;
  rango: RangoISR;
} {
  const rango = encontrarRangoISR(baseMensual);
  const excedente = Math.max(0, baseMensual - rango.limiteInferior);
  const isrTarifa = rango.cuotaFija + excedente * (rango.tasaExcedente / 100);

  return {
    isrTarifa: Math.max(0, isrTarifa),
    rango,
  };
}

/**
 * Calcula el subsidio al empleo mensual.
 */
export function calcularSubsidioMensual(baseMensual: number): {
  subsidio: number;
  rango: RangoSubsidio | null;
} {
  const rango = encontrarRangoSubsidio(baseMensual);
  return {
    subsidio: rango?.subsidio ?? 0,
    rango,
  };
}

// ─────────────────────────────────────────────────────────────────────
// CÁLCULO COMPLETO DEL ISR
// ─────────────────────────────────────────────────────────────────────

/**
 * Calcula el ISR completo para un período.
 *
 * Estrategia:
 *   1. Convertir base del período a mensual
 *   2. Calcular tarifa y subsidio mensuales
 *   3. Calcular ISR mensual = max(0, tarifa - subsidio)
 *   4. Reconvenir ISR mensual al período original
 */
export function calcularISR(basePeriodo: number, periodo: Periodo): ResultadoISR {
  // Caso 0: sin base
  if (basePeriodo <= 0) {
    return {
      baseGravable: 0,
      isrTarifa: 0,
      subsidio: 0,
      isrFinal: 0,
      rangoTarifa: TABLA_ISR_MENSUAL[0]!,
      rangoSubsidio: null,
    };
  }

  const factor = factorMensual(periodo);

  // Paso 1: convertir a mensual
  const baseMensual = basePeriodo * factor;

  // Paso 2: calcular tarifa y subsidio mensuales
  const { isrTarifa: isrTarifaMensual, rango: rangoTarifa } = calcularISRTarifaMensual(baseMensual);
  const { subsidio: subsidioMensual, rango: rangoSubsidio } = calcularSubsidioMensual(baseMensual);

  // Paso 3: ISR mensual neto (nunca negativo)
  const isrMensualNeto = Math.max(0, isrTarifaMensual - subsidioMensual);

  // Paso 4: reconvenir al período
  const divisor = factor;
  const isrTarifaPeriodo = isrTarifaMensual / divisor;
  const subsidioPeriodo = subsidioMensual / divisor;
  const isrFinalPeriodo = isrMensualNeto / divisor;

  return {
    baseGravable: redondear2(basePeriodo),
    isrTarifa: redondear2(isrTarifaPeriodo),
    subsidio: redondear2(subsidioPeriodo),
    isrFinal: redondear2(isrFinalPeriodo),
    rangoTarifa,
    rangoSubsidio,
  };
}

// ─────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────

/**
 * Redondea a 2 decimales (centavos).
 */
function redondear2(valor: number): number {
  return Math.round(valor * 100) / 100;
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
 * Formatea un número sin símbolo, con separadores.
 */
export function formatearNumero(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * Formatea un porcentaje.
 */
export function formatearPorcentaje(valor: number): string {
  return `${valor.toFixed(2)}%`;
}

/**
 * Formatea un rango ISR como texto legible.
 * Ej: "$746.05 - $6,328.07"
 */
export function formatearRango(rango: RangoISR): string {
  const inferior = formatearMXN(rango.limiteInferior);
  const superior =
    rango.limiteSuperior !== null ? formatearMXN(rango.limiteSuperior) : 'en adelante';
  return `${inferior} - ${superior}`;
}
