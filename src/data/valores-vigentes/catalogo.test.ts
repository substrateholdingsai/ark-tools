import { describe, it, expect } from 'vitest';
import { CATALOGO_VALORES, VALORES_POR_ID } from './catalogo';
import { evaluarVigencia } from './vigencia';

describe('catálogo de valores vigentes', () => {
  it('no tiene IDs duplicados', () => {
    const ids = CATALOGO_VALORES.map(v => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('el índice por ID cubre todo el catálogo', () => {
    expect(VALORES_POR_ID.size).toBe(CATALOGO_VALORES.length);
  });

  it('todos los valores tienen fuente y referencia no vacías', () => {
    for (const v of CATALOGO_VALORES) {
      expect(v.fuente, `fuente faltante en ${v.id}`).toBeTruthy();
      expect(v.referencia, `referencia faltante en ${v.id}`).toMatch(/^https?:\/\//);
    }
  });

  it('todas las fechas están en formato ISO YYYY-MM-DD', () => {
    const ISO = /^\d{4}-\d{2}-\d{2}$/;
    for (const v of CATALOGO_VALORES) {
      expect(v.fechaPublicacion, v.id).toMatch(ISO);
      expect(v.vigenteDesde, v.id).toMatch(ISO);
      if (v.vigenteHasta) expect(v.vigenteHasta, v.id).toMatch(ISO);
    }
  });

  it('vigenteHasta nunca es anterior a vigenteDesde', () => {
    for (const v of CATALOGO_VALORES) {
      if (v.vigenteHasta) {
        expect(
          v.vigenteHasta >= v.vigenteDesde,
          `${v.id}: vigenteHasta < vigenteDesde`
        ).toBe(true);
      }
    }
  });

  it('valores proyectados tienen criticidad alto o critico', () => {
    for (const v of CATALOGO_VALORES) {
      if (v.esProyeccion) {
        expect(
          ['critico', 'alto'].includes(v.criticidad),
          `${v.id}: proyección con criticidad baja`
        ).toBe(true);
      }
    }
  });

  it('ningún valor crítico está vencido hoy', () => {
    const criticosVencidos = CATALOGO_VALORES
      .filter(v => v.criticidad === 'critico')
      .filter(v => evaluarVigencia(v).estado === 'vencido');

    expect(
      criticosVencidos.map(v => v.id),
      'CRÍTICO: valores fiscales vencidos sin reemplazo'
    ).toEqual([]);
  });
});