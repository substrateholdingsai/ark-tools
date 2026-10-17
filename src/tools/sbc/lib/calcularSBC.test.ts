/**
 * Tests unitarios para la lógica de cálculo de SBC.
 * Framework: Vitest
 */

import { describe, it, expect } from 'vitest';
import {
  calcularFactorIntegracion,
  calcularSBCFinal,
  calcularResultadoSBC,
  formatearFactor,
  formatearMXN,
  generarResumenTexto,
} from './calcularSBC';
import { CONSTANTES_IMSS } from '../data/uma';
import type { ParametrosSBC } from '../types';

// ─────────────────────────────────────────────────────────────────────
// FIXTURES
// ─────────────────────────────────────────────────────────────────────

const parametrosEjemplo: ParametrosSBC = {
  salarioDiario: 580,
  diasVacaciones: 12,
  primaVacacional: 25,
  diasAguinaldo: 15,
};

// ─────────────────────────────────────────────────────────────────────
// TESTS: calcularFactorIntegracion
// ─────────────────────────────────────────────────────────────────────

describe('calcularFactorIntegracion', () => {
  it('calcula el factor con parámetros típicos', () => {
    const desglose = calcularFactorIntegracion(parametrosEjemplo);

    // diasPrimaVacacional = 12 × 0.25 = 3
    expect(desglose.diasPrimaVacacional).toBe(3);

    // aporteVacaciones = 3/365 = 0.008219178...
    expect(desglose.aporteVacaciones).toBeCloseTo(3 / 365, 6);

    // aporteAguinaldo = 15/365 = 0.041095890...
    expect(desglose.aporteAguinaldo).toBeCloseTo(15 / 365, 6);

    // factor = 1 + 3/365 + 15/365 = 1 + 18/365 = 1.049315...
    expect(desglose.factor).toBeCloseTo(1 + 18 / 365, 6);

    // diasIntegracion = 3 + 15 = 18
    expect(desglose.diasIntegracion).toBe(18);
  });

  it('retorna factor 1.0 con prestaciones en 0', () => {
    const desglose = calcularFactorIntegracion({
      salarioDiario: 500,
      diasVacaciones: 0,
      primaVacacional: 0,
      diasAguinaldo: 0,
    });

    expect(desglose.factor).toBe(1);
    expect(desglose.diasIntegracion).toBe(0);
  });

  it('maneja vacaciones al máximo (32 días)', () => {
    const desglose = calcularFactorIntegracion({
      salarioDiario: 500,
      diasVacaciones: 32,
      primaVacacional: 25,
      diasAguinaldo: 15,
    });

    // 32 × 0.25 = 8 días de prima vacacional
    expect(desglose.diasPrimaVacacional).toBe(8);
    // 8 + 15 = 23 días de integración
    expect(desglose.diasIntegracion).toBe(23);
  });
});

// ─────────────────────────────────────────────────────────────────────
// TESTS: calcularSBCFinal (topes)
// ─────────────────────────────────────────────────────────────────────

describe('calcularSBCFinal', () => {
  it('aplica tope máximo cuando supera 25 UMAs', () => {
    const result = calcularSBCFinal(5000);

    expect(result.tipoTope).toBe('max');
    expect(result.sbcFinal).toBe(CONSTANTES_IMSS.topePesos);
  });

  it('aplica tope mínimo cuando cae bajo salario mínimo', () => {
    const result = calcularSBCFinal(100);

    expect(result.tipoTope).toBe('min');
    expect(result.sbcFinal).toBe(CONSTANTES_IMSS.salarioMinimo);
  });

  it('no aplica tope cuando está dentro del rango', () => {
    const result = calcularSBCFinal(500);

    expect(result.tipoTope).toBeNull();
    expect(result.sbcFinal).toBe(500);
  });

  it('retorna 0 con sbcBruto de 0', () => {
    const result = calcularSBCFinal(0);

    expect(result.tipoTope).toBeNull();
    expect(result.sbcFinal).toBe(0);
  });

  it('aplica tope exacto en el límite máximo', () => {
    const result = calcularSBCFinal(CONSTANTES_IMSS.topePesos + 0.01);
    expect(result.tipoTope).toBe('max');
    expect(result.sbcFinal).toBe(CONSTANTES_IMSS.topePesos);
  });

  it('aplica tope exacto en el límite mínimo', () => {
    const result = calcularSBCFinal(CONSTANTES_IMSS.salarioMinimo - 0.01);
    expect(result.tipoTope).toBe('min');
    expect(result.sbcFinal).toBe(CONSTANTES_IMSS.salarioMinimo);
  });
});

// ─────────────────────────────────────────────────────────────────────
// TESTS: calcularResultadoSBC (integración)
// ─────────────────────────────────────────────────────────────────────

describe('calcularResultadoSBC', () => {
  it('calcula el resultado completo con parámetros típicos', () => {
    const resultado = calcularResultadoSBC(parametrosEjemplo);

    // Factor ≈ 1.0493
    expect(resultado.factor).toBeCloseTo(1 + 18 / 365, 6);

    // SBC bruto = 580 × 1.0493 ≈ 608.60
    expect(resultado.sbcBruto).toBeCloseTo(580 * (1 + 18 / 365), 2);

    // SBC final: como el bruto (608.60) está dentro del rango (440.87 - 2932.75),
    // no se aplica tope
    expect(resultado.tipoTope).toBeNull();
    expect(resultado.sbcFinal).toBeCloseTo(resultado.sbcBruto, 2);

    // Porcentaje del tope ≈ 21.52%
    expect(resultado.porcentajeDelTope).toBeGreaterThan(20);
    expect(resultado.porcentajeDelTope).toBeLessThan(23);
  });

  it('aplica tope máximo con salario alto', () => {
    const resultado = calcularResultadoSBC({
      ...parametrosEjemplo,
      salarioDiario: 5000,
    });

    expect(resultado.tipoTope).toBe('max');
    expect(resultado.sbcFinal).toBe(CONSTANTES_IMSS.topePesos);
    expect(resultado.porcentajeDelTope).toBe(100);
  });

  it('aplica tope mínimo con salario bajo', () => {
    const resultado = calcularResultadoSBC({
      ...parametrosEjemplo,
      salarioDiario: 200,
    });

    // 200 × 1.0493 ≈ 209.86, que es < 278.80
    expect(resultado.tipoTope).toBe('min');
    expect(resultado.sbcFinal).toBe(CONSTANTES_IMSS.salarioMinimo);
  });

  it('maneja salario 0', () => {
    const resultado = calcularResultadoSBC({
      ...parametrosEjemplo,
      salarioDiario: 0,
    });

    expect(resultado.sbcBruto).toBe(0);
    expect(resultado.sbcFinal).toBe(0);
    expect(resultado.tipoTope).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────
// TESTS: Formateo
// ─────────────────────────────────────────────────────────────────────

describe('formatearFactor', () => {
  it('formatea con 4 decimales', () => {
    expect(formatearFactor(1.0493150684931507)).toBe('1.0493');
    expect(formatearFactor(1)).toBe('1.0000');
    expect(formatearFactor(1.123456)).toBe('1.1235');
  });
});

describe('formatearMXN', () => {
  it('formatea como moneda MXN', () => {
    expect(formatearMXN(1234.5)).toContain('1,234.50');
    expect(formatearMXN(0)).toContain('0.00');
  });
});

describe('generarResumenTexto', () => {
  it('genera un resumen con todos los datos', () => {
    const resultado = calcularResultadoSBC(parametrosEjemplo);
    const resumen = generarResumenTexto(parametrosEjemplo, resultado);

    expect(resumen).toContain('SBC 2026');
    expect(resumen).toContain('Factor: 1.0493');
    expect(resumen).toContain('Salario: $580');
    expect(resumen).toContain('Vac: 12d');
    expect(resumen).toContain('Prima: 25%');
    expect(resumen).toContain('Aguinaldo: 15d');
  });
});
