/**
 * ARK TOOLS — Calculadora ISN 2026
 * Exportación a CSV (compatible con Excel / Google Sheets)
 *
 * Genera un archivo CSV con BOM UTF-8 para que Excel respete los acentos.
 * El archivo se descarga directamente en el navegador (sin backend).
 */

import { formatearNumero, formatearMXN, formatearPorcentaje } from './calcularISN';
import type { ConceptoPercepcion, Estado, ResultadoISN } from '../types';

interface ExportarCSVParams {
  /** Estado seleccionado */
  estado: Estado;
  /** Conceptos de la tabla */
  conceptos: ConceptoPercepcion[];
  /** Resultado calculado */
  resultado: ResultadoISN;
}

/**
 * Escapa un valor para CSV.
 * Si contiene coma, comilla o salto de línea, lo envuelve en comillas.
 */
function escaparCSV(valor: string | number): string {
  const str = String(valor);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Genera el contenido CSV.
 * Estructura:
 *   1. Encabezado con estado, tasa y fecha
 *   2. Tabla de percepciones (concepto, gravado, exento, total)
 *   3. Fila de totales
 *   4. Resumen del cálculo ISN
 */
function generarContenidoCSV({ estado, conceptos, resultado }: ExportarCSVParams): string {
  const fecha = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lineas: string[] = [];

  // ─────────────────────────────────────────────────────────────
  // SECCIÓN 1: Encabezado
  // ─────────────────────────────────────────────────────────────
  lineas.push('CÁLCULO ISN 2026 — ARK TOOLS');
  lineas.push(`Fecha de cálculo,${escaparCSV(fecha)}`);
  lineas.push(`Estado,${escaparCSV(estado.nombre)}`);
  lineas.push(`Tasa ISN,${escaparCSV(formatearPorcentaje(estado.tasa))}`);
  lineas.push(`Fundamento,${escaparCSV(estado.articulo)}`);
  lineas.push('');

  // ─────────────────────────────────────────────────────────────
  // SECCIÓN 2: Tabla de percepciones
  // ─────────────────────────────────────────────────────────────
  lineas.push('PERCEPCIONES DEL PERIODO');
  lineas.push('Concepto,Gravado,Exento,Total');

  for (const c of conceptos) {
    lineas.push(
      [
        escaparCSV(c.concepto),
        escaparCSV(formatearNumero(c.gravado)),
        escaparCSV(formatearNumero(c.exento)),
        escaparCSV(formatearNumero(c.gravado + c.exento)),
      ].join(',')
    );
  }

  // Fila de totales
  const totalGravado = conceptos.reduce((s, c) => s + c.gravado, 0);
  const totalExento = conceptos.reduce((s, c) => s + c.exento, 0);
  lineas.push(
    [
      'TOTAL',
      escaparCSV(formatearNumero(totalGravado)),
      escaparCSV(formatearNumero(totalExento)),
      escaparCSV(formatearNumero(totalGravado + totalExento)),
    ].join(',')
  );
  lineas.push('');

  // ─────────────────────────────────────────────────────────────
  // SECCIÓN 3: Resumen del cálculo ISN
  // ─────────────────────────────────────────────────────────────
  lineas.push('RESUMEN ISN 2026');
  lineas.push(`Base gravable,${escaparCSV(formatearNumero(resultado.baseGravable))}`);
  lineas.push(`Tasa aplicable,${escaparCSV(formatearPorcentaje(resultado.tasa))}`);
  lineas.push(`ISN a pagar,${escaparCSV(formatearNumero(resultado.isn))}`);
  lineas.push('');
  lineas.push(`TOTAL A PAGAR,${escaparCSV(formatearMXN(resultado.isn))}`);
  lineas.push('');

  // ─────────────────────────────────────────────────────────────
  // SECCIÓN 4: Disclaimer
  // ─────────────────────────────────────────────────────────────
  lineas.push('DISCLAIMER');
  lineas.push(
    'Cálculo informativo. Verifica retención y fecha de pago en el portal tributario estatal.'
  );
  lineas.push('No sustituye asesoría fiscal.');
  lineas.push('Generado por ARK TOOLS · Substrate Holdings LLC');

  return lineas.join('\n');
}

/**
 * Descarga un archivo CSV en el navegador.
 * Añade BOM UTF-8 para que Excel respete acentos.
 */
export function descargarCSV(params: ExportarCSVParams): void {
  const contenido = generarContenidoCSV(params);

  // BOM UTF-8 para compatibilidad con Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + contenido], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const fecha = new Date().toISOString().slice(0, 10);
  const filename = `ISN_2026_${params.estado.id}_${fecha}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Limpieza
  URL.revokeObjectURL(url);
}
