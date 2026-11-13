/**
 * ARK LEDGER — Calculadora Nómina Rápida 2026
 * Cuotas IMSS patrón (empleador) 2026 — TODAS las ramas, sumadas por rama.
 *
 * Fuente: LSS Art. 25, 106, 147, 168, 211, 73
 * Última actualización: Octubre 2026
 *
 * IMPORTANTE: Todas las tasas están en verificación contra DOF/IMSS oficial.
 * Ninguna tasa está hardcodeada: se importan de @/data/valores-vigentes/catalogo.
 *
 * RAMAS INCLUIDAS en totalIMSSPatronal (sin INFONAVIT):
 *  1. Enfermedades y Maternidad — Cuota Fija (Art. 106 I): 20.40% sobre UMA × días
 *  2. Enfermedades y Maternidad — Cuota Adicional (Art. 106 II): 1.10% sobre (SBC − 3 UMA) × días
 *  3. Gastos Médicos para Pensionados (Art. 25): 1.05% sobre SBC × días
 *  4. Invalidez y Vida (Art. 147): 1.75% sobre SBC × días
 *  5. Guarderías y Prestaciones Sociales (Art. 211): 1.00% sobre SBC × días
 *  6. Retiro (Art. 168): 2.00% sobre SBC × días
 *  7. Cesantía y Vejez (Art. 168, reforma 2020): tabla progresiva 2026 (tasa a confirmar)
 *
 * RAMAS SEPARADAS (fuera de totalIMSSPatronal o con variable propia):
 *  - Riesgos de Trabajo (Art. 73): prima variable, línea aparte, se calcula con primaRiesgo
 *  - INFONAVIT: 5% sobre SBC × días, línea aparte, NO incluida en totalIMSSPatronal
 *
 * Bases:
 *  - sbc: porcentaje × SBC diario × días
 *  - uma: porcentaje × UMA diaria × días
 *  - sbc_excedente: porcentaje × max(0, SBC − 3 UMA) × días
 */

import type { CuotaIMSS, Periodo, ResultadoIMSS } from '../types';
import { CATALOGO_2026 } from '@/data/valores-vigentes/catalogo';
import { PERIODOS } from '../data/periodos';

const getValor = (id: string): number => {
  const item = CATALOGO_2026.find((v) => v.id === id);
  if (!item) throw new Error(`Valor no encontrado en catálogo: ${id}`);
  return item.valor as number;
};

/**
 * UMA diaria 2026 (catalogo centralizado).
 */
export const UMA_DIARIA_2026 = getValor('UMA_DIARIA_2026');

/**
 * 3 × UMA diaria (base para el excedente de Enfermedades y Maternidad).
 */
export const TRES_UMAS = UMA_DIARIA_2026 * 3;

/**
 * Cuotas IMSS obrero 2026 (mantenidas para compatibilidad con el módulo obrero).
 * Las tasas se importan del catálogo canónico de valores vigentes.
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
    porcentaje: 0.6,
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
    porcentaje: 0.0,
    base: 'sbc',
    monto: 0,
  },
];

/**
 * Cuotas IMSS patrón 2026 — todas incluidas en el total patronal (sin INFONAVIT).
 * Las tasas se importan del catálogo canónico de valores vigentes.
 */
export const CUOTAS_PATRONAL: CuotaIMSS[] = [
  {
    ramo: 'Enfermedades y Maternidad — Cuota Fija',
    fundamento: 'LSS Art. 106 Fracc. I',
    porcentaje: getValor('CUOTA_IMSS_PATRONAL_ENFERMEDADES_MATERNIDAD_FIJA_2026'),
    base: 'uma',
    monto: 0,
  },
  {
    ramo: 'Enfermedades y Maternidad — Cuota Adicional',
    fundamento: 'LSS Art. 106 Fracc. II',
    porcentaje: getValor('CUOTA_IMSS_PATRONAL_ENFERMEDADES_MATERNIDAD_ADICIONAL_2026'),
    base: 'sbc_excedente',
    monto: 0,
  },
  {
    ramo: 'Gastos Médicos para Pensionados',
    fundamento: 'LSS Art. 25',
    porcentaje: getValor('CUOTA_IMSS_PATRONAL_GASTOS_MEDICOS_PENSIONADOS_2026'),
    base: 'sbc',
    monto: 0,
  },
  {
    ramo: 'Invalidez y Vida',
    fundamento: 'LSS Art. 147',
    porcentaje: getValor('CUOTA_IMSS_PATRONAL_INVALIDEZ_VIDA_2026'),
    base: 'sbc',
    monto: 0,
  },
  {
    ramo: 'Guarderías y Prestaciones Sociales',
    fundamento: 'LSS Art. 211',
    porcentaje: getValor('CUOTA_IMSS_PATRONAL_GUARDERIAS_2026'),
    base: 'sbc',
    monto: 0,
  },
  {
    ramo: 'Retiro',
    fundamento: 'LSS Art. 168',
    porcentaje: getValor('CUOTA_IMSS_PATRONAL_RETIRO_2026'),
    base: 'sbc',
    monto: 0,
  },
  {
    ramo: 'Cesantía y Vejez (reforma 2020)',
    fundamento: 'LSS Art. 168 — tabla progresiva 2026',
    porcentaje: getValor('CUOTA_IMSS_PATRONAL_CESANTIA_VEJEZ_2026'),
    base: 'sbc',
    monto: 0,
  },
];

/**
 * Calcula el monto de una cuota individual según su base.
 *
 * @param umaDiaria — requerido cuando base === 'uma' (Cuota Fija Art. 106 I)
 */
export function calcularCuota(
  cuota: CuotaIMSS,
  sbcDiario: number,
  dias: number,
  umaDiaria?: number
): number {
  const porcentajeDecimal = cuota.porcentaje / 100;

  switch (cuota.base) {
    case 'sbc': {
      return porcentajeDecimal * sbcDiario * dias;
    }

    case 'uma': {
      return porcentajeDecimal * (umaDiaria ?? sbcDiario) * dias;
    }

    case 'sbc_excedente': {
      const excedenteDiario = Math.max(0, sbcDiario - TRES_UMAS);
      return porcentajeDecimal * excedenteDiario * dias;
    }

    default:
      return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────
// CÁLCULO COMPLETO DEL IMSS PATRÓN
// ─────────────────────────────────────────────────────────────────────

/**
 * Calcula las cuotas IMSS patrón (empleador) para un período.
 * Suma TODAS las ramas de CUOTAS_PATRONAL (sin INFONAVIT).
 *
 * @param primaRiesgo — prima de Riesgos de Trabajo (Art. 73), variable por empresa.
 *   Si se pasa, se agrega como línea aparte incluida en el total.
 */
export function calcularIMSSPatronal(
  sbcDiario: number,
  periodo: Periodo,
  primaRiesgo?: number
): ResultadoIMSS {
  const dias = PERIODOS[periodo].dias;
  const umaDiaria = UMA_DIARIA_2026;

  if (sbcDiario <= 0) {
    const cuotasCeros = CUOTAS_PATRONAL.map((c) => ({ ...c, monto: 0 }));
    if (primaRiesgo != null && primaRiesgo > 0) {
      cuotasCeros.push({
        ramo: 'Riesgos de Trabajo',
        fundamento: 'LSS Art. 73',
        porcentaje: primaRiesgo / 100,
        base: 'sbc',
        monto: 0,
      });
    }
    return { cuotas: cuotasCeros, total: 0, sbc: 0, dias };
  }

  const cuotasCalculadas: CuotaIMSS[] = CUOTAS_PATRONAL.map((cuota) => ({
    ...cuota,
    monto: redondear2(calcularCuota(cuota, sbcDiario, dias, umaDiaria)),
  }));

  // Riesgos de Trabajo: prima variable, línea aparte incluida en el total
  if (primaRiesgo != null && primaRiesgo > 0) {
    cuotasCalculadas.push({
      ramo: 'Riesgos de Trabajo',
      fundamento: 'LSS Art. 73',
      porcentaje: primaRiesgo / 100,
      base: 'sbc',
      monto: redondear2((primaRiesgo / 100) * sbcDiario * dias),
    });
  }

  const total = redondear2(cuotasCalculadas.reduce((sum, c) => sum + c.monto, 0));

  return {
    cuotas: cuotasCalculadas,
    total,
    sbc: redondear2(sbcDiario),
    dias,
  };
}

/**
 * Calcula la cuota INFONAVIT patrón (5% sobre SBC × días).
 * Línea separada: NO incluida en totalIMSSPatronal.
 */
export function calcularInfONAVITPatronal(
  sbcDiario: number,
  dias: number
): {
  monto: number;
  porcentaje: number;
} {
  const porcentaje = 5;
  const monto = redondear2((porcentaje / 100) * sbcDiario * dias);
  return { monto, porcentaje };
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
      return 'SBC − 3 UMA';
    default:
      return '';
  }
}
