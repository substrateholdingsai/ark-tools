/**
 * ARK LEDGER — Exportaciones Oficiales AAFY-30, AAFY-31 y Cotejo CSV
 * Reutiliza helpers CSV + BOM UTF-8 + Sello SHA-256 de exportarCedulaAafy.ts
 */

import {
  descargarArchivoCsvBom,
  escaparCSV,
  generarSelloDigitalAafy,
} from '../../isn/lib/exportarCedulaAafy';
import type { RetencionClinicasInput, RetencionClinicasResultado } from '../types';

function obtenerMesAnio(fechaIso: string): { mes: string; anio: string; periodo: string } {
  const [anio = '2026', mes = '01'] = fechaIso.split('-');
  return { mes, anio, periodo: `${mes}/${anio}` };
}

export function generarContenidoAafy30(
  input: RetencionClinicasInput,
  resultado: RetencionClinicasResultado
): string {
  const { mes, anio, periodo } = obtenerMesAnio(input.fechaPago);
  const fechaEmision = new Date().toISOString().slice(0, 10);
  const folio = input.folioConstancia?.trim() || `AAFY30-${anio}${mes}-001`;
  const recODomicilio =
    input.prestador.rec?.trim() ||
    input.prestador.domicilioFiscal?.trim() ||
    'PENDIENTE DOMICILIO FISCAL';

  const lineas: string[] = [
    'AGENCIA DE ADMINISTRACIÓN FISCAL DE YUCATÁN (AAFY)',
    'FORMATO AAFY-30 — CONSTANCIA DE RETENCIÓN DEL IMPUESTO SOBRE EL EJERCICIO PROFESIONAL',
    'Fundamento: Art. 20-Bis y Art. 20-Ter LGHY (D.O. 26-dic-2025)',
    '',
    `Folio Constancia,${escaparCSV(folio)}`,
    `Mes / Año,${escaparCSV(periodo)}`,
    `Fecha de Emisión,${escaparCSV(fechaEmision)}`,
    `Periodo de Retención,${escaparCSV(input.fechaPago)}`,
    '',
    '1. DATOS DEL RETENEDOR (CLÍNICA / HOSPITAL)',
    `Nombre o Razón Social,${escaparCSV(input.retenedor.nombre)}`,
    `RFC,${escaparCSV(input.retenedor.rfc)}`,
    `REC AAFY,${escaparCSV(input.retenedor.rec || 'N/D')}`,
    `CIEE,${escaparCSV(input.retenedor.ciee || 'N/D')}`,
    '',
    '2. DATOS DEL PRESTADOR DEL SERVICIO MÉDICO',
    `Nombre o Razón Social,${escaparCSV(input.prestador.nombre)}`,
    `Tipo de Persona,${escaparCSV(input.prestador.tipoPersona === 'moral' ? 'Persona Moral' : 'Persona Física')}`,
    `RFC,${escaparCSV(input.prestador.rfc)}`,
    `REC AAFY o Domicilio Fiscal,${escaparCSV(recODomicilio)}`,
    '',
    '3. DETERMINACIÓN DE LA RETENCIÓN (ART. 20-BIS LGHY)',
    `1.1 Base de Retención (Total Contraprestaciones),${resultado.base.toFixed(2)}`,
    `1.2 Impuesto Retenido (2%),${resultado.retencion2Pct.toFixed(2)}`,
    `Neto Pagado al Prestador,${resultado.netoPagar.toFixed(2)}`,
    `Impuesto Subyacente Ejercicio Profesional 3% (Informativo Art. 16-20),${resultado.impuestoEjercicioProfesional3Pct.toFixed(2)}`,
    '',
    '4. FIRMAS Y SELLO DE INTEGRIDAD',
    'Firma del Retenedor,______________________________',
    'Firma de Recibido (Prestador),______________________________',
    `Sello Digital ARK LEDGER,${generarSelloDigitalAafy('AAFY-30')}`,
  ];

  return lineas.join('\r\n');
}

export function generarContenidoAafy31(
  input: RetencionClinicasInput,
  resultado: RetencionClinicasResultado
): string {
  const { periodo } = obtenerMesAnio(input.fechaPago);
  const lineas: string[] = [
    'AGENCIA DE ADMINISTRACIÓN FISCAL DE YUCATÁN (AAFY)',
    'FORMATO AAFY-31 — DECLARACIÓN DE ENTERO DE LAS RETENCIONES (ART. 20-BIS LGHY)',
    '',
    `Periodo Declarado,${escaparCSV(periodo)}`,
    `Fecha Límite de Entero,${escaparCSV(resultado.fechaLimiteEntero)}`,
    `Retenedor,${escaparCSV(input.retenedor.nombre)}`,
    `RFC Retenedor,${escaparCSV(input.retenedor.rfc)}`,
    `REC AAFY Retenedor,${escaparCSV(input.retenedor.rec || 'N/D')}`,
    `CIEE,${escaparCSV(input.retenedor.ciee || 'N/D')}`,
    '',
    'RESUMEN DE ENTERO',
    `Base de Retención (Total Contraprestaciones),${resultado.base.toFixed(2)}`,
    `Tasa de Retención Aplicable,2.00%`,
    `Impuesto Retenido a Pagar,${resultado.retencion2Pct.toFixed(2)}`,
    '',
    'ANEXO 31.1 — DESGLOSE POR PRESTADOR RETENIDO',
    'RFC Prestador,Nombre / Razón Social,Tipo Persona,REC / Domicilio,Fecha Pago,Base Retención,Impuesto Retenido 2%',
    `${escaparCSV(input.prestador.rfc)},${escaparCSV(input.prestador.nombre)},${escaparCSV(input.prestador.tipoPersona)},${escaparCSV(input.prestador.rec || input.prestador.domicilioFiscal || 'N/D')},${escaparCSV(input.fechaPago)},${resultado.base.toFixed(2)},${resultado.retencion2Pct.toFixed(2)}`,
    '',
    `Nota Normativa,${escaparCSV(resultado.notaAcuerdoAafy2026)}`,
    `Sello Digital ARK LEDGER,${generarSelloDigitalAafy('AAFY-31')}`,
  ];

  return lineas.join('\r\n');
}

export function generarContenidoCotejoAafy(
  input: RetencionClinicasInput,
  resultado: RetencionClinicasResultado
): string {
  const lineas: string[] = [
    'Portal,Concepto,RFC Retenedor,REC Retenedor,RFC Prestador,Fecha Pago,Base,Retencion 2%,Neto Pagado,Limite Entero,Sello',
    `AAFY Yucatán,Retención 2% Clínicas Art. 20-Bis LGHY,${escaparCSV(input.retenedor.rfc)},${escaparCSV(input.retenedor.rec || 'N/D')},${escaparCSV(input.prestador.rfc)},${escaparCSV(input.fechaPago)},${resultado.base.toFixed(2)},${resultado.retencion2Pct.toFixed(2)},${resultado.netoPagar.toFixed(2)},${escaparCSV(resultado.fechaLimiteEntero)},${generarSelloDigitalAafy('AAFY-COTEJO')}`,
  ];
  return lineas.join('\r\n');
}

export function descargarAafy30(
  input: RetencionClinicasInput,
  resultado: RetencionClinicasResultado
): void {
  const contenido = generarContenidoAafy30(input, resultado);
  descargarArchivoCsvBom(
    `AAFY-30_Constancia_Retencion_${input.prestador.rfc || 'Prestador'}_${input.fechaPago}.csv`,
    contenido
  );
}

export function descargarAafy31(
  input: RetencionClinicasInput,
  resultado: RetencionClinicasResultado
): void {
  const contenido = generarContenidoAafy31(input, resultado);
  descargarArchivoCsvBom(
    `AAFY-31_Declaracion_Entero_${input.retenedor.rfc || 'Retenedor'}_${input.fechaPago}.csv`,
    contenido
  );
}

export function descargarCotejoAafy(
  input: RetencionClinicasInput,
  resultado: RetencionClinicasResultado
): void {
  const contenido = generarContenidoCotejoAafy(input, resultado);
  descargarArchivoCsvBom(
    `Cotejo_AAFY_Retencion_2pct_${input.retenedor.rfc || 'Retenedor'}_${input.fechaPago}.csv`,
    contenido
  );
}
