/**
 * ARK LEDGER — Calculadora SBC 2026
 * Lógica de cálculo del Salario Base de Cotización
 *
 * Base legal:
 * - LSS Art. 27: Integración del SBC.
 * - LSS Art. 28, párrafo primero (texto vigente, DOF): "Los asegurados se
 *   inscribirán con el salario base de cotización que perciban en el momento
 *   de su afiliación, estableciéndose como límite superior el equivalente a
 *   veinticinco veces el salario mínimo general que rija en el Distrito
 *   Federal y como límite inferior el salario mínimo general del área
 *   geográfica respectiva." Interpretación aplicada: el SBC integrado
 *   (salario diario × factor de integración, sbcBruto) se acota entre el
 *   tope superior (25 UMA) y el salario mínimo general del área geográfica
 *   del trabajador (zona general o ZLFN). Se compara y, en su caso, se
 *   ajusta el SBC integrado al mínimo de zona.
 * - LFT Art. 76 (reforma DOF 27/12/2022, Vacaciones Dignas).
 * - LFT Art. 80: prima vacacional mínima 25%.
 * - LFT Art. 87: aguinaldo mínimo 15 días.
 */

import type {
  FactorIntegracion,
  ParametrosSBC,
  ResultadoSBC,
  TipoTope,
  ZonaSalarial,
} from '../types';
import { CONSTANTES_IMSS, obtenerSalarioMinimo } from '../data/uma';

export function calcularFactorIntegracion(
  parametros: Pick<ParametrosSBC, 'diasVacaciones' | 'primaVacacional' | 'diasAguinaldo'>
): FactorIntegracion {
  const { diasVacaciones, primaVacacional, diasAguinaldo } = parametros;
  const diasPrimaVacacional = diasVacaciones * (primaVacacional / 100);
  const aporteVacaciones = diasPrimaVacacional / 365;
  const aporteAguinaldo = diasAguinaldo / 365;
  const factor = 1 + aporteVacaciones + aporteAguinaldo;
  return {
    factor,
    aporteVacaciones,
    aporteAguinaldo,
    diasPrimaVacacional,
    diasIntegracion: diasPrimaVacacional + diasAguinaldo,
  };
}

export function calcularSBCFinal(
  sbcBruto: number,
  zona: ZonaSalarial = 'general',
  topePesos: number = CONSTANTES_IMSS.topePesos
): { sbcFinal: number; tipoTope: TipoTope; salarioMinimoAplicado: number } {
  const salarioMinimoAplicado = obtenerSalarioMinimo(zona);
  if (sbcBruto <= 0) {
    return { sbcFinal: 0, tipoTope: null, salarioMinimoAplicado };
  }
  if (sbcBruto > topePesos) {
    return { sbcFinal: topePesos, tipoTope: 'max', salarioMinimoAplicado };
  }
  if (sbcBruto < salarioMinimoAplicado) {
    return { sbcFinal: salarioMinimoAplicado, tipoTope: 'min', salarioMinimoAplicado };
  }
  return { sbcFinal: sbcBruto, tipoTope: null, salarioMinimoAplicado };
}

export function calcularResultadoSBC(parametros: ParametrosSBC): ResultadoSBC {
  const zona: ZonaSalarial = parametros.zona ?? 'general';
  const desglose = calcularFactorIntegracion(parametros);
  const sbcBruto = parametros.salarioDiario * desglose.factor;
  const { sbcFinal, tipoTope, salarioMinimoAplicado } = calcularSBCFinal(
    sbcBruto,
    zona,
    CONSTANTES_IMSS.topePesos
  );
  const porcentajeDelTope = Math.min(100, (sbcFinal / CONSTANTES_IMSS.topePesos) * 100);
  return {
    factor: desglose.factor,
    sbcBruto,
    sbcFinal,
    tipoTope,
    desglose,
    porcentajeDelTope,
    salarioMinimoAplicado,
    zona,
  };
}

export function formatearFactor(valor: number): string {
  return valor.toFixed(4);
}

export function formatearMXN(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

export function formatearNumero(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

export function generarResumenTexto(parametros: ParametrosSBC, resultado: ResultadoSBC): string {
  const zonaLabel = (parametros.zona ?? 'general') === 'frontera' ? 'ZLFN' : 'General';
  return [
    `SBC 2026: ${formatearMXN(resultado.sbcFinal)}`,
    `Factor: ${formatearFactor(resultado.factor)}`,
    `Zona: ${zonaLabel}`,
    `Salario: $${parametros.salarioDiario}`,
    `Vac: ${parametros.diasVacaciones}d`,
    `Prima: ${parametros.primaVacacional}%`,
    `Aguinaldo: ${parametros.diasAguinaldo}d`,
  ].join(' | ');
}
