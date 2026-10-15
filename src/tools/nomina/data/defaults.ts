/**
 * ARK TOOLS — Calculadora Nómina Rápida 2026
 * Valores por defecto y presets
 * 
 * UMA proveniente del catálogo centralizado de valores vigentes.
 */

import type { ParametrosNomina } from '../types';
import { UMA, SALARIO_MINIMO } from '@/data/valores-vigentes/catalogo';

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
 * Basados en salario mínimo oficial del catálogo.
 */
export const PRESETS_SUELDO = [
  { label: 'Mínimo general', valor: SALARIO_MINIMO.general2026.valor * 30 },
  { label: 'Mínimo frontera', valor: SALARIO_MINIMO.frontera2026.valor * 30 },
  { label: 'Bajo', valor: 12000 },
  { label: 'Típico', valor: 18000 },
  { label: 'Medio', valor: 30000 },
  { label: 'Alto', valor: 50000 },
] as const;

/**
 * UMA diaria (re-export para conveniencia desde catálogo).
 */
export const UMA_DIARIA = UMA.diaria2026.valor;
