/**
 * ARK LEDGER — Tests SBC 2026 (LSS Art. 27/28, LFT Art. 76/80/87)
 * Vitest
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import {
  calcularFactorIntegracion,
  calcularSBCFinal,
  calcularResultadoSBC,
  formatearFactor,
  formatearMXN,
  generarResumenTexto,
} from './calcularSBC';
import { CONSTANTES_IMSS, diasVacacionesPorAntiguedad, PARAMETROS_DEFAULT } from '../data/uma';
import { DesgloseTable } from '../components/DesgloseTable';
import type { ParametrosSBC } from '../types';

const base: ParametrosSBC = {
  salarioDiario: 200,
  diasVacaciones: 12,
  primaVacacional: 25,
  diasAguinaldo: 15,
  zona: 'general',
};

describe('calcularFactorIntegracion', () => {
  it('calcula factor típico (12 vac, 25%, 15 aguinaldo)', () => {
    const d = calcularFactorIntegracion(base);
    expect(d.diasPrimaVacacional).toBe(3);
    expect(d.factor).toBeCloseTo(1.0493150685, 9);
    expect(d.aporteVacaciones).toBeCloseTo(3 / 365, 9);
    expect(d.aporteAguinaldo).toBeCloseTo(15 / 365, 9);
  });

  it('factor 1.0 sin prestaciones', () => {
    const d = calcularFactorIntegracion({
      diasVacaciones: 0,
      primaVacacional: 0,
      diasAguinaldo: 0,
    });
    expect(d.factor).toBe(1);
  });
});

describe('calcularSBCFinal — zona (LSS Art. 28)', () => {
  it('aplica mínimo zona general por defecto ($315.04)', () => {
    const r = calcularSBCFinal(100);
    expect(r.tipoTope).toBe('min');
    expect(r.sbcFinal).toBe(CONSTANTES_IMSS.salarioMinimoGeneral);
    expect(r.salarioMinimoAplicado).toBe(315.04);
  });

  it('no aplica mínimo cuando sbcBruto >= mínimo general', () => {
    const r = calcularSBCFinal(330.58, 'general');
    expect(r.tipoTope).toBeNull();
    expect(r.sbcFinal).toBe(330.58);
  });

  it('aplica mínimo ZLFN solo si zona frontera explícita ($440.87)', () => {
    const r = calcularSBCFinal(200 * 1.0493150685, 'frontera');
    expect(r.tipoTope).toBe('min');
    expect(r.sbcFinal).toBe(CONSTANTES_IMSS.salarioMinimoFrontera);
    expect(r.salarioMinimoAplicado).toBe(440.87);
  });

  it('aplica tope máximo 25 UMA', () => {
    const r = calcularSBCFinal(5000, 'general');
    expect(r.tipoTope).toBe('max');
    expect(r.sbcFinal).toBe(CONSTANTES_IMSS.topePesos);
  });

  it('exact-tope (== tope) sigue siendo null (follow-up pendiente)', () => {
    const r = calcularSBCFinal(CONSTANTES_IMSS.topePesos, 'general');
    expect(r.tipoTope).toBeNull();
    expect(r.sbcFinal).toBe(CONSTANTES_IMSS.topePesos);
  });
});

describe('calcularResultadoSBC — vectores dorados Monday', () => {
  it('$200, 12 vac, 25%, 15 agui, general -> bruto 209.86, final 315.04 (min)', () => {
    const r = calcularResultadoSBC({ ...base, salarioDiario: 200, zona: 'general' });
    expect(r.sbcBruto).toBeCloseTo(209.863013698, 6);
    expect(r.sbcFinal).toBe(315.04);
    expect(r.tipoTope).toBe('min');
    expect(r.zona).toBe('general');
    expect(r.salarioMinimoAplicado).toBe(315.04);
  });

  it('$315.04, 12 vac, 25%, 15 agui -> bruto 330.58, final 330.58, null', () => {
    const r = calcularResultadoSBC({ ...base, salarioDiario: 315.04, zona: 'general' });
    expect(r.sbcBruto).toBeCloseTo(330.576219178, 6);
    expect(r.sbcFinal).toBeCloseTo(330.576219178, 6);
    expect(r.tipoTope).toBeNull();
  });

  it('$100, 12 vac, 25%, 15 agui, general -> final 315.04 (min)', () => {
    const r = calcularResultadoSBC({ ...base, salarioDiario: 100, zona: 'general' });
    expect(r.sbcBruto).toBeCloseTo(104.931506849, 6);
    expect(r.sbcFinal).toBe(315.04);
    expect(r.tipoTope).toBe('min');
  });

  it('$200, 12 vac, 25%, 15 agui, frontera -> final 440.87 (min)', () => {
    const r = calcularResultadoSBC({ ...base, salarioDiario: 200, zona: 'frontera' });
    expect(r.sbcBruto).toBeCloseTo(209.863013698, 6);
    expect(r.sbcFinal).toBe(440.87);
    expect(r.tipoTope).toBe('min');
    expect(r.zona).toBe('frontera');
  });

  it('$200, 30 vac, 25%, 30 agui, general -> final 315.04 (min)', () => {
    const r = calcularResultadoSBC({
      salarioDiario: 200,
      diasVacaciones: 30,
      primaVacacional: 25,
      diasAguinaldo: 30,
      zona: 'general',
    });
    // factor = 1 + (7.5 + 30)/365 = 1.102739726
    expect(r.factor).toBeCloseTo(1.102739726, 8);
    expect(r.sbcBruto).toBeCloseTo(220.547945205, 6);
    expect(r.sbcFinal).toBe(315.04);
    expect(r.tipoTope).toBe('min');
  });

  it('default zona es general', () => {
    const r = calcularResultadoSBC({
      salarioDiario: 200,
      diasVacaciones: 12,
      primaVacacional: 25,
      diasAguinaldo: 15,
    });
    expect(r.zona).toBe('general');
    expect(r.salarioMinimoAplicado).toBe(315.04);
  });
});

describe('Vacaciones Dignas LFT Art. 76', () => {
  it.each([
    [1, 12],
    [2, 14],
    [3, 16],
    [4, 18],
    [5, 20],
    [6, 22],
    [10, 22],
    [11, 24],
    [20, 26],
    [30, 30],
    [31, 32],
  ])('%i años -> %i días', (anios, dias) => {
    expect(diasVacacionesPorAntiguedad(anios)).toBe(dias);
  });

  it('frontera 5->6 años salta de 20 a 22 días (seleccionable)', () => {
    expect(diasVacacionesPorAntiguedad(5)).toBe(20);
    expect(diasVacacionesPorAntiguedad(6)).toBe(22);
  });
});

describe('Constantes y defaults', () => {
  it('usa UMA 2026 y topes de catálogo', () => {
    expect(CONSTANTES_IMSS.umaDiaria).toBe(117.31);
    expect(CONSTANTES_IMSS.topePesos).toBe(2932.75);
    expect(CONSTANTES_IMSS.salarioMinimoGeneral).toBe(315.04);
    expect(CONSTANTES_IMSS.salarioMinimoFrontera).toBe(440.87);
  });

  it('PARAMETROS_DEFAULT es zona general y 12 días (1 año)', () => {
    expect(PARAMETROS_DEFAULT.zona).toBe('general');
    expect(PARAMETROS_DEFAULT.diasVacaciones).toBe(12);
  });
});

describe('DesgloseTable — regresión UMA tope (must-fix 2)', () => {
  it('muestra $117.31 × 25 = $2,932.75 y no $113.14', () => {
    const params: ParametrosSBC = { ...base, salarioDiario: 580, zona: 'general' };
    const resultado = calcularResultadoSBC(params);
    const html = renderToStaticMarkup(
      React.createElement(DesgloseTable, { parametros: params, resultado })
    );
    expect(html).toContain('117.31');
    expect(html).toContain('2,932.75');
    expect(html).not.toContain('113.14');
  });
});

describe('formateo y resumen', () => {
  it('formatearFactor 4 decimales', () => {
    expect(formatearFactor(1.0493150684931507)).toBe('1.0493');
  });
  it('formatearMXN incluye decimales', () => {
    expect(formatearMXN(2932.75)).toContain('2,932.75');
  });
  it('generarResumenTexto incluye zona y datos', () => {
    const r = calcularResultadoSBC(base);
    const txt = generarResumenTexto(base, r);
    expect(txt).toContain('SBC 2026');
    expect(txt).toContain('General');
    expect(txt).toContain('Factor: 1.0493');
  });
});
