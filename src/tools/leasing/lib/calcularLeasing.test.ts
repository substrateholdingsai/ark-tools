import { describe, it, expect } from 'vitest';
import {
  proyectarMeses,
  calcularResumenLeasing,
  formatearMXN,
  PARAMETROS_DEFAULT,
} from './calcularLeasing';
import { generarCSVProyeccion } from './exportarProyeccion';

describe('Calculadora de Leasing y MRR ($500 setup -> $2,500 renta)', () => {
  it('genera proyección mensual para 12 meses', () => {
    const meses = proyectarMeses(PARAMETROS_DEFAULT);

    expect(meses.length).toBe(12);
    const m1 = meses[0]!;
    expect(m1.mes).toBe(1);
    expect(m1.clientesInicio).toBe(5);
    expect(m1.clientesNuevos).toBe(3);
    // 5 + 3 = 8 clientes. Churn 3%: Math.round(8 * 0.03) = 0 perdidos
    expect(m1.clientesFin).toBe(8);
    // Setup: 3 * 500 = 1500
    expect(m1.ingresosSetup).toBe(1500);
    // Rentas: 8 * 2500 = 20000
    expect(m1.ingresosRentas).toBe(20000);
    // Total mes: 21500
    expect(m1.ingresoTotalMes).toBe(21500);
  });

  it('calcula métricas de resumen financiero (MRR, ARR, LTV)', () => {
    const meses = proyectarMeses(PARAMETROS_DEFAULT);
    const resumen = calcularResumenLeasing(PARAMETROS_DEFAULT, meses);

    expect(resumen.clientesFinales).toBeGreaterThan(5);
    expect(resumen.mrrFinal).toBe(resumen.clientesFinales * 2500);
    expect(resumen.arrProyectado).toBe(resumen.mrrFinal * 12);
    expect(resumen.ingresoBrutoTotal).toBeGreaterThan(0);
    expect(resumen.utilidadTotalAcumulada).toBeGreaterThan(0);
    expect(resumen.margenPromedioPorcentaje).toBeGreaterThan(80);
    expect(resumen.ltvEstimado).toBeGreaterThan(2500);
  });

  it('maneja proyección sin cancelaciones (churn = 0)', () => {
    const params = {
      ...PARAMETROS_DEFAULT,
      tasaChurnPorcentaje: 0,
      plazoMeses: 6,
    };
    const meses = proyectarMeses(params);

    expect(meses.length).toBe(6);
    // En mes 6: 5 iniciales + 6 * 3 = 23 clientes
    expect(meses[5]!.clientesFin).toBe(23);
  });

  it('genera CSV con BOM UTF-8 y encabezados', () => {
    const meses = proyectarMeses(PARAMETROS_DEFAULT);
    const resumen = calcularResumenLeasing(PARAMETROS_DEFAULT, meses);
    const csv = generarCSVProyeccion(meses, resumen);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('PROYECCIÓN DE LEASING RECURRENTE');
    expect(csv).toContain('MRR Final');
    expect(csv).toContain('Mes 1');
    expect(csv).toContain('Mes 12');
  });

  it('formatea moneda en MXN correctamente', () => {
    expect(formatearMXN(25000)).toContain('25,000');
  });
});
