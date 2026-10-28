import { describe, it, expect } from 'vitest';
import { determinarEstrato, calcularCuotaAfiliacion, generarFolioSiem } from './calculoCuota';

describe('CANACO SERVYTUR Mérida — Motor de Cuotas de Afiliación & SIEM', () => {
  it('determina estratos empresariales correctamente según rango de personal', () => {
    expect(determinarEstrato(1)).toBe('micro');
    expect(determinarEstrato(10)).toBe('micro');
    expect(determinarEstrato(11)).toBe('pequena');
    expect(determinarEstrato(30)).toBe('pequena');
    expect(determinarEstrato(31)).toBe('mediana');
    expect(determinarEstrato(100)).toBe('mediana');
    expect(determinarEstrato(101)).toBe('grande');
    expect(determinarEstrato(500)).toBe('grande');
  });

  it('calcula la cuota oficial para microempresa (1 a 10 empleados)', () => {
    const cotizacion = calcularCuotaAfiliacion(5, 'comercio');
    expect(cotizacion.estrato).toBe('micro');
    expect(cotizacion.cuotaSiem).toBe(200);
    expect(cotizacion.cuotaMembresia).toBe(1800);
    expect(cotizacion.totalAnual).toBe(2000);
    expect(cotizacion.beneficios.length).toBeGreaterThanOrEqual(6);
  });

  it('calcula la cuota para empresa grande con beneficios preferenciales', () => {
    const cotizacion = calcularCuotaAfiliacion(150, 'turismo');
    expect(cotizacion.estrato).toBe('grande');
    expect(cotizacion.cuotaSiem).toBe(2200);
    expect(cotizacion.cuotaMembresia).toBe(9800);
    expect(cotizacion.totalAnual).toBe(12000);
    expect(cotizacion.beneficios).toContain(
      'Ventanilla prioritaria en trámites municipales de licencias de funcionamiento'
    );
  });

  it('genera un folio SIEM formateado con año 2026 y código de estrato', () => {
    const folio = generarFolioSiem('ABC010101XYZ', 'pequena');
    expect(folio).toMatch(/^SIEM-MID-2026-ABC0-PEQ-\d{4}$/);
  });
});
