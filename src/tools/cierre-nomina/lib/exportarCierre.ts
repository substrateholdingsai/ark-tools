/**
 * ARK LEDGER — Generador de Exportaciones para Cierre de Nómina Masiva (Sprint 11)
 *
 * Genera:
 * 1. Cédula Concentradora en CSV/Excel con BOM UTF-8 y fórmulas de totales.
 * 2. Layout para Dispersión Bancaria Masiva (SPEI / Banca Empresarial).
 * 3. Descargador seguro en navegador.
 */

import type { CierreNominaCompleto } from '../types';

/**
 * Escapa un valor para formato CSV conforme a RFC 4180.
 */
export function escaparCSV(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return '';
  const str = String(valor);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Genera el CSV de la Cédula Concentradora de Nómina Oficial.
 */
export function exportarConcentradoCSV(cierre: CierreNominaCompleto): string {
  const { parametros, trabajadores, resumen } = cierre;
  const lineas: string[] = [];

  // 1. Metadatos Institucionales
  lineas.push('ARK LEDGER — CÉDULA CONCENTRADORA DE NÓMINA OFICIAL');
  lineas.push(`Empresa / Razón Social,${escaparCSV(parametros.empresaNombre)}`);
  if (parametros.empresaRfc) {
    lineas.push(`RFC Empresa,${escaparCSV(parametros.empresaRfc)}`);
  }
  lineas.push(`Período,${escaparCSV(parametros.periodo.toUpperCase())}`);
  lineas.push(
    `Fechas del Período,${escaparCSV(`${parametros.fechaInicio} al ${parametros.fechaFin}`)}`
  );
  lineas.push(
    `Entidad Federativa (ISN),${escaparCSV(`${parametros.estadoIsnNombre} (${parametros.tasaIsn}%)`)}`
  );
  lineas.push(
    `Fecha de Emisión,${escaparCSV(new Date(resumen.fechaEmision).toLocaleString('es-MX'))}`
  );
  lineas.push(`Sello Digital SHA-256,${escaparCSV(resumen.hashLote)}`);
  lineas.push(`Versión Tablas Oficiales,${escaparCSV(resumen.catalogVersion)}`);
  lineas.push('');

  // 2. Encabezados de Columna
  const columnas = [
    'No',
    'Trabajador',
    'RFC',
    'CURP',
    'NSS',
    'Antigüedad (Años)',
    'Días Vacaciones',
    'Factor Integración',
    'Salario Diario',
    'SBC Diario (IMSS)',
    'Días Trabajados',
    'Sueldo Ordinario',
    'Percepciones Adic.',
    'Total Percepciones',
    'Base Gravable ISR',
    'ISR Antes Subsidio',
    'Subsidio Entregado',
    'ISR Retenido',
    'IMSS Obrero',
    'Otras Deducciones',
    'Total Deducciones',
    'Sueldo Neto a Pagar',
    'ISN Estatal',
  ];
  lineas.push(columnas.join(','));

  // 3. Filas de Trabajadores
  trabajadores.forEach((t) => {
    const fila = [
      t.numeroLista,
      escaparCSV(t.nombre),
      escaparCSV(t.rfc),
      escaparCSV(t.curp),
      escaparCSV(t.nss),
      t.antiguedadAnios,
      t.diasVacacionesLey,
      t.factorIntegracion.toFixed(4),
      t.salarioDiario.toFixed(2),
      t.sbcDiario.toFixed(2),
      t.diasTrabajados,
      t.sueldoOrdinario.toFixed(2),
      t.percepcionesAdicionales.toFixed(2),
      t.totalPercepciones.toFixed(2),
      t.baseGravableISR.toFixed(2),
      t.isrAntesSubsidio.toFixed(2),
      t.subsidioEmpleo.toFixed(2),
      t.isrRetenido.toFixed(2),
      t.imssObrero.toFixed(2),
      t.otrasDeducciones.toFixed(2),
      t.totalDeducciones.toFixed(2),
      t.sueldoNeto.toFixed(2),
      t.isnEstatal.toFixed(2),
    ];
    lineas.push(fila.join(','));
  });

  // 4. Fila de Totales Generales
  lineas.push('');
  const filaTotales = [
    'TOTALES',
    `${resumen.totalTrabajadores} COLABORADORES`,
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
    resumen.totalPercepcionesBrutas.toFixed(2),
    '',
    '',
    resumen.totalSubsidioEntregado.toFixed(2),
    resumen.totalISRRetenido.toFixed(2),
    resumen.totalIMSSObrero.toFixed(2),
    resumen.totalOtrasDeducciones.toFixed(2),
    resumen.totalDeducciones.toFixed(2),
    resumen.totalNetoDispersar.toFixed(2),
    resumen.totalISNEstatal.toFixed(2),
  ];
  lineas.push(filaTotales.join(','));

  lineas.push('');
  lineas.push(`IMPORTE TOTAL NETO EN LETRAS,${escaparCSV(resumen.importeNetoEnLetras)}`);
  lineas.push(
    'Fundamento Legal,"LISR Art. 96, LSS Art. 27/28/106/147, LFT Art. 76/87, CFF Art. 28"'
  );

  // Agregar BOM UTF-8 (\uFEFF) para visualización correcta de acentos en Excel
  return '\uFEFF' + lineas.join('\r\n');
}

/**
 * Genera el layout bancario para dispersión masiva de nómina.
 */
export function exportarDispersionBancariaCSV(cierre: CierreNominaCompleto): string {
  const { parametros, trabajadores } = cierre;
  const lineas: string[] = [];

  lineas.push('No,Beneficiario,RFC,Monto_Neto,Concepto');
  trabajadores.forEach((t) => {
    const concepto = `Nomina ${parametros.periodo} ${parametros.empresaNombre.slice(0, 15)}`;
    lineas.push(
      [
        t.numeroLista,
        escaparCSV(t.nombre),
        escaparCSV(t.rfc),
        t.sueldoNeto.toFixed(2),
        escaparCSV(concepto),
      ].join(',')
    );
  });

  return '\uFEFF' + lineas.join('\r\n');
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
