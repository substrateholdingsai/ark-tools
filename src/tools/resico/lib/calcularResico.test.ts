import { describe, it, expect } from 'vitest';
import { calcularResicoPF } from './calcularResicoPF';
import { calcularResicoPM } from './calcularResicoPM';

describe('Motor Matemático RESICO 2026 — Persona Física (Art. 113-E y 113-J LISR)', () => {
  it('aplica la tasa del 1.0% para ingresos hasta $25,000 MXN (Rango 1)', () => {
    const res = calcularResicoPF({
      ingresosCobradosMes: 20000,
      ingresosAcumuladosPrevios: 0,
      retencionISREfectuadaPM: 0,
      ivaCobrado: 3200,
      ivaAcreditablePagado: 1000,
      retencionIVAEfectuadaPM: 0,
      mes: 1,
      ejercicio: 2026,
    });

    expect(res.tasaISRPct).toBe(1.0);
    expect(res.isrCausado).toBe(200.0);
    expect(res.isrNetoPagar).toBe(200.0);
    expect(res.ivaNetoPagar).toBe(2200.0);
    expect(res.totalImpuestosPagar).toBe(2400.0);
    expect(res.totalEnLetras).toContain('DOS MIL CUATROCIENTOS PESOS');
  });

  it('aplica la tasa del 1.1% para ingresos entre $25,000.01 y $50,000 MXN (Rango 2)', () => {
    const res = calcularResicoPF({
      ingresosCobradosMes: 40000,
      ingresosAcumuladosPrevios: 20000,
      retencionISREfectuadaPM: 0,
      ivaCobrado: 6400,
      ivaAcreditablePagado: 2000,
      retencionIVAEfectuadaPM: 0,
      mes: 2,
      ejercicio: 2026,
    });

    expect(res.tasaISRPct).toBe(1.1);
    expect(res.isrCausado).toBe(440.0);
    expect(res.isrNetoPagar).toBe(440.0);
  });

  it('aplica la tasa del 1.5% para ingresos entre $50,000.01 y $83,333.33 MXN (Rango 3)', () => {
    const res = calcularResicoPF({
      ingresosCobradosMes: 75000,
      ingresosAcumuladosPrevios: 50000,
      retencionISREfectuadaPM: 0,
      ivaCobrado: 12000,
      ivaAcreditablePagado: 3000,
      retencionIVAEfectuadaPM: 0,
      mes: 3,
      ejercicio: 2026,
    });

    expect(res.tasaISRPct).toBe(1.5);
    expect(res.isrCausado).toBe(1125.0);
    expect(res.isrNetoPagar).toBe(1125.0);
  });

  it('aplica la tasa del 2.0% para ingresos entre $83,333.34 y $208,333.33 MXN (Rango 4)', () => {
    const res = calcularResicoPF({
      ingresosCobradosMes: 150000,
      ingresosAcumuladosPrevios: 100000,
      retencionISREfectuadaPM: 0,
      ivaCobrado: 24000,
      ivaAcreditablePagado: 5000,
      retencionIVAEfectuadaPM: 0,
      mes: 4,
      ejercicio: 2026,
    });

    expect(res.tasaISRPct).toBe(2.0);
    expect(res.isrCausado).toBe(3000.0);
    expect(res.isrNetoPagar).toBe(3000.0);
  });

  it('aplica la tasa del 2.5% para ingresos mayores a $208,333.33 MXN (Rango 5)', () => {
    const res = calcularResicoPF({
      ingresosCobradosMes: 250000,
      ingresosAcumuladosPrevios: 500000,
      retencionISREfectuadaPM: 0,
      ivaCobrado: 40000,
      ivaAcreditablePagado: 10000,
      retencionIVAEfectuadaPM: 0,
      mes: 5,
      ejercicio: 2026,
    });

    expect(res.tasaISRPct).toBe(2.5);
    expect(res.isrCausado).toBe(6250.0);
    expect(res.isrNetoPagar).toBe(6250.0);
  });

  it('calcula y descuenta adecuadamente la retención del 1.25% de Personas Morales (Art. 113-J)', () => {
    const res = calcularResicoPF({
      ingresosCobradosMes: 100000, // Tasa 2.0% -> ISR Causado = $2,000
      ingresosAcumuladosPrevios: 0,
      retencionISREfectuadaPM: 0,
      autoCalcularRetencionPM: true,
      ingresosFacturadosPM: 80000, // Retención 1.25% de 80k = $1,000
      ivaCobrado: 16000,
      ivaAcreditablePagado: 6000,
      retencionIVAEfectuadaPM: 0,
      mes: 6,
      ejercicio: 2026,
    });

    expect(res.isrCausado).toBe(2000.0);
    expect(res.retencionISRAcreditada).toBe(1000.0);
    expect(res.isrNetoPagar).toBe(1000.0); // 2000 - 1000 = 1000
  });

  it('no arroja ISR neto negativo cuando la retención excede el impuesto causado y emite aviso', () => {
    const res = calcularResicoPF({
      ingresosCobradosMes: 20000, // Tasa 1.0% -> ISR Causado = $200
      ingresosAcumuladosPrevios: 0,
      retencionISREfectuadaPM: 500, // Retención de 500 > 200
      ivaCobrado: 3200,
      ivaAcreditablePagado: 1000,
      retencionIVAEfectuadaPM: 0,
      mes: 7,
      ejercicio: 2026,
    });

    expect(res.isrCausado).toBe(200.0);
    expect(res.retencionISRAcreditada).toBe(500.0);
    expect(res.isrNetoPagar).toBe(0.0);
    expect(res.advertencias.some((a) => a.includes('REMANENTE DE RETENCIÓN'))).toBe(true);
  });

  it('calcula saldo a favor de IVA cuando el acreditable excede al cobrado', () => {
    const res = calcularResicoPF({
      ingresosCobradosMes: 30000,
      ingresosAcumuladosPrevios: 0,
      retencionISREfectuadaPM: 0,
      ivaCobrado: 4800,
      ivaAcreditablePagado: 7000, // Mayor a cobrado
      retencionIVAEfectuadaPM: 0,
      mes: 8,
      ejercicio: 2026,
    });

    expect(res.ivaNetoPagar).toBe(-2200.0);
    // En total a pagar solo se suma el ISR (330), no el saldo a favor de IVA
    expect(res.totalImpuestosPagar).toBe(330.0);
    expect(res.advertencias.some((a) => a.includes('SALDO A FAVOR DE IVA'))).toBe(true);
  });

  it('activa alertas preventivas y críticas de aproximación al tope de $3,500,000 MXN', () => {
    // 80% del tope ($2,800,000) -> Preventivo
    const resPreventivo = calcularResicoPF({
      ingresosCobradosMes: 300000,
      ingresosAcumuladosPrevios: 2500000, // Total = 2.8M (80%)
      retencionISREfectuadaPM: 0,
      ivaCobrado: 48000,
      ivaAcreditablePagado: 10000,
      retencionIVAEfectuadaPM: 0,
      mes: 9,
      ejercicio: 2026,
    });
    expect(resPreventivo.alertaTope).toBe('preventivo');
    expect(resPreventivo.rebasoTope).toBe(false);

    // 92% del tope ($3,220,000) -> Crítico
    const resCritico = calcularResicoPF({
      ingresosCobradosMes: 220000,
      ingresosAcumuladosPrevios: 3000000, // Total = 3.22M (92%)
      retencionISREfectuadaPM: 0,
      ivaCobrado: 35200,
      ivaAcreditablePagado: 5000,
      retencionIVAEfectuadaPM: 0,
      mes: 10,
      ejercicio: 2026,
    });
    expect(resCritico.alertaTope).toBe('critico');
    expect(resCritico.rebasoTope).toBe(false);

    // Excedido ($3,600,000) -> Excedido
    const resExcedido = calcularResicoPF({
      ingresosCobradosMes: 600000,
      ingresosAcumuladosPrevios: 3000000, // Total = 3.6M
      retencionISREfectuadaPM: 0,
      ivaCobrado: 96000,
      ivaAcreditablePagado: 10000,
      retencionIVAEfectuadaPM: 0,
      mes: 11,
      ejercicio: 2026,
    });
    expect(resExcedido.alertaTope).toBe('excedido');
    expect(resExcedido.rebasoTope).toBe(true);
    expect(resExcedido.advertencias.some((a) => a.includes('EXCESO DE TOPE'))).toBe(true);
  });
});

describe('Motor Matemático RESICO 2026 — Persona Moral (Art. 206 al 215 LISR)', () => {
  it('calcula la utilidad fiscal acumulada a flujo de efectivo y aplica la tasa del 30%', () => {
    const res = calcularResicoPM({
      ingresosCobradosAcumulados: 1200000,
      deduccionesAutorizadasAcumuladas: 700000,
      ptuPagada: 50000,
      perdidasFiscalesPendientes: 50000,
      pagosProvisionalesPrevios: 80000,
      retencionesISRAcumuladas: 0,
      ivaCobrado: 32000,
      ivaAcreditablePagado: 15000,
      retencionIVAMes: 0,
      mes: 6,
      ejercicio: 2026,
    });

    // Utilidad = 1,200,000 - 700,000 - 50,000 - 50,000 = 400,000
    expect(res.utilidadFiscalBase).toBe(400000.0);
    // ISR Causado = 400,000 * 30% = 120,000
    expect(res.isrCausadoAcumulado).toBe(120000.0);
    // ISR a pagar = 120,000 - 80,000 (previos) = 40,000
    expect(res.isrNetoPagar).toBe(40000.0);
    // IVA a pagar = 32,000 - 15,000 = 17,000
    expect(res.ivaNetoPagar).toBe(17000.0);
    // Total a pagar = 40,000 + 17,000 = 57,000
    expect(res.totalImpuestosPagar).toBe(57000.0);
    expect(res.totalEnLetras).toContain('CINCUENTA Y SIETE MIL PESOS');
  });

  it('determina base cero si las deducciones y pérdidas superan los ingresos acumulados', () => {
    const res = calcularResicoPM({
      ingresosCobradosAcumulados: 500000,
      deduccionesAutorizadasAcumuladas: 600000,
      ptuPagada: 0,
      perdidasFiscalesPendientes: 0,
      pagosProvisionalesPrevios: 0,
      retencionesISRAcumuladas: 0,
      ivaCobrado: 16000,
      ivaAcreditablePagado: 16000,
      retencionIVAMes: 0,
      mes: 3,
      ejercicio: 2026,
    });

    expect(res.utilidadFiscalBase).toBe(0.0);
    expect(res.isrCausadoAcumulado).toBe(0.0);
    expect(res.isrNetoPagar).toBe(0.0);
    expect(res.advertencias.some((a) => a.includes('BASE CERO'))).toBe(true);
  });

  it('detecta superación del tope de $35,000,000 MXN para Personas Morales', () => {
    const res = calcularResicoPM({
      ingresosCobradosAcumulados: 36000000,
      deduccionesAutorizadasAcumuladas: 20000000,
      ptuPagada: 0,
      perdidasFiscalesPendientes: 0,
      pagosProvisionalesPrevios: 1000000,
      retencionesISRAcumuladas: 0,
      ivaCobrado: 100000,
      ivaAcreditablePagado: 50000,
      retencionIVAMes: 0,
      mes: 12,
      ejercicio: 2026,
    });

    expect(res.rebasoTope).toBe(true);
    expect(res.advertencias.some((a) => a.includes('EXCESO DE TOPE PM'))).toBe(true);
  });
});
