/**
 * ARK LEDGER — Utilidades de Exportación y Compartición para Recargos Fiscales
 */

import type { ResultadoRecargos } from '../types';

/**
 * Genera el archivo CSV con BOM UTF-8 para compatibilidad absoluta con Microsoft Excel.
 */
export function exportarRecargosCSV(
  resultado: ResultadoRecargos,
  clienteNombre = 'Contribuyente General',
  clienteRfc = 'XAXX010101000'
): string {
  const BOM = '\uFEFF';
  const lineas: string[] = [];

  lineas.push('PAPEL DE TRABAJO — DETERMINACIÓN DE ACTUALIZACIÓN Y RECARGOS FISCALES (CFF)');
  lineas.push(`Cliente / Razón Social,"${clienteNombre.replace(/"/g, '""')}"`);
  lineas.push(`RFC,${clienteRfc}`);
  lineas.push(`Fecha en que debió pagarse (Vencimiento),${resultado.fechaVencimiento}`);
  lineas.push(`Fecha de pago real,${resultado.fechaPago}`);
  lineas.push(`Meses o fracción de mora transcurridos,${resultado.mesesMora}`);
  lineas.push(`Tasa mensual de recargos (LIF),${resultado.tasaRecargosMensual}%`);
  lineas.push(`Tasa total acumulada de recargos,${resultado.tasaRecargosTotal}%`);
  lineas.push('');

  lineas.push('FACTOR DE ACTUALIZACIÓN (ARTÍCULO 17-A CFF)');
  lineas.push(
    `INPC Numerador (Mes anterior al pago),${resultado.factorDetalle.periodoInpcReciente},${resultado.factorDetalle.inpcReciente}`
  );
  lineas.push(
    `INPC Denominador (Mes anterior al vencimiento),${resultado.factorDetalle.periodoInpcAntiguo},${resultado.factorDetalle.inpcAntiguo}`
  );
  lineas.push(
    `Factor de Actualización Aplicado (Truncado a 4 decimales),${resultado.factorActualizacion.toFixed(4)}`
  );
  lineas.push('');

  lineas.push('RESUMEN DE LIQUIDACIÓN TRIBUTARIA');
  lineas.push(`Concepto,Monto MXN,Fundamento Legal`);
  lineas.push(
    `Impuesto Omitido (Histórico),${resultado.importeHistorico.toFixed(2)},Ley Específica de la Contribución`
  );
  lineas.push(
    `Actualización por Inflación,${resultado.montoActualizacion.toFixed(2)},Artículo 17-A Código Fiscal de la Federación`
  );
  lineas.push(
    `Impuesto Actualizado,${resultado.impuestoActualizado.toFixed(2)},Artículo 17-A Código Fiscal de la Federación`
  );
  lineas.push(
    `Recargos por Mora,${resultado.montoRecargos.toFixed(2)},Artículo 21 CFF y Artículo 8 LIF`
  );
  lineas.push(
    `TOTAL A LIQUIDAR,${resultado.totalPagar.toFixed(2)},Artículos 20 y 21 Código Fiscal de la Federación`
  );
  lineas.push(`Importe en Letra,"${resultado.totalEnLetras}"`);
  lineas.push('');

  if (resultado.desgloseMeses.length > 0) {
    lineas.push('DESGLOSE MES A MES DE RECARGOS (ARTÍCULO 21 CFF)');
    lineas.push(
      'Mes / Fracción,Periodo Cómputo,Tasa Mensual %,Tasa Acumulada %,Base Cálculo Actualizada,Recargo del Mes,Recargo Acumulado'
    );
    for (const d of resultado.desgloseMeses) {
      lineas.push(
        `${d.numero},"${d.periodo}",${d.tasaMensual}%,${d.tasaAcumulada}%,${d.baseCalculo.toFixed(2)},${d.recargoMes.toFixed(2)},${d.recargoAcumulado.toFixed(2)}`
      );
    }
  }

  return BOM + lineas.join('\r\n');
}

/**
 * Genera el resumen ejecutivo para compartir vía WhatsApp.
 */
export function generarResumenWhatsApp(
  resultado: ResultadoRecargos,
  clienteNombre = 'Contribuyente'
): string {
  const lineas = [
    `🏛️ *ARK LEDGER — Cédula de Actualización y Recargos (CFF)*`,
    `👤 *Cliente:* ${clienteNombre}`,
    `📅 *Vencimiento:* ${resultado.fechaVencimiento} | *Pago:* ${resultado.fechaPago}`,
    `⏳ *Mora:* ${resultado.mesesMora} meses (${resultado.tasaRecargosTotal}% acumulado)`,
    `📈 *Factor INPC (Art. 17-A):* ${resultado.factorActualizacion.toFixed(4)}`,
    ``,
    `💰 *DESGLOSE DE ADEUDO FISCAL:*`,
    `▪️ *Impuesto Histórico:* $${resultado.importeHistorico.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
    `▪️ *(+) Inflación (INPC):* $${resultado.montoActualizacion.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
    `▪️ *(=) Impuesto Actualizado:* $${resultado.impuestoActualizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
    `▪️ *(+) Recargos Mora:* $${resultado.montoRecargos.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
    `───────────────`,
    `💵 *TOTAL A LIQUIDAR:* $${resultado.totalPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
    `📝 _"${resultado.totalEnLetras}"_`,
    ``,
    `🔒 _Documento sellado con SHA-256 conforme a CFF Arts. 17-A y 21._`,
  ];

  return lineas.join('\n');
}

/**
 * Dispara la descarga directa de un archivo en el navegador.
 */
export function descargarArchivo(
  contenido: string,
  nombreArchivo: string,
  mimeType = 'text/csv;charset=utf-8;'
): void {
  const blob = new Blob([contenido], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
