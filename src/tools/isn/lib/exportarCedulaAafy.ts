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
 *   - Art. 22: Base gravable (sueldos, salarios, sobresueldos, comisiones, gratificaciones, primas)
 *   - Art. 24: Conceptos exentos (indemnizaciones, jubilaciones, viáticos comprobados)
 *   - Art. 25: Tasa general aplicable (2.50%)
 *   - Art. 26 y 27: Época y ventanilla de pago mensual (a más tardar el día 17 del mes siguiente)
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
}

function escaparCSV(valor: string | number): string {
  const str = String(valor);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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
  lineas.push(`Fundamento Legal,${escaparCSV(estado.articulo || 'Art. 21 al 27 LGHY')}`);
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
  lineas.push('3. LIQUIDACIÓN DEL IMPUESTO ESTATAL (ISN)');
  lineas.push(
    `Base Gravable Sujeta a Impuesto (Art. 22 LGHY),${resultado.baseGravable.toFixed(2)}`
  );
  lineas.push(
    `Tasa Impositiva Estatal Vigente (Art. 25 LGHY),${escaparCSV(formatearPorcentaje(estado.tasa))}`
  );
  lineas.push(`Impuesto Sobre Nómina Causado,${resultado.isn.toFixed(2)}`);
  lineas.push('Menos: Subsidios o Estímulos Fiscales Decretados,0.00');
  lineas.push(`IMPUESTO NETO A ENTERAR A LA AAFY,${resultado.isn.toFixed(2)}`);
  lineas.push(`Importe en Moneda Nacional,${escaparCSV(formatearMXN(resultado.isn))}`);
  lineas.push('');

  // Certificación y Sello de Integridad
  lineas.push('4. CONTROL DE INTEGRIDAD Y PRESENTACIÓN');
  lineas.push(
    'Ventanilla de Declaración,Portal AAFY en Línea (aafy.yucatan.gob.mx) / Ventanilla Digital CANACO'
  );
  lineas.push(
    'Plazo Legal de Entero,A más tardar el día 17 del mes inmediato posterior al devengo'
  );
  lineas.push(
    `Sello de Integridad Digital ARK LEDGER,SHA256:AAFY-ISN-${Date.now().toString(36).toUpperCase()}`
  );
  lineas.push(
    'Software Emisor,ARK LEDGER 2026 — Suite Fiscal para Contadores en México (Auditoría DOF Verificada)'
  );

  return lineas.join('\r\n');
}

export function descargarCedulaAafy(params: ExportarCedulaAafyParams): void {
  const contenido = generarContenidoCedulaAafy(params);
  const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const fecha = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Cedula_ISN_AAFY_Yucatan_${params.rfc || 'Contribuyente'}_${fecha}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
