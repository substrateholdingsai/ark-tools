/**
 * Tests unitarios para la lógica de cálculo de ISR.
 * Framework: Vitest
 */

import { describe, it, expect } from 'vitest';
import {
  encontrarRangoISR,
  encontrarRangoSubsidio,
  calcularISRTarifaMensual,
  calcularSubsidioMensual,
  calcularISR,
  formatearMXN,
} from './calcularISR';
import { CATALOGO_2026 } from '@/data/valores-vigentes/catalogo';

interface TarifaISRRango {
  limiteInferior: number;
  limiteSuperior: number | null;
  cuotaFija: number;
  tasa: number;
}

// Valores oficiales SAT 2026 (desde catálogo centralizado)
const tarifaIsr = CATALOGO_2026.find((v) => v.id === 'TARIFA_ISR_MENSUAL_2026');
if (!tarifaIsr) throw new Error('TARIFA_ISR_MENSUAL_2026 no encontrado en catálogo');
const TABLA_ISR = tarifaIsr.valor as TarifaISRRango[];

// ─────────────────────────────────────────────────────────────────────
// TESTS: encontrarRangoISR
// ─────────────────────────────────────────────────────────────────────

describe('encontrarRangoISR', () => {
  it('encuentra el primer rango para bases bajas', () => {
    const rango = encontrarRangoISR(500);
    expect(rango.limiteInferior).toBe(TABLA_ISR[0]!.limiteInferior);
    expect(rango.tasaExcedente).toBe(TABLA_ISR[0]!.tasa * 100);
  });

  it('encuentra el rango correcto para $10,000', () => {
    const rango = encontrarRangoISR(10000);
    // Rango 3: 6872.79 - 12081.52, tasa 10.88%
    expect(rango.limiteInferior).toBe(TABLA_ISR[2]!.limiteInferior);
    expect(rango.tasaExcedente).toBe(TABLA_ISR[2]!.tasa * 100);
  });

  it('encuentra el rango correcto para $30,000', () => {
    const rango = encontrarRangoISR(30000);
    // Rango 6: 16799.17 - 33929.88, tasa 21.36%
    expect(rango.tasaExcedente).toBe(TABLA_ISR[5]!.tasa * 100);
  });

  it('retorna el último rango para bases muy altas', () => {
    // El último rango inicia en 407,791.36 (tasa 35%)
    const rango = encontrarRangoISR(500000);
    expect(rango.tasaExcedente).toBe(TABLA_ISR[TABLA_ISR.length - 1]!.tasa * 100);
  });
});

// ─────────────────────────────────────────────────────────────────────
// TESTS: encontrarRangoSubsidio
// ─────────────────────────────────────────────────────────────────────

describe('encontrarRangoSubsidio', () => {
  it('encuentra subsidio para base baja', () => {
    const rango = encontrarRangoSubsidio(1500);
    expect(rango).not.toBeNull();
    expect(rango?.subsidio).toBe(407.02);
  });

  it('retorna null para base alta', () => {
    const rango = encontrarRangoSubsidio(8000);
    expect(rango).toBeNull();
  });

  it('retorna null en el último rango (subsidio 0)', () => {
    const rango = encontrarRangoSubsidio(10000);
    expect(rango).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────
// TESTS: calcularISRTarifaMensual
// ─────────────────────────────────────────────────────────────────────

describe('calcularISRTarifaMensual', () => {
  it('calcula ISR tarifa para base de $10,000', () => {
    const { isrTarifa } = calcularISRTarifaMensual(10000);
    // Rango 3: 6872.79 - 12081.52, cuota fija 403.25, tasa 10.88%
    // Excedente: 10000 - 6872.79 = 3127.21
    // ISR tarifa: 403.25 + 3127.21 × 0.1088 = 743.49
    const rango = TABLA_ISR[2]!;
    const esperado = rango.cuotaFija + (10000 - rango.limiteInferior) * rango.tasa;
    expect(isrTarifa).toBeCloseTo(esperado, 1);
  });

  it('calcula ISR tarifa para base de $20,000', () => {
    const { isrTarifa } = calcularISRTarifaMensual(20000);
    // Rango 6: 16799.17 - 33929.88, cuota fija 1776.73, tasa 21.36%
    // Excedente: 20000 - 16799.17 = 3200.83
    // ISR tarifa: 1776.73 + 3200.83 × 0.2136 = 2460.43
    const rango = TABLA_ISR[5]!;
    const esperado = rango.cuotaFija + (20000 - rango.limiteInferior) * rango.tasa;
    expect(isrTarifa).toBeCloseTo(esperado, 1);
  });

  it('retorna ISR 0 para base de $500', () => {
    const { isrTarifa } = calcularISRTarifaMensual(500);
    // Rango 1: 0.01 - 809.17, cuota 0, tasa 1.92%
    // ISR: 0 + (500 - 0.01) × 0.0192 = 9.60
    const rango = TABLA_ISR[0]!;
    const esperado = rango.cuotaFija + (500 - rango.limiteInferior) * rango.tasa;
    expect(isrTarifa).toBeCloseTo(esperado, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────
// TESTS: calcularSubsidioMensual
// ─────────────────────────────────────────────────────────────────────

describe('calcularSubsidioMensual', () => {
  it('calcula subsidio para base de $1,500', () => {
    const { subsidio } = calcularSubsidioMensual(1500);
    expect(subsidio).toBe(407.02);
  });

  it('retorna subsidio 0 para base de $8,000', () => {
    const { subsidio } = calcularSubsidioMensual(8000);
    expect(subsidio).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// TESTS: calcularISR (integración + conversión de período)
// ─────────────────────────────────────────────────────────────────────

describe('calcularISR', () => {
  it('calcula ISR mensual para base de $20,000', () => {
    const result = calcularISR(20000, 'mensual');
    // ISR tarifa calculado con valores oficiales SAT
    const rango = TABLA_ISR[5]!;
    const isrTarifa = rango.cuotaFija + (20000 - rango.limiteInferior) * rango.tasa;
    // Subsidio: 0 (base alta)
    // ISR final: isrTarifa
    expect(result.isrFinal).toBeCloseTo(isrTarifa, 1);
    expect(result.subsidio).toBe(0);
  });

  it('convierte sueldo quincenal a mensual y viceversa', () => {
    // $10,000 quincenal = $20,000 mensual equivalente
    const result = calcularISR(10000, 'quincenal');
    // ISR mensual calculado con valores oficiales, dividido entre 2
    const rango = TABLA_ISR[5]!;
    const isrTarifa = rango.cuotaFija + (20000 - rango.limiteInferior) * rango.tasa;
    expect(result.isrFinal).toBeCloseTo(isrTarifa / 2, 1);
  });

  it('aplica subsidio a sueldos bajos', () => {
    // $1,000 quincenal = $2,000 mensual
    const result = calcularISR(1000, 'quincenal');
    // Base mensual: 2000, subsidio aplicado, ISR final: 0
    expect(result.isrFinal).toBe(0);
    expect(result.subsidio).toBeGreaterThan(0);
  });

  it('retorna 0 con base 0', () => {
    const result = calcularISR(0, 'mensual');
    expect(result.isrFinal).toBe(0);
    expect(result.isrTarifa).toBe(0);
    expect(result.subsidio).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// TESTS: formatearMXN
// ─────────────────────────────────────────────────────────────────────

describe('formatearMXN', () => {
  it('formatea valores como moneda', () => {
    expect(formatearMXN(1234.5)).toContain('1,234.50');
    expect(formatearMXN(0)).toContain('0.00');
  });
});
