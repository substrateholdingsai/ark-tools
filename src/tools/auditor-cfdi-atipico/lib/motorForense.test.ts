import { describe, it, expect } from 'vitest';
import {
  calcularMallaMensual,
  conciliarConMetadata,
  evaluarCriteriosForense,
  clasificarRiesgoMatriz,
  CRITERIOS_DEFAULT,
} from './motorForense';
import { generarDatosDemostracion } from './generadorDemo';

describe('Motor Forense y Algorítmico de CFDI Atípicos', () => {
  const demo = generarDatosDemostracion(2026);

  it('calcula la malla mensual de 12 meses con totales e importes válidos', () => {
    const { malla, promedioMensual, desviacionEstandar } = calcularMallaMensual(demo.cfdis, 2026);

    expect(malla).toHaveLength(12);
    expect(promedioMensual).toBeGreaterThan(0);
    expect(desviacionEstandar).toBeGreaterThan(0);

    const totalEmitidos = malla.reduce((acc, m) => acc + m.emitidos.importe, 0);
    expect(totalEmitidos).toBeGreaterThan(100000);
  });

  it('concilia adecuadamente los XML contra la Metadata del SAT', () => {
    const res = conciliarConMetadata(demo.cfdis, demo.metadata);

    expect(res.totalXML).toBe(demo.cfdis.length);
    expect(res.totalMetadata).toBe(demo.metadata.length);
    expect(res.canceladosEnSAT).toBeGreaterThanOrEqual(1);
  });

  it('identifica violaciones de efectivo mayor a $2,000 (Art. 27 LISR)', () => {
    const hallazgos = evaluarCriteriosForense(demo.cfdis, demo.metadata, CRITERIOS_DEFAULT, 2026);
    const hallazgoEfectivo = hallazgos.find((h) => h.criterioId === 'EFECTIVO_EXCESO');

    expect(hallazgoEfectivo).toBeDefined();
    expect(hallazgoEfectivo?.nivelRiesgo).toBe('Crítico');
    expect(hallazgoEfectivo?.importeInvolucrado).toBeGreaterThan(2000);
  });

  it('identifica sospecha de fraccionamiento de pagos en efectivo en el mismo día', () => {
    const hallazgos = evaluarCriteriosForense(demo.cfdis, demo.metadata, CRITERIOS_DEFAULT, 2026);
    const hallazgoFrac = hallazgos.find((h) => h.criterioId === 'FRACCIONAMIENTO_EFECTIVO');

    expect(hallazgoFrac).toBeDefined();
    expect(hallazgoFrac?.comprobantesUUIDs.length).toBeGreaterThanOrEqual(2);
  });

  it('detecta facturas con estatus CANCELADO en metadata SAT', () => {
    const hallazgos = evaluarCriteriosForense(demo.cfdis, demo.metadata, CRITERIOS_DEFAULT, 2026);
    const hallazgoCanc = hallazgos.find((h) => h.criterioId === 'CANCELADOS_METADATA');

    expect(hallazgoCanc).toBeDefined();
    expect(hallazgoCanc?.nivelRiesgo).toBe('Crítico');
  });

  it('detecta operaciones con EFOS de la lista 69-B del CFF', () => {
    const hallazgos = evaluarCriteriosForense(demo.cfdis, demo.metadata, CRITERIOS_DEFAULT, 2026);
    const hallazgoEFOS = hallazgos.find((h) => h.criterioId === 'LISTA_69B');

    expect(hallazgoEFOS).toBeDefined();
    expect(hallazgoEFOS?.nivelRiesgo).toBe('Crítico');
  });

  it('clasifica correctamente los cuadrantes de la matriz de riesgo 5x5', () => {
    expect(clasificarRiesgoMatriz(5, 5)).toBe('Crítico');
    expect(clasificarRiesgoMatriz(4, 3)).toBe('Alto');
    expect(clasificarRiesgoMatriz(3, 2)).toBe('Moderado');
    expect(clasificarRiesgoMatriz(1, 2)).toBe('Bajo');
  });
});
