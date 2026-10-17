import type { ResultadoResico } from '../types';
import { NOMBRES_MESES } from '../data/tablasResico';

export function escaparCSV(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return '';
  const str = String(valor);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Genera el archivo CSV con BOM UTF-8 de la Cédula de Determinación RESICO para Excel.
 */
export function exportarResicoCSV(
  resultado: ResultadoResico,
  clienteNombre: string = 'Contribuyente General',
  clienteRfc: string = 'XAXX010101000'
): string {
  const lineas: string[] = [];
  const nombreMes = NOMBRES_MESES[resultado.mes];

  // 1. Encabezado institucional
  lineas.push('ARK TOOLS — PAPEL DE TRABAJO Y CÉDULA DE DETERMINACIÓN RESICO');
  lineas.push(`Contribuyente,${escaparCSV(clienteNombre)}`);
  lineas.push(`RFC,${escaparCSV(clienteRfc)}`);
  lineas.push(`Tipo de Persona,${resultado.tipoPersona === 'fisica' ? 'Persona Física (Art. 113-E LISR)' : 'Persona Moral (Art. 206 LISR)'}`);
  lineas.push(`Período Fiscal,${escaparCSV(`${nombreMes} ${resultado.ejercicio}`)}`);
  lineas.push(`Fundamento Legal,${escaparCSV(resultado.fundamentoLegal)}`);
  lineas.push('');

  // 2. Desglose de conceptos
  lineas.push('No,Concepto,Base Gravable (MXN),Tasa Aplicable,Importe Determinado (MXN),Naturaleza,Fundamento');
  resultado.desglose.forEach((d, idx) => {
    lineas.push(
      [
        idx + 1,
        escaparCSV(d.concepto),
        d.base.toFixed(2),
        d.tasaPct > 0 ? `${d.tasaPct.toFixed(2)}%` : 'N/A',
        d.importe.toFixed(2),
        escaparCSV(d.naturaleza.toUpperCase()),
        escaparCSV(d.fundamento),
      ].join(',')
    );
  });

  lineas.push('');
  lineas.push(`TOTAL IMPUESTOS A PAGAR,${resultado.totalImpuestosPagar.toFixed(2)}`);
  lineas.push(`IMPORTE EN LETRAS,${escaparCSV(resultado.totalEnLetras)}`);

  if (resultado.tipoPersona === 'fisica') {
    lineas.push('');
    lineas.push(`Ingresos Acumulados Ejercicio,${resultado.ingresosAcumuladosTotal.toFixed(2)}`);
    lineas.push(`Límite Anual RESICO (Art. 113-E),${resultado.topeAnualLISR.toFixed(2)}`);
    lineas.push(`Porcentaje Consumido del Tope,${resultado.porcentajeConsumoTope.toFixed(2)}%`);
    lineas.push(`Estado del Límite,${escaparCSV(resultado.alertaTope.toUpperCase())}`);
  }

  if (resultado.advertencias.length > 0) {
    lineas.push('');
    lineas.push('OBSERVACIONES Y ADVERTENCIAS DEL AUDITOR');
    resultado.advertencias.forEach((adv) => {
      lineas.push(escaparCSV(adv));
    });
  }

  return '\uFEFF' + lineas.join('\r\n');
}

/**
 * Genera un texto conciso y formateado para enviar la liquidación al cliente por WhatsApp.
 */
export function generarResumenWhatsApp(
  resultado: ResultadoResico,
  clienteNombre: string = 'Cliente'
): string {
  const nombreMes = NOMBRES_MESES[resultado.mes];
  const esPF = resultado.tipoPersona === 'fisica';

  let msg = `🏛️ *ARK TOOLS | Liquidación Fiscal RESICO*\n`;
  msg += `*Cliente:* ${clienteNombre}\n`;
  msg += `*Período:* ${nombreMes} ${resultado.ejercicio}\n`;
  msg += `*Régimen:* ${esPF ? 'RESICO Persona Física' : 'RESICO Persona Moral (Flujo)'}\n\n`;

  if (esPF) {
    msg += `📊 *Ingresos Cobrados:* $${resultado.ingresosCobradosMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n`;
    msg += `📈 *Tasa ISR:* ${resultado.tasaISRPct}%\n`;
    msg += `💵 *ISR a Pagar:* $${resultado.isrNetoPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n`;
  } else {
    msg += `📊 *Utilidad Base:* $${resultado.utilidadFiscalBase.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n`;
    msg += `📈 *Tasa ISR:* 30.0%\n`;
    msg += `💵 *ISR a Pagar:* $${resultado.isrNetoPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n`;
  }

  if (resultado.ivaNetoPagar >= 0) {
    msg += `📑 *IVA a Pagar:* $${resultado.ivaNetoPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n`;
  } else {
    msg += `📑 *IVA Saldo a Favor:* $${Math.abs(resultado.ivaNetoPagar).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n`;
  }

  msg += `\n🎯 *TOTAL A PAGAR:* $${resultado.totalImpuestosPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN\n`;
  msg += `_${resultado.totalEnLetras}_\n\n`;

  if (esPF) {
    msg += `⚠️ *Monitoreo Tope 3.5M:* ${resultado.porcentajeConsumoTope}% ejercido.\n`;
  }

  msg += `_Cédula oficial emitida con ARK TOOLS con sello digital verificable._`;
  return msg;
}

/**
 * Descarga directamente un archivo en el navegador del usuario.
 */
export function descargarArchivo(
  contenido: string,
  nombreArchivo: string,
  mimeType: string = 'text/csv;charset=utf-8;'
): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([contenido], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.setAttribute('download', nombreArchivo);
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
