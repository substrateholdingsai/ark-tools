import { describe, it, expect } from 'vitest';
import { generarContenidoCedulaAafy } from './exportarCedulaAafy';
import type { ConceptoPercepcion, Estado, ResultadoISN } from '../types';

describe('exportarCedulaAafy', () => {
  const estadoYuc: Estado = {
    id: 'YUC',
    nombre: 'Yucatán',
    corto: 'Yuc',
    tasa: 2.5,
    vigencia: '2026',
    articulo: 'Art. 21 al 27 LGHY',
  };

  const conceptos: ConceptoPercepcion[] = [
    { id: 1, concepto: 'Sueldo ordinario', gravado: 50000, exento: 0 },
    { id: 2, concepto: 'Comisiones mercantiles', gravado: 10000, exento: 0 },
    { id: 3, concepto: 'Viáticos comprobados', gravado: 0, exento: 5000 },
  ];

  const resultado: ResultadoISN = {
    baseGravable: 60000,
    totalExento: 5000,
    totalPercepciones: 65000,
    tasa: 2.5,
    isn: 1500,
  };

  it('genera el contenido de la cédula AAFY con fundamento LGHY y tasa 2.5%', () => {
    const csv = generarContenidoCedulaAafy({
      estado: estadoYuc,
      conceptos,
      resultado,
      razonSocial: 'Comercializadora Mayab S.A. de C.V.',
      rfc: 'CMA200101AB1',
      registroEstatalAafy: 'REC-MID-98765',
      registroPatronalImss: 'Y1234567101',
      ejercicio: 2026,
      mes: 'Octubre',
    });

    expect(csv).toContain('AGENCIA DE ADMINISTRACIÓN FISCAL DE YUCATÁN (AAFY)');
    expect(csv).toContain('Art. 21 al 27 LGHY');
    expect(csv).toContain('CMA200101AB1');
    expect(csv).toContain('REC-MID-98765');
    expect(csv).toContain('Y1234567101');
    expect(csv).toContain('60000.00'); // Base gravable
    expect(csv).toContain('1500.00'); // ISN determinado
    expect(csv).toContain('2.5%');
    expect(csv).toContain('aafy.yucatan.gob.mx');
  });

  it('maneja valores por defecto si no se proporcionan datos adicionales', () => {
    const csv = generarContenidoCedulaAafy({
      estado: estadoYuc,
      conceptos,
      resultado,
    });

    expect(csv).toContain('AGENCIA DE ADMINISTRACIÓN FISCAL DE YUCATÁN (AAFY)');
    expect(csv).toContain('XAXX010101000');
    expect(csv).toContain('1500.00');
  });
});
