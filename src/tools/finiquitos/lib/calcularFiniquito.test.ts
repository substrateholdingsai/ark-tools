import { describe, it, expect } from 'vitest';
import {
  calcularFiniquito,
  calcularDiasVacacionesPorLey,
  validarEntradaFiniquito,
  TOPE_PRIMA_ANTIGUEDAD,
} from './calcularFiniquito';
import type { EntradaFiniquito } from '../types';

describe('Calculadora de Finiquitos y Liquidaciones (LFT)', () => {
  describe('Tabla de Vacaciones Dignas (Art. 76 LFT ref. 2023)', () => {
    it('asigna correctamente los días según los años de servicio', () => {
      expect(calcularDiasVacacionesPorLey(1)).toBe(12);
      expect(calcularDiasVacacionesPorLey(2)).toBe(14);
      expect(calcularDiasVacacionesPorLey(3)).toBe(16);
      expect(calcularDiasVacacionesPorLey(4)).toBe(18);
      expect(calcularDiasVacacionesPorLey(5)).toBe(20);
      expect(calcularDiasVacacionesPorLey(6)).toBe(22);
      expect(calcularDiasVacacionesPorLey(10)).toBe(22);
      expect(calcularDiasVacacionesPorLey(11)).toBe(24);
      expect(calcularDiasVacacionesPorLey(15)).toBe(24);
      expect(calcularDiasVacacionesPorLey(16)).toBe(26);
      expect(calcularDiasVacacionesPorLey(21)).toBe(28);
      expect(calcularDiasVacacionesPorLey(26)).toBe(30);
      expect(calcularDiasVacacionesPorLey(31)).toBe(32);
    });
  });

  describe('Validación de Parámetros de Entrada', () => {
    it('detecta fecha de baja anterior a la de ingreso', () => {
      const entrada: EntradaFiniquito = {
        tipoBaja: 'finiquito',
        fechaIngreso: '2026-05-01',
        fechaBaja: '2026-04-01',
        salarioDiario: 500,
        sdi: 525,
        vacacionesPendientes: 0,
        aguinaldoPendiente: 0,
        primaVacacionalPct: 25,
        incluirPrimaAntiguedad: false,
        incluirIndem90Dias: false,
        incluir20DiasAnio: false,
      };

      const errores = validarEntradaFiniquito(entrada);
      expect(errores.some((e) => e.campo === 'fechaBaja')).toBe(true);
    });

    it('rechaza salarios diarios o integrados menores o iguales a 0', () => {
      const entrada: EntradaFiniquito = {
        tipoBaja: 'finiquito',
        fechaIngreso: '2025-01-01',
        fechaBaja: '2026-01-01',
        salarioDiario: 0,
        sdi: -10,
        vacacionesPendientes: 0,
        aguinaldoPendiente: 0,
        primaVacacionalPct: 25,
        incluirPrimaAntiguedad: false,
        incluirIndem90Dias: false,
        incluir20DiasAnio: false,
      };

      const errores = validarEntradaFiniquito(entrada);
      expect(errores.some((e) => e.campo === 'salarioDiario')).toBe(true);
      expect(errores.some((e) => e.campo === 'sdi')).toBe(true);
    });
  });

  describe('Cálculo de Finiquito Ordinario (Renuncia Voluntaria)', () => {
    it('calcula aguinaldo, vacaciones y prima vacacional sin indemnizaciones', () => {
      // 1 año exacto (2025-01-01 al 2025-12-31 = 365 días)
      const entrada: EntradaFiniquito = {
        tipoBaja: 'finiquito',
        fechaIngreso: '2025-01-01',
        fechaBaja: '2025-12-31',
        salarioDiario: 400,
        sdi: 420,
        vacacionesPendientes: 0,
        aguinaldoPendiente: 0,
        primaVacacionalPct: 25,
        incluirPrimaAntiguedad: false,
        incluirIndem90Dias: false,
        incluir20DiasAnio: false,
      };

      const res = calcularFiniquito(entrada);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const v = res.valor;
      expect(v.diasAntiguedad).toBe(365);
      expect(v.aniosExactos).toBe(1);
      expect(v.tablaVacaciones).toBe(12);

      // Aguinaldo completo de 1 año (15 días * $400 = $6,000)
      expect(v.totalAguinaldoDias).toBeCloseTo(15, 1);
      expect(v.importeAguinaldo).toBeCloseTo(6000, 1);

      // Vacaciones proporcionales de 1 año (12 días * $400 = $4,800)
      expect(v.totalVacacionesDias).toBeCloseTo(12, 1);
      expect(v.importeVacaciones).toBeCloseTo(4800, 1);

      // Prima vacacional: 25% de $4,800 = $1,200
      expect(v.importePrimaVacacional).toBeCloseTo(1200, 1);

      // Sin liquidaciones ni prima de antigüedad
      expect(v.importePrimaAntiguedad).toBe(0);
      expect(v.importeIndem90).toBe(0);
      expect(v.importe20dias).toBe(0);

      // Total finiquito = $6,000 + $4,800 + $1,200 = $12,000
      expect(v.totalFiniquito).toBeCloseTo(12000, 1);
      expect(v.totalLiquidacion).toBe(v.totalFiniquito);
      expect(v.desglose.length).toBe(6);
    });
  });

describe('Cálculo con Prima de Antigüedad y Tope Art. 486 LFT', () => {
    it('aplica tope de 2 SMG cuando el salario diario excede el límite', () => {
      // Salario diario $1,000 > Tope (2 × $315.04 = $630.08)
      const entrada: EntradaFiniquito = {
        tipoBaja: 'finiquito',
        fechaIngreso: '2024-01-01',
        fechaBaja: '2025-12-31',
        salarioDiario: 1000,
        sdi: 1050,
        vacacionesPendientes: 0,
        aguinaldoPendiente: 0,
        primaVacacionalPct: 25,
        incluirPrimaAntiguedad: true,
        incluirIndem90Dias: false,
        incluir20DiasAnio: false,
      };

      const res = calcularFiniquito(entrada);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const v = res.valor;
      expect(v.salarioTope).toBe(TOPE_PRIMA_ANTIGUEDAD);
      expect(v.salarioTope).toBe(630.08);

      // 2 años de antigüedad: aniosExactos * 12 días × $630.08
      expect(v.importePrimaAntiguedad).toBeGreaterThan(0);
      expect(v.importePrimaAntiguedad).toBeCloseTo(v.aniosExactos * 12 * 630.08, 1);
    });

    it('utiliza el salario diario directo si es inferior al tope de 2 SMG', () => {
      const entrada: EntradaFiniquito = {
        tipoBaja: 'finiquito',
        fechaIngreso: '2024-01-01',
        fechaBaja: '2025-12-31',
        salarioDiario: 450, // 450 < 557.60
        sdi: 470,
        vacacionesPendientes: 0,
        aguinaldoPendiente: 0,
        primaVacacionalPct: 25,
        incluirPrimaAntiguedad: true,
        incluirIndem90Dias: false,
        incluir20DiasAnio: false,
      };

      const res = calcularFiniquito(entrada);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.valor.salarioTope).toBe(450);
    });
  });

  describe('Cálculo de Liquidación Constitucional (Despido Injustificado)', () => {
    it('suma los 90 días de SDI y los 20 días por año al finiquito', () => {
      const entrada: EntradaFiniquito = {
        tipoBaja: 'liquidacion',
        fechaIngreso: '2023-01-01',
        fechaBaja: '2025-12-31', // 3 años
        salarioDiario: 600,
        sdi: 650,
        vacacionesPendientes: 2,
        aguinaldoPendiente: 0,
        primaVacacionalPct: 30,
        incluirPrimaAntiguedad: true,
        incluirIndem90Dias: true,
        incluir20DiasAnio: true,
      };

      const res = calcularFiniquito(entrada);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const v = res.valor;
      // 90 días × $650 = $58,500
      expect(v.importeIndem90).toBe(90 * 650);

      // aniosExactos × 20 días/año × $650
      expect(v.importe20dias).toBeCloseTo(v.aniosExactos * 20 * 650, 1);

      // Total liquidación = totalFiniquito + 90d + 20d
      expect(v.totalLiquidacion).toBe(
        Math.round((v.totalFiniquito + v.importeIndem90 + v.importe20dias) * 100) / 100
      );
    });
  });
});
