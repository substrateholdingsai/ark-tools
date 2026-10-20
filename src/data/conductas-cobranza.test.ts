import { describe, it, expect } from 'vitest';
import {
  SECCIONES_COBRANZA,
  CONDUCTAS_COBRANZA,
  RIESGOS_COBRANZA,
  PESO_RIESGO,
  type SeccionCobranzaId,
} from './conductas-cobranza';

describe('Catálogo de Conductas de Cobranza (Fase D: Compliance)', () => {
  it('contiene las 8 secciones oficiales de auditoría de cobranza', () => {
    expect(SECCIONES_COBRANZA).toHaveLength(8);
    const ids = SECCIONES_COBRANZA.map((s) => s.id);
    expect(ids).toEqual(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']);
  });

  it('cuenta con ponderaciones de riesgo válidas y crecientes', () => {
    expect(PESO_RIESGO.BAJO).toBe(1);
    expect(PESO_RIESGO.MEDIO).toBe(3);
    expect(PESO_RIESGO.ALTO).toBe(5);
    expect(PESO_RIESGO.CRITICO).toBe(10);
  });

  it('todas las conductas tienen ID único y no duplicado', () => {
    const ids = CONDUCTAS_COBRANZA.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('todas las conductas tienen fundamento legal, descripción y riesgo válido', () => {
    for (const conducta of CONDUCTAS_COBRANZA) {
      expect(conducta.id).toBeTruthy();
      expect(conducta.titulo.trim().length).toBeGreaterThan(0);
      expect(conducta.descripcion.trim().length).toBeGreaterThan(0);
      expect(conducta.fundamento.trim().length).toBeGreaterThan(0);
      expect(RIESGOS_COBRANZA).toContain(conducta.riesgo);
    }
  });

  it('todas las conductas pertenecen a una sección válida existente', () => {
    const seccionesValidas = new Set<SeccionCobranzaId>(SECCIONES_COBRANZA.map((s) => s.id));

    for (const conducta of CONDUCTAS_COBRANZA) {
      expect(seccionesValidas.has(conducta.seccion)).toBe(true);
    }
  });

  it('verifica la distribución de conductas por sección operativa (I a VII)', () => {
    const conteoPorSeccion: Record<string, number> = {};
    for (const conducta of CONDUCTAS_COBRANZA) {
      conteoPorSeccion[conducta.seccion] = (conteoPorSeccion[conducta.seccion] ?? 0) + 1;
    }

    expect(conteoPorSeccion['I']).toBe(7); // 1.1 a 1.7
    expect(conteoPorSeccion['II']).toBe(9); // 2.1 a 2.9
    expect(conteoPorSeccion['III']).toBe(7); // 3.1 a 3.7
    expect(conteoPorSeccion['IV']).toBe(7); // 4.1 a 4.7
    expect(conteoPorSeccion['V']).toBe(3); // 5.1 a 5.3
    expect(conteoPorSeccion['VI']).toBe(4); // 6.1 a 6.4
    expect(conteoPorSeccion['VII']).toBe(6); // 7.1 a 7.6
  });
});
