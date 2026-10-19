import { describe, expect, it } from 'vitest';
import { calcularTotales, analizarBalance } from './calcularBalance';
import type { JerarquiaBalance } from '../types';

describe('Balance General - Core', () => {
  it('valida ecuación A = P + C', () => {
    const j: JerarquiaBalance = {
      activoCorriente: [
        {
          id: 'a1',
          codigo: '1101',
          nombre: 'Caja',
          naturaleza: 'deudora',
          montoActual: 1000,
          nivel: 1,
          tipo: 'activo_corriente',
        },
      ],
      activoNoCorriente: [],
      pasivoCorriente: [
        {
          id: 'p1',
          codigo: '2101',
          nombre: 'Proveedores',
          naturaleza: 'acreedora',
          montoActual: 400,
          nivel: 1,
          tipo: 'pasivo_corriente',
        },
      ],
      pasivoNoCorriente: [],
      patrimonio: [
        {
          id: 'c1',
          codigo: '3101',
          nombre: 'Capital',
          naturaleza: 'acreedora',
          montoActual: 600,
          nivel: 1,
          tipo: 'patrimonio',
        },
      ],
    };
    const t = calcularTotales(j);
    expect(t.cuadrado).toBe(true);
    expect(t.totalActivo).toBe(1000);
    expect(t.totalPasivoPatrimonio).toBe(1000);
  });

  it('calcula AV y AH con precisión 2 decimales', () => {
    const j: JerarquiaBalance = {
      activoCorriente: [
        {
          id: 'a1',
          codigo: '1101',
          nombre: 'Caja',
          naturaleza: 'deudora',
          montoActual: 1200,
          montoAnterior: 1000,
          nivel: 1,
          tipo: 'activo_corriente',
        },
      ],
      activoNoCorriente: [],
      pasivoCorriente: [],
      pasivoNoCorriente: [],
      patrimonio: [
        {
          id: 'c1',
          codigo: '3101',
          nombre: 'Capital',
          naturaleza: 'acreedora',
          montoActual: 1200,
          montoAnterior: 1000,
          nivel: 1,
          tipo: 'patrimonio',
        },
      ],
    };
    const t = calcularTotales(j);
    const res = analizarBalance(j, t);
    const caja = res.cuentas.find((x) => x.codigo === '1101');
    expect(caja).toBeDefined();
    if (caja) {
      expect(caja.analisisVerticalActual).toBe(100);
      expect(caja.variacionPorcentual).toBe(20);
    }
  });

  it('evita división por cero en AH', () => {
    const j: JerarquiaBalance = {
      activoCorriente: [
        {
          id: 'a1',
          codigo: '1101',
          nombre: 'Caja',
          naturaleza: 'deudora',
          montoActual: 500,
          montoAnterior: 0,
          nivel: 1,
          tipo: 'activo_corriente',
        },
      ],
      activoNoCorriente: [],
      pasivoCorriente: [],
      pasivoNoCorriente: [],
      patrimonio: [
        {
          id: 'c1',
          codigo: '3101',
          nombre: 'Capital',
          naturaleza: 'acreedora',
          montoActual: 500,
          nivel: 1,
          tipo: 'patrimonio',
        },
      ],
    };
    const t = calcularTotales(j);
    const res = analizarBalance(j, t);
    const caja = res.cuentas.find((x) => x.codigo === '1101');
    expect(caja).toBeDefined();
    if (caja) {
      expect(caja.variacionPorcentual).toBeNull();
    }
    expect(t.cuadrado).toBe(true);
  });
});
