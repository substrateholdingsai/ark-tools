import { describe, it, expect } from 'vitest';
import {
  ejecutarConciliacionAnexo24,
  exportarConciliacionCSV,
  exportarLayoutContpaqi,
} from './motorConciliacion';
import type { FacturaCFDI } from '@/tools/xml-excel/types';
import type { MetadataParseResult } from '../types';

describe('motorConciliacionAnexo24', () => {
  const facturaMock1: FacturaCFDI = {
    id: 'f1',
    fileName: 'factura1.xml',
    version: '4.0',
    uuid: '11111111-2222-3333-4444-555555555555',
    fecha: '2026-03-10T12:00:00',
    tipoComprobante: 'I',
    tipoComprobanteDesc: 'Ingreso',
    serie: 'F',
    folio: '101',
    moneda: 'MXN',
    tipoCambio: 1,
    formaPago: '03',
    metodoPago: 'PUE',
    lugarExpedicion: '06600',
    rfcEmisor: 'EKU9003173C9',
    nombreEmisor: 'ESCUELA KEMPER',
    regimenFiscalEmisor: '601',
    rfcReceptor: 'XAXX010101000',
    nombreReceptor: 'PUBLICO EN GENERAL',
    regimenFiscalReceptor: '616',
    usoCFDI: 'G03',
    subtotal: 10000,
    descuento: 0,
    totalImpuestosTrasladados: 1600,
    totalImpuestosRetenidos: 0,
    total: 11600,
    iva16: 1600,
    iva8: 0,
    ivaRetenido: 0,
    isrRetenido: 0,
    ieps: 0,
    subtotal16: 10000,
    conceptosCount: 1,
    descripcionResumen: 'Servicios',
    estado: 'valido',
  };

  const facturaCanceladaMock: FacturaCFDI = {
    id: 'f2',
    fileName: 'factura_cancelada.xml',
    version: '4.0',
    uuid: '99999999-9999-9999-9999-999999999999',
    fecha: '2026-03-11T10:00:00',
    tipoComprobante: 'I',
    tipoComprobanteDesc: 'Ingreso',
    serie: 'F',
    folio: '102',
    moneda: 'MXN',
    tipoCambio: 1,
    formaPago: '01',
    metodoPago: 'PUE',
    lugarExpedicion: '06600',
    rfcEmisor: 'EKU9003173C9',
    nombreEmisor: 'ESCUELA KEMPER',
    regimenFiscalEmisor: '601',
    rfcReceptor: 'XAXX010101000',
    nombreReceptor: 'CLIENTE CANCELADO',
    regimenFiscalReceptor: '616',
    usoCFDI: 'G03',
    subtotal: 5000,
    descuento: 0,
    totalImpuestosTrasladados: 800,
    totalImpuestosRetenidos: 0,
    total: 5800,
    iva16: 800,
    iva8: 0,
    ivaRetenido: 0,
    isrRetenido: 0,
    ieps: 0,
    subtotal16: 5000,
    conceptosCount: 1,
    descripcionResumen: 'Cancelado',
    estado: 'valido',
  };

  const facturaConRetencionesMock: FacturaCFDI = {
    id: 'f3',
    fileName: 'factura_honorarios.xml',
    version: '4.0',
    uuid: '33333333-3333-3333-3333-333333333333',
    fecha: '2026-03-12T14:00:00',
    tipoComprobante: 'I',
    tipoComprobanteDesc: 'Ingreso',
    serie: 'HON',
    folio: '45',
    moneda: 'MXN',
    tipoCambio: 1,
    formaPago: '03',
    metodoPago: 'PUE',
    lugarExpedicion: '64000',
    rfcEmisor: 'EKU9003173C9',
    nombreEmisor: 'ESCUELA KEMPER',
    regimenFiscalEmisor: '601',
    rfcReceptor: 'CORP901231ABC',
    nombreReceptor: 'CORPORATIVO SA',
    regimenFiscalReceptor: '601',
    usoCFDI: 'G03',
    subtotal: 20000,
    descuento: 0,
    totalImpuestosTrasladados: 3200,
    totalImpuestosRetenidos: 2333.33,
    total: 20866.67,
    iva16: 3200,
    iva8: 0,
    ivaRetenido: 2133.33,
    isrRetenido: 200,
    ieps: 0,
    subtotal16: 20000,
    conceptosCount: 1,
    descripcionResumen: 'Servicios Profesionales',
    estado: 'valido',
  };

  const metadataMock: MetadataParseResult = {
    totalRegistros: 2,
    vigentes: 1,
    cancelados: 1,
    mapaPorUUID: new Map(),
    uuidsVigentes: new Set(['11111111-2222-3333-4444-555555555555']),
    uuidsCancelados: new Set(['99999999-9999-9999-9999-999999999999']),
    errores: [],
  };

  it('asocia por defecto Subtotal a Ingresos 16% (401.01) e IVA a Trasladado (208.01)', () => {
    const res = ejecutarConciliacionAnexo24([facturaMock1]);

    expect(res.resumen.totalCFDIsProcesados).toBe(1);
    expect(res.resumen.totalCFDIsVigentes).toBe(1);
    expect(res.resumen.totalPolizasGeneradas).toBe(1);
    expect(res.resumen.cuadrado).toBe(true);
    expect(res.resumen.diferencia).toBe(0);

    const poliza = res.polizas[0];
    expect(poliza?.partidas).toHaveLength(3);

    const pCliente = poliza?.partidas.find((p) => p.tipoPartida === 'cliente');
    expect(pCliente?.codigoAgrupador).toBe('105.01');
    expect(pCliente?.debe).toBe(11600);
    expect(pCliente?.haber).toBe(0);

    const pIngreso = poliza?.partidas.find((p) => p.tipoPartida === 'ingreso_16');
    expect(pIngreso?.codigoAgrupador).toBe('401.01');
    expect(pIngreso?.debe).toBe(0);
    expect(pIngreso?.haber).toBe(10000);

    const pIva = poliza?.partidas.find((p) => p.tipoPartida === 'iva_trasladado');
    expect(pIva?.codigoAgrupador).toBe('208.01');
    expect(pIva?.debe).toBe(0);
    expect(pIva?.haber).toBe(1600);
  });

  it('descarta facturas canceladas mediante cruce con Metadata del SAT', () => {
    const res = ejecutarConciliacionAnexo24([facturaMock1, facturaCanceladaMock], metadataMock);

    expect(res.resumen.totalCFDIsProcesados).toBe(2);
    expect(res.resumen.totalCFDIsVigentes).toBe(1);
    expect(res.resumen.totalCFDIsCancelados).toBe(1);
    expect(res.resumen.totalPolizasGeneradas).toBe(1);

    expect(res.descartesMetadata).toHaveLength(1);
    expect(res.descartesMetadata[0]?.uuid).toBe('99999999-9999-9999-9999-999999999999');

    expect(res.resumen.cuadrado).toBe(true);
  });

  it('cuadra pólizas complejas con retenciones de ISR e IVA', () => {
    const res = ejecutarConciliacionAnexo24([facturaConRetencionesMock]);

    expect(res.resumen.cuadrado).toBe(true);
    expect(res.resumen.diferencia).toBe(0);

    const poliza = res.polizas[0];
    expect(poliza?.totalDebe).toBe(poliza?.totalHaber);
  });

  it('exporta CSV con BOM UTF-8 y Layout Contpaqi', () => {
    const res = ejecutarConciliacionAnexo24([facturaMock1]);

    const csv = exportarConciliacionCSV(res);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('401.01');
    expect(csv).toContain('208.01');

    const layout = exportarLayoutContpaqi(res);
    expect(layout).toContain('P ');
    expect(layout).toContain('M ');
    expect(layout).toContain('11111111-2222-3333-4444-555555555555');
  });
});
