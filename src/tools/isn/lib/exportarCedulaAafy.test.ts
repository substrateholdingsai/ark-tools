import { describe, it, expect } from 'vitest';
import { generarContenidoCedulaAafy } from './exportarCedulaAafy';
import type { ConceptoPercepcion, Estado, ResultadoISN } from '../types';

describe('exportarCedulaAafy', () => {
  const estadoYuc: Estado = {
    id: 'YUC',
    nombre: 'Yucatán',
    corto: 'Yuc',
    tasa: 3.75,
    vigencia: '2026',
    articulo: 'Art. 21 al 27 LGHY, Art. 24 tasa 3.75% (2026), Decreto 138/2025, Decreto 147/2025',
  };

  const conceptos: ConceptoPercepcion[] = [
    { id: 1, concepto: 'Sueldo ordinario', gravado: 200000, exento: 0 },
    { id: 2, concepto: 'Comisiones mercantiles', gravado: 50000, exento: 0 },
    { id: 3, concepto: 'Viáticos comprobados', gravado: 0, exento: 5000 },
  ];

  const resultado: ResultadoISN = {
    baseGravable: 250000,
    totalExento: 5000,
    totalPercepciones: 255000,
    tasa: 3.75,
    tasaBruta: 3.75,
    tasaEfectiva: 3.0,
    isnBruto: 9375,
    estimulo: 1875,
    isn: 7500,
    isnNeto: 7500,
    ejercicio: 2026,
    regimen: 'micro_pequena',
    estimuloConfirmado: true,
    decretoAplicado: 'Decreto 147/2025, D.O. 31-dic-2025',
    articuloAplicado: 'Art. 24 LGHY y Decreto 147/2025',
  };

  it('genera el contenido de la cédula AAFY con fundamento LGHY, tasa 3.75% bruta y estímulo Decreto 147/2025', () => {
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
    expect(csv).toContain('250000.00'); // Base gravable
    expect(csv).toContain('9375.00'); // ISN bruto
    expect(csv).toContain('1875.00'); // Estímulo Decreto 147/2025
    expect(csv).toContain('7500.00'); // ISN neto
    expect(csv).toContain('3.75%');
    expect(csv).toContain('3.0%');
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
    expect(csv).toContain('7500.00');
  });
});
