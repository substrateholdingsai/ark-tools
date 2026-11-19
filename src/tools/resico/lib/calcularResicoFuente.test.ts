import { describe, it, expect } from 'vitest';
import { TASA_IVA_GENERAL } from '@/data/valores-vigentes/catalogo';
import { calcularResicoPF } from './calcularResicoPF';
import { calcularResicoPM } from './calcularResicoPM';
import { TARIFA_RESICO_PF_MENSUAL } from '../data/tablasResico';
import type { EntradaResicoPF, EntradaResicoPM } from '../types';

const basePF: EntradaResicoPF = {
  ingresosCobradosMes: 65000,
  ingresosAcumuladosPrevios: 120000,
  retencionISREfectuadaPM: 0,
  autoCalcularRetencionPM: false,
  ingresosFacturadosPM: 0,
  ivaCobrado: 10400,
  ivaAcreditablePagado: 3800,
  retencionIVAEfectuadaPM: 0,
  tasaIVA: undefined,
  mes: 3,
  ejercicio: 2026,
};

const basePM: EntradaResicoPM = {
  ingresosCobradosAcumulados: 1200000,
  deduccionesAutorizadasAcumuladas: 750000,
  ptuPagada: 40000,
  perdidasFiscalesPendientes: 0,
  pagosProvisionalesPrevios: 85000,
  retencionesISRAcumuladas: 0,
  ivaCobrado: 32000,
  ivaAcreditablePagado: 14000,
  retencionIVAMes: 0,
  tasaIVA: undefined,
  mes: 3,
  ejercicio: 2026,
};

describe('T5 — RESICO: tasas desde fuente única (catálogo / tablasResico)', () => {
  it('TASA_IVA_GENERAL del catálogo es 0.16 y se usa como default en PF y PM', () => {
    expect(TASA_IVA_GENERAL).toBe(0.16);

    const pf = calcularResicoPF(basePF);
    expect(pf.tasaIVAPct).toBe(TASA_IVA_GENERAL * 100);

    const pm = calcularResicoPM(basePM);
    expect(pm.tasaIVAPct).toBe(TASA_IVA_GENERAL * 100);
  });

  it('tasa máxima de exceso PF es la del último rango de TARIFA_RESICO_PF_MENSUAL (no literal 0.025)', () => {
    const ultimo = TARIFA_RESICO_PF_MENSUAL[TARIFA_RESICO_PF_MENSUAL.length - 1]!;
    const exceso = calcularResicoPF({ ...basePF, ingresosCobradosMes: 4000000 });
    expect(exceso.tasaISRPct).toBe(ultimo.tasaPct);
  });
});
