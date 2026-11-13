/**
 * ARK LEDGER — Cálculo de Retención 2% Clínicas y Hospitales (Yucatán)
 * Ley General de Hacienda del Estado de Yucatán (LGHY):
 * - Arts. 16 al 20: Impuesto sobre el Ejercicio Profesional (3%, pago día 17)
 * - Art. 20-Bis (adicionado D.O. 26-dic-2025): Retención 2% al pago, entero día 10 mes siguiente
 * - Art. 20-Ter: Constancia AAFY-30 dentro de los 5 días siguientes al pago
 * - Art. 20-Quater: Responsabilidad solidaria
 * - Art. 20-Quinquies: Declaración informativa trimestral (1er y 2do trim. 2026 acumulados en julio 2026)
 * - Acuerdo AAFY 12/2026 (III.1.5): Entero de enero 2026 prorrogado al 20 de febrero de 2026
 */

import type {
  RetencionClinicasInput,
  RetencionClinicasResultado,
  TrimestreInformativo,
} from '../types';

export const MENSAJE_SOLO_YUCATAN = 'Solo Yucatán, Art. 20-Bis LGHY';

const r2 = (n: number): number => Math.round(n * 100) / 100;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function sumarDiasIso(fechaIso: string, dias: number): string {
  const [y, m, d] = fechaIso.split('-').map(Number);
  if (!y || !m || !d) return fechaIso;
  const dt = new Date(Date.UTC(y, m - 1, d + dias));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

function calcularFechaMesSiguiente(fechaIso: string, dia: number): string {
  const [y, m] = fechaIso.split('-').map(Number);
  if (!y || !m) return fechaIso;
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  return `${nextYear}-${pad2(nextMonth)}-${pad2(dia)}`;
}

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function obtenerTrimestreInformativo(fechaIso: string): TrimestreInformativo {
  const [y, m] = fechaIso.split('-').map(Number);
  if (!y || !m) {
    return {
      periodo: 'Sin periodo',
      mesLimite: 'Indeterminado',
      label: 'Declaración trimestral Art. 20-Quinquies LGHY',
    };
  }
  // Transitory Fifth (Quinto Transitorio): Q1 + Q2 2026 acumulados y presentados en julio 2026
  if (y === 2026 && m <= 6) {
    return {
      periodo: 'Q1+Q2 2026',
      mesLimite: 'julio 2026',
      label:
        '1er y 2do trimestre 2026: presentación acumulada en julio 2026 (Transitory Fifth, Art. 20-Quinquies LGHY)',
    };
  }
  const trim = Math.ceil(m / 3);
  const trimEndMonth = trim * 3;
  let limYear = y;
  let limMonth = trimEndMonth + 1;
  if (limMonth > 12) {
    limMonth = 1;
    limYear = y + 1;
  }
  return {
    periodo: `Q${trim} ${y}`,
    mesLimite: `${MESES[limMonth - 1]} ${limYear}`,
    label: `Trimestre ${trim} de ${y}: presentación en ${MESES[limMonth - 1]} ${limYear} (Art. 20-Quinquies LGHY)`,
  };
}

export function calcularRetencionClinicas(
  input: RetencionClinicasInput
): RetencionClinicasResultado {
  if ((input.estadoId || '').trim().toUpperCase() !== 'YUC') {
    throw new Error(MENSAJE_SOLO_YUCATAN);
  }

  const rawBase = Number(input.montoHonorarios);
  if (Number.isNaN(rawBase)) {
    throw new Error('Base de honorarios requerida: montoHonorarios debe ser un número válido.');
  }
  if (rawBase < 0) {
    throw new Error('Base de honorarios no puede ser negativa.');
  }
  const base = r2(rawBase);
  const retencion2Pct = r2(base * 0.02);
  const netoPagar = r2(base - retencion2Pct);
  const impuestoEjercicioProfesional3Pct = r2(base * 0.03);

  const fechaPago = /^\d{4}-\d{2}-\d{2}$/.test(input.fechaPago) ? input.fechaPago : '2026-01-15';

  const esEnero2026 = fechaPago.startsWith('2026-01-');
  const fechaLimiteEntero = esEnero2026 ? '2026-02-20' : calcularFechaMesSiguiente(fechaPago, 10);
  const fechaLimitePagoImpuesto = calcularFechaMesSiguiente(fechaPago, 17);
  const fechaLimiteConstancia = sumarDiasIso(fechaPago, 5);

  const notaAcuerdoAafy2026 = esEnero2026
    ? 'Constancia dentro de los 5 días siguientes al pago (Art. 20-Ter LGHY). Acumulación mensual no confirmada en reglas oficiales.'
    : 'Constancia dentro de los 5 días siguientes al pago (Art. 20-Ter LGHY). Acumulación mensual no confirmada en reglas oficiales.';

  return {
    base,
    tasaRetencion: 2.0,
    retencion2Pct,
    netoPagar,
    impuestoEjercicioProfesional3Pct,
    fechaLimiteEntero,
    fechaLimitePagoImpuesto,
    fechaLimiteConstancia,
    notaAcuerdoAafy2026,
    trimestreInformativo: obtenerTrimestreInformativo(fechaPago),
  };
}
