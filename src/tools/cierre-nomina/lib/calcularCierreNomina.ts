/**
 * ARK LEDGER — Motor de Procesamiento de Cierre de Nómina Masiva (Sprint 11)
 *
 * Ejecuta simultáneamente el cálculo para todos los trabajadores de la empresa:
 * 1. Factor de Integración y SBC (LSS Art. 27 y 28, tope 25 UMAs).
 * 2. Retención de ISR y Subsidio al Empleo (LISR Art. 96, Anexo 8 RMF 2026).
 * 3. Cuotas IMSS Obrero (LSS Art. 25, 106, 107, 147, 168).
 * 4. ISN Estatal por Entidad Federativa.
 * 5. Determinación del Sueldo Neto a dispersar y totales en letra (CFF Art. 28).
 * 6. Folio de Integridad (hash SHA-256 determinista calculado en el navegador)
 *    del lote. No constituye sellado fiscal ni consta en D1.
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
import { calcularIMSSPatronal, calcularInfONAVITPatronal } from '../../nomina/data/cuotasIMSS';
import { calcularISN, calcularResultadoISN } from '../../isn/lib/calcularISN';
import { ESTADOS } from '../../isn/data/estados';
import type { OpcionesISN, RegimenISN, ResultadoISN } from '../../isn/types';
import { numeroALetras } from '../../../lib/numeroALetras';
import { calcularAntiguedadAnios, calcularDiasVacacionesPorLey } from './parserPlantilla';

export const CATALOG_VERSION_CIERRE = 'DOF-2026-UMA117.31-SMG315.04-TOPESBC2932.75';

/**
 * Genera el Folio de Integridad (hash SHA-256 canónico determinista calculado
 * en el navegador) para el lote completo. No es un sellado fiscal.
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
 * Reparte un total en pesos entre pesos relativos sin perder centavos
 * (método del mayor residuo). Evita que la suma por trabajador difiera
 * del total del lote por redondeo.
 */
function repartirCents(totalPesos: number, pesos: number[]): number[] {
  const totalCents = Math.round(totalPesos * 100);
  const sumaPesos = pesos.reduce((a, b) => a + b, 0);
  if (sumaPesos <= 0 || pesos.length === 0) {
    return pesos.map(() => 0);
  }
  const exactos = pesos.map((p) => (p / sumaPesos) * totalCents);
  const asignados = exactos.map((v) => Math.floor(v));
  let faltante = totalCents - asignados.reduce((a, b) => a + b, 0);
  const orden = exactos
    .map((v, i) => ({ i, residuo: v - Math.floor(v) }))
    .sort((a, b) => b.residuo - a.residuo);
  let k = 0;
  while (faltante > 0 && orden.length > 0) {
    asignados[orden[k % orden.length]!.i]! += 1;
    faltante -= 1;
    k += 1;
  }
  return asignados.map((c) => c / 100);
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
  let acumIMSSPatronal = 0;
  const acumIMSSPatronalDesglose = new Map<string, number>();
  let acumInfONAVIT = 0;
  let acumOtrasDeducciones = 0;
  let acumDeducciones = 0;
  let acumNeto = 0;
  let acumISN = 0;

  const advertencias: string[] = [];
  const estadoCatalogo = ESTADOS.find(
    (e) => e.id.toUpperCase() === (parametros.estadoIsnId || '').toUpperCase()
  );
  const usaISNVersionado = Boolean(estadoCatalogo?.tasasPorEjercicio);

  // Para estados con tasas versionadas el ISN se calcula sobre la base agregada
  // del lote (ver bloque posterior) para evitar desviaciones por redondeo.
  // Si el llamador no envía opcionesIsn, se aplican defaults y se advierte;
  // nunca se cae silenciosamente a la tasa plana del estado.
  let opcionesIsResolved: OpcionesISN | undefined;
  if (estadoCatalogo && usaISNVersionado) {
    opcionesIsResolved = parametros.opcionesIsn ?? {
      ejercicio: 2026,
      numEmpleados: trabajadoresInput.length,
      esMicroPequena2026: trabajadoresInput.length >= 1 && trabajadoresInput.length <= 50,
      esGobiernoEstatal: false,
      aplica27A: false,
    };
    if (!parametros.opcionesIsn) {
      advertencias.push(
        `ISN ${estadoCatalogo.nombre}: no se recibieron opcionesIsn; se aplicaron valores por defecto (ejercicio 2026, ${trabajadoresInput.length} empleados, micro/pequeña ${opcionesIsResolved.esMicroPequena2026 ? 'sí' : 'no'}).`
      );
    }
  }

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
    const diasTrabajados =
      t.diasTrabajados !== undefined ? t.diasTrabajados : parametros.diasPeriodo;
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

    // 5b. Cuotas IMSS Patrón (empleador)
    const resIMSSPatronal = calcularIMSSPatronal(sbcDiario, parametros.periodo);
    const imssPatronal = resIMSSPatronal.total;

    // 5c. INFONAVIT patrón (5% sobre SBC × días) — línea separada, fuera de totalIMSSPatronal
    const infONAVIT = calcularInfONAVITPatronal(sbcDiario, diasTrabajados).monto;

    // 6. Deducciones y Neto
    const otrasDeducciones = r2(t.otrasDeducciones || 0);
    const totalDeducciones = r2(isrRetenido + imssObrero + otrasDeducciones);
    const sueldoNeto = r2(Math.max(0, totalPercepciones - totalDeducciones));

    // 7. Impuesto Sobre Nómina Estatal
    // Con tasas versionadas se calcula sobre la base agregada al final del lote.
    const isnEstatal = usaISNVersionado ? 0 : calcularISN(totalPercepciones, parametros.tasaIsn);

    // Acumuladores
    acumBruto += totalPercepciones;
    acumISR += isrRetenido;
    acumSubsidio += subsidioEmpleo;
    acumIMSS += imssObrero;
    acumIMSSPatronal += imssPatronal;
    for (const c of resIMSSPatronal.cuotas) {
      acumIMSSPatronalDesglose.set(c.ramo, (acumIMSSPatronalDesglose.get(c.ramo) || 0) + c.monto);
    }
    acumInfONAVIT += infONAVIT;
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
      imssPatronal,
      infONAVIT,
      otrasDeducciones,
      totalDeducciones,
      sueldoNeto,
      isnEstatal,
    });
  }

  const totalBrutoRedondeado = r2(acumBruto);
  const totalNetoRedondeado = r2(acumNeto);

  let isnBaseGravable = totalBrutoRedondeado;
  let isnTasaBruta = parametros.tasaIsn;
  let isnBruto = r2(acumISN);
  let isnEstimulo = 0;
  let isnTasaEfectiva = parametros.tasaIsn;
  let isnRegimen: RegimenISN = 'general';

  if (estadoCatalogo && usaISNVersionado && opcionesIsResolved) {
    const resIs: ResultadoISN = calcularResultadoISN(
      [{ id: 1, concepto: 'Nómina del período', gravado: totalBrutoRedondeado, exento: 0 }],
      estadoCatalogo,
      opcionesIsResolved
    );

    const asignacion = repartirCents(
      resIs.isnNeto,
      trabajadores.map((t) => t.totalPercepciones)
    );
    trabajadores.forEach((t, idx) => {
      t.isnEstatal = asignacion[idx] ?? 0;
    });

    acumISN = r2(asignacion.reduce((a, b) => a + b, 0));
    isnBaseGravable = r2(resIs.baseGravable);
    isnTasaBruta = resIs.tasaBruta;
    isnBruto = r2(resIs.isnBruto);
    isnEstimulo = r2(resIs.estimulo);
    isnTasaEfectiva = resIs.tasaEfectiva;
    isnRegimen = resIs.regimen;
  } else {
    isnBruto = r2(acumISN);
    isnEstimulo = 0;
    isnTasaEfectiva =
      totalBrutoRedondeado > 0 ? (acumISN / totalBrutoRedondeado) * 100 : parametros.tasaIsn;
  }

  const resumenPreHash = {
    totalTrabajadores: trabajadores.length,
    totalPercepcionesBrutas: totalBrutoRedondeado,
    totalISRRetenido: r2(acumISR),
    totalSubsidioEntregado: r2(acumSubsidio),
    totalIMSSObrero: r2(acumIMSS),
    totalIMSSPatronal: r2(acumIMSSPatronal),
    imssPatronalDesglose: Array.from(acumIMSSPatronalDesglose.entries()).map(([ramo, monto]) => ({
      ramo,
      monto: r2(monto),
    })),
    totalInfONAVIT: r2(acumInfONAVIT),
    totalOtrasDeducciones: r2(acumOtrasDeducciones),
    totalDeducciones: r2(acumDeducciones),
    totalNetoDispersar: totalNetoRedondeado,
    totalISNEstatal: r2(acumISN),
    isnBaseGravable,
    isnTasaBruta,
    isnBruto,
    isnEstimulo,
    isnTasaEfectiva,
    isnRegimen,
    importeNetoEnLetras: numeroALetras(totalNetoRedondeado),
    fechaEmision: new Date().toISOString(),
    catalogVersion: CATALOG_VERSION_CIERRE,
  };

  // Folio de Integridad determinista del lote (hash local, sin sellar en D1)
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
    advertencias,
  };
}
