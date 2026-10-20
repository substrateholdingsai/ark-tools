/**
 * ARK TOOLS — Calculadora Nómina Rápida 2026
 * Orquestador del cálculo completo de nómina
 *
 * Combina ISR + IMSS obrero para obtener el neto a pagar.
 */

import type { ParametrosNomina, ResultadoNomina } from '../types';
import { calcularISR, formatearMXN } from './calcularISR';
import { calcularIMSS } from './calcularIMSS';
import { PERIODOS } from '../data/periodos';

// ─────────────────────────────────────────────────────────────────────
// CÁLCULO COMPLETO
// ─────────────────────────────────────────────────────────────────────

/**
 * Calcula la nómina completa.
 *
 * Flujo:
 *   1. Sueldo bruto del período
 *   2. Ajustar por días trabajados (si aplica prorrateo)
 *   3. Base gravable ISR = sueldo bruto (en este caso, sin deducciones)
 *   4. Calcular ISR sobre la base
 *   5. Calcular IMSS obrero sobre el SBC
 *   6. Total deducciones = ISR + IMSS
 *   7. Neto = sueldo bruto - total deducciones
 */
export function calcularNomina(parametros: ParametrosNomina): ResultadoNomina {
  const { periodo, sueldoBruto, diasTrabajados, diasPeriodo, sbcDiario } = parametros;

  const infoPeriodo = PERIODOS[periodo];

  // Paso 1: Sueldo bruto ajustado por días trabajados
  const factorDias = diasPeriodo > 0 ? Math.min(1, diasTrabajados / diasPeriodo) : 1;
  const sueldoAjustado = redondear2(sueldoBruto * factorDias);

  // Paso 2: Base gravable para ISR (sin deducciones en este MVP)
  const baseISR = sueldoAjustado;

  // Paso 3: Calcular ISR
  const isr = calcularISR(baseISR, periodo);

  // Paso 4: Calcular IMSS obrero
  const imss = calcularIMSS(sbcDiario, periodo);

  // Paso 5: Total de deducciones
  const totalDeducciones = redondear2(isr.isrFinal + imss.total);

  // Paso 6: Neto
  const neto = redondear2(Math.max(0, sueldoAjustado - totalDeducciones));

  return {
    sueldoBruto: sueldoAjustado,
    baseISR,
    isr,
    imss,
    totalDeducciones,
    neto,
    periodo: infoPeriodo,
  };
}

// ─────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────

function redondear2(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Genera un resumen de texto para copiar al portapapeles.
 */
export function generarResumenTexto(
  parametros: ParametrosNomina,
  resultado: ResultadoNomina
): string {
  const partes = [
    `Nómina ${parametros.periodo.toUpperCase()}`,
    `Bruto: ${formatearMXN(resultado.sueldoBruto)}`,
    `ISR: ${formatearMXN(resultado.isr.isrFinal)}`,
    `IMSS: ${formatearMXN(resultado.imss.total)}`,
    `Neto: ${formatearMXN(resultado.neto)}`,
  ];
  return partes.join(' | ');
}
