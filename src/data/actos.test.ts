import { describe, expect, it } from 'vitest';
import {
  ACTOS_FISCALES,
  ACTOS_IMSS,
  ACTOS_SAT,
  GUIA_PASOS,
  PLAZOS_CLAVE,
} from './actos';

describe('actos.ts', () => {
  it('debe tener exactamente 8 pasos', () => {
    expect(GUIA_PASOS).toHaveLength(8);
  });

  it('debe tener pasos con id consecutivo', () => {
    expect(GUIA_PASOS.map(p => p.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('todos los pasos deben tener checklist', () => {
    for (const paso of GUIA_PASOS) {
      expect(paso.checklist.length).toBeGreaterThan(0);
    }
  });

  it('debe tener 4 actos SAT', () => {
    expect(ACTOS_SAT).toHaveLength(4);
  });

  it('debe tener 4 actos IMSS', () => {
    expect(ACTOS_IMSS).toHaveLength(4);
  });

  it('debe tener 8 actos fiscales en total', () => {
    expect(ACTOS_FISCALES).toHaveLength(8);
  });

  it('los códigos de actos deben ser únicos', () => {
    const codigos = ACTOS_FISCALES.map(a => a.codigo);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it('los riesgos deben ser válidos', () => {
    const riesgosValidos = ['Bajo', 'Medio', 'Alto', 'Crítico'];

    for (const acto of ACTOS_FISCALES) {
      expect(riesgosValidos).toContain(acto.riesgo);
    }
  });

  it('debe tener 3 plazos clave', () => {
    expect(PLAZOS_CLAVE).toHaveLength(3);
  });
});