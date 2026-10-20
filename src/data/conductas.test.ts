// src/data/conductas.test.ts

import { describe, expect, it } from 'vitest';

import {
  AUTORIDADES_AV,
  CONDUCTAS_AV,
  FRONTERA_LEGAL_AV,
  GRAVEDADES_AV,
  MARCOS_LEGALES_AV,
  RESUMEN_MAPA_AV,
  TIPOS_SANCION_AV,
  TIMELINE_REGULATORIO_AV,
  UMBRALES_REPORTE_AV,
} from './conductas';

describe('conductas.ts', () => {
  it('tiene 12 conductas tipificadas', () => {
    expect(CONDUCTAS_AV).toHaveLength(12);
  });

  it('tiene IDs únicos y consecutivos', () => {
    const ids = CONDUCTAS_AV.map((conducta) => conducta.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(Array.from({ length: 12 }, (_, index) => index + 1));
  });

  it('todas las conductas tienen campos obligatorios', () => {
    for (const conducta of CONDUCTAS_AV) {
      expect(conducta.conducta.trim().length).toBeGreaterThan(0);
      expect(conducta.articulo.trim().length).toBeGreaterThan(0);
      expect(conducta.calificacion.trim().length).toBeGreaterThan(0);
      expect(conducta.sancionCorta.trim().length).toBeGreaterThan(0);
      expect(conducta.sancionDetalle.trim().length).toBeGreaterThan(0);
    }
  });

  it('todas las conductas tienen marco legal válido', () => {
    for (const conducta of CONDUCTAS_AV) {
      expect(MARCOS_LEGALES_AV.includes(conducta.marcoLegal)).toBe(true);
    }
  });

  it('todas las conductas tienen gravedad válida', () => {
    for (const conducta of CONDUCTAS_AV) {
      expect(GRAVEDADES_AV.includes(conducta.gravedad)).toBe(true);
    }
  });

  it('todas las conductas tienen al menos un tipo de sanción', () => {
    for (const conducta of CONDUCTAS_AV) {
      expect(conducta.tipos.length).toBeGreaterThan(0);

      for (const tipo of conducta.tipos) {
        expect(TIPOS_SANCION_AV.includes(tipo)).toBe(true);
      }
    }
  });

  it('tiene 5 autoridades', () => {
    expect(AUTORIDADES_AV).toHaveLength(5);
  });

  it('las autoridades tienen sigla y función', () => {
    for (const autoridad of AUTORIDADES_AV) {
      expect(autoridad.sigla.trim().length).toBeGreaterThan(0);
      expect(autoridad.nombre.trim().length).toBeGreaterThan(0);
      expect(autoridad.funcion.trim().length).toBeGreaterThan(0);
    }
  });

  it('tiene 6 hitos regulatorios', () => {
    expect(TIMELINE_REGULATORIO_AV).toHaveLength(6);
  });

  it('los hitos regulatorios tienen orden consecutivo', () => {
    const orden = TIMELINE_REGULATORIO_AV.map((hito) => hito.orden);

    expect(orden).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('tiene 3 umbrales de reporte', () => {
    expect(UMBRALES_REPORTE_AV).toHaveLength(3);
  });

  it('los umbrales UMA tienen cantidad válida', () => {
    const umbralOperacion = UMBRALES_REPORTE_AV.find(
      (umbral) => umbral.id === 'operacion-individual'
    );

    const umbralComisiones = UMBRALES_REPORTE_AV.find(
      (umbral) => umbral.id === 'comisiones-honorarios'
    );

    expect(umbralOperacion?.cantidadUMA).toBe(210);
    expect(umbralComisiones?.cantidadUMA).toBe(4);
  });

  it('tiene 6 reglas de frontera legal/ilegal', () => {
    expect(FRONTERA_LEGAL_AV).toHaveLength(6);
  });

  it('la frontera tiene 3 reglas legales y 3 ilegales', () => {
    const legales = FRONTERA_LEGAL_AV.filter((regla) => regla.estatus === 'LEGAL').length;

    const ilegales = FRONTERA_LEGAL_AV.filter((regla) => regla.estatus === 'ILEGAL').length;

    expect(legales).toBe(3);
    expect(ilegales).toBe(3);
  });

  it('el resumen coincide con los datos', () => {
    expect(RESUMEN_MAPA_AV.totalConductas).toBe(12);
    expect(RESUMEN_MAPA_AV.totalAutoridades).toBe(5);
    expect(RESUMEN_MAPA_AV.totalHitos).toBe(6);
    expect(RESUMEN_MAPA_AV.totalUmbrales).toBe(3);
    expect(RESUMEN_MAPA_AV.totalReglasFrontera).toBe(6);
  });
});
