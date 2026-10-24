/**
 * ARK LEDGER — Motor Matemático y Jurídico de Modalidad 40 (Ley 73 + Criterio DOF 2026)
 *
 * Implementa:
 * 1. Acuerdo ACDO.AS2.HCT.101026/302.P.DG del Consejo Técnico del IMSS (DOF 21/10/2026):
 *    - Límite del nuevo SBC: No puede superar el último salario registrado previo a la baja más 1 UMA.
 *    - Tope máximo absoluto general de 25 UMAs (Art. 28 LSS).
 *    - Mínimo permitido: Salario Mínimo General vigente (Art. 218 LSS).
 * 2. Cuota de Continuación Voluntaria 2026:
 *    - Tasa de 14.438% del SBC conforme a la reforma gradual a las cuotas de Cesantía y Vejez (Art. 168 LSS).
 * 3. Cálculo Actuarial de Pensión por Cesantía y Vejez (Ley del Seguro Social 1973):
 *    - Tabla oficial de Cuantía Básica e Incrementos Anuales (Art. 167 LSS).
 *    - Fracciones de año por excedente de semanas (semestre de gracia Art. 167).
 *    - Factor de edad por cesantía (Art. 171 LSS: 75% a los 60 años hasta 100% a los 65 años).
 *    - Asignaciones familiares y ayuda asistencial del 15% (Art. 164 LSS).
 *    - Factor de actualización del 11% (Decreto Presidencial 2004 / Factor Fox).
 */

import { CATALOGO_2026, CUOTA_MODALIDAD_40_PCT_2026 } from '@/data/valores-vigentes/catalogo';
import type {
  ParametrosModalidad40,
  LimitesModalidad40,
  InversionModalidad40,
  ProyeccionPensionLey73,
  AnalisisRoi,
  ResultadoModalidad40,
} from '../types';

function obtenerValorCatalogo(id: string, fallback: number): number {
  const item = CATALOGO_2026.find((v) => v.id === id);
  return typeof item?.valor === 'number' ? item.valor : fallback;
}

export const VALORES_OFICIALES_M40 = {
  UMA_DIARIA: obtenerValorCatalogo('UMA_DIARIA_2026', 117.31),
  SMG_DIARIO: obtenerValorCatalogo('SALARIO_MINIMO_GENERAL_2026', 315.04),
  TOPE_25_UMA: obtenerValorCatalogo('TOPE_SBC_25_UMA_2026', 2932.75),
  TASA_CUOTA_2026: CUOTA_MODALIDAD_40_PCT_2026,
};

/**
 * Tabla oficial del Artículo 167 de la Ley del Seguro Social de 1973.
 * Determina el % de Cuantía Básica y el % de Incremento Anual
 * según la relación entre el salario promedio diario y el Salario Mínimo General.
 */
export interface RangoTablaArt167 {
  limiteSuperiorSMG: number;
  pctCuantiaBasica: number;
  pctIncrementoAnual: number;
}

export const TABLA_ART_167_LSS: RangoTablaArt167[] = [
  { limiteSuperiorSMG: 1.0, pctCuantiaBasica: 80.0, pctIncrementoAnual: 0.563 },
  { limiteSuperiorSMG: 1.25, pctCuantiaBasica: 77.11, pctIncrementoAnual: 0.814 },
  { limiteSuperiorSMG: 1.5, pctCuantiaBasica: 58.18, pctIncrementoAnual: 1.178 },
  { limiteSuperiorSMG: 1.75, pctCuantiaBasica: 49.23, pctIncrementoAnual: 1.43 },
  { limiteSuperiorSMG: 2.0, pctCuantiaBasica: 42.67, pctIncrementoAnual: 1.615 },
  { limiteSuperiorSMG: 2.25, pctCuantiaBasica: 37.65, pctIncrementoAnual: 1.756 },
  { limiteSuperiorSMG: 2.5, pctCuantiaBasica: 33.68, pctIncrementoAnual: 1.868 },
  { limiteSuperiorSMG: 2.75, pctCuantiaBasica: 30.48, pctIncrementoAnual: 1.958 },
  { limiteSuperiorSMG: 3.0, pctCuantiaBasica: 27.83, pctIncrementoAnual: 2.033 },
  { limiteSuperiorSMG: 3.25, pctCuantiaBasica: 25.6, pctIncrementoAnual: 2.096 },
  { limiteSuperiorSMG: 3.5, pctCuantiaBasica: 23.7, pctIncrementoAnual: 2.149 },
  { limiteSuperiorSMG: 3.75, pctCuantiaBasica: 22.07, pctIncrementoAnual: 2.195 },
  { limiteSuperiorSMG: 4.0, pctCuantiaBasica: 20.65, pctIncrementoAnual: 2.235 },
  { limiteSuperiorSMG: 4.25, pctCuantiaBasica: 19.39, pctIncrementoAnual: 2.271 },
  { limiteSuperiorSMG: 4.5, pctCuantiaBasica: 18.29, pctIncrementoAnual: 2.302 },
  { limiteSuperiorSMG: 4.75, pctCuantiaBasica: 17.3, pctIncrementoAnual: 2.33 },
  { limiteSuperiorSMG: 5.0, pctCuantiaBasica: 16.41, pctIncrementoAnual: 2.355 },
  { limiteSuperiorSMG: 5.25, pctCuantiaBasica: 15.61, pctIncrementoAnual: 2.377 },
  { limiteSuperiorSMG: 5.5, pctCuantiaBasica: 14.88, pctIncrementoAnual: 2.398 },
  { limiteSuperiorSMG: 5.75, pctCuantiaBasica: 14.22, pctIncrementoAnual: 2.416 },
  { limiteSuperiorSMG: 6.0, pctCuantiaBasica: 13.62, pctIncrementoAnual: 2.433 },
  { limiteSuperiorSMG: Infinity, pctCuantiaBasica: 13.0, pctIncrementoAnual: 2.45 },
];

/**
 * Obtiene los porcentajes de Cuantía Básica e Incremento Anual para un factor salarial.
 */
export function buscarPorcentajesArt167(factorSalarioSmg: number): {
  pctCuantiaBasica: number;
  pctIncrementoAnual: number;
} {
  const factorRedondeado = Math.round(factorSalarioSmg * 100) / 100;
  for (const rango of TABLA_ART_167_LSS) {
    if (factorRedondeado <= rango.limiteSuperiorSMG) {
      return {
        pctCuantiaBasica: rango.pctCuantiaBasica,
        pctIncrementoAnual: rango.pctIncrementoAnual,
      };
    }
  }
  return { pctCuantiaBasica: 13.0, pctIncrementoAnual: 2.45 };
}

/**
 * Obtiene el porcentaje de pensión por edad conforme al Art. 171 de la LSS 1973.
 */
export function obtenerFactorEdad(edad: number): number {
  if (edad <= 60) return 0.75;
  if (edad === 61) return 0.8;
  if (edad === 62) return 0.85;
  if (edad === 63) return 0.9;
  if (edad === 64) return 0.95;
  return 1.0;
}

/**
 * Calcula los años de incremento sobre las primeras 500 semanas,
 * aplicando la regla del semestre de gracia (Art. 167 LSS último párrafo):
 * - De 13 a 26 semanas excedentes: +0.5 años.
 * - Más de 26 semanas excedentes: +1.0 año.
 */
export function calcularAniosExcedentes(semanasTotales: number): number {
  if (semanasTotales <= 500) return 0;
  const excedente = semanasTotales - 500;
  const aniosCompletos = Math.floor(excedente / 52);
  const semanasRestantes = excedente % 52;
  let fraccion = 0;
  if (semanasRestantes >= 27) {
    fraccion = 1;
  } else if (semanasRestantes >= 13) {
    fraccion = 0.5;
  }
  return aniosCompletos + fraccion;
}

/**
 * Evalúa los límites legales aplicables conforme al Acuerdo DOF 21/10/2026.
 */
export function evaluarLimitesModalidad40(
  ultimoSbc: number,
  sbcDeseado: number
): LimitesModalidad40 {
  const salarioMinimo = VALORES_OFICIALES_M40.SMG_DIARIO;
  const umaDiaria = VALORES_OFICIALES_M40.UMA_DIARIA;
  const topeHistorico25Umas = VALORES_OFICIALES_M40.TOPE_25_UMA;

  // Límite legal conforme al Acuerdo ACDO.AS2.HCT.101026/302.P.DG (DOF 21/10/2026):
  // El salario no podrá superar el último SBC con el que causó baja más 1 UMA diaria,
  // sin exceder las 25 UMAs ni ser menor al SMG.
  const baseSbc = Math.max(salarioMinimo, ultimoSbc);
  const limitePermitidoDof2026 = Math.min(
    Math.round((baseSbc + umaDiaria) * 100) / 100,
    topeHistorico25Umas
  );

  const excedeLimiteDof = sbcDeseado > limitePermitidoDof2026;
  const sbcEfectivo = Math.max(salarioMinimo, Math.min(sbcDeseado, limitePermitidoDof2026));

  const diferenciaConTopeHistorico = Math.max(
    0,
    Math.round((topeHistorico25Umas - limitePermitidoDof2026) * 100) / 100
  );

  const mensajeCriterio = excedeLimiteDof
    ? `Conforme al Acuerdo ACDO.AS2.HCT.101026/302.P.DG (DOF 21/10/2026), el salario de registro queda topado a tu último salario ($${ultimoSbc.toFixed(
        2
      )}) más 1 UMA ($${umaDiaria.toFixed(2)}), siendo el máximo legal $${limitePermitidoDof2026.toFixed(
        2
      )} MXN diarios.`
    : `Salario dentro del límite permitido por el nuevo criterio del IMSS (máx. $${limitePermitidoDof2026.toFixed(
        2
      )} MXN diarios).`;

  return {
    salarioMinimo,
    umaDiaria,
    topeHistorico25Umas,
    limitePermitidoDof2026,
    sbcEfectivo,
    excedeLimiteDof,
    diferenciaConTopeHistorico,
    mensajeCriterio,
  };
}

/**
 * Proyecta la inversión mensual y total en cuotas de Modalidad 40.
 */
export function calcularInversionModalidad40(
  sbcEfectivo: number,
  mesesAportacion: number
): InversionModalidad40 {
  const tasaCuotaPct = VALORES_OFICIALES_M40.TASA_CUOTA_2026;
  // Promedio mensual actuarial: 30.4 días por mes
  const cuotaMensual = Math.round(sbcEfectivo * 30.4 * (tasaCuotaPct / 100) * 100) / 100;
  const cuotaAnual = Math.round(cuotaMensual * 12 * 100) / 100;
  const inversionTotal = Math.round(cuotaMensual * mesesAportacion * 100) / 100;

  const cronograma: InversionModalidad40['cronograma'] = [];
  for (let m = 1; m <= mesesAportacion; m++) {
    cronograma.push({
      mes: m,
      cuotaMes: cuotaMensual,
      inversionAcumulada: Math.round(cuotaMensual * m * 100) / 100,
    });
  }

  return {
    tasaCuotaPct,
    cuotaMensual,
    cuotaAnual,
    inversionTotal,
    cronograma,
  };
}

/**
 * Calcula la proyección de pensión bajo el Régimen 1973 de la LSS.
 */
export function calcularPensionLey73(
  ultimoSbc: number,
  sbcModalidad40: number,
  semanasPrevias: number,
  mesesM40: number,
  edadJubilacion: number,
  asignacionFamiliar: boolean
): ProyeccionPensionLey73 {
  const smg = VALORES_OFICIALES_M40.SMG_DIARIO;
  const semanasM40 = Math.floor((mesesM40 * 30.4) / 7);
  const semanasTotales = semanasPrevias + semanasM40;

  // Cálculo del salario promedio de las últimas 250 semanas de cotización
  const semanasM40EnPromedio = Math.min(250, semanasM40);
  const semanasPreviasEnPromedio = 250 - semanasM40EnPromedio;
  const salarioPromedioDiario =
    Math.round(
      ((semanasM40EnPromedio * sbcModalidad40 + semanasPreviasEnPromedio * ultimoSbc) / 250) * 100
    ) / 100;

  const factorSalarioSmg = Math.round((salarioPromedioDiario / smg) * 100) / 100;
  const { pctCuantiaBasica, pctIncrementoAnual } = buscarPorcentajesArt167(factorSalarioSmg);

  const aniosExcedentes = calcularAniosExcedentes(semanasTotales);

  // Cuantía Básica Anual e Incrementos Anuales
  const cuantiaBasicaAnual =
    Math.round(salarioPromedioDiario * 365 * (pctCuantiaBasica / 100) * 100) / 100;
  const incrementosAnuales =
    Math.round(salarioPromedioDiario * 365 * (pctIncrementoAnual / 100) * aniosExcedentes * 100) /
    100;

  const pensionBaseAnual = Math.round((cuantiaBasicaAnual + incrementosAnuales) * 100) / 100;

  // Factor de edad (Art. 171 LSS)
  const factorEdadPct = Math.round(obtenerFactorEdad(edadJubilacion) * 100);
  const pensionConEdad = Math.round(pensionBaseAnual * (factorEdadPct / 100) * 100) / 100;

  // Asignaciones familiares: 15% por cónyuge o soledad (Art. 164 LSS)
  const importeAsignacionFamiliar = asignacionFamiliar
    ? Math.round(pensionConEdad * 0.15 * 100) / 100
    : 0;

  // Decreto Fox de 2004: +11% sobre pensión + asignación
  const subtotalConAsignacion = pensionConEdad + importeAsignacionFamiliar;
  const importeDecretoFox = Math.round(subtotalConAsignacion * 0.11 * 100) / 100;

  const pensionAnualTotal = Math.round((subtotalConAsignacion + importeDecretoFox) * 100) / 100;

  const pensionMensualEstimada = Math.round((pensionAnualTotal / 12) * 100) / 100;

  const aguinaldoAnual = pensionMensualEstimada;

  return {
    semanasTotales,
    semanasM40,
    salarioPromedioDiario,
    factorSalarioSmg,
    pctCuantiaBasica,
    pctIncrementoAnual,
    aniosExcedentes,
    cuantiaBasicaAnual,
    incrementosAnuales,
    pensionBaseAnual,
    factorEdadPct,
    pensionConEdad,
    importeAsignacionFamiliar,
    importeDecretoFox,
    pensionAnualTotal,
    pensionMensualEstimada,
    aguinaldoAnual,
  };
}

/**
 * Realiza el análisis de retorno de inversión (ROI) comparando el escenario
 * con Modalidad 40 frente a jubilarse con el último salario registrado.
 */
export function analizarRoi(
  pensionConM40: number,
  ultimoSbc: number,
  semanasPrevias: number,
  edadJubilacion: number,
  asignacionFamiliar: boolean,
  inversionTotal: number
): AnalisisRoi {
  // Proyección base sin invertir en Modalidad 40 (0 meses M40)
  const proyeccionSinM40 = calcularPensionLey73(
    ultimoSbc,
    ultimoSbc,
    semanasPrevias,
    0,
    edadJubilacion,
    asignacionFamiliar
  );

  const pensionSinM40 = proyeccionSinM40.pensionMensualEstimada;
  const incrementoMensualPension = Math.max(
    0,
    Math.round((pensionConM40 - pensionSinM40) * 100) / 100
  );

  const mesesRecuperacionRoi =
    incrementoMensualPension > 0 ? Math.ceil(inversionTotal / incrementoMensualPension) : 0;

  const aniosRoi = Math.floor(mesesRecuperacionRoi / 12);
  const mesesRestantesRoi = mesesRecuperacionRoi % 12;

  let tiempoRecuperacionFormateado = `${mesesRecuperacionRoi} meses`;
  if (aniosRoi > 0) {
    tiempoRecuperacionFormateado = `${aniosRoi} año${
      aniosRoi > 1 ? 's' : ''
    }${mesesRestantesRoi > 0 ? ` y ${mesesRestantesRoi} mes${mesesRestantesRoi > 1 ? 'es' : ''}` : ''}`;
  }

  return {
    pensionSinM40,
    incrementoMensualPension,
    inversionTotal,
    mesesRecuperacionRoi,
    tiempoRecuperacionFormateado,
  };
}

/**
 * Genera un sello criptográfico determinista SHA-256 para el papel de trabajo.
 */
export async function generarSelloSha256(data: unknown): Promise<string> {
  const encoder = new TextEncoder();
  const canonical = JSON.stringify(data);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(canonical));
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback simple determinista
  let hash = 0;
  for (let i = 0; i < canonical.length; i++) {
    hash = (hash << 5) - hash + canonical.charCodeAt(i);
    hash |= 0;
  }
  return `m40_${Math.abs(hash).toString(16).padStart(64, '0')}`;
}

/**
 * Función principal que ejecuta la corrida completa del simulador.
 */
export async function simularModalidad40(
  params: ParametrosModalidad40
): Promise<ResultadoModalidad40> {
  const limites = evaluarLimitesModalidad40(params.ultimoSbc, params.sbcDeseado);
  const inversion = calcularInversionModalidad40(limites.sbcEfectivo, params.mesesAportacion);

  const pension = calcularPensionLey73(
    params.ultimoSbc,
    limites.sbcEfectivo,
    params.semanasPrevias,
    params.mesesAportacion,
    params.edadJubilacion,
    params.asignacionFamiliar
  );

  const roi = analizarRoi(
    pension.pensionMensualEstimada,
    params.ultimoSbc,
    params.semanasPrevias,
    params.edadJubilacion,
    params.asignacionFamiliar,
    inversion.inversionTotal
  );

  const fechaCalculoIso = new Date().toISOString();
  const payloadSello = {
    params,
    limites: {
      sbcEfectivo: limites.sbcEfectivo,
      limitePermitidoDof2026: limites.limitePermitidoDof2026,
    },
    inversion: {
      cuotaMensual: inversion.cuotaMensual,
      inversionTotal: inversion.inversionTotal,
    },
    pension: {
      pensionMensualEstimada: pension.pensionMensualEstimada,
      semanasTotales: pension.semanasTotales,
    },
    roi: {
      mesesRecuperacionRoi: roi.mesesRecuperacionRoi,
    },
  };

  const selloSha256 = await generarSelloSha256(payloadSello);

  return {
    parametros: params,
    limites,
    inversion,
    pension,
    roi,
    selloSha256,
    fechaCalculoIso,
  };
}
