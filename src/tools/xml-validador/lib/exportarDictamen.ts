/**
 * ARK TOOLS — Validador de XMLs CFDI
 * Exportador de Dictamen de Auditoría Fiscal a CSV compatible con Excel
 */

import type { DictamenCFDI } from '../types';

function escaparCSV(valor: string | number | undefined | null): string {
  if (valor === undefined || valor === null) return '';
  const str = String(valor).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generarCSVDictamenes(dictamenes: DictamenCFDI[]): string {
  const lineas: string[] = [];

  // Encabezados
  const encabezados = [
    'Archivo',
    'UUID / Folio Fiscal',
    'Estatus Auditoría',
    'Score Fiscal (0-100)',
    'Versión CFDI',
    'RFC Emisor',
    'Nombre Emisor',
    'RFC Receptor',
    'Nombre Receptor',
    'Total',
    'Errores Críticos',
    'Advertencias',
    'Detalle de Observaciones y Fundamentos SAT',
  ];

  lineas.push(encabezados.map(escaparCSV).join(','));

  for (const d of dictamenes) {
    const observaciones = d.reglas
      .filter((r) => r.severidad !== 'exito')
      .map(
        (r) =>
          `[${r.severidad.toUpperCase()}] ${r.codigo} - ${r.titulo}: ${r.descripcion}${
            r.fundamentoLegal ? ` (${r.fundamentoLegal})` : ''
          }`
      )
      .join(' | ');

    const fila = [
      d.fileName,
      d.uuid,
      d.estatusGeneral.toUpperCase(),
      d.score,
      d.version,
      d.rfcEmisor,
      d.nombreEmisor,
      d.rfcReceptor,
      d.nombreReceptor,
      d.total.toFixed(2),
      d.erroresCount,
      d.advertenciasCount,
      observaciones || 'Sin observaciones (Comprobante 100% íntegro)',
    ];

    lineas.push(fila.map(escaparCSV).join(','));
  }

  // BOM UTF-8
  return '\uFEFF' + lineas.join('\r\n');
}

export function descargarCSVDictamenes(
  dictamenes: DictamenCFDI[],
  nombreArchivo?: string
): void {
  const contenido = generarCSVDictamenes(dictamenes);
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const fechaIso = new Date().toISOString().slice(0, 10);
  const nombreFinal = nombreArchivo || `ARK_Auditoria_CFDI_${fechaIso}.csv`;

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
