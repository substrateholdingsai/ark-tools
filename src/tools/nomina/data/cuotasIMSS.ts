/**
 * ARK TOOLS — Calculadora Nómina Rápida 2026
 * Cuotas IMSS obrero 2026
 *
 * Fuente: LSS Art. 25, 106, 107, 147, 168, 211
 * Última actualización: Octubre 2026
 *
 * NOTA: Estas son las cuotas OBRERO (empleado). El patrón tiene
 * cuotas adicionales que NO se calculan aquí.
 *
 * Bases:
 *  - sbc: Salario Base de Cotización
 *  - uma: UMA diaria (valor del día)
 *  - sbc_excedente: Excedente del SBC sobre 3 UMAs
 */

import type { CuotaIMSS } from '../types';
import { UMA_DIARIA } from '@/tools/sbc/data/uma';

/**
 * Cuotas IMSS obrero mensuales 2026.
 * Los porcentajes se aplican a la base correspondiente.
 */
export const CUOTAS_OBRERO: CuotaIMSS[] = [
  {
    ramo: 'Enfermedades y Maternidad',
    fundamento: 'LSS Art. 25 Frac. I',
    porcentaje: 0.25,
    base: 'sbc',
    monto: 0,
  },
  {
    ramo: 'Enfermedades y Maternidad (excedente)',
    fundamento: 'LSS Art. 25 Frac. II',
    porcentaje: 0.60,
    base: 'sbc_excedente',
    monto: 0,
  },
  {
    ramo: 'Invalidez y Vida',
    fundamento: 'LSS Art. 147',
    porcentaje: 0.625,
    base: 'sbc',
    monto: 0,
  },
  {
    ramo: 'Cesantía en Edad Avanzada y Vejez',
    fundamento: 'LSS Art. 168',
    porcentaje: 1.125,
    base: 'sbc',
    monto: 0,
  },
  {
    ramo: 'Guarderías y Prestaciones Sociales',
    fundamento: 'LSS Art. 211',
    porcentaje: 0.00, // No aplica para obrero en 2026
    base: 'sbc',
    monto: 0,
  },
];

/**
 * UMA multiplicada por 3 (base para excedente).
 */
export const TRES_UMAS = UMA_DIARIA * 3;
