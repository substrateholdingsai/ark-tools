// src/data/comparadores-contrato-crm.test.ts

import { describe, expect, it } from 'vitest';

import { RIESGOS_COBRANZA } from './conductas-cobranza';
import { COMPARADORES_CONTRATO_CRM, ESTADOS_COMPARADOR } from './comparadores-contrato-crm';

describe('comparadores-contrato-crm', () => {
  it('tiene 12 comparadores del eje Contrato vs CRM', () => {
    expect(COMPARADORES_CONTRATO_CRM).toHaveLength(12);
  });

  it('tiene IDs únicos', () => {
    const ids = COMPARADORES_CONTRATO_CRM.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tiene códigos únicos', () => {
    const codigos = COMPARADORES_CONTRATO_CRM.map((item) => item.codigo);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it('todos los comparadores pertenecen a la sección VIII', () => {
    for (const item of COMPARADORES_CONTRATO_CRM) {
      expect(item.seccion).toBe('VIII');
    }
  });

  it('todos los comparadores tienen campo', () => {
    for (const item of COMPARADORES_CONTRATO_CRM) {
      expect(item.campo.trim().length).toBeGreaterThan(0);
    }
  });

  it('todos los comparadores tienen pregunta de auditoría', () => {
    for (const item of COMPARADORES_CONTRATO_CRM) {
      expect(item.pregunta.trim().length).toBeGreaterThan(0);
    }
  });

  it('todos los comparadores tienen impacto contable', () => {
    for (const item of COMPARADORES_CONTRATO_CRM) {
      expect(item.impactoContable.trim().length).toBeGreaterThan(0);
    }
  });

  it('todos los comparadores tienen recomendación', () => {
    for (const item of COMPARADORES_CONTRATO_CRM) {
      expect(item.recomendacion.trim().length).toBeGreaterThan(0);
    }
  });

  it('todos los comparadores tienen evidencia sugerida', () => {
    for (const item of COMPARADORES_CONTRATO_CRM) {
      expect(item.evidenciaSugerida.length).toBeGreaterThan(0);
    }
  });

  it('todos los comparadores tienen riesgo válido', () => {
    for (const item of COMPARADORES_CONTRATO_CRM) {
      expect(RIESGOS_COBRANZA.includes(item.riesgo)).toBe(true);
    }
  });

  it('exporta los estados posibles del comparador', () => {
    expect(ESTADOS_COMPARADOR).toHaveLength(5);
    expect(ESTADOS_COMPARADOR).toContain('COINCIDE');
    expect(ESTADOS_COMPARADOR).toContain('DIFIERE');
    expect(ESTADOS_COMPARADOR).toContain('PARCIAL');
    expect(ESTADOS_COMPARADOR).toContain('NO_VERIFICABLE');
    expect(ESTADOS_COMPARADOR).toContain('SIN_DATO');
  });
});
