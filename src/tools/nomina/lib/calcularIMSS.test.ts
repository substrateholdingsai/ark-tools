/**
 * Tests unitarios para la lógica de cálculo de IMSS obrero.
 */

import { describe, it, expect } from 'vitest';
import { calcularCuota, calcularIMSS } from './calcularIMSS';
import type { CuotaIMSS } from '../types';

// ─────────────────────────────────────────────────────────────────────
// FIXTURES
// ─────────────────────────────────────────────────────────────────────

const cuotaSBC: CuotaIMSS = {
  ramo: 'Test SBC',
  fundamento: 'Test',
  porcentaje: 1.0, // 1%
  base: 'sbc',
  monto: 0,
};

const cuotaExcedente: CuotaIMSS = {
  ramo: 'Test Excedente',
  fundamento: 'Test',
  porcentaje: 0.6, // 0.6%
  base: 'sbc_excedente',
  monto: 0,
};

// ─────────────────────────────────────────────────────────────────────
// TESTS: calcularCuota
// ─────────────────────────────────────────────────────────────────────

describe('calcularCuota', () => {
  it('calcula cuota sobre SBC', () => {
    // 1% × 500 (SBC) × 30 (días) = 150
    const monto = calcularCuota(cuotaSBC, 500, 30);
    expect(monto).toBe(150);
  });

  it('calcula cuota sobre excedente de 3 UMA (SBC alto)', () => {
    // UMA 2026 = 117.31, 3 UMA = 351.93
    // SBC 500, excedente = 500 - 351.93 = 148.07
    // 0.6% × 148.07 × 30 = 26.65
    const monto = calcularCuota(cuotaExcedente, 500, 30);
    expect(monto).toBeCloseTo(26.65, 2);
  });

  it('retorna 0 si SBC es menor que 3 UMA (no hay excedente)', () => {
    // SBC 300, 3 UMA = 351.93, excedente = 0
    const monto = calcularCuota(cuotaExcedente, 300, 30);
    expect(monto).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// TESTS: calcularIMSS
// ─────────────────────────────────────────────────────────────────────

describe('calcularIMSS', () => {
  it('calcula IMSS completo para SBC de 500 mensual', () => {
    const result = calcularIMSS(500, 'mensual');
    // Cuotas (UMA 117.31, 3 UMA = 351.93, excedente = 148.07):
    //  Enfermedades: 0.25% × 500 × 30 = 37.50
    //  Excedente: 0.60% × 148.07 × 30 = 26.65
    //  Invalidez: 0.625% × 500 × 30 = 93.75
    //  Cesantía: 1.125% × 500 × 30 = 168.75
    //  Guarderías: 0
    // Total ≈ 326.65
    expect(result.total).toBeCloseTo(326.65, 2);
    expect(result.dias).toBe(30);
    expect(result.sbc).toBe(500);
  });

  it('calcula IMSS con SBC bajo (sin excedente)', () => {
    const result = calcularIMSS(300, 'mensual');
    //  Excedente: 0
    //  Enfermedades: 0.25% × 300 × 30 = 22.50
    //  Invalidez: 0.625% × 300 × 30 = 56.25
    //  Cesantía: 1.125% × 300 × 30 = 101.25
    // Total = 180.00
    expect(result.total).toBe(180);
  });

  it('calcula IMSS para período quincenal', () => {
    const result = calcularIMSS(500, 'quincenal');
    // Días: 15
    expect(result.dias).toBe(15);
    // El total es aproximadamente la mitad del mensual (163.34 con redondeo por ramo)
    expect(result.total).toBeCloseTo(163.34, 2);
  });

  it('retorna 0 con SBC 0', () => {
    const result = calcularIMSS(0, 'mensual');
    expect(result.total).toBe(0);
    expect(result.sbc).toBe(0);
  });
});
