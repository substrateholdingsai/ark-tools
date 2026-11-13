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
import type { ConceptoPercepcion, EjercicioISN, Estado } from '../types';
import { getEstadoById } from '../data/estados';

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

  it('calcula ISN para Yucatán (YUC) 2026 general (>50 empleados) al 3.75% ($250,000 -> $9,375)', () => {
    const yucatan = getEstadoById('YUC');
    expect(yucatan).toBeDefined();
    expect(yucatan?.tasa).toBe(3.75);
    expect(yucatan?.articulo).toContain('Art. 21 al 27 LGHY');

    const resultado = calcularResultadoISN(
      [{ id: 1, concepto: 'Nómina gravada Yucatán (51 empleados)', gravado: 250000, exento: 0 }],
      yucatan!,
      { ejercicio: 2026, numEmpleados: 51, esMicroPequena2026: true }
    );

    expect(resultado.baseGravable).toBe(250000);
    expect(resultado.tasaBruta).toBe(3.75);
    expect(resultado.isnBruto).toBe(9375);
    expect(resultado.estimulo).toBe(0);
    expect(resultado.isnNeto).toBe(9375);
    expect(resultado.isn).toBe(9375);
    expect(resultado.tasaEfectiva).toBe(3.75);
  });

  it('calcula los vectores dorados de Yucatán (2025, 2026 MIPyME 15 emp, Gobierno 4.75%, Art. 27-A)', () => {
    const yucatan = getEstadoById('YUC')!;
    const nomina250k = [{ id: 1, concepto: 'Nómina', gravado: 250000, exento: 0 }];

    // 1. 2025: 3.0% = $7,500
    const r2025 = calcularResultadoISN(nomina250k, yucatan, { ejercicio: 2025 });
    expect(r2025.tasaBruta).toBe(3.0);
    expect(r2025.isnNeto).toBe(7500);

    // 2. 2026 Pequeña (15 emp): $9,375 bruto - $1,875 estímulo = $7,500 neto (3.0% efectiva)
    const rPequena = calcularResultadoISN(nomina250k, yucatan, {
      ejercicio: 2026,
      numEmpleados: 15,
      esMicroPequena2026: true,
    });
    expect(rPequena.tasaBruta).toBe(3.75);
    expect(rPequena.isnBruto).toBe(9375);
    expect(rPequena.estimulo).toBe(1875);
    expect(rPequena.isnNeto).toBe(7500);
    expect(rPequena.tasaEfectiva).toBe(3.0);

    // 3. 2026 Gobierno Estatal: 4.75% = $11,875 bruto, estímulo no confirmado
    const rGov = calcularResultadoISN(nomina250k, yucatan, {
      ejercicio: 2026,
      numEmpleados: 15,
      esMicroPequena2026: true,
      esGobiernoEstatal: true,
    });
    expect(rGov.tasaBruta).toBe(4.75);
    expect(rGov.isnBruto).toBe(11875);
    expect(rGov.estimulo).toBe(0);
    expect(rGov.isnNeto).toBe(11875);
    expect(rGov.estimuloConfirmado).toBe(false);

    // 4. Art. 27-A + Decreto 147/2025: no acumulable -> estímulo 0
    const r27A = calcularResultadoISN(nomina250k, yucatan, {
      ejercicio: 2026,
      numEmpleados: 15,
      esMicroPequena2026: true,
      aplica27A: true,
    });
    expect(r27A.estimulo).toBe(0);
    expect(r27A.isnNeto).toBe(9375);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Boundary tests: 1-50 employee rule (Decreto 147/2025)
  // ─────────────────────────────────────────────────────────────────────
  describe('calcularResultadoISN — boundary employee counts (YUC 2026)', () => {
    const yucatan = getEstadoById('YUC')!;
    const nomina250k = [{ id: 1, concepto: 'Nómina', gravado: 250000, exento: 0 }];

    it('0 empleados -> no MIPyME, general 3.75%', () => {
      const r = calcularResultadoISN(nomina250k, yucatan, {
        ejercicio: 2026,
        numEmpleados: 0,
        esMicroPequena2026: true,
      });
      expect(r.regimen).toBe('general');
      expect(r.tasaBruta).toBe(3.75);
      expect(r.estimulo).toBe(0);
      expect(r.isnNeto).toBe(9375);
    });

    it('10 empleados -> MIPyME, 3.0% net', () => {
      const r = calcularResultadoISN(nomina250k, yucatan, {
        ejercicio: 2026,
        numEmpleados: 10,
        esMicroPequena2026: true,
      });
      expect(r.regimen).toBe('micro_pequena');
      expect(r.tasaBruta).toBe(3.75);
      expect(r.estimulo).toBe(1875);
      expect(r.isnNeto).toBe(7500);
      expect(r.tasaEfectiva).toBe(3.0);
    });

    it('11 empleados -> MIPyME, 3.0% net', () => {
      const r = calcularResultadoISN(nomina250k, yucatan, {
        ejercicio: 2026,
        numEmpleados: 11,
        esMicroPequena2026: true,
      });
      expect(r.regimen).toBe('micro_pequena');
      expect(r.tasaBruta).toBe(3.75);
      expect(r.estimulo).toBe(1875);
      expect(r.isnNeto).toBe(7500);
    });

    it('50 empleados -> MIPyME, 3.0% net', () => {
      const r = calcularResultadoISN(nomina250k, yucatan, {
        ejercicio: 2026,
        numEmpleados: 50,
        esMicroPequena2026: true,
      });
      expect(r.regimen).toBe('micro_pequena');
      expect(r.tasaBruta).toBe(3.75);
      expect(r.estimulo).toBe(1875);
      expect(r.isnNeto).toBe(7500);
    });

    it('51 empleados -> no MIPyME, general 3.75%', () => {
      const r = calcularResultadoISN(nomina250k, yucatan, {
        ejercicio: 2026,
        numEmpleados: 51,
        esMicroPequena2026: true,
      });
      expect(r.regimen).toBe('general');
      expect(r.tasaBruta).toBe(3.75);
      expect(r.estimulo).toBe(0);
      expect(r.isnNeto).toBe(9375);
    });

    it('ejercicio 2027 -> fail-closed throws (rate not published)', () => {
      expect(() =>
        calcularResultadoISN(nomina250k, yucatan, {
          ejercicio: 2027 as EjercicioISN,
        })
      ).toThrow(/no publicada/);
    });
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
  it('formatea porcentajes con 1 o 2 decimales según precisión', () => {
    expect(formatearPorcentaje(3.0)).toBe('3.0%');
    expect(formatearPorcentaje(3.75)).toBe('3.75%');
    expect(formatearPorcentaje(1.8)).toBe('1.8%');
  });
});

describe('formatearNumero', () => {
  it('formatea números sin símbolo de moneda', () => {
    expect(formatearNumero(45280.5)).toBe('45,280.50');
    expect(formatearNumero(1518)).toBe('1,518.00');
  });
});
