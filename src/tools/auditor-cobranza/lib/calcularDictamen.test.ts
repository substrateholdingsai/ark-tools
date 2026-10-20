import { describe, it, expect } from 'vitest';
import {
  calcularDictamenCobranza,
  esEstadoDictamen,
  normalizarRiesgo,
  FACTOR_ESTADO,
  PESO_RIESGO,
} from './calcularDictamen';

describe('calcularDictamenCobranza — Motor de Auditoría de Cobranza', () => {
  it('valida estados de dictamen, factores, pesos y normaliza riesgos', () => {
    expect(esEstadoDictamen('COINCIDE')).toBe(true);
    expect(esEstadoDictamen('difiere')).toBe(true);
    expect(esEstadoDictamen('INVALIDO')).toBe(false);

    expect(FACTOR_ESTADO.COINCIDE).toBe(0);
    expect(FACTOR_ESTADO.DIFIERE).toBe(1);
    expect(FACTOR_ESTADO.PARCIAL).toBe(0.5);

    expect(PESO_RIESGO.CRITICO).toBe(10);
    expect(PESO_RIESGO.BAJO).toBe(1);

    expect(normalizarRiesgo('critico')).toBe('CRITICO');
    expect(normalizarRiesgo('ALTO')).toBe('ALTO');
    expect(normalizarRiesgo('OTRO')).toBe('MEDIO');
  });

  it('calcula dictamen SIN_EVALUAR cuando los alcances son falsos o vacíos', () => {
    const dictamen = calcularDictamenCobranza({
      incluirComparadores: false,
      incluirConductas: false,
    });

    expect(dictamen.resumen.nivel).toBe('SIN_EVALUAR');
    expect(dictamen.resumen.puntosMaximos).toBe(0);
    expect(dictamen.resumen.score).toBe(0);
    expect(dictamen.recomendaciones[0]).toContain('Define el alcance del dictamen');
  });

  it('calcula dictamen SIN_HALLAZGOS cuando todos los comparadores coinciden', () => {
    // Array con todos los comparadores 8.1 a 8.12 en COINCIDE
    const respuestas = Array.from({ length: 12 }, (_, i) => ({
      id: `8.${i + 1}`,
      estado: 'COINCIDE' as const,
    }));

    const dictamen = calcularDictamenCobranza({
      respuestasComparadores: respuestas,
      incluirConductas: false,
    });

    expect(dictamen.resumen.nivel).toBe('SIN_HALLAZGOS');
    expect(dictamen.resumen.score).toBe(0);
    expect(dictamen.resumen.hallazgos).toBe(0);
    expect(dictamen.resumen.observaciones).toBe(0);
    expect(dictamen.detalles).toHaveLength(0);
  });

  it('evalúa comparadores con DIFIERE y PARCIAL sumando puntos ponderados', () => {
    const dictamen = calcularDictamenCobranza({
      respuestasComparadores: {
        '8.1': 'DIFIERE', // Monto principal (CRITICO = 10 pts * 1 = 10 pts)
        '8.2': 'PARCIAL', // Tasa (CRITICO = 10 pts * 0.5 = 5 pts)
        '8.3': 'COINCIDE', // Plazo (0 pts)
      },
      incluirConductas: false,
    });

    // 8.1 es hallazgo (DIFIERE) y 8.2 es hallazgo (PARCIAL)
    expect(dictamen.resumen.hallazgos).toBeGreaterThanOrEqual(2);
    expect(dictamen.resumen.criticos).toBeGreaterThan(0);
    expect(dictamen.resumen.nivel).toBe('CRITICO');

    const detalle81 = dictamen.detalles.find((d) => d.id === '8.1');
    expect(detalle81).toBeDefined();
    expect(detalle81?.puntos).toBe(10);
    expect(detalle81?.categoria).toBe('hallazgo');

    const detalle82 = dictamen.detalles.find((d) => d.id === '8.2');
    expect(detalle82).toBeDefined();
    expect(detalle82?.puntos).toBe(5);
  });

  it('evalúa conductas detectadas con su peso nominal', () => {
    const dictamen = calcularDictamenCobranza({
      incluirComparadores: false,
      conductasDetectadas: ['1.1', '2.1'], // Ambas CRITICAS (10 + 10 = 20 pts)
    });

    expect(dictamen.alcance.totalConductasEvaluadas).toBe(43);
    expect(dictamen.resumen.hallazgos).toBe(2);
    expect(dictamen.resumen.criticos).toBe(2);
    expect(dictamen.resumen.puntosRiesgo).toBe(20);
    expect(dictamen.resumen.nivel).toBe('CRITICO');

    const detalle11 = dictamen.detalles.find((d) => d.id === '1.1');
    expect(detalle11?.tipo).toBe('conducta');
    expect(detalle11?.titulo).toBe('Usurpación de identidad corporativa');
  });

  it('genera advertencia ante comparadores o conductas desconocidas', () => {
    const dictamen = calcularDictamenCobranza({
      respuestasComparadores: {
        ID_INEXISTENTE: 'DIFIERE',
      },
      conductasDetectadas: ['CONDUCTA_FALSA'],
    });

    expect(dictamen.advertencias.some((a) => a.includes('Comparador desconocido'))).toBe(true);
    expect(dictamen.advertencias.some((a) => a.includes('Conducta desconocida'))).toBe(true);
  });

  it('soporta objeto detallado con notas en comparadores', () => {
    const dictamen = calcularDictamenCobranza({
      respuestasComparadores: {
        '8.4': {
          estado: 'DIFIERE',
          nota: 'Se detectó cobro en cuenta de persona física.',
        },
      },
      incluirConductas: false,
    });

    const detalle84 = dictamen.detalles.find((d) => d.id === '8.4');
    expect(detalle84?.nota).toBe('Se detectó cobro en cuenta de persona física.');
  });
});
