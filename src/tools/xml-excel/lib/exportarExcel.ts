/**
 * ARK TOOLS — Conversor XML a Excel (CFDI 4.0)
 * Exportador de datos a formato CSV compatible al 100% con Microsoft Excel y Google Sheets
 * Incluye BOM UTF-8 (\uFEFF) para visualización perfecta de caracteres en español.
 */

import type { FacturaCFDI, ResumenLoteXML } from '../types';
import { calcularResumenLote } from './parserCFDI';

/**
 * Escapa un valor para campo CSV de forma segura
 */
function escaparCSV(valor: string | number | undefined | null): string {
  if (valor === undefined || valor === null) return '';
  const str = String(valor).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convierte un número a string formateado con 2 decimales para Excel
 */
function formatearDecimal(num: number): string {
  return num.toFixed(2);
}

/**
 * Genera el string CSV con encabezados detallados y filas de comprobantes
 */
export function generarCSVFacturas(facturas: FacturaCFDI[]): string {
  const lineas: string[] = [];

  // Encabezados de columnas
  const encabezados = [
    'UUID / Folio Fiscal',
    'Fecha de Emisión',
    'Tipo',
    'Descripción Tipo',
    'Serie',
    'Folio',
    'RFC Emisor',
    'Nombre Emisor',
    'Régimen Fiscal Emisor',
    'RFC Receptor',
    'Nombre Receptor',
    'Régimen Fiscal Receptor',
    'Uso CFDI',
    'Moneda',
    'Tipo de Cambio',
    'Subtotal',
    'Descuento',
    'IVA 16%',
    'IVA 8%',
    'IEPS',
    'Total Impuestos Trasladados',
    'IVA Retenido',
    'ISR Retenido',
    'Total Impuestos Retenidos',
    'Total',
    'Método de Pago',
    'Forma de Pago',
    'Lugar de Expedición',
    'Conceptos / Descripción',
    'Archivo Origen',
    'Estado',
  ];

  lineas.push(encabezados.map(escaparCSV).join(','));

  // Filas de comprobantes
  for (const f of facturas) {
    const fila = [
      f.uuid,
      f.fecha,
      f.tipoComprobante,
      f.tipoComprobanteDesc,
      f.serie,
      f.folio,
      f.rfcEmisor,
      f.nombreEmisor,
      f.regimenFiscalEmisor,
      f.rfcReceptor,
      f.nombreReceptor,
      f.regimenFiscalReceptor,
      f.usoCFDI,
      f.moneda,
      f.tipoCambio,
      formatearDecimal(f.subtotal),
      formatearDecimal(f.descuento),
      formatearDecimal(f.iva16),
      formatearDecimal(f.iva8),
      formatearDecimal(f.ieps),
      formatearDecimal(f.totalImpuestosTrasladados),
      formatearDecimal(f.ivaRetenido),
      formatearDecimal(f.isrRetenido),
      formatearDecimal(f.totalImpuestosRetenidos),
      formatearDecimal(f.total),
      f.metodoPago,
      f.formaPago,
      f.lugarExpedicion,
      f.descripcionResumen,
      f.fileName,
      f.estado.toUpperCase(),
    ];

    lineas.push(fila.map(escaparCSV).join(','));
  }

  // Fila de Totales Generales
  const resumen: ResumenLoteXML = calcularResumenLote(facturas);
  const filaTotales = [
    'TOTALES CONSOLIDADOS',
    `Comprobantes: ${resumen.totalValidos}`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    formatearDecimal(resumen.sumaSubtotal),
    formatearDecimal(resumen.sumaDescuento),
    formatearDecimal(resumen.sumaIVA16),
    '',
    '',
    formatearDecimal(resumen.sumaImpuestosTrasladados),
    formatearDecimal(resumen.sumaIVARetenido),
    formatearDecimal(resumen.sumaISRRetenido),
    formatearDecimal(resumen.sumaImpuestosRetenidos),
    formatearDecimal(resumen.sumaTotal),
    '',
    '',
    '',
    '',
    `Total XMLs: ${resumen.totalArchivos}`,
    '',
  ];

  lineas.push(filaTotales.map(escaparCSV).join(','));

  // Agregar BOM UTF-8 al inicio
  return '\uFEFF' + lineas.join('\r\n');
}

/**
 * Dispara la descarga del archivo CSV en el navegador
 */
export function descargarCSVFacturas(facturas: FacturaCFDI[], nombreArchivo?: string): void {
  const contenido = generarCSVFacturas(facturas);
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });

  const fechaIso = new Date().toISOString().slice(0, 10);
  const nombreFinal = nombreArchivo || `ARK_CFDI_Reporte_${fechaIso}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nombreFinal);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
