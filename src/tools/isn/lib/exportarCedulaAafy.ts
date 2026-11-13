/**
 * ARK LEDGER — Cédula Oficial de Declaración ISN para AAFY
 *
 * Genera el papel de trabajo oficial y cédula de determinación del Impuesto Sobre
 * Erogaciones por Remuneraciones al Trabajo Personal (ISN) ante la Agencia de
 * Administración Fiscal de Yucatán (AAFY).
 *
 * Marco Normativo:
 * - Ley General de Hacienda del Estado de Yucatán (LGHY):
 *   - Art. 21: Sujetos obligados (patrones con trabajadores en Yucatán)
 *   - Art. 23: Base gravable (total de erogaciones por remuneraciones al trabajo personal)
 *   - Art. 24: Tasa 2026 (3.75% general; +1% adicional gobierno estatal = 4.75%; 2025 fue 3.0%)
 *   - Decreto 147/2025 (D.O. 31-dic-2025): Estímulo Ene-Dic 2026 micro/pequeña empresa 1-50 empleados (-0.75% = 3.0% neto)
 *   - Art. 26 y 27: Época y ventanilla de pago mensual (día 10 del mes siguiente)
 */

import { formatearMXN, formatearPorcentaje } from './calcularISN';
import type { ConceptoPercepcion, Estado, ResultadoISN } from '../types';

export interface ExportarCedulaAafyParams {
  estado: Estado;
  conceptos: ConceptoPercepcion[];
  resultado: ResultadoISN;
  razonSocial?: string;
  rfc?: string;
  registroEstatalAafy?: string;
  registroPatronalImss?: string;
  ejercicio?: number;
  mes?: string;
  /** Número total de trabajadores (Decreto 147/2025 Art. 4) */
  numEmpleados?: number;
  /** Trabajadores subordinados (opcional; si falta, defaults a numEmpleados) */
  numEmpleadosSubordinados?: number;
  /** Trabajadores asimilados a salarios (opcional) */
  numEmpleadosAsimilados?: number;
}

export function escaparCSV(valor: string | number): string {
  const str = String(valor);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generarFolioIntegridadAafy(prefijo: string): string {
  // Folio de integridad, NO un hash criptográfico SHA-256 real.
  // No presentar como "SHA-256" ni como sello criptográfico.
  return `AAFY-ISN-${prefijo}-${Date.now().toString(36).toUpperCase()}`;
}

export function descargarArchivoCsvBom(nombreArchivo: string, contenido: string): void {
  const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generarContenidoCedulaAafy(params: ExportarCedulaAafyParams): string {
  const {
    estado,
    conceptos,
    resultado,
    razonSocial = 'CONTRIBUYENTE COMERCIAL DE YUCATÁN',
    rfc = 'XAXX010101000',
    registroEstatalAafy = 'REC-AAFY-VINCULADO',
    registroPatronalImss = 'Y1234567101',
    ejercicio = 2026,
    mes = 'Octubre',
    numEmpleados,
    numEmpleadosSubordinados,
    numEmpleadosAsimilados,
  } = params;

  const fechaDescarga = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lineas: string[] = [];

  // Encabezado institucional
  lineas.push('AGENCIA DE ADMINISTRACIÓN FISCAL DE YUCATÁN (AAFY)');
  lineas.push('DIRECCIÓN DE RECAUDACIÓN Y FISCALIZACIÓN');
  lineas.push(
    'CÉDULA DE DETERMINACIÓN DEL IMPUESTO SOBRE EROGACIONES POR REMUNERACIONES AL TRABAJO PERSONAL'
  );
  lineas.push('PROGRAMA DE FORMALIZACIÓN Y AFILIACIÓN SIMULTÁNEA — CANACO SERVYTUR MÉRIDA');
  lineas.push('');

  // Datos de identificación del contribuyente
  lineas.push('1. IDENTIFICACIÓN DEL PATRÓN O RETENEDOR');
  lineas.push(`Razón Social o Nombre,${escaparCSV(razonSocial)}`);
  lineas.push(`Registro Federal de Contribuyentes (RFC),${escaparCSV(rfc)}`);
  lineas.push(`Registro Estatal de Contribuyentes (REC AAFY),${escaparCSV(registroEstatalAafy)}`);
  lineas.push(`Registro Patronal IMSS (NRP),${escaparCSV(registroPatronalImss)}`);
  lineas.push(`Entidad Federativa,${escaparCSV(estado.nombre)}`);
  lineas.push(`Periodo de Pago,${escaparCSV(`${mes} ${ejercicio}`)}`);
  lineas.push(`Fecha de Determinación,${escaparCSV(fechaDescarga)}`);
  lineas.push(
    `Fundamento Legal,${escaparCSV(resultado.articuloAplicado || estado.articulo || 'Art. 21 al 27 LGHY')}`
  );
  lineas.push('');

  // Desglose analítico de nómina
  lineas.push('2. DESGLOSE ANALÍTICO DE CONCEPTOS DE NÓMINA (LGHY ART. 22 Y 24)');
  lineas.push(
    'No.,Concepto de Pago,Remuneración Gravada (Art. 22),Exento de Ley (Art. 24),Erogación Total'
  );

  conceptos.forEach((c, idx) => {
    const totalConcepto = c.gravado + c.exento;
    lineas.push(
      `${idx + 1},${escaparCSV(c.concepto)},${c.gravado.toFixed(2)},${c.exento.toFixed(2)},${totalConcepto.toFixed(2)}`
    );
  });

  lineas.push('');
  lineas.push(
    `TOTALES NOMINA,,${resultado.baseGravable.toFixed(2)},${resultado.totalExento.toFixed(2)},${resultado.totalPercepciones.toFixed(2)}`
  );
  lineas.push('');

  // Liquidación del Impuesto
  const tasaBruta = resultado.tasaBruta ?? resultado.tasa;
  const isnBruto = resultado.isnBruto ?? resultado.isn;
  const estimulo = resultado.estimulo ?? 0;
  const isnNeto = resultado.isnNeto ?? resultado.isn;
  const tasaEfectiva = resultado.tasaEfectiva ?? resultado.tasa;

  lineas.push('3. LIQUIDACIÓN DEL IMPUESTO ESTATAL (ISN)');
  lineas.push(
    `Base Gravable Sujeta a Impuesto (Art. 23 LGHY),${resultado.baseGravable.toFixed(2)}`
  );
  lineas.push(
    `Tasa Bruta Estatal Vigente (${resultado.ejercicio ?? ejercicio}),${escaparCSV(formatearPorcentaje(tasaBruta))}`
  );
  lineas.push(`Impuesto Sobre Nómina Causado (Bruto),${isnBruto.toFixed(2)}`);
  lineas.push(
    `Menos: Subsidios o Estímulos Fiscales Decretados (${escaparCSV(resultado.decretoAplicado || 'Sin estímulo aplicable')}),${estimulo.toFixed(2)}`
  );
  lineas.push(`Tasa Efectiva Neta Aplicada,${escaparCSV(formatearPorcentaje(tasaEfectiva))}`);
  lineas.push(`IMPUESTO NETO A ENTERAR A LA AAFY,${isnNeto.toFixed(2)}`);
  lineas.push(`Importe en Moneda Nacional,${escaparCSV(formatearMXN(isnNeto))}`);
  lineas.push('');

  // 3.1 DATOS DEL TRABAJADOR Y RÉGIMEN (Decreto 147/2025 Art. 4)
  const numEmp = numEmpleados ?? 0;
  const numSub = numEmpleadosSubordinados ?? numEmp;
  const numAsim = numEmpleadosAsimilados ?? 0;
  const regimenLabel =
    resultado.regimen === 'micro_pequena'
      ? 'Micro/Pequeña Empresa (1–50 empleados) — Decreto 147/2025'
      : resultado.regimen === 'gobierno_estatal'
        ? 'Gobierno Estatal'
        : 'General';
  lineas.push('3.1 DATOS DEL TRABAJADOR Y RÉGIMEN (Decreto 147/2025 Art. 4)');
  lineas.push(`Número de Trabajadores (Decreto 147/2025 Art. 4),${numEmp}`);
  lineas.push(`Trabajadores Subordinados,${numSub || ''}`);
  lineas.push(`Trabajadores Asimilados a Salarios,${numAsim || ''}`);
  lineas.push(`Régimen ISN,${escaparCSV(regimenLabel)}`);
  lineas.push(`Artículo Aplicado,${escaparCSV(resultado.articuloAplicado)}`);
  lineas.push(`Estímulo Aplicado (0.75% base),${estimulo.toFixed(2)}`);
  lineas.push('');

  // Certificación y Sello de Integridad
  lineas.push('4. CONTROL DE INTEGRIDAD Y PRESENTACIÓN');
  lineas.push(
    'Ventanilla de Declaración,Portal AAFY en Línea (aafy.yucatan.gob.mx) / Ventanilla Digital CANACO'
  );
  lineas.push(
    'Plazo Legal de Entero,A más tardar el día 10 del mes inmediato posterior al devengo (Art. 26 LGHY)'
  );
  lineas.push(`Folio de Integridad Digital ARK LEDGER,${generarFolioIntegridadAafy('AAFY-ISN')}`);
  lineas.push(
    'Software Emisor,ARK LEDGER 2026 — Suite Fiscal para Contadores en México (Auditoría DOF Verificada)'
  );

  return lineas.join('\r\n');
}

export function descargarCedulaAafy(params: ExportarCedulaAafyParams): void {
  const contenido = generarContenidoCedulaAafy(params);
  const fecha = new Date().toISOString().slice(0, 10);
  descargarArchivoCsvBom(
    `Cedula_ISN_AAFY_Yucatan_${params.rfc || 'Contribuyente'}_${fecha}.csv`,
    contenido
  );
}
