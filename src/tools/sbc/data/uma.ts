/**
 * ARK TOOLS — Calculadora SBC 2026
 * Constantes oficiales del sistema IMSS 2026
 *
 * Fuentes:
 * - UMA: INEGI, valor vigente a febrero 2026
 * - Salario mínimo: CONASAMI, zona libre de la frontera norte
 * - Tope: LSS Art. 28 (25 UMAs)
 *
 * Última actualización: Octubre 2026
 * 
 * NOTA: Valores provenientes del catálogo centralizado de valores vigentes.
 * El test de integridad del catálogo valida que tengan fuente, referencia y no estén vencidos.
 */

import type { ConstantesIMSS, ParametrosSBC } from '../types';
import { UMA, SALARIO_MINIMO, TOPES_LSS } from '@/data/valores-vigentes/catalogo';

// ─────────────────────────────────────────────────────────────────────
// CONSTANTES 2026 (desde catálogo centralizado)
// ─────────────────────────────────────────────────────────────────────

/** UMA diaria 2026 (INEGI) */
export const UMA_DIARIA = UMA.diaria2026.valor;

/** Salario mínimo frontera norte 2026 (CONASAMI) */
export const SALARIO_MINIMO_FRONTERA = SALARIO_MINIMO.frontera2026.valor;

/** Tope legal: 25 UMAs (LSS Art. 28) */
export const TOPE_UMAS = 25;

/** Tope en pesos: 25 × UMA_DIARIA (desde catálogo TOPES_LSS) */
export const TOPE_PESOS = TOPES_LSS.tope25UMA2026.valor;

/** Constantes agrupadas */
export const CONSTANTES_IMSS: ConstantesIMSS = {
  umaDiaria: UMA_DIARIA,
  topeUmas: TOPE_UMAS,
  topePesos: TOPE_PESOS,
  salarioMinimo: SALARIO_MINIMO_FRONTERA,
};

// ─────────────────────────────────────────────────────────────────────
// PARÁMETROS POR DEFECTO
// ─────────────────────────────────────────────────────────────────────

/** Valores iniciales del formulario */
export const PARAMETROS_DEFAULT: ParametrosSBC = {
  salarioDiario: 580,
  diasVacaciones: 12,
  primaVacacional: 25,
  diasAguinaldo: 15,
};

// ─────────────────────────────────────────────────────────────────────
// PRESETS DE SALARIO (para los botones rápidos)
// ─────────────────────────────────────────────────────────────────────

export const PRESETS_SALARIO = [
  { label: 'Mínimo general', valor: SALARIO_MINIMO.general2026.valor },
  { label: 'Mínimo frontera', valor: SALARIO_MINIMO.frontera2026.valor },
  { label: 'Típico', valor: 400 },
  { label: 'Profesional', valor: 580 },
  { label: 'Alto', valor: 850 },
] as const;

// ─────────────────────────────────────────────────────────────────────
// PRESETS DE DÍAS DE VACACIONES (por antigüedad LFT)
// ─────────────────────────────────────────────────────────────────────

export const PRESETS_VACACIONES = [
  { label: 'Año 1', valor: 6 },
  { label: 'Año 5', valor: 14 },
  { label: 'Año 10', valor: 20 },
  { label: 'Año 20', valor: 28 },
  { label: 'Año 30+', valor: 32 },
] as const;
