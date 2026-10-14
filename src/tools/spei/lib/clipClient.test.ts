import { describe, it, expect } from 'vitest';
import {
  calcularComisionClip,
  validarSolicitudCobro,
  generarMensajeWhatsApp,
  formatearMXN,
} from './clipClient';

describe('Calculadora de Comisiones Clip', () => {
  it('calcula la comisión base de 3.6% + IVA (4.176% efectiva) para $1,000 MXN', () => {
    const res = calcularComisionClip(1000, 0);

    // 1000 * 3.6% = 36. 36 * 1.16 = 41.76
    expect(res.montoCobrado).toBe(1000);
    expect(res.comisionTotal).toBe(41.76);
    expect(res.netoRecibido).toBe(958.24);
    expect(res.msiMeses).toBe(0);
  });

  it('calcula correctamente con sobretasa de 3 Meses Sin Intereses (MSI)', () => {
    const res = calcularComisionClip(2000, 3);

    // (3.6 + 4.5) * 1.16 = 8.1 * 1.16 = 9.396%
    // 2000 * 9.396% = 187.92
    expect(res.msiMeses).toBe(3);
    expect(res.comisionTotal).toBe(187.92);
    expect(res.netoRecibido).toBe(1812.08);
  });

  it('maneja montos de cero sin errores', () => {
    const res = calcularComisionClip(0);
    expect(res.comisionTotal).toBe(0);
    expect(res.netoRecibido).toBe(0);
  });
});

describe('Validación de Solicitudes de Cobro Clip', () => {
  it('aprueba cargas válidas', () => {
    const res = validarSolicitudCobro({
      amount: 1500,
      purchase_description: 'Honorarios contables mensuales',
    });
    expect(res.valido).toBe(true);
  });

  it('rechaza montos menores a $1.00 MXN', () => {
    const res = validarSolicitudCobro({
      amount: 0.5,
      purchase_description: 'Prueba',
    });
    expect(res.valido).toBe(false);
    expect(res.error).toContain('mínimo');
  });

  it('rechaza descripciones vacías', () => {
    const res = validarSolicitudCobro({
      amount: 500,
      purchase_description: '',
    });
    expect(res.valido).toBe(false);
    expect(res.error).toContain('obligatoria');
  });

  it('rechaza descripciones que exceden 250 caracteres', () => {
    const res = validarSolicitudCobro({
      amount: 500,
      purchase_description: 'a'.repeat(251),
    });
    expect(res.valido).toBe(false);
    expect(res.error).toContain('250');
  });
});

describe('Generador de Mensajes WhatsApp', () => {
  it('genera enlace con número de teléfono preformateado', () => {
    const url = generarMensajeWhatsApp({
      cliente: 'Empresa ABC',
      monto: 3500,
      concepto: 'Declaración Anual 2025',
      linkPago: 'https://checkout.clip.mx/checkout/demo123',
      telefono: '+52 (55) 1234-5678',
    });

    expect(url).toContain('https://wa.me/525512345678');
    expect(url).toContain('Declaraci%C3%B3n%20Anual%202025');
    expect(url).toContain('https%3A%2F%2Fcheckout.clip.mx%2Fcheckout%2Fdemo123');
  });

  it('genera enlace general si no se proporciona teléfono', () => {
    const url = generarMensajeWhatsApp({
      monto: 1000,
      concepto: 'Servicios',
      linkPago: 'https://checkout.clip.mx/checkout/123',
    });

    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
  });

  it('formatea moneda correctamente', () => {
    expect(formatearMXN(2500)).toContain('2,500.00');
  });
});
