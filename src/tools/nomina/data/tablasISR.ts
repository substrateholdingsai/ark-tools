/**
 * ARK TOOLS — Calculadora Nómina Rápida 2026
 * Tablas ISR 2026 + Subsidio al empleo
 *
 * Fuente: Anexo 8 de la RMF 2026 (tarifa mensual)
 * Última actualización: Octubre 2026
 *
 * NOTA: La tabla ISR es MENSUAL. Para otros períodos se convierte
 * el sueldo a mensual, se aplica la tabla, y se reconvierte.
 */

import type { RangoISR, RangoSubsidio } from '../types';
import { TARIFA_ISR } from '@/data/valores-vigentes/catalogo';

/**
 * Tabla ISR mensual 2026 — fuente centralizada en catálogo de valores vigentes.
 * El test de integridad del catálogo valida que TARIFA_ISR.mensual2026
 * tenga fuente, referencia y no esté vencida.
 * 
 * Conversión: el catálogo usa `tasa` (decimal, ej. 0.0192) y el tipo local
 * usa `tasaExcedente` (porcentaje, ej. 1.92).
 */
export const TABLA_ISR_MENSUAL: RangoISR[] = TARIFA_ISR.mensual2026.valor.map(r => ({
  limiteInferior: r.limiteInferior,
  limiteSuperior: r.limiteSuperior,
  cuotaFija: r.cuotaFija,
  tasaExcedente: r.tasa * 100,
}));

/**
 * Tabla de subsidio al empleo mensual 2026.
 * Se aplica a salarios bajos para reducir el ISR a retener.
 */
export const TABLA_SUBSIDIO_MENSUAL: RangoSubsidio[] = [
  { limiteInferior: 0.01,      limiteSuperior: 1768.96,  subsidio: 407.02 },
  { limiteInferior: 1768.97,   limiteSuperior: 2653.38,  subsidio: 406.83 },
  { limiteInferior: 2653.39,   limiteSuperior: 3472.84,  subsidio: 406.62 },
  { limiteInferior: 3472.85,   limiteSuperior: 3537.87,  subsidio: 392.77 },
  { limiteInferior: 3537.88,   limiteSuperior: 4446.15,  subsidio: 382.46 },
  { limiteInferior: 4446.16,   limiteSuperior: 4717.18,  subsidio: 354.23 },
  { limiteInferior: 4717.19,   limiteSuperior: 5335.42,  subsidio: 324.87 },
  { limiteInferior: 5335.43,   limiteSuperior: 6221.59,  subsidio: 294.63 },
  { limiteInferior: 6221.60,   limiteSuperior: 7113.90,  subsidio: 253.54 },
  { limiteInferior: 7113.91,   limiteSuperior: 7382.33,  subsidio: 217.61 },
  { limiteInferior: 7382.34,   limiteSuperior: null,     subsidio: 0      },
];
