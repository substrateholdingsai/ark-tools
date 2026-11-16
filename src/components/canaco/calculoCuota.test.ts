import { describe, it, expect } from 'vitest';
import { determinarEstrato, calcularCuotaAfiliacion, generarFolioSiem } from './calculoCuota';

describe('CANACO SERVYTUR Mérida — Motor de Cuotas de Afiliación & SIEM', () => {
  it('determina estratos empresariales correctamente según rango de personal', () => {
    expect(determinarEstrato(1)).toBe('micro');
    expect(determinarEstrato(10)).toBe('micro');
    expect(determinarEstrato(11)).toBe('pequena');
    expect(determinarEstrato(15)).toBe('pequena');
    expect(determinarEstrato(30)).toBe('pequena');
    expect(determinarEstrato(31)).toBe('mediana');
    expect(determinarEstrato(60)).toBe('mediana');
    expect(determinarEstrato(100)).toBe('mediana');
    expect(determinarEstrato(101)).toBe('grande');
    expect(determinarEstrato(500)).toBe('grande');
  });

  it('calcula el importe de referencia para microempresa (1 a 10 empleados)', () => {
    const cotizacion = calcularCuotaAfiliacion(5, 'comercio');
    expect(cotizacion.estrato).toBe('micro');
    expect(cotizacion.cuotaSiem).toBe(200);
    expect(cotizacion.cuotaMembresia).toBe(1800);
    expect(cotizacion.totalAnual).toBe(2000);
    expect(cotizacion.beneficios).toContain(
      'Importes de referencia sujetos a confirmación por CANACO'
    );
  });

  it('calcula importes de referencia y aclara que beneficios adicionales deben confirmarse', () => {
    const cotizacion = calcularCuotaAfiliacion(150, 'turismo');
    expect(cotizacion.estrato).toBe('grande');
    expect(cotizacion.cuotaSiem).toBe(2200);
    expect(cotizacion.cuotaMembresia).toBe(9800);
    expect(cotizacion.totalAnual).toBe(12000);
    expect(cotizacion.beneficios).toContain(
      'Consulta con CANACO si hay servicios adicionales disponibles para tu estrato'
    );
  });

  it('determina la cotización de referencia para el caso de 15 empleados', () => {
    const cotizacion = calcularCuotaAfiliacion(15, 'comercio');
    expect(cotizacion.estrato).toBe('pequena');
    expect(cotizacion.totalAnual).toBe(3700);
  });

  it('genera un folio SIEM formateado con año 2026 y código de estrato', () => {
    const folio = generarFolioSiem('ABC010101XYZ', 'pequena');
    expect(folio).toMatch(/^SIEM-MID-2026-ABC0-PEQ-\d{4}$/);
  });
});
