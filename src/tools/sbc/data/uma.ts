/**
 * ARK LEDGER — Calculadora SBC 2026
 * Constantes oficiales del sistema IMSS 2026
 */

import type { ConstantesIMSS, ParametrosSBC, ZonaSalarial } from '../types';
import { CATALOGO_2026 } from '@/data/valores-vigentes/catalogo';

const getValor = (id: string): number => {
  const item = CATALOGO_2026.find((v) => v.id === id);
  if (!item) throw new Error(`Valor no encontrado en catálogo: ${id}`);
  return item.valor as number;
};

export const UMA_DIARIA = getValor('UMA_DIARIA_2026');
export const SALARIO_MINIMO_GENERAL = getValor('SALARIO_MINIMO_GENERAL_2026');
export const SALARIO_MINIMO_FRONTERA = getValor('SALARIO_MINIMO_FRONTERA_2026');
export const TOPE_UMAS = 25;
export const TOPE_PESOS = getValor('TOPE_SBC_25_UMA_2026');

export const CONSTANTES_IMSS: ConstantesIMSS = {
  umaDiaria: UMA_DIARIA,
  topeUmas: TOPE_UMAS,
  topePesos: TOPE_PESOS,
  salarioMinimoGeneral: SALARIO_MINIMO_GENERAL,
  salarioMinimoFrontera: SALARIO_MINIMO_FRONTERA,
};

export function obtenerSalarioMinimo(zona: ZonaSalarial): number {
  return zona === 'frontera' ? SALARIO_MINIMO_FRONTERA : SALARIO_MINIMO_GENERAL;
}

export const PARAMETROS_DEFAULT: ParametrosSBC = {
  salarioDiario: 580,
  diasVacaciones: 12,
  primaVacacional: 25,
  diasAguinaldo: 15,
  zona: 'general',
};

export const PRESETS_SALARIO = [
  { label: 'Mínimo general', valor: SALARIO_MINIMO_GENERAL },
  { label: 'Mínimo frontera', valor: SALARIO_MINIMO_FRONTERA },
  { label: 'Típico', valor: 400 },
  { label: 'Profesional', valor: 580 },
  { label: 'Alto', valor: 850 },
] as const;

// LFT Art. 76 (reforma de Vacaciones Dignas, DOF 27/12/2022, vigente 2023)
// 1:12, 2:14, 3:16, 4:18, 5:20, 6-10:22, 11-15:24, 16-20:26, 21-25:28, 26-30:30, 31-35:32
export const TABLA_VACACIONES_LFT: { anios: number; dias: number; label: string }[] = [
  { anios: 1, dias: 12, label: 'Año 1' },
  { anios: 2, dias: 14, label: 'Año 2' },
  { anios: 3, dias: 16, label: 'Año 3' },
  { anios: 4, dias: 18, label: 'Año 4' },
  { anios: 5, dias: 20, label: 'Año 5' },
  { anios: 6, dias: 22, label: 'Año 6' },
  { anios: 10, dias: 22, label: 'Años 6-10' },
  { anios: 11, dias: 24, label: 'Año 11' },
  { anios: 15, dias: 24, label: 'Años 11-15' },
  { anios: 20, dias: 26, label: 'Años 16-20' },
  { anios: 25, dias: 28, label: 'Años 21-25' },
  { anios: 30, dias: 30, label: 'Años 26-30' },
  { anios: 31, dias: 32, label: 'Año 31' },
  { anios: 35, dias: 32, label: 'Años 31-35' },
];

export function diasVacacionesPorAntiguedad(anios: number): number {
  if (anios < 1) return 0;
  if (anios === 1) return 12;
  if (anios === 2) return 14;
  if (anios === 3) return 16;
  if (anios === 4) return 18;
  if (anios === 5) return 20;
  if (anios <= 10) return 22;
  if (anios <= 15) return 24;
  if (anios <= 20) return 26;
  if (anios <= 25) return 28;
  if (anios <= 30) return 30;
  return 32; // 31+
}
