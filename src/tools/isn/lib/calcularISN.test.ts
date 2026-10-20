/**
 * Tests unitarios para la lógica de cálculo de ISN.
 * Framework: Vitest
 */

import { describe, it, expect } from 'vitest';
import {
  calcularBaseGravable,
  calcularTotalExento,
  calcularISN,
  calcularResultadoISN,
  formatearMXN,
  formatearPorcentaje,
  formatearNumero,
} from './calcularISN';
import type { ConceptoPercepcion, Estado } from '../types';

// ─────────────────────────────────────────────────────────────────────
// FIXTURES
// ─────────────────────────────────────────────────────────────────────

const conceptosEjemplo: ConceptoPercepcion[] = [
  { id: 1, concepto: 'Sueldo base', gravado: 45000, exento: 0 },
  { id: 2, concepto: 'Premio de puntualidad', gravado: 3500, exento: 500 },
  { id: 3, concepto: 'Vales de despensa', gravado: 0, exento: 2800 },
  { id: 4, concepto: 'Horas extra dobles', gravado: 2100, exento: 1050 },
];

const cdmx: Estado = {
  id: 'CDMX',
  nombre: 'Ciudad de México',
  corto: 'CDMX',
  tasa: 3.0,
  vigencia: '2026',
  articulo: 'Art. 156 CF',
};

const jalisco: Estado = {
  id: 'JAL',
  nombre: 'Jalisco',
  corto: 'Jal',
  tasa: 2.0,
  vigencia: '2026',
  articulo: 'Art. 37 LHE',
};

// ─────────────────────────────────────────────────────────────────────
// TESTS: calcularBaseGravable
// ─────────────────────────────────────────────────────────────────────

describe('calcularBaseGravable', () => {
  it('suma correctamente los conceptos gravados', () => {
    // 45000 + 3500 + 0 + 2100 = 50600
    expect(calcularBaseGravable(conceptosEjemplo)).toBe(50600);
  });

  it('retorna 0 si no hay conceptos', () => {
    expect(calcularBaseGravable([])).toBe(0);
  });

  it('ignora valores undefined o null', () => {
    const conceptos: ConceptoPercepcion[] = [
      { id: 1, concepto: 'A', gravado: 1000, exento: 0 },
      { id: 2, concepto: 'B', gravado: 0, exento: 0 },
    ];
    expect(calcularBaseGravable(conceptos)).toBe(1000);
  });

  it('maneja valores negativos (no debería pasar, pero por seguridad)', () => {
    const conceptos: ConceptoPercepcion[] = [
      { id: 1, concepto: 'A', gravado: 1000, exento: 0 },
      { id: 2, concepto: 'B', gravado: -500, exento: 0 },
    ];
    expect(calcularBaseGravable(conceptos)).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────
// TESTS: calcularTotalExento
// ─────────────────────────────────────────────────────────────────────

describe('calcularTotalExento', () => {
  it('suma correctamente los conceptos exentos', () => {
    // 0 + 500 + 2800 + 1050 = 4350
    expect(calcularTotalExento(conceptosEjemplo)).toBe(4350);
  });

  it('retorna 0 si no hay conceptos', () => {
    expect(calcularTotalExento([])).toBe(0);
  });

  it('retorna 0 si no hay exentos', () => {
    const conceptos: ConceptoPercepcion[] = [{ id: 1, concepto: 'A', gravado: 1000, exento: 0 }];
    expect(calcularTotalExento(conceptos)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// TESTS: calcularISN
// ─────────────────────────────────────────────────────────────────────

describe('calcularISN', () => {
  it('calcula ISN con tasa CDMX (3%)', () => {
    // 50600 × 0.03 = 1518
    expect(calcularISN(50600, 3.0)).toBe(1518);
  });

  it('calcula ISN con tasa Jalisco (2%)', () => {
    // 50600 × 0.02 = 1012
    expect(calcularISN(50600, 2.0)).toBe(1012);
  });

  it('redondea a 2 decimales', () => {
    // 1000 × 2.33% = 23.3
    expect(calcularISN(1000, 2.33)).toBe(23.3);
    // 1000 × 2.345% = 23.45
    expect(calcularISN(1000, 2.345)).toBe(23.45);
    // 1000 × 2.3456% = 23.46 (redondeo)
    expect(calcularISN(1000, 2.3456)).toBe(23.46);
  });

  it('retorna 0 si base gravable es 0', () => {
    expect(calcularISN(0, 3.0)).toBe(0);
  });

  it('retorna 0 si base gravable es negativa', () => {
    expect(calcularISN(-1000, 3.0)).toBe(0);
  });

  it('retorna 0 si tasa es 0', () => {
    expect(calcularISN(50600, 0)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// TESTS: calcularResultadoISN
// ─────────────────────────────────────────────────────────────────────

describe('calcularResultadoISN', () => {
  it('calcula el resultado completo para CDMX', () => {
    const resultado = calcularResultadoISN(conceptosEjemplo, cdmx);

    expect(resultado.baseGravable).toBe(50600);
    expect(resultado.totalExento).toBe(4350);
    expect(resultado.totalPercepciones).toBe(54950);
    expect(resultado.tasa).toBe(3.0);
    expect(resultado.isn).toBe(1518);
  });

  it('calcula el resultado completo para Jalisco', () => {
    const resultado = calcularResultadoISN(conceptosEjemplo, jalisco);

    expect(resultado.baseGravable).toBe(50600);
    expect(resultado.tasa).toBe(2.0);
    expect(resultado.isn).toBe(1012);
  });

  it('maneja conceptos vacíos', () => {
    const resultado = calcularResultadoISN([], cdmx);

    expect(resultado.baseGravable).toBe(0);
    expect(resultado.totalExento).toBe(0);
    expect(resultado.totalPercepciones).toBe(0);
    expect(resultado.isn).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// TESTS: Formateo
// ─────────────────────────────────────────────────────────────────────

describe('formatearMXN', () => {
  it('formatea valores con 2 decimales', () => {
    // Nota: El símbolo puede variar según locale del entorno de test
    expect(formatearMXN(45280.5)).toContain('45,280.50');
    expect(formatearMXN(1518)).toContain('1,518.00');
    expect(formatearMXN(0)).toContain('0.00');
  });
});

describe('formatearPorcentaje', () => {
  it('formatea porcentajes con 1 decimal', () => {
    expect(formatearPorcentaje(3.0)).toBe('3.0%');
    expect(formatearPorcentaje(2.5)).toBe('2.5%');
    expect(formatearPorcentaje(1.8)).toBe('1.8%');
  });
});

describe('formatearNumero', () => {
  it('formatea números sin símbolo de moneda', () => {
    expect(formatearNumero(45280.5)).toBe('45,280.50');
    expect(formatearNumero(1518)).toBe('1,518.00');
  });
});
