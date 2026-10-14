/**
 * ARK TOOLS — Calculadora Nómina Rápida 2026
 * Valores por defecto y presets
 */

import type { ParametrosNomina } from '../types';
import { UMA_DIARIA } from '@/tools/sbc/data/uma';

/**
 * Parámetros por defecto (mensual, sueldo típico de $18,000).
 */
export const PARAMETROS_DEFAULT: ParametrosNomina = {
  periodo: 'mensual',
  sueldoBruto: 18000,
  diasTrabajados: 30,
  diasPeriodo: 30,
  sbcDiario: 610, // Estimado: 18,000 / 30 × factor 1.05 aprox.
};

/**
 * Presets de sueldo mensual (para botones rápidos).
 */
export const PRESETS_SUELDO = [
  { label: 'Mínimo', valor: 8364 },   // 278.80 × 30
  { label: 'Bajo', valor: 12000 },
  { label: 'Típico', valor: 18000 },
  { label: 'Medio', valor: 30000 },
  { label: 'Alto', valor: 50000 },
] as const;

/**
 * UMA diaria (re-export para conveniencia).
 */
export { UMA_DIARIA };
