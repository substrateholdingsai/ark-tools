import { describe, it, expect } from 'vitest';
import {
  detectarDelimitador,
  normalizarFecha,
  parsearNumero,
  parsearPlantillaCobranza,
  generarPlantillaEjemploCobranzaCSV,
} from './parserCobranza';

describe('Parser de Sábanas de Cobranza (parserCobranza)', () => {
  it('detecta delimitadores por coma, punto y coma y tabulador', () => {
    expect(detectarDelimitador('col1,col2,col3')).toBe(',');
    expect(detectarDelimitador('col1;col2;col3')).toBe(';');
    expect(detectarDelimitador('col1\tcol2\tcol3')).toBe('\t');
  });

  it('normaliza fechas en distintos formatos a YYYY-MM-DD', () => {
    expect(normalizarFecha('2026-03-15')).toBe('2026-03-15');
    expect(normalizarFecha('15/03/2026')).toBe('2026-03-15');
    expect(normalizarFecha('15-03-2026')).toBe('2026-03-15');
    expect(normalizarFecha('2026/03/15')).toBe('2026-03-15');
  });

  it('parsea números eliminando comas, signos de pesos y espacios', () => {
    expect(parsearNumero('$125,500.50')).toBe(125500.5);
    expect(parsearNumero(' 3500.00 ')).toBe(3500);
    expect(parsearNumero(450)).toBe(450);
    expect(parsearNumero('')).toBe(0);
  });

  it('parsea exitosamente la plantilla de ejemplo oficial', () => {
    const csvEjemplo = generarPlantillaEjemploCobranzaCSV();
    const resultado = parsearPlantillaCobranza(csvEjemplo);

    expect(resultado.esValido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
    expect(resultado.operacionesValidas.length).toBeGreaterThan(0);

    const primera = resultado.operacionesValidas[0]!;
    expect(primera.idCliente).toBe('INM-CORP-9801');
    expect(primera.montoCobrado).toBe(130000);
    expect(primera.fechaPago).toBe('2026-01-10');
  });

  it('valida columnas requeridas y rechaza archivos sin encabezados obligatorios', () => {
    const csvInvalido = 'colA,colB,colC\n1,2,3';
    const resultado = parsearPlantillaCobranza(csvInvalido);

    expect(resultado.esValido).toBe(false);
    expect(resultado.errores.length).toBeGreaterThanOrEqual(2);
  });

  it('detecta archivos vacíos', () => {
    const resultado = parsearPlantillaCobranza('');
    expect(resultado.esValido).toBe(false);
    expect(resultado.errores).toContain('El archivo importado se encuentra vacío.');
  });
});
