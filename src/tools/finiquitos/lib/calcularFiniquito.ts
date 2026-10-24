/**
 * ARK LEDGER — Motor de Cálculos de Finiquitos y Liquidaciones
 * Fundamentado en la Ley Federal del Trabajo (LFT).
 *
 * Arts. aplicables:
 * - Art. 76 (ref. Vacaciones Dignas 2023): Tabla de días de vacaciones según antigüedad.
 * - Art. 79: Vacaciones proporcionales en caso de rescisión.
 * - Art. 80: Prima vacacional no menor al 25%.
 * - Art. 87: Aguinaldo anual mínimo de 15 días o parte proporcional.
 * - Art. 162: Prima de antigüedad de 12 días por año.
 * - Art. 486: Salario tope para prima de antigüedad (doble del salario mínimo general).
 * - Art. 50: Indemnización de 90 días y 20 días por año.
 */

import { CATALOGO_2026 } from '../../../data/valores-vigentes/catalogo';
import type {
  EntradaFiniquito,
  ResultadoCalculo,
  ResultadoFiniquito,
  DesgloseConcepto,
  ErrorCalculo,
} from '../types';

/** SMG de referencia para el tope del Art. 486 LFT */
const getValor = (id: string): number => {
  const item = CATALOGO_2026.find((v) => v.id === id);
  if (!item) throw new Error(`Valor no encontrado en catálogo: ${id}`);
  return item.valor as number;
};

export const SMG_VIGENTE = getValor('SALARIO_MINIMO_GENERAL_2026');
export const TOPE_PRIMA_ANTIGUEDAD = 2 * SMG_VIGENTE;

/**
 * Tabla de vacaciones dignas (LFT Art. 76 vigente a partir de 2023).
 * Año 1: 12 días
 * Año 2: 14 días
 * Año 3: 16 días
 * Año 4: 18 días
 * Año 5: 20 días
 * Años 6 a 10: 22 días
 * Años 11 a 15: 24 días
 * Años 16 a 20: 26 días
 * Años 21 a 25: 28 días
 * Años 26 a 30: 30 días
 * Años 31 a 35: 32 días
 */
export function calcularDiasVacacionesPorLey(anioServicio: number): number {
  const anio = Math.max(1, anioServicio);
  if (anio === 1) return 12;
  if (anio === 2) return 14;
  if (anio === 3) return 16;
  if (anio === 4) return 18;
  if (anio === 5) return 20;
  if (anio <= 10) return 22;
  if (anio <= 15) return 24;
  if (anio <= 20) return 26;
  if (anio <= 25) return 28;
  if (anio <= 30) return 30;
  if (anio <= 35) return 32;
  return 32 + Math.floor((anio - 31) / 5) * 2;
}

/**
 * Parsea una fecha ISO YYYY-MM-DD en UTC a medianoche para evitar desfases de huso horario.
 */
function parsearFechaISO(iso: string): Date {
  const partes = iso.split('-').map(Number);
  const y = partes[0] ?? 2026;
  const m = partes[1] ?? 1;
  const d = partes[2] ?? 1;
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Redondeo financiero a 2 decimales.
 */
function redondear(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Valida la entrada antes de efectuar cálculos.
 */
export function validarEntradaFiniquito(entrada: EntradaFiniquito): ErrorCalculo[] {
  const errores: ErrorCalculo[] = [];

  if (!entrada.fechaIngreso || !/^\d{4}-\d{2}-\d{2}$/.test(entrada.fechaIngreso)) {
    errores.push({
      campo: 'fechaIngreso',
      mensaje: 'Fecha de ingreso inválida (formato YYYY-MM-DD).',
    });
  }

  if (!entrada.fechaBaja || !/^\d{4}-\d{2}-\d{2}$/.test(entrada.fechaBaja)) {
    errores.push({ campo: 'fechaBaja', mensaje: 'Fecha de baja inválida (formato YYYY-MM-DD).' });
  }

  if (entrada.fechaIngreso && entrada.fechaBaja) {
    const fIngreso = parsearFechaISO(entrada.fechaIngreso);
    const fBaja = parsearFechaISO(entrada.fechaBaja);
    if (fBaja.getTime() < fIngreso.getTime()) {
      errores.push({
        campo: 'fechaBaja',
        mensaje: 'La fecha de baja no puede ser anterior a la fecha de ingreso.',
      });
    }
  }

  if (
    typeof entrada.salarioDiario !== 'number' ||
    entrada.salarioDiario <= 0 ||
    isNaN(entrada.salarioDiario)
  ) {
    errores.push({ campo: 'salarioDiario', mensaje: 'El salario diario debe ser mayor a 0.' });
  }

  if (typeof entrada.sdi !== 'number' || entrada.sdi <= 0 || isNaN(entrada.sdi)) {
    errores.push({
      campo: 'sdi',
      mensaje: 'El Salario Diario Integrado (SDI) debe ser mayor a 0.',
    });
  }

  if (entrada.primaVacacionalPct < 0) {
    errores.push({
      campo: 'primaVacacionalPct',
      mensaje: 'La prima vacacional no puede ser negativa.',
    });
  }

  if (entrada.vacacionesPendientes < 0) {
    errores.push({
      campo: 'vacacionesPendientes',
      mensaje: 'Los días de vacaciones pendientes no pueden ser negativos.',
    });
  }

  if (entrada.aguinaldoPendiente < 0) {
    errores.push({
      campo: 'aguinaldoPendiente',
      mensaje: 'El aguinaldo pendiente no puede ser negativo.',
    });
  }

  return errores;
}

/**
 * Motor principal de cálculo de Finiquitos y Liquidaciones.
 */
export function calcularFiniquito(entrada: EntradaFiniquito): ResultadoCalculo {
  const errores = validarEntradaFiniquito(entrada);
  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const fIngreso = parsearFechaISO(entrada.fechaIngreso);
  const fBaja = parsearFechaISO(entrada.fechaBaja);

  // 1. Antigüedad total en días (ambos días inclusive)
  const msPorDia = 86_400_000;
  const diasAntiguedad = Math.floor((fBaja.getTime() - fIngreso.getTime()) / msPorDia) + 1;
  const aniosExactos = redondear(diasAntiguedad / 365);

  // Aniversarios cumplidos
  let aniosCompletos = fBaja.getUTCFullYear() - fIngreso.getUTCFullYear();
  const fAniversarioEsteAnio = new Date(
    Date.UTC(fBaja.getUTCFullYear(), fIngreso.getUTCMonth(), fIngreso.getUTCDate())
  );
  if (fBaja.getTime() < fAniversarioEsteAnio.getTime()) {
    aniosCompletos--;
  }
  aniosCompletos = Math.max(0, aniosCompletos);

  // Días trabajados en el año de servicio en curso (desde el último aniversario hasta la baja)
  const ultimoAniversario = new Date(
    Date.UTC(
      fIngreso.getUTCFullYear() + aniosCompletos,
      fIngreso.getUTCMonth(),
      fIngreso.getUTCDate()
    )
  );
  const diasTrabajadosAnio =
    Math.floor((fBaja.getTime() - ultimoAniversario.getTime()) / msPorDia) + 1;

  // Días trabajados en el año calendario de baja (para aguinaldo proporcional)
  const inicioAnioBaja = new Date(Date.UTC(fBaja.getUTCFullYear(), 0, 1));
  const inicioCalculoAguinaldo =
    fIngreso.getTime() > inicioAnioBaja.getTime() ? fIngreso : inicioAnioBaja;
  const diasTrabajadosAguinaldo =
    Math.floor((fBaja.getTime() - inicioCalculoAguinaldo.getTime()) / msPorDia) + 1;

  // 2. Parámetros salariales
  const salarioDiario = entrada.salarioDiario;
  const sdi = entrada.sdi;
  const salarioMensual = redondear(salarioDiario * 30.4);
  const salarioTope = redondear(Math.min(salarioDiario, TOPE_PRIMA_ANTIGUEDAD));

  // 3. Vacaciones (Art. 76 y 79 LFT)
  const anioEnCurso = aniosCompletos + 1;
  const tablaVacaciones = calcularDiasVacacionesPorLey(anioEnCurso);
  const vacacionesProporcionales = (diasTrabajadosAnio / 365) * tablaVacaciones;
  const totalVacacionesDias = vacacionesProporcionales + (entrada.vacacionesPendientes || 0);
  const importeVacaciones = redondear(totalVacacionesDias * salarioDiario);

  // 4. Prima Vacacional (Art. 80 LFT)
  const pctPrima = (entrada.primaVacacionalPct ?? 25) / 100;
  const importePrimaVacacional = redondear(importeVacaciones * pctPrima);

  // 5. Aguinaldo (Art. 87 LFT - 15 días base)
  const aguinaldoProporcionalDias = (diasTrabajadosAguinaldo / 365) * 15;
  const totalAguinaldoDias = aguinaldoProporcionalDias + (entrada.aguinaldoPendiente || 0);
  const importeAguinaldo = redondear(totalAguinaldoDias * salarioDiario);

  // 6. Prima de Antigüedad (Art. 162 y 486 LFT)
  // 12 días por cada año de servicios (proporcional por días totales)
  const diasPrimaAntiguedad = aniosExactos * 12;
  const importePrimaAntiguedadCalculado = redondear(diasPrimaAntiguedad * salarioTope);
  const importePrimaAntiguedad = entrada.incluirPrimaAntiguedad
    ? importePrimaAntiguedadCalculado
    : 0;

  // 7. Indemnización Constitucional 90 días (Art. 50 Fracc. III LFT)
  const esLiquidacion = entrada.tipoBaja === 'liquidacion';
  const importeIndem90 = esLiquidacion && entrada.incluirIndem90Dias ? redondear(90 * sdi) : 0;

  // 8. 20 días por año (Art. 50 Fracc. II LFT)
  const dias20PorAnio = aniosExactos * 20;
  const importe20dias =
    esLiquidacion && entrada.incluir20DiasAnio ? redondear(dias20PorAnio * sdi) : 0;

  // 9. Totales
  const totalFiniquito = redondear(
    importeAguinaldo + importeVacaciones + importePrimaVacacional + importePrimaAntiguedad
  );
  const totalLiquidacion = redondear(totalFiniquito + importeIndem90 + importe20dias);

  // 10. Desglose detallado
  const desglose: DesgloseConcepto[] = [
    {
      concepto: 'Aguinaldo Proporcional y Pendiente',
      formula: `${totalAguinaldoDias.toFixed(2)} días (${diasTrabajadosAguinaldo} d laborados en el año) × $${salarioDiario.toFixed(2)}`,
      dias: redondear(totalAguinaldoDias),
      importe: importeAguinaldo,
      fundamento: 'Art. 87 LFT',
    },
    {
      concepto: 'Vacaciones Proporcionales y Pendientes',
      formula: `${totalVacacionesDias.toFixed(2)} días (${tablaVacaciones} d/año s/tabla 2023) × $${salarioDiario.toFixed(2)}`,
      dias: redondear(totalVacacionesDias),
      importe: importeVacaciones,
      fundamento: 'Arts. 76 y 79 LFT',
    },
    {
      concepto: 'Prima Vacacional',
      formula: `$${importeVacaciones.toFixed(2)} de vacaciones × ${(pctPrima * 100).toFixed(0)}%`,
      importe: importePrimaVacacional,
      fundamento: 'Art. 80 LFT',
    },
    {
      concepto: 'Prima de Antigüedad (12 días/año)',
      formula: entrada.incluirPrimaAntiguedad
        ? `${diasPrimaAntiguedad.toFixed(2)} días (${aniosExactos.toFixed(2)} años) × $${salarioTope.toFixed(2)} (tope 2×SMG)`
        : 'Desactivado por configuración de baja',
      dias: redondear(diasPrimaAntiguedad),
      importe: importePrimaAntiguedad,
      fundamento: 'Arts. 162 y 486 LFT',
      deshabilitado: !entrada.incluirPrimaAntiguedad,
    },
    {
      concepto: 'Indemnización Constitucional (90 días)',
      formula:
        esLiquidacion && entrada.incluirIndem90Dias
          ? `90 días × $${sdi.toFixed(2)} (SDI)`
          : 'Solo aplica en despido injustificado (Liquidación)',
      dias: esLiquidacion && entrada.incluirIndem90Dias ? 90 : 0,
      importe: importeIndem90,
      fundamento: 'Art. 50 Fracc. III LFT / Art. 123 Const.',
      esLiquidacion: true,
      deshabilitado: !(esLiquidacion && entrada.incluirIndem90Dias),
    },
    {
      concepto: 'Indemnización de 20 días por año',
      formula:
        esLiquidacion && entrada.incluir20DiasAnio
          ? `${dias20PorAnio.toFixed(2)} días (${aniosExactos.toFixed(2)} años) × $${sdi.toFixed(2)} (SDI)`
          : 'Aplica en negativa de reinstalación patronal',
      dias: redondear(dias20PorAnio),
      importe: importe20dias,
      fundamento: 'Art. 50 Fracc. II LFT',
      esLiquidacion: true,
      deshabilitado: !(esLiquidacion && entrada.incluir20DiasAnio),
    },
  ];

  const resultado: ResultadoFiniquito = {
    diasAntiguedad,
    aniosExactos: redondear(aniosExactos),
    aniosCompletos,
    diasTrabajadosAnio,
    tablaVacaciones,
    vacacionesProporcionales: redondear(vacacionesProporcionales),
    salarioMensual,
    salarioTope,
    aguinaldoProporcionalDias: redondear(aguinaldoProporcionalDias),
    totalAguinaldoDias: redondear(totalAguinaldoDias),
    importeAguinaldo,
    totalVacacionesDias: redondear(totalVacacionesDias),
    importeVacaciones,
    importePrimaVacacional,
    importePrimaAntiguedad,
    importeIndem90,
    importe20dias,
    totalFiniquito,
    totalLiquidacion,
    desglose,
  };

  return { ok: true, valor: resultado };
}
