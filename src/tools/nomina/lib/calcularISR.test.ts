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

// ─────────────────────────────────────────────────────────────────────
// TESTS: encontrarRangoISR
// ─────────────────────────────────────────────────────────────────────

describe('encontrarRangoISR', () => {
  it('encuentra el primer rango para bases bajas', () => {
    const rango = encontrarRangoISR(500);
    expect(rango.limiteInferior).toBe(0.01);
    expect(rango.tasaExcedente).toBe(1.92);
  });

  it('encuentra el rango correcto para $10,000', () => {
    const rango = encontrarRangoISR(10000);
    // Está entre 6328.08 y 11125.00
    expect(rango.limiteInferior).toBe(6328.08);
    expect(rango.tasaExcedente).toBe(10.88);
  });

  it('encuentra el rango correcto para $30,000', () => {
    const rango = encontrarRangoISR(30000);
    // Está entre 15487.01 y 31236.00
    expect(rango.tasaExcedente).toBe(21.36);
  });

  it('retorna el último rango para bases muy altas', () => {
    const rango = encontrarRangoISR(200000);
    expect(rango.tasaExcedente).toBe(35.00);
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
    // Rango: 6328.08 - 11125.00, cuota fija 371.48, tasa 10.88%
    // Excedente: 10000 - 6328.08 = 3671.92
    // ISR tarifa: 371.48 + 3671.92 × 0.1088 = 770.98
    expect(isrTarifa).toBeCloseTo(770.98, 1);
  });

  it('calcula ISR tarifa para base de $20,000', () => {
    const { isrTarifa } = calcularISRTarifaMensual(20000);
    // Rango: 15487.01 - 31236.00, cuota fija 1640.18, tasa 21.36%
    // Excedente: 20000 - 15487.01 = 4512.99
    // ISR tarifa: 1640.18 + 4512.99 × 0.2136 = 2604.15
    expect(isrTarifa).toBeCloseTo(2604.15, 1);
  });

  it('retorna ISR 0 para base de $500', () => {
    const { isrTarifa } = calcularISRTarifaMensual(500);
    // Rango: 0.01 - 746.04, cuota 0, tasa 1.92%
    // ISR: 0 + (500 - 0.01) × 0.0192 = 9.60
    expect(isrTarifa).toBeCloseTo(9.60, 1);
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
    // ISR tarifa: 2604.15
    // Subsidio: 0 (base alta)
    // ISR final: 2604.15
    expect(result.isrFinal).toBeCloseTo(2604.15, 1);
    expect(result.subsidio).toBe(0);
  });

  it('convierte sueldo quincenal a mensual y viceversa', () => {
    // $10,000 quincenal = $20,000 mensual equivalente
    const result = calcularISR(10000, 'quincenal');
    // ISR mensual ≈ 2604.15, dividido entre 2 ≈ 1302.08
    expect(result.isrFinal).toBeCloseTo(1302.08, 1);
  });

  it('aplica subsidio a sueldos bajos', () => {
    // $1,000 quincenal = $2,000 mensual
    const result = calcularISR(1000, 'quincenal');
    // Base mensual: 2000, subsidio: 406.83, tarifa: ~35.35
    // ISR mensual: 0 (subsidio cubre tarifa)
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
