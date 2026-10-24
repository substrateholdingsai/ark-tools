/**
 * ARK LEDGER — Herramienta #16: Motor de Conciliación Anexo 24
 * Algoritmo Core de Conciliación, Auto-asociación y Generación de Pólizas
 *
 * Mapea CFDIs emitidos a códigos agrupadores del Anexo 24 del SAT:
 * - Subtotal a Ingresos según tasa (16% -> 401.01, 8% -> 401.02, 0% -> 401.03, Exento -> 401.04)
 * - IVA Trasladado a 208.01 (cobrado PUE) o 209.01 (no cobrado PPD)
 * - Clientes a 105.01
 * - Retenciones a 113.01 / 113.02
 * - Filtra y descarta facturas canceladas mediante cruce obligatorio con Metadata SAT
 */

import type { FacturaCFDI } from '@/tools/xml-excel/types';
import type {
  CatalogoBalanzaAnexo24,
  CuentaAnexo24,
  DescarteMetadata,
  ItemCFDIConciliado,
  MetadataParseResult,
  PartidaPoliza,
  PolizaIngreso,
  ResultadoConciliacion,
  ResumenConciliacion,
  CuentaUtilizada,
} from '../types';
import { obtenerCatalogoEstandarSAT } from './parserAnexo24';

const round2 = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;

/**
 * Busca la cuenta contable más adecuada en el catálogo o recurre a la estándar
 */
function resolverCuenta(
  catalogo: CatalogoBalanzaAnexo24,
  codAgrupPreferido: string,
  codAgrupAlternativo?: string
): CuentaAnexo24 {
  // 1. Búsqueda directa por código agrupador preferido
  let cta = catalogo.cuentasPorCodAgrup.get(codAgrupPreferido);
  if (cta) return cta;

  // 2. Búsqueda por alternativo si se proporcionó
  if (codAgrupAlternativo) {
    cta = catalogo.cuentasPorCodAgrup.get(codAgrupAlternativo);
    if (cta) return cta;
  }

  // 3. Búsqueda por prefijo (ej. '401' si busca '401.01')
  const prefijo = codAgrupPreferido.split('.')[0] || codAgrupPreferido;
  for (const [, c] of catalogo.cuentasPorCodAgrup) {
    if (c.codigoAgrupador.startsWith(prefijo)) {
      return c;
    }
  }

  // 4. Fallback sintético basado en código agrupador
  return {
    codigoAgrupador: codAgrupPreferido,
    numCta: `${codAgrupPreferido.replace('.', '-')}-000`,
    descripcion: `Cuenta Anexo 24 (${codAgrupPreferido})`,
    nivel: 2,
    naturaleza: codAgrupPreferido.startsWith('1') ? 'D' : 'A',
    tipo: 'otro',
  };
}

/**
 * Ejecuta el motor de conciliación y generación automática de pólizas
 */
export function ejecutarConciliacionAnexo24(
  facturas: FacturaCFDI[],
  metadata?: MetadataParseResult | null,
  catalogoPropio?: CatalogoBalanzaAnexo24 | null
): ResultadoConciliacion {
  const catalogo = catalogoPropio || obtenerCatalogoEstandarSAT();
  const uuidsCancelados = metadata?.uuidsCancelados || new Set<string>();
  const uuidsVigentes = metadata?.uuidsVigentes || new Set<string>();

  const polizas: PolizaIngreso[] = [];
  const partidasConciliadas: PartidaPoliza[] = [];
  const cfdisDetalle: ItemCFDIConciliado[] = [];
  const descartesMetadata: DescarteMetadata[] = [];
  const mapaCuentasUtilizadas = new Map<string, CuentaUtilizada>();

  let totalSubtotal16 = 0;
  let totalSubtotal8 = 0;
  let totalSubtotal0 = 0;
  let totalSubtotalExento = 0;
  let totalIVA16 = 0;
  let totalIVA8 = 0;
  let totalRetenciones = 0;
  let totalImporteFacturado = 0;
  let totalDebeGlobal = 0;
  let totalHaberGlobal = 0;

  let totalVigentes = 0;
  let totalCancelados = 0;

  // Cuentas pre-resueltas del catálogo
  const ctaClientes = resolverCuenta(catalogo, '105.01', '105');
  const ctaIngresos16 = resolverCuenta(catalogo, '401.01', '401');
  const ctaIngresos8 = resolverCuenta(catalogo, '401.02', '401');
  const ctaIngresos0 = resolverCuenta(catalogo, '401.03', '401');
  const ctaIngresosExento = resolverCuenta(catalogo, '401.04', '401');
  const ctaIvaCobrado16 = resolverCuenta(catalogo, '208.01', '208');
  const ctaIvaCobrado8 = resolverCuenta(catalogo, '208.02', '208');
  const ctaIvaNoCobrado16 = resolverCuenta(catalogo, '209.01', '209');
  const ctaIvaNoCobrado8 = resolverCuenta(catalogo, '209.02', '209');
  const ctaRetIsr = resolverCuenta(catalogo, '113.01', '216.01');
  const ctaRetIva = resolverCuenta(catalogo, '113.02', '216.02');
  const ctaDevoluciones = resolverCuenta(catalogo, '402.01', '402');

  const registrarMovimientoCuenta = (cta: CuentaAnexo24, debe: number, haber: number) => {
    const key = `${cta.codigoAgrupador}_${cta.numCta}`;
    const existente = mapaCuentasUtilizadas.get(key);
    if (existente) {
      existente.debe = round2(existente.debe + debe);
      existente.haber = round2(existente.haber + haber);
    } else {
      mapaCuentasUtilizadas.set(key, {
        codigoAgrupador: cta.codigoAgrupador,
        numCta: cta.numCta,
        descripcion: cta.descripcion,
        debe: round2(debe),
        haber: round2(haber),
      });
    }
  };

  facturas.forEach((f, idx) => {
    const uuidUpper = (f.uuid || '').trim().toUpperCase();
    const esCanceladoPorMetadata = uuidsCancelados.has(uuidUpper);
    const estaEnVigentes = uuidsVigentes.has(uuidUpper);

    // Determinar estatus oficial según SAT y metadata
    let estatusSAT: 'VIGENTE' | 'CANCELADO' | 'NO_VERIFICADO' = 'NO_VERIFICADO';
    if (metadata && metadata.totalRegistros > 0) {
      estatusSAT = esCanceladoPorMetadata
        ? 'CANCELADO'
        : estaEnVigentes
          ? 'VIGENTE'
          : 'NO_VERIFICADO';
    } else {
      estatusSAT = 'NO_VERIFICADO';
    }

    const folioVisual = `${f.serie ? `${f.serie}-` : ''}${f.folio || idx + 1}`;

    // Si está cancelada en el SAT, descartar de la contabilización
    if (esCanceladoPorMetadata) {
      totalCancelados++;
      const razon = 'CFDI descartado: Estatus CANCELADO verificado contra Metadata oficial del SAT';
      descartesMetadata.push({
        uuid: f.uuid,
        folio: folioVisual,
        razon,
        monto: f.total,
        rfcReceptor: f.rfcReceptor,
      });

      cfdisDetalle.push({
        uuid: f.uuid,
        folio: f.folio || '',
        serie: f.serie || '',
        fecha: f.fecha,
        rfcEmisor: f.rfcEmisor,
        rfcReceptor: f.rfcReceptor,
        nombreReceptor: f.nombreReceptor,
        total: f.total,
        subtotal: f.subtotal,
        descuento: f.descuento,
        iva16: f.iva16,
        iva8: f.iva8,
        iva0: 0,
        ivaExento: 0,
        retencionIsr: f.isrRetenido,
        retencionIva: f.ivaRetenido,
        metodoPago: f.metodoPago,
        formaPago: f.formaPago,
        tipoComprobante: f.tipoComprobante,
        estatusSAT: 'CANCELADO',
        descartado: true,
        motivoDescarte: razon,
      });

      return;
    }

    // Factura vigente o a contabilizar
    totalVigentes++;
    totalImporteFacturado = round2(totalImporteFacturado + f.total);

    const partidasEstaPoliza: PartidaPoliza[] = [];
    const esPPD = (f.metodoPago || '').toUpperCase() === 'PPD';
    const subtotalNeto = Math.max(0, round2(f.subtotal - f.descuento));

    // Determinar bases por tasa
    let b16 = f.subtotal16 ?? 0;
    let b8 = f.subtotal8 ?? 0;
    let b0 = f.subtotal0 ?? 0;
    const bEx = f.subtotalExento ?? 0;

    // Si no vinieron bases segregadas, inferir por IVA
    if (b16 === 0 && b8 === 0 && b0 === 0 && bEx === 0) {
      if (f.iva16 > 0 && f.iva8 === 0) {
        b16 = subtotalNeto;
      } else if (f.iva8 > 0 && f.iva16 === 0) {
        b8 = subtotalNeto;
      } else if (f.iva16 === 0 && f.iva8 === 0) {
        b0 = subtotalNeto;
      } else {
        b16 = subtotalNeto;
      }
    }

    totalSubtotal16 = round2(totalSubtotal16 + b16);
    totalSubtotal8 = round2(totalSubtotal8 + b8);
    totalSubtotal0 = round2(totalSubtotal0 + b0);
    totalSubtotalExento = round2(totalSubtotalExento + bEx);

    const iva16 = round2(f.iva16 || 0);
    const iva8 = round2(f.iva8 || 0);
    totalIVA16 = round2(totalIVA16 + iva16);
    totalIVA8 = round2(totalIVA8 + iva8);

    const isrRet = round2(f.isrRetenido || 0);
    const ivaRet = round2(f.ivaRetenido || 0);
    totalRetenciones = round2(totalRetenciones + isrRet + ivaRet);

    const conceptoBase = `${f.tipoComprobante === 'E' ? 'Nota de Crédito' : 'Factura'} ${folioVisual} - ${f.nombreReceptor || f.rfcReceptor}`;

    if (f.tipoComprobante === 'E') {
      // ═════════════════════════════════════════════════════════════════
      // NOTA DE CRÉDITO (EGRESO)
      // Cargo a Devoluciones + Cargo a IVA Trasladado // Abono a Clientes
      // ═════════════════════════════════════════════════════════════════
      if (subtotalNeto > 0) {
        partidasEstaPoliza.push({
          id: `p-${f.uuid}-dev`,
          cfdiUuid: f.uuid,
          cfdiFolio: folioVisual,
          codigoAgrupador: ctaDevoluciones.codigoAgrupador,
          numCta: ctaDevoluciones.numCta,
          nombreCuenta: ctaDevoluciones.descripcion,
          concepto: `${conceptoBase} (Devolución/Descuento)`,
          tipoPartida: 'devolucion',
          debe: subtotalNeto,
          haber: 0,
          estatus: 'cuadrado',
        });
        registrarMovimientoCuenta(ctaDevoluciones, subtotalNeto, 0);
      }

      if (iva16 > 0) {
        const ctaIva = esPPD ? ctaIvaNoCobrado16 : ctaIvaCobrado16;
        partidasEstaPoliza.push({
          id: `p-${f.uuid}-iva16-e`,
          cfdiUuid: f.uuid,
          cfdiFolio: folioVisual,
          codigoAgrupador: ctaIva.codigoAgrupador,
          numCta: ctaIva.numCta,
          nombreCuenta: ctaIva.descripcion,
          concepto: `${conceptoBase} (Disminución IVA 16%)`,
          tipoPartida: 'iva_trasladado',
          debe: iva16,
          haber: 0,
          estatus: 'cuadrado',
        });
        registrarMovimientoCuenta(ctaIva, iva16, 0);
      }

      partidasEstaPoliza.push({
        id: `p-${f.uuid}-cli-e`,
        cfdiUuid: f.uuid,
        cfdiFolio: folioVisual,
        codigoAgrupador: ctaClientes.codigoAgrupador,
        numCta: ctaClientes.numCta,
        nombreCuenta: ctaClientes.descripcion,
        concepto: `${conceptoBase} (Disminución Saldo Cliente)`,
        tipoPartida: 'cliente',
        debe: 0,
        haber: f.total,
        estatus: 'cuadrado',
      });
      registrarMovimientoCuenta(ctaClientes, 0, f.total);
    } else {
      // ═════════════════════════════════════════════════════════════════
      // FACTURA DE INGRESO (CFDI 'I')
      // Cargo a Clientes + Retenciones // Abono a Ingresos + IVA
      // ═════════════════════════════════════════════════════════════════

      // 1. Cargo a Clientes
      partidasEstaPoliza.push({
        id: `p-${f.uuid}-cli`,
        cfdiUuid: f.uuid,
        cfdiFolio: folioVisual,
        codigoAgrupador: ctaClientes.codigoAgrupador,
        numCta: ctaClientes.numCta,
        nombreCuenta: ctaClientes.descripcion,
        concepto: `${conceptoBase} (Exigibilidad Cliente)`,
        tipoPartida: 'cliente',
        debe: f.total,
        haber: 0,
        estatus: 'cuadrado',
      });
      registrarMovimientoCuenta(ctaClientes, f.total, 0);

      // 2. Retenciones a favor (si existen en el comprobante)
      if (isrRet > 0) {
        partidasEstaPoliza.push({
          id: `p-${f.uuid}-ret-isr`,
          cfdiUuid: f.uuid,
          cfdiFolio: folioVisual,
          codigoAgrupador: ctaRetIsr.codigoAgrupador,
          numCta: ctaRetIsr.numCta,
          nombreCuenta: ctaRetIsr.descripcion,
          concepto: `${conceptoBase} (Retención ISR a favor)`,
          tipoPartida: 'retencion_isr',
          debe: isrRet,
          haber: 0,
          estatus: 'cuadrado',
        });
        registrarMovimientoCuenta(ctaRetIsr, isrRet, 0);
      }

      if (ivaRet > 0) {
        partidasEstaPoliza.push({
          id: `p-${f.uuid}-ret-iva`,
          cfdiUuid: f.uuid,
          cfdiFolio: folioVisual,
          codigoAgrupador: ctaRetIva.codigoAgrupador,
          numCta: ctaRetIva.numCta,
          nombreCuenta: ctaRetIva.descripcion,
          concepto: `${conceptoBase} (Retención IVA a favor)`,
          tipoPartida: 'retencion_iva',
          debe: ivaRet,
          haber: 0,
          estatus: 'cuadrado',
        });
        registrarMovimientoCuenta(ctaRetIva, ivaRet, 0);
      }

      // 3. Abono a Ingresos según tasa
      if (b16 > 0) {
        partidasEstaPoliza.push({
          id: `p-${f.uuid}-ing16`,
          cfdiUuid: f.uuid,
          cfdiFolio: folioVisual,
          codigoAgrupador: ctaIngresos16.codigoAgrupador,
          numCta: ctaIngresos16.numCta,
          nombreCuenta: ctaIngresos16.descripcion,
          concepto: `${conceptoBase} (Venta Tasa 16%)`,
          tipoPartida: 'ingreso_16',
          debe: 0,
          haber: b16,
          estatus: 'cuadrado',
        });
        registrarMovimientoCuenta(ctaIngresos16, 0, b16);
      }

      if (b8 > 0) {
        partidasEstaPoliza.push({
          id: `p-${f.uuid}-ing8`,
          cfdiUuid: f.uuid,
          cfdiFolio: folioVisual,
          codigoAgrupador: ctaIngresos8.codigoAgrupador,
          numCta: ctaIngresos8.numCta,
          nombreCuenta: ctaIngresos8.descripcion,
          concepto: `${conceptoBase} (Venta Tasa 8%)`,
          tipoPartida: 'ingreso_8',
          debe: 0,
          haber: b8,
          estatus: 'cuadrado',
        });
        registrarMovimientoCuenta(ctaIngresos8, 0, b8);
      }

      if (b0 > 0) {
        partidasEstaPoliza.push({
          id: `p-${f.uuid}-ing0`,
          cfdiUuid: f.uuid,
          cfdiFolio: folioVisual,
          codigoAgrupador: ctaIngresos0.codigoAgrupador,
          numCta: ctaIngresos0.numCta,
          nombreCuenta: ctaIngresos0.descripcion,
          concepto: `${conceptoBase} (Venta Tasa 0%)`,
          tipoPartida: 'ingreso_0',
          debe: 0,
          haber: b0,
          estatus: 'cuadrado',
        });
        registrarMovimientoCuenta(ctaIngresos0, 0, b0);
      }

      if (bEx > 0) {
        partidasEstaPoliza.push({
          id: `p-${f.uuid}-ing-ex`,
          cfdiUuid: f.uuid,
          cfdiFolio: folioVisual,
          codigoAgrupador: ctaIngresosExento.codigoAgrupador,
          numCta: ctaIngresosExento.numCta,
          nombreCuenta: ctaIngresosExento.descripcion,
          concepto: `${conceptoBase} (Venta Exenta)`,
          tipoPartida: 'ingreso_exento',
          debe: 0,
          haber: bEx,
          estatus: 'cuadrado',
        });
        registrarMovimientoCuenta(ctaIngresosExento, 0, bEx);
      }

      // 4. Abono a IVA Trasladado
      if (iva16 > 0) {
        const ctaIva = esPPD ? ctaIvaNoCobrado16 : ctaIvaCobrado16;
        partidasEstaPoliza.push({
          id: `p-${f.uuid}-iva16`,
          cfdiUuid: f.uuid,
          cfdiFolio: folioVisual,
          codigoAgrupador: ctaIva.codigoAgrupador,
          numCta: ctaIva.numCta,
          nombreCuenta: ctaIva.descripcion,
          concepto: `${conceptoBase} (IVA Trasladado 16% ${esPPD ? 'PPD No Cobrado' : 'PUE Cobrado'})`,
          tipoPartida: 'iva_trasladado',
          debe: 0,
          haber: iva16,
          estatus: 'cuadrado',
        });
        registrarMovimientoCuenta(ctaIva, 0, iva16);
      }

      if (iva8 > 0) {
        const ctaIva = esPPD ? ctaIvaNoCobrado8 : ctaIvaCobrado8;
        partidasEstaPoliza.push({
          id: `p-${f.uuid}-iva8`,
          cfdiUuid: f.uuid,
          cfdiFolio: folioVisual,
          codigoAgrupador: ctaIva.codigoAgrupador,
          numCta: ctaIva.numCta,
          nombreCuenta: ctaIva.descripcion,
          concepto: `${conceptoBase} (IVA Trasladado 8% ${esPPD ? 'PPD No Cobrado' : 'PUE Cobrado'})`,
          tipoPartida: 'iva_trasladado',
          debe: 0,
          haber: iva8,
          estatus: 'cuadrado',
        });
        registrarMovimientoCuenta(ctaIva, 0, iva8);
      }
    }

    const sumaDebePoliza = round2(partidasEstaPoliza.reduce((acc, p) => acc + p.debe, 0));
    const sumaHaberPoliza = round2(partidasEstaPoliza.reduce((acc, p) => acc + p.haber, 0));
    const diferenciaPoliza = round2(sumaDebePoliza - sumaHaberPoliza);
    const cuadrada = Math.abs(diferenciaPoliza) < 0.01;

    totalDebeGlobal = round2(totalDebeGlobal + sumaDebePoliza);
    totalHaberGlobal = round2(totalHaberGlobal + sumaHaberPoliza);

    const polizaGenerada: PolizaIngreso = {
      id: `poliza-${f.uuid}`,
      tipo: f.tipoComprobante === 'E' ? 'Diario' : 'Ingresos',
      folio: idx + 1,
      fecha: f.fecha ? f.fecha.split('T')[0] || f.fecha : '2026-03-01',
      concepto: conceptoBase,
      cfdiUuid: f.uuid,
      cfdiFolio: folioVisual,
      rfcReceptor: f.rfcReceptor,
      nombreReceptor: f.nombreReceptor,
      partidas: partidasEstaPoliza,
      totalDebe: sumaDebePoliza,
      totalHaber: sumaHaberPoliza,
      cuadrada,
      diferencia: diferenciaPoliza,
    };

    polizas.push(polizaGenerada);
    partidasConciliadas.push(...partidasEstaPoliza);

    cfdisDetalle.push({
      uuid: f.uuid,
      folio: f.folio || '',
      serie: f.serie || '',
      fecha: f.fecha,
      rfcEmisor: f.rfcEmisor,
      rfcReceptor: f.rfcReceptor,
      nombreReceptor: f.nombreReceptor,
      total: f.total,
      subtotal: f.subtotal,
      descuento: f.descuento,
      iva16: f.iva16,
      iva8: f.iva8,
      iva0: b0,
      ivaExento: bEx,
      retencionIsr: f.isrRetenido,
      retencionIva: f.ivaRetenido,
      metodoPago: f.metodoPago,
      formaPago: f.formaPago,
      tipoComprobante: f.tipoComprobante,
      estatusSAT,
      descartado: false,
      poliza: polizaGenerada,
    });
  });

  const diferenciaGlobal = round2(totalDebeGlobal - totalHaberGlobal);
  const globalCuadrado = Math.abs(diferenciaGlobal) < 0.01;

  const resumen: ResumenConciliacion = {
    totalCFDIsProcesados: facturas.length,
    totalCFDIsVigentes: totalVigentes,
    totalCFDIsCancelados: totalCancelados,
    totalImporteFacturado,
    totalSubtotal16,
    totalSubtotal8,
    totalSubtotal0,
    totalSubtotalExento,
    totalIVA16,
    totalIVA8,
    totalRetenciones,
    totalPolizasGeneradas: polizas.length,
    totalDebe: totalDebeGlobal,
    totalHaber: totalHaberGlobal,
    diferencia: diferenciaGlobal,
    cuadrado: globalCuadrado,
  };

  const cuentasUtilizadas = Array.from(mapaCuentasUtilizadas.values()).sort((a, b) =>
    a.codigoAgrupador.localeCompare(b.codigoAgrupador)
  );

  return {
    resumen,
    polizas,
    partidasConciliadas,
    cfdisDetalle,
    descartesMetadata,
    cuentasUtilizadas,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Genera el archivo CSV con BOM UTF-8 (\uFEFF) para visualización limpia en Microsoft Excel
 */
export function exportarConciliacionCSV(res: ResultadoConciliacion): string {
  const encabezados = [
    'Folio Fiscal (UUID)',
    'Fecha',
    'Folio CFDI',
    'RFC Receptor',
    'Nombre Receptor',
    'Tipo Comprobante',
    'Código Agrupador Anexo 24',
    'Número Cuenta',
    'Nombre de la Cuenta',
    'Concepto Movimiento',
    'Cargo (Debe)',
    'Abono (Haber)',
    'Estatus SAT',
  ];

  const filas: string[] = [encabezados.join(',')];

  for (const poliza of res.polizas) {
    for (const partida of poliza.partidas) {
      const fila = [
        `"${partida.cfdiUuid || poliza.cfdiUuid}"`,
        `"${poliza.fecha}"`,
        `"${poliza.cfdiFolio}"`,
        `"${poliza.rfcReceptor}"`,
        `"${(poliza.nombreReceptor || '').replace(/"/g, '""')}"`,
        `"${poliza.tipo}"`,
        `"${partida.codigoAgrupador}"`,
        `"${partida.numCta}"`,
        `"${(partida.nombreCuenta || '').replace(/"/g, '""')}"`,
        `"${(partida.concepto || '').replace(/"/g, '""')}"`,
        partida.debe.toFixed(2),
        partida.haber.toFixed(2),
        'VIGENTE',
      ];
      filas.push(fila.join(','));
    }
  }

  // Anexar también facturas canceladas para auditoría completa
  for (const descarte of res.descartesMetadata) {
    const fila = [
      `"${descarte.uuid}"`,
      '""',
      `"${descarte.folio || ''}"`,
      `"${descarte.rfcReceptor || ''}"`,
      '""',
      '"DESCARTADO"',
      '""',
      '""',
      '""',
      `"${descarte.razon.replace(/"/g, '""')}"`,
      '0.00',
      '0.00',
      'CANCELADO',
    ];
    filas.push(fila.join(','));
  }

  return '\uFEFF' + filas.join('\r\n');
}

/**
 * Genera el layout de Pólizas compatible con Contpaqi / COI
 * Formato estructurado:
 * P [Fecha AAAAMMDD] [Tipo] [Folio] [Concepto]
 * M [NumCta] [Referencia] [TipoMovimiento 0=Cargo, 1=Abono] [Importe] [Concepto] [UUID]
 */
export function exportarLayoutContpaqi(res: ResultadoConciliacion): string {
  const lineas: string[] = [];

  for (const poliza of res.polizas) {
    const fechaLimpia = poliza.fecha.replace(/[^0-9]/g, '');
    const tipoNum = poliza.tipo === 'Ingresos' ? 1 : poliza.tipo === 'Egreso' ? 2 : 3;
    const conceptoEscapado = poliza.concepto.replace(/"/g, "'").slice(0, 100);

    // Encabezado de Póliza
    lineas.push(`P ${fechaLimpia} ${tipoNum} ${poliza.folio} 0 1 "${conceptoEscapado}" 1 1`);

    // Movimientos (Partidas)
    for (const partida of poliza.partidas) {
      const esCargo = partida.debe > 0;
      const importe = esCargo ? partida.debe : partida.haber;
      const tipoMov = esCargo ? 0 : 1; // 0 = Cargo, 1 = Abono en Contpaqi
      const conceptoPartida = partida.concepto.replace(/"/g, "'").slice(0, 100);

      lineas.push(
        `M ${partida.numCta} "${poliza.cfdiFolio}" ${tipoMov} ${importe.toFixed(2)} 0.00 "${conceptoPartida}" "${partida.cfdiUuid || poliza.cfdiUuid}"`
      );
    }
  }

  return lineas.join('\r\n');
}
