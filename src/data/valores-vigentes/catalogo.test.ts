import { describe, it, expect } from 'vitest';
import { CATALOGO_2026, VALORES_POR_ID } from './catalogo';
import { evaluarVigencia } from './vigencia';

describe('catálogo de valores vigentes', () => {
  it('no tiene IDs duplicados', () => {
    const ids = CATALOGO_2026.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('el índice por ID cubre todo el catálogo', () => {
    expect(VALORES_POR_ID.size).toBe(CATALOGO_2026.length);
  });

  it('todos los valores tienen fuente y referencia no vacías', () => {
    for (const v of CATALOGO_2026) {
      expect(v.fuente.organismo, `organismo faltante en ${v.id}`).toBeTruthy();
      expect(v.fuente.urlDOF, `urlDOF faltante en ${v.id}`).toMatch(/^https?:\/\//);
      expect(v.fuente.referencia, `referencia legal faltante en ${v.id}`).toBeTruthy();
    }
  });

  it('todas las fechas están en formato ISO YYYY-MM-DD', () => {
    const ISO = /^\d{4}-\d{2}-\d{2}$/;
    for (const v of CATALOGO_2026) {
      expect(v.vigencia.inicio, v.id).toMatch(ISO);
      if (v.vigencia.fin) expect(v.vigencia.fin, v.id).toMatch(ISO);
    }
  });

  it('vigencia.fin nunca es anterior a vigencia.inicio', () => {
    for (const v of CATALOGO_2026) {
      if (v.vigencia.fin) {
        expect(v.vigencia.fin >= v.vigencia.inicio, `${v.id}: vigencia.fin < vigencia.inicio`).toBe(
          true
        );
      }
    }
  });

  it('valores proyectados tienen criticidad ALTA', () => {
    for (const v of CATALOGO_2026) {
      if (v.esProyeccion) {
        expect(v.criticidad === 'ALTA', `${v.id}: proyección con criticidad distinta de ALTA`).toBe(
          true
        );
      }
    }
  });

  it('todos los valores tienen verificadoPor', () => {
    for (const v of CATALOGO_2026) {
      expect(v.verificadoPor, `verificadoPor faltante en ${v.id}`).toBeTruthy();
    }
  });

  it('ningún valor crítico está vencido hoy', () => {
    const criticosVencidos = CATALOGO_2026.filter((v) => v.criticidad === 'ALTA').filter(
      (v) => evaluarVigencia(v).estado === 'vencido'
    );

    expect(
      criticosVencidos.map((v) => v.id),
      'CRÍTICO: valores fiscales vencidos sin reemplazo'
    ).toEqual([]);
  });
});
