/**
 * ARK TOOLS — Calculadora Nómina Rápida 2026
 * Valores por defecto y presets
 *
 * UMA proveniente del catálogo centralizado de valores vigentes.
 */

import type { ParametrosNomina } from '../types';
import { CATALOGO_2026 } from '@/data/valores-vigentes/catalogo';

const getValor = (id: string): number => {
  const item = CATALOGO_2026.find((v) => v.id === id);
  if (!item) throw new Error(`Valor no encontrado en catálogo: ${id}`);
  return item.valor as number;
};

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
  { label: 'Mínimo general', valor: getValor('SALARIO_MINIMO_GENERAL_2026') * 30 },
  { label: 'Mínimo frontera', valor: getValor('SALARIO_MINIMO_FRONTERA_2026') * 30 },
  { label: 'Bajo', valor: 12000 },
  { label: 'Típico', valor: 18000 },
  { label: 'Medio', valor: 30000 },
  { label: 'Alto', valor: 50000 },
] as const;

/**
 * UMA diaria (re-export para conveniencia desde catálogo).
 */
export const UMA_DIARIA = getValor('UMA_DIARIA_2026');
