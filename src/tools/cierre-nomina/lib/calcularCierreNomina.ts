/**
 * ARK TOOLS — Motor de Procesamiento de Cierre de Nómina Masiva (Sprint 11)
 *
 * Ejecuta simultáneamente el cálculo para todos los trabajadores de la empresa:
 * 1. Factor de Integración y SBC (LSS Art. 27 y 28, tope 25 UMAs).
 * 2. Retención de ISR y Subsidio al Empleo (LISR Art. 96, Anexo 8 RMF 2026).
 * 3. Cuotas IMSS Obrero (LSS Art. 25, 106, 107, 147, 168).
 * 4. ISN Estatal por Entidad Federativa.
 * 5. Determinación del Sueldo Neto a dispersar y totales en letra (CFF Art. 28).
 * 6. Generación del Sello Digital Criptográfico SHA-256 inmutable del lote.
 */

import type {
  TrabajadorFilaInput,
  ParametrosCierreNomina,
  ResultadoTrabajadorNomina,
  ResumenCierreNomina,
  CierreNominaCompleto,
} from '../types';
import { calcularResultadoSBC } from '../../sbc/lib/calcularSBC';
import { calcularISR } from '../../nomina/lib/calcularISR';
import { calcularIMSS } from '../../nomina/lib/calcularIMSS';
import { calcularISN } from '../../isn/lib/calcularISN';
import { numeroALetras } from '../../../lib/numeroALetras';
import { calcularAntiguedadAnios, calcularDiasVacacionesPorLey } from './parserPlantilla';

export const CATALOG_VERSION_CIERRE = 'DOF-2026-UMA117.31-SMG315.04-TOPESBC2932.75';

/**
 * Genera un hash SHA-256 canónico determinista para sellar el lote completo.
 */
export async function computeBatchHash(data: unknown): Promise<string> {
  const normalize = (obj: unknown): unknown => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(normalize);
    }
    const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
    const result: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      result[key] = normalize((obj as Record<string, unknown>)[key]);
    }
    return result;
  };

  const canonicalJson = JSON.stringify(normalize(data));
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalJson));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Redondeo financiero a 2 decimales.
 */
function r2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Procesa el lote de trabajadores y genera la Cédula Concentradora completa.
 */
export async function procesarCierreNomina(
  trabajadoresInput: TrabajadorFilaInput[],
  parametros: ParametrosCierreNomina
): Promise<CierreNominaCompleto> {
  const trabajadores: ResultadoTrabajadorNomina[] = [];

  let acumBruto = 0;
  let acumISR = 0;
  let acumSubsidio = 0;
  let acumIMSS = 0;
  let acumOtrasDeducciones = 0;
  let acumDeducciones = 0;
  let acumNeto = 0;
  let acumISN = 0;

  for (let i = 0; i < trabajadoresInput.length; i++) {
    const t = trabajadoresInput[i]!;
    const numeroLista = i + 1;

    // 1. Antigüedad y Vacaciones por Ley
    const antiguedad = calcularAntiguedadAnios(t.fechaIngreso || '', parametros.fechaCorte);
    const diasVacaciones = calcularDiasVacacionesPorLey(antiguedad);

    // 2. Factor de Integración y SBC
    const resultadoSBC = calcularResultadoSBC({
      salarioDiario: t.salarioDiario,
      diasVacaciones,
      primaVacacional: parametros.primaVacacionalPct ?? 25,
      diasAguinaldo: parametros.diasAguinaldo ?? 15,
    });

    const sbcDiario = resultadoSBC.sbcFinal;
    const factorIntegracion = resultadoSBC.factor;

    // 3. Percepciones
    const diasTrabajados = t.diasTrabajados !== undefined ? t.diasTrabajados : parametros.diasPeriodo;
    const sueldoOrdinario = r2(t.salarioDiario * diasTrabajados);
    const percepcionesAdicionales = r2(
      (t.horasExtras || 0) + (t.bonos || 0) + (t.otrasPercepciones || 0)
    );
    const totalPercepciones = r2(sueldoOrdinario + percepcionesAdicionales);

    // 4. Base gravable y Retención ISR
    const baseGravableISR = totalPercepciones;
    const resISR = calcularISR(baseGravableISR, parametros.periodo);
    const isrAntesSubsidio = resISR.isrTarifa;
    const subsidioEmpleo = resISR.subsidio;
    const isrRetenido = resISR.isrFinal;

    // 5. Cuotas IMSS Obrero
    const resIMSS = calcularIMSS(sbcDiario, parametros.periodo);
    const imssObrero = resIMSS.total;

    // 6. Deducciones y Neto
    const otrasDeducciones = r2(t.otrasDeducciones || 0);
    const totalDeducciones = r2(isrRetenido + imssObrero + otrasDeducciones);
    const sueldoNeto = r2(Math.max(0, totalPercepciones - totalDeducciones));

    // 7. Impuesto Sobre Nómina Estatal
    const isnEstatal = calcularISN(totalPercepciones, parametros.tasaIsn);

    // Acumuladores
    acumBruto += totalPercepciones;
    acumISR += isrRetenido;
    acumSubsidio += subsidioEmpleo;
    acumIMSS += imssObrero;
    acumOtrasDeducciones += otrasDeducciones;
    acumDeducciones += totalDeducciones;
    acumNeto += sueldoNeto;
    acumISN += isnEstatal;

    trabajadores.push({
      id: t.id || `trab_${numeroLista}`,
      numeroLista,
      nombre: t.nombre,
      rfc: t.rfc || '',
      curp: t.curp || '',
      nss: t.nss || '',
      fechaIngreso: t.fechaIngreso || '',
      antiguedadAnios: antiguedad,
      diasVacacionesLey: diasVacaciones,
      factorIntegracion,
      salarioDiario: t.salarioDiario,
      sbcDiario,
      diasTrabajados,
      sueldoOrdinario,
      percepcionesAdicionales,
      totalPercepciones,
      baseGravableISR,
      isrAntesSubsidio,
      subsidioEmpleo,
      isrRetenido,
      imssObrero,
      otrasDeducciones,
      totalDeducciones,
      sueldoNeto,
      isnEstatal,
    });
  }

  const totalBrutoRedondeado = r2(acumBruto);
  const totalNetoRedondeado = r2(acumNeto);

  const resumenPreHash = {
    totalTrabajadores: trabajadores.length,
    totalPercepcionesBrutas: totalBrutoRedondeado,
    totalISRRetenido: r2(acumISR),
    totalSubsidioEntregado: r2(acumSubsidio),
    totalIMSSObrero: r2(acumIMSS),
    totalOtrasDeducciones: r2(acumOtrasDeducciones),
    totalDeducciones: r2(acumDeducciones),
    totalNetoDispersar: totalNetoRedondeado,
    totalISNEstatal: r2(acumISN),
    importeNetoEnLetras: numeroALetras(totalNetoRedondeado),
    fechaEmision: new Date().toISOString(),
    catalogVersion: CATALOG_VERSION_CIERRE,
  };

  // Sello digital inmutable del lote
  const hashLote = await computeBatchHash({
    parametros,
    resumen: resumenPreHash,
    trabajadores: trabajadores.map((tr) => ({
      rfc: tr.rfc,
      salarioDiario: tr.salarioDiario,
      totalPercepciones: tr.totalPercepciones,
      totalDeducciones: tr.totalDeducciones,
      sueldoNeto: tr.sueldoNeto,
    })),
  });

  const resumen: ResumenCierreNomina = {
    ...resumenPreHash,
    hashLote,
  };

  return {
    parametros,
    trabajadores,
    resumen,
  };
}
