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

/**
 * Tabla ISR mensual 2026.
 */
export const TABLA_ISR_MENSUAL: RangoISR[] = [
  { limiteInferior: 0.01,      limiteSuperior: 746.04,   cuotaFija: 0,        tasaExcedente: 1.92  },
  { limiteInferior: 746.05,    limiteSuperior: 6328.07,  cuotaFija: 14.32,    tasaExcedente: 6.40  },
  { limiteInferior: 6328.08,   limiteSuperior: 11125.00, cuotaFija: 371.48,   tasaExcedente: 10.88 },
  { limiteInferior: 11125.01,  limiteSuperior: 12932.00, cuotaFija: 893.33,   tasaExcedente: 16.00 },
  { limiteInferior: 12932.01,  limiteSuperior: 15487.00, cuotaFija: 1182.45,  tasaExcedente: 17.92 },
  { limiteInferior: 15487.01,  limiteSuperior: 31236.00, cuotaFija: 1640.18,  tasaExcedente: 21.36 },
  { limiteInferior: 31236.01,  limiteSuperior: 49233.00, cuotaFija: 5004.12,  tasaExcedente: 23.52 },
  { limiteInferior: 49233.01,  limiteSuperior: 93900.00, cuotaFija: 9236.89,  tasaExcedente: 30.00 },
  { limiteInferior: 93900.01,  limiteSuperior: 125000.00,cuotaFija: 22641.19, tasaExcedente: 32.00 },
  { limiteInferior: 125000.01, limiteSuperior: null,     cuotaFija: 32594.00, tasaExcedente: 35.00 },
];

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
