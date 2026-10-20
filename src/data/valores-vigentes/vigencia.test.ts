import { describe, it, expect } from 'vitest';
import { evaluarVigencia, evaluarLote } from './vigencia';
import type { ValorFiscal } from './tipos';

const base: Omit<ValorFiscal, 'id' | 'vigencia' | 'fuente' | 'verificadoPor'> = {
  nombre: 'Test',
  valor: 100,
  unidad: 'MXN',
  criticidad: 'ALTA',
  esProyeccion: false,
};

function makeValor(id: string, inicio: string, fin: string | null): ValorFiscal {
  return {
    ...base,
    id,
    vigencia: { inicio, fin },
    fuente: {
      organismo: 'SAT',
      publicacion: 'DOF 01/01/2026',
      urlDOF: 'https://dof.gob.mx/test',
      referencia: 'Art. test',
    },
    verificadoPor: 'Test — 2026-01-01',
  };
}

describe('evaluarVigencia', () => {
  const ref = new Date(Date.UTC(2026, 5, 15, 12)); // 15 jun 2026

  it('marca vigente si está dentro del rango', () => {
    const v = makeValor('x', '2026-01-01', '2026-12-31');
    const r = evaluarVigencia(v, { fechaReferencia: ref });
    expect(r.estado).toBe('vigente');
    expect(r.requiereAtencion).toBe(false);
  });

  it('marca proximo-vencer a 60 días o menos', () => {
    const v = makeValor('x', '2026-01-01', '2026-07-31');
    const r = evaluarVigencia(v, { fechaReferencia: ref });
    expect(r.estado).toBe('proximo-vencer');
    expect(r.diasRestantes).toBeLessThanOrEqual(60);
    expect(r.requiereAtencion).toBe(true);
  });

  it('marca vencido si pasó la fecha fin', () => {
    const v = makeValor('x', '2026-01-01', '2026-05-31');
    const r = evaluarVigencia(v, { fechaReferencia: ref });
    expect(r.estado).toBe('vencido');
    expect(r.requiereAtencion).toBe(true);
  });

  it('trata vigencia.fin=null como vigente infinito', () => {
    const v = makeValor('x', '2020-01-01', null);
    const r = evaluarVigencia(v, { fechaReferencia: ref });
    expect(r.estado).toBe('vigente');
    expect(r.diasRestantes).toBeNull();
  });

  it('marca proximo-vencer si aún no entra en vigor', () => {
    const v = makeValor('x', '2026-08-01', '2026-12-31');
    const r = evaluarVigencia(v, { fechaReferencia: ref });
    expect(r.estado).toBe('proximo-vencer');
    expect(r.diasRestantes).toBeGreaterThan(0);
  });

  it('respeta diasAlerta configurable', () => {
    const v = makeValor('x', '2026-01-01', '2026-08-15');
    const r30 = evaluarVigencia(v, { fechaReferencia: ref, diasAlerta: 30 });
    const r90 = evaluarVigencia(v, { fechaReferencia: ref, diasAlerta: 90 });
    expect(r30.estado).toBe('vigente');
    expect(r90.estado).toBe('proximo-vencer');
  });
});

describe('evaluarLote', () => {
  const ref = new Date(Date.UTC(2026, 5, 15, 12));

  it('clasifica correctamente un lote mixto', () => {
    const lote = [
      makeValor('a', '2026-01-01', '2026-12-31'), // vigente
      makeValor('b', '2026-01-01', '2026-07-01'), // proximo
      makeValor('c', '2026-01-01', '2026-03-01'), // vencido
    ];
    const r = evaluarLote(lote, { fechaReferencia: ref });
    expect(r.vigentes.map((v) => v.id)).toEqual(['a']);
    expect(r.proximosAVencer.map((v) => v.id)).toEqual(['b']);
    expect(r.vencidos.map((v) => v.id)).toEqual(['c']);
    expect(r.criticos.map((v) => v.id)).toEqual(['c']);
  });
});
