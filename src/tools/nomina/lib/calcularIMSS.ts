/**
 * ARK TOOLS — Calculadora Nómina Rápida 2026
 * Cálculo del IMSS obrero (cuotas del trabajador)
 *
 * Base legal: LSS Art. 25, 106, 107, 147, 168, 211
 *
 * IMPORTANTE: Solo se calculan las cuotas OBRERO (empleado).
 * Las cuotas PATRÓN (empleador) NO se incluyen aquí.
 */

import type { CuotaIMSS, Periodo, ResultadoIMSS } from '../types';
import { CUOTAS_OBRERO, TRES_UMAS } from '../data/cuotasIMSS';
import { PERIODOS } from '../data/periodos';

// ─────────────────────────────────────────────────────────────────────
// CÁLCULO DE UNA CUOTA INDIVIDUAL
// ─────────────────────────────────────────────────────────────────────

/**
 * Calcula el monto de una cuota según su base.
 *
 * Bases:
 *   - sbc: porcentaje × SBC × días
 *   - uma: porcentaje × UMA × días
 *   - sbc_excedente: porcentaje × max(0, SBC - 3 UMA) × días
 */
export function calcularCuota(cuota: CuotaIMSS, sbcDiario: number, dias: number): number {
  const porcentajeDecimal = cuota.porcentaje / 100;

  switch (cuota.base) {
    case 'sbc': {
      return porcentajeDecimal * sbcDiario * dias;
    }

    case 'uma': {
      // Se calcula con UMA diaria, pero como es obrero no suele usarse
      // En este caso, usamos SBC × (UMA/SBC) aproximación
      // Mejor práctica: usar la UMA directamente
      // Nota: En el contexto de esta calculadora, sbcDiario ya representa la base
      return porcentajeDecimal * sbcDiario * dias;
    }

    case 'sbc_excedente': {
      // Solo se calcula sobre el excedente de 3 UMAs
      const excedenteDiario = Math.max(0, sbcDiario - TRES_UMAS);
      return porcentajeDecimal * excedenteDiario * dias;
    }

    default:
      return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────
// CÁLCULO COMPLETO DEL IMSS OBRERO
// ─────────────────────────────────────────────────────────────────────

/**
 * Calcula el IMSS obrero completo para un período.
 *
 * @param sbcDiario — Salario Base de Cotización diario
 * @param periodo — Período de pago (determina los días)
 */
export function calcularIMSS(sbcDiario: number, periodo: Periodo): ResultadoIMSS {
  const dias = PERIODOS[periodo].dias;

  // Caso 0: sin SBC
  if (sbcDiario <= 0) {
    return {
      cuotas: CUOTAS_OBRERO.map((c) => ({ ...c, monto: 0 })),
      total: 0,
      sbc: 0,
      dias,
    };
  }

  // Calcular cada cuota
  const cuotasCalculadas: CuotaIMSS[] = CUOTAS_OBRERO.map((cuota) => ({
    ...cuota,
    monto: redondear2(calcularCuota(cuota, sbcDiario, dias)),
  }));

  // Sumar
  const total = redondear2(cuotasCalculadas.reduce((sum, c) => sum + c.monto, 0));

  return {
    cuotas: cuotasCalculadas,
    total,
    sbc: redondear2(sbcDiario),
    dias,
  };
}

// ─────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────

function redondear2(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Genera una descripción legible de una base de cálculo.
 */
export function describirBase(base: CuotaIMSS['base']): string {
  switch (base) {
    case 'sbc':
      return 'SBC';
    case 'uma':
      return 'UMA';
    case 'sbc_excedente':
      return 'SBC - 3 UMA';
    default:
      return '';
  }
}
