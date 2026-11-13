/**
 * ARK LEDGER — Test de vector dorado: cuotas IMSS patrón 2026 (TODAS las ramas).
 *
 * Vector dorado: SBC diario $1,165.90, 30 días, base $34,977.
 * Fuente de tasas: @/data/valores-vigentes/catalogo (todas en verificación DOF — Pavel).
 *
 * Ramas esperadas (tolerancia $0.01):
 *  - Enfermedades Cuota Fija (Art. 106 I): 20.40% × UMA $117.31 × 30 = $717.94
 *  - Enfermedades Cuota Adicional (Art. 106 II): 1.10% × (SBC − 3 UMA) × 30 = $268.61
 *  - Gastos Médicos Pensionados (Art. 25): 1.05% × $34,977 = $367.26
 *  - Invalidez y Vida (Art. 147): 1.75% × $34,977 = $612.10
 *  - Guarderías (Art. 211): 1.00% × $34,977 = $349.77
 *  - Retiro (Art. 168): 2.00% × $34,977 = $699.54
 *  - Cesantía y Vejez (Art. 168, reforma 2020): tasa tabla progresiva 2026 (catálogo)
 * Total patronal SIN INFONAVIT debe ser > $2,000.
 * INFONAVIT 5% es línea separada, NO incluida en totalIMSSPatronal.
 */

import { describe, it, expect } from 'vitest';
import { calcularIMSSPatronal, calcularInfONAVITPatronal, CUOTAS_PATRONAL } from './cuotasIMSS';
import type { Periodo } from '../types';

describe('cuotas IMSS patrón 2026 — vector dorado (todas las ramas)', () => {
  const sbcDiario = 1165.9;
  const dias = 30;
  const sbcTotal = sbcDiario * dias; // 34,977
  const umaDiaria = 117.31;
  const tresUmas = umaDiaria * 3; // 351.93

  it('calcula cada rama con tolerancia $0.01 y total patronal > $2,000 (sin INFONAVIT)', () => {
    const res = calcularIMSSPatronal(sbcDiario, 'mensual' as Periodo);

    // Índice por ramo para aserciones claras
    const porRamo = new Map(res.cuotas.map((c) => [c.ramo, c]));

    // 1. Enfermedades y Maternidad — Cuota Fija (uma): 20.40% × 117.31 × 30
    const fija = porRamo.get('Enfermedades y Maternidad — Cuota Fija')!;
    expect(fija.base).toBe('uma');
    expect(fija.monto).toBeCloseTo(0.204 * umaDiaria * dias, 2); // 717.94

    // 2. Enfermedades y Maternidad — Cuota Adicional (sbc_excedente): 1.10% × (SBC − 3 UMA) × 30
    const adicional = porRamo.get('Enfermedades y Maternidad — Cuota Adicional')!;
    expect(adicional.base).toBe('sbc_excedente');
    expect(adicional.monto).toBeCloseTo(0.011 * Math.max(0, sbcDiario - tresUmas) * dias, 2); // 268.61

    // 3. Gastos Médicos para Pensionados (sbc): 1.05% × 34,977
    const gastosMedicos = porRamo.get('Gastos Médicos para Pensionados')!;
    expect(gastosMedicos.monto).toBeCloseTo(0.0105 * sbcTotal, 2); // 367.26

    // 4. Invalidez y Vida (sbc): 1.75% × 34,977
    const invalidez = porRamo.get('Invalidez y Vida')!;
    expect(invalidez.monto).toBeCloseTo(0.0175 * sbcTotal, 2); // 612.10

    // 5. Guarderías (sbc): 1.00% × 34,977
    const guarderias = porRamo.get('Guarderías y Prestaciones Sociales')!;
    expect(guarderias.monto).toBeCloseTo(0.01 * sbcTotal, 2); // 349.77

    // 6. Retiro (sbc): 2.00% × 34,977
    const retiro = porRamo.get('Retiro')!;
    expect(retiro.monto).toBeCloseTo(0.02 * sbcTotal, 2); // 699.54

    // 7. Cesantía y Vejez (sbc): tasa catálogo (pendiente confirmación DOF)
    const cesantia = porRamo.get('Cesantía y Vejez (reforma 2020)')!;
    expect(cesantia.monto).toBeCloseTo((cesantia.porcentaje / 100) * sbcTotal, 2);

    // Total patronal SIN INFONAVIT debe superar $2,000
    const totalSinInfONAVIT = res.total;
    expect(totalSinInfONAVIT).toBeGreaterThan(2000);

    // Todas las cuotas tienen monto >= 0
    for (const c of res.cuotas) {
      expect(c.monto).toBeGreaterThanOrEqual(0);
    }
  });

  it('INFONAVIT 5% es línea separada y NO incluida en totalIMSSPatronal', () => {
    const resPatronal = calcularIMSSPatronal(sbcDiario, 'mensual' as Periodo);
    const infONAVIT = calcularInfONAVITPatronal(sbcDiario, dias);

    expect(infONAVIT.porcentaje).toBe(5);
    expect(infONAVIT.monto).toBeCloseTo(0.05 * sbcTotal, 2); // 1,748.85

    // INFONAVIT no está dentro de las cuotas patronales del total
    const infONAVITEnCuotas = resPatronal.cuotas.some((c) =>
      c.ramo.toLowerCase().includes('infonavit')
    );
    expect(infONAVITEnCuotas).toBe(false);

    // totalIMSSPatronal (sin INFONAVIT) + INFONAVIT > total solo patronal
    expect(resPatronal.total + infONAVIT.monto).toBeGreaterThan(resPatronal.total);
  });

  it('CUOTAS_PATRONAL exporta exactamente las 7 ramas incluidas en el total', () => {
    expect(CUOTAS_PATRONAL).toHaveLength(7);
    const ramos = CUOTAS_PATRONAL.map((c) => c.ramo);
    expect(ramos).toContain('Enfermedades y Maternidad — Cuota Fija');
    expect(ramos).toContain('Enfermedades y Maternidad — Cuota Adicional');
    expect(ramos).toContain('Gastos Médicos para Pensionados');
    expect(ramos).toContain('Invalidez y Vida');
    expect(ramos).toContain('Guarderías y Prestaciones Sociales');
    expect(ramos).toContain('Retiro');
    expect(ramos).toContain('Cesantía y Vejez (reforma 2020)');
    // INFONAVIT NO está en CUOTAS_PATRONAL (es aparte)
    expect(ramos.some((r) => r.toLowerCase().includes('infonavit'))).toBe(false);
    // Riesgos NO está en CUOTAS_PATRONAL (prima variable, aparte)
    expect(ramos.some((r) => r.toLowerCase().includes('riesgos'))).toBe(false);
  });
});
