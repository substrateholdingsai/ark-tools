import { describe, it, expect } from 'vitest';
import { numeroALetras } from './numeroALetras';

describe('numeroALetras — Conversor Contable Oficial', () => {
  it('convierte montos enteros correctamente', () => {
    expect(numeroALetras(0)).toBe('CERO PESOS 00/100 M.N.');
    expect(numeroALetras(1)).toBe('UN PESO 00/100 M.N.');
    expect(numeroALetras(100)).toBe('CIEN PESOS 00/100 M.N.');
    expect(numeroALetras(500)).toBe('QUINIENTOS PESOS 00/100 M.N.');
    expect(numeroALetras(1000)).toBe('MIL PESOS 00/100 M.N.');
  });

  it('convierte centavos fraccionarios correctamente', () => {
    expect(numeroALetras(15420.5)).toBe('QUINCE MIL CUATROCIENTOS VEINTE PESOS 50/100 M.N.');
    expect(numeroALetras(2589.99)).toBe('DOS MIL QUINIENTOS OCHENTA Y NUEVE PESOS 99/100 M.N.');
  });

  it('convierte cifras en millones', () => {
    expect(numeroALetras(1000000)).toBe('UN MILLÓN PESOS 00/100 M.N.');
    expect(numeroALetras(2500000)).toBe('DOS MILLONES QUINIENTOS MIL PESOS 00/100 M.N.');
  });
});
