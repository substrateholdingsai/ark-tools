// src/tools/auditor-cobranza/lib/exportarDictamenCobranza.ts

import type { DictamenCobranza, DetalleDictamen } from './calcularDictamen';

// =====================================================
// Exportador TXT
// =====================================================

export function generarTXT(dictamen: DictamenCobranza): string {
  const lineas: string[] = [];
  const { resumen, alcance, detalles, recomendaciones, advertencias } = dictamen;

  lineas.push('══════════════════════════════════════════════════════');
  lineas.push('  DICTAMEN DE AUDITORÍA DE COBRANZA — ARK TOOLS');
  lineas.push('══════════════════════════════════════════════════════');
  lineas.push('');

  if (dictamen.cliente) {
    lineas.push(`Cliente: ${dictamen.cliente}`);
  }
  if (dictamen.revisor) {
    lineas.push(`Revisor: ${dictamen.revisor}`);
  }
  lineas.push(`Fecha de generación: ${dictamen.generadoEl}`);
  lineas.push('');

  // Resumen ejecutivo
  lineas.push('──────────────────────────────────────────────────────');
  lineas.push('RESUMEN EJECUTIVO');
  lineas.push('──────────────────────────────────────────────────────');
  lineas.push(`Nivel de riesgo:       ${resumen.nivel}`);
  lineas.push(`Score:                 ${resumen.score}/100`);
  lineas.push(`Puntos de riesgo:      ${resumen.puntosRiesgo}`);
  lineas.push(`Puntos máximos:        ${resumen.puntosMaximos}`);
  lineas.push(`Hallazgos:             ${resumen.hallazgos}`);
  lineas.push(`Observaciones:         ${resumen.observaciones}`);
  lineas.push(`Críticos:              ${resumen.criticos}`);
  lineas.push(`Altos:                 ${resumen.altos}`);
  lineas.push(`Medios:                ${resumen.medios}`);
  lineas.push(`Bajos:                 ${resumen.bajos}`);
  lineas.push('');

  // Alcance
  lineas.push('──────────────────────────────────────────────────────');
  lineas.push('ALCANCE');
  lineas.push('──────────────────────────────────────────────────────');
  lineas.push(`Comparadores evaluados: ${alcance.totalComparadoresEvaluados}`);
  lineas.push(`Conductas evaluadas:    ${alcance.totalConductasEvaluadas}`);
  lineas.push('');

  // Notas del auditor
  if (dictamen.notas) {
    lineas.push('──────────────────────────────────────────────────────');
    lineas.push('NOTAS DEL AUDITOR');
    lineas.push('──────────────────────────────────────────────────────');
    lineas.push(dictamen.notas);
    lineas.push('');
  }

  // Detalles
  if (detalles.length > 0) {
    lineas.push('──────────────────────────────────────────────────────');
    lineas.push('DETALLES DEL DICTAMEN');
    lineas.push('──────────────────────────────────────────────────────');
    lineas.push('');

    detalles.forEach((detalle: DetalleDictamen, index) => {
      lineas.push(
        `[${index + 1}] ${detalle.tipo.toUpperCase()} — ${detalle.categoria.toUpperCase()}`
      );
      lineas.push(`    ID:          ${detalle.id}`);
      if (detalle.codigo) lineas.push(`    Código:      ${detalle.codigo}`);
      lineas.push(`    Título:      ${detalle.titulo}`);
      if (detalle.estado) lineas.push(`    Estado:      ${detalle.estado}`);
      lineas.push(`    Riesgo:      ${detalle.riesgo}`);
      lineas.push(`    Puntos:      ${detalle.puntos}`);
      if (detalle.fundamento) lineas.push(`    Fundamento:  ${detalle.fundamento}`);
      if (detalle.impactoContable) lineas.push(`    Impacto:     ${detalle.impactoContable}`);
      if (detalle.recomendacion) lineas.push(`    Rec.:        ${detalle.recomendacion}`);
      if (detalle.nota) lineas.push(`    Nota:        ${detalle.nota}`);
      lineas.push('');
    });
  }

  // Recomendaciones
  if (recomendaciones.length > 0) {
    lineas.push('──────────────────────────────────────────────────────');
    lineas.push('RECOMENDACIONES');
    lineas.push('──────────────────────────────────────────────────────');
    lineas.push('');
    recomendaciones.forEach((rec, i) => {
      lineas.push(`${i + 1}. ${rec}`);
    });
    lineas.push('');
  }

  // Advertencias
  if (advertencias.length > 0) {
    lineas.push('──────────────────────────────────────────────────────');
    lineas.push('ADVERTENCIAS');
    lineas.push('──────────────────────────────────────────────────────');
    lineas.push('');
    advertencias.forEach((adv) => {
      lineas.push(`⚠ ${adv}`);
    });
    lineas.push('');
  }

  lineas.push('══════════════════════════════════════════════════════');
  lineas.push('  Generado por ARK TOOLS — Auditoría de Cobranza');
  lineas.push('  Substrate Holdings LLC — Ley como Código');
  lineas.push('══════════════════════════════════════════════════════');

  return lineas.join('\n');
}

// =====================================================
// Exportador CSV con BOM UTF-8
// =====================================================

function escaparCSV(valor: string | undefined | null): string {
  if (valor === undefined || valor === null) return '';
  const str = String(valor);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generarCSV(dictamen: DictamenCobranza): string {
  const filas: string[] = [];
  const { resumen, detalles, recomendaciones } = dictamen;

  // BOM UTF-8
  const BOM = '\uFEFF';

  // Headers
  filas.push(
    [
      'TIPO',
      'CATEGORIA',
      'ID',
      'CODIGO',
      'TITULO',
      'ESTADO',
      'RIESGO',
      'PUNTOS',
      'FUNDAMENTO',
      'IMPACTO_CONTABLE',
      'RECOMENDACION',
      'NOTA',
    ].join(',')
  );

  // Detalles
  detalles.forEach((d: DetalleDictamen) => {
    filas.push(
      [
        escaparCSV(d.tipo),
        escaparCSV(d.categoria),
        escaparCSV(d.id),
        escaparCSV(d.codigo),
        escaparCSV(d.titulo),
        escaparCSV(d.estado),
        escaparCSV(d.riesgo),
        escaparCSV(String(d.puntos)),
        escaparCSV(d.fundamento),
        escaparCSV(d.impactoContable),
        escaparCSV(d.recomendacion),
        escaparCSV(d.nota),
      ].join(',')
    );
  });

  // Fila de resumen
  filas.push('');
  filas.push(['', '', '', '', '', '', '', '', '', '', '', ''].join(','));
  filas.push(['RESUMEN', '', '', '', '', '', '', '', '', '', '', ''].join(','));
  filas.push(
    ['Nivel', escaparCSV(resumen.nivel), '', '', '', '', '', '', '', '', '', ''].join(',')
  );
  filas.push(
    ['Score', escaparCSV(String(resumen.score)), '', '', '', '', '', '', '', '', '', ''].join(',')
  );
  filas.push(
    [
      'Hallazgos',
      escaparCSV(String(resumen.hallazgos)),
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
    ].join(',')
  );
  filas.push(
    [
      'Observaciones',
      escaparCSV(String(resumen.observaciones)),
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
    ].join(',')
  );
  filas.push(
    ['Críticos', escaparCSV(String(resumen.criticos)), '', '', '', '', '', '', '', '', '', ''].join(
      ','
    )
  );
  filas.push(
    ['Altos', escaparCSV(String(resumen.altos)), '', '', '', '', '', '', '', '', '', ''].join(',')
  );
  filas.push(
    ['Medios', escaparCSV(String(resumen.medios)), '', '', '', '', '', '', '', '', '', ''].join(',')
  );
  filas.push(
    ['Bajos', escaparCSV(String(resumen.bajos)), '', '', '', '', '', '', '', '', '', ''].join(',')
  );

  // Recomendaciones
  filas.push('');
  filas.push(['RECOMENDACIONES', '', '', '', '', '', '', '', '', '', '', ''].join(','));
  recomendaciones.forEach((rec, i) => {
    filas.push([`${i + 1}`, escaparCSV(rec), '', '', '', '', '', '', '', '', '', ''].join(','));
  });

  return BOM + filas.join('\n');
}

// =====================================================
// Descarga de archivo
// =====================================================

export function descargarArchivo(nombre: string, contenido: string, tipoMIME: string): void {
  const blob = new Blob([contenido], { type: `${tipoMIME};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombre;
  link.click();
  URL.revokeObjectURL(url);
}

export function descargarTXT(dictamen: DictamenCobranza): void {
  const nombre = `dictamen_cobranza_${new Date().toISOString().slice(0, 10)}.txt`;
  descargarArchivo(nombre, generarTXT(dictamen), 'text/plain');
}

export function descargarCSV(dictamen: DictamenCobranza): void {
  const nombre = `dictamen_cobranza_${new Date().toISOString().slice(0, 10)}.csv`;
  descargarArchivo(nombre, generarCSV(dictamen), 'text/csv');
}

export async function copiarTXT(dictamen: DictamenCobranza): Promise<void> {
  const texto = generarTXT(dictamen);
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return;
    }
    throw new Error('Clipboard no disponible');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
