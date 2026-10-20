/**
 * ARK TOOLS — Calculadora Nómina Rápida 2026
 * Definición de períodos de pago
 */

import type { Periodo, PeriodoInfo } from '../types';

export const PERIODOS: Record<Periodo, PeriodoInfo> = {
  diario: { id: 'diario', label: 'Día', dias: 1, vecesAlAnio: 365 },
  semanal: { id: 'semanal', label: 'Sem', dias: 7, vecesAlAnio: 52 },
  quincenal: { id: 'quincenal', label: 'Qna', dias: 15, vecesAlAnio: 24 },
  mensual: { id: 'mensual', label: 'Mes', dias: 30, vecesAlAnio: 12 },
};

/**
 * Factor de conversión del período a mensual.
 * Convierte el sueldo del período a su equivalente mensual,
 * para aplicar la tabla ISR mensual.
 */
export function factorMensual(periodo: Periodo): number {
  return PERIODOS.mensual.dias / PERIODOS[periodo].dias;
}

export const LISTA_PERIODOS: PeriodoInfo[] = [
  PERIODOS.diario,
  PERIODOS.semanal,
  PERIODOS.quincenal,
  PERIODOS.mensual,
];
