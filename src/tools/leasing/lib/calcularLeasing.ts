/**
 * ARK LEDGER — Motor Matemático y Fiscal de Arrendamiento Puro (Leasing) vs Crédito vs Contado
 *
 * Fundamento Legal Vigente:
 * - LISR Art. 27 Fracc. I y Art. 28 Fracc. II y XIII (Deducción de rentas y proporción deducible)
 * - LISR Art. 34 Fracc. VI, VII y VIII (Tasas máximas de depreciación anual)
 * - LISR Art. 36 Fracc. II (Topes MOI para automóviles de combustión e híbridos/eléctricos)
 * - LIVA Art. 5 Fracc. I (Acreditamiento de IVA en proporción a la deducibilidad en ISR)
 * - CFF Art. 15 y 15-A (Definición de arrendamiento financiero y opciones terminales)
 * - NIF D-5 (Arrendamientos)
 */

import {
  TOPE_MOI_AUTO_COMBUSTION,
  TOPE_MOI_AUTO_HIBRIDO,
  TOPE_RENTA_DIARIA_AUTO_COMBUSTION,
  TOPE_RENTA_DIARIA_AUTO_HIBRIDO,
  TASA_DEPRECIACION_ANUAL_AUTO,
  TASA_DEPRECIACION_ANUAL_COMPUTO,
  TASA_DEPRECIACION_ANUAL_MAQUINARIA,
  TASA_ISR_PERSONA_MORAL,
  TASA_PTU_GENERAL,
  TASA_IVA_GENERAL,
} from '@/data/valores-vigentes/catalogo';

import type {
  TipoActivoFiscal,
  ParametrosComparativaFiscal,
  DetalleMetodoAdquisicion,
  FlujoAnualComparativo,
  ResultadoComparativaFiscal,
  PresetActivoFiscal,
  MetodoAdquisicionId,
  ParametrosLeasing,
  ProyeccionMes,
  ResumenLeasing,
} from '../types';

const DIAS_PROMEDIO_MES = 365 / 12; // 30.4166667 días por mes

/**
 * Calcula una renta mensual de arrendamiento puro estimada de mercado
 * considerando el valor del activo, el valor residual y una tasa financiera implícita.
 */
export function estimarRentaLeasingSugerida(
  valorFacturaSinIva: number,
  plazoMeses: number,
  valorResidualPorcentaje: number,
  tasaAnualImplicita = 14.0
): number {
  const valor = Math.max(0, valorFacturaSinIva);
  const plazo = Math.max(12, Math.min(60, plazoMeses));
  const residual = valor * (Math.max(0, Math.min(60, valorResidualPorcentaje)) / 100);
  const tasaMensual = Math.max(0, tasaAnualImplicita) / 100 / 12;

  if (tasaMensual === 0) {
    return Math.round((valor - residual) / plazo);
  }

  const factor = Math.pow(1 + tasaMensual, plazo);
  const renta = ((valor - residual / factor) * (tasaMensual * factor)) / (factor - 1);
  return Math.round(renta);
}

export const PARAMETROS_FISCAL_DEFAULT: ParametrosComparativaFiscal = {
  tipoActivo: 'auto_combustion',
  valorFacturaSinIva: 450_000,
  plazoMeses: 36,
  engancheCreditoPorcentaje: 20,
  tasaInteresCreditoAnual: 14.5,
  comisionAperturaLeasingPorcentaje: 2,
  rentaMensualLeasingSinIva: 13_600,
  valorResidualPorcentaje: 15,
  opcionTerminal: 'compra_residual',
  tasaIsrPorcentaje: TASA_ISR_PERSONA_MORAL * 100,
  incluirPtu: true,
};

export const PRESETS_ACTIVOS_FISCALES: PresetActivoFiscal[] = [
  {
    id: 'auto_utilitario',
    nombre: 'Automóvil Utilitario (Gasolina)',
    subtitulo: '$450,000 MXN • Tope MOI $175k vs Renta $200/día',
    badge: 'Art. 36 II / 28 XIII LISR',
    parametros: {
      tipoActivo: 'auto_combustion',
      valorFacturaSinIva: 450_000,
      plazoMeses: 36,
      engancheCreditoPorcentaje: 20,
      tasaInteresCreditoAnual: 14.5,
      comisionAperturaLeasingPorcentaje: 2,
      rentaMensualLeasingSinIva: 13_600,
      valorResidualPorcentaje: 15,
      opcionTerminal: 'compra_residual',
      tasaIsrPorcentaje: 30,
      incluirPtu: true,
    },
  },
  {
    id: 'auto_hibrido_ev',
    nombre: 'Vehículo Híbrido / Eléctrico',
    subtitulo: '$850,000 MXN • Tope MOI $250k vs Renta $285/día',
    badge: 'Estímulo Ecológico LISR',
    parametros: {
      tipoActivo: 'auto_hibrido',
      valorFacturaSinIva: 850_000,
      plazoMeses: 36,
      engancheCreditoPorcentaje: 20,
      tasaInteresCreditoAnual: 13.5,
      comisionAperturaLeasingPorcentaje: 2,
      rentaMensualLeasingSinIva: 25_200,
      valorResidualPorcentaje: 15,
      opcionTerminal: 'compra_residual',
      tasaIsrPorcentaje: 30,
      incluirPtu: true,
    },
  },
  {
    id: 'equipo_computo',
    nombre: 'Servidores y Equipo de Cómputo',
    subtitulo: '$240,000 MXN • 100% Deducible en Leasing vs 30% Anual',
    badge: 'Art. 34 Fracc. VII LISR',
    parametros: {
      tipoActivo: 'equipo_computo',
      valorFacturaSinIva: 240_000,
      plazoMeses: 24,
      engancheCreditoPorcentaje: 15,
      tasaInteresCreditoAnual: 15.0,
      comisionAperturaLeasingPorcentaje: 1.5,
      rentaMensualLeasingSinIva: 10_600,
      valorResidualPorcentaje: 10,
      opcionTerminal: 'renovacion',
      tasaIsrPorcentaje: 30,
      incluirPtu: true,
    },
  },
  {
    id: 'maquinaria_industrial',
    nombre: 'Maquinaria y Equipo Industrial',
    subtitulo: '$1,500,000 MXN • Deducción en 4 años vs 10 años MOI',
    badge: 'Art. 34 Fracc. VIII LISR',
    parametros: {
      tipoActivo: 'maquinaria',
      valorFacturaSinIva: 1_500_000,
      plazoMeses: 48,
      engancheCreditoPorcentaje: 25,
      tasaInteresCreditoAnual: 13.0,
      comisionAperturaLeasingPorcentaje: 2,
      rentaMensualLeasingSinIva: 35_400,
      valorResidualPorcentaje: 15,
      opcionTerminal: 'compra_residual',
      tasaIsrPorcentaje: 30,
      incluirPtu: true,
    },
  },
];

/**
 * Obtiene los parámetros normativos LISR según el tipo de activo.
 */
export function obtenerReglasFiscalesActivo(tipoActivo: TipoActivoFiscal): {
  topeMoi: number | null;
  topeRentaDiaria: number | null;
  topeRentaMensual: number | null;
  tasaDepreciacionAnual: number;
  etiquetaActivo: string;
} {
  switch (tipoActivo) {
    case 'auto_combustion': {
      const topeRentaMensual =
        Math.round(TOPE_RENTA_DIARIA_AUTO_COMBUSTION * DIAS_PROMEDIO_MES * 100) / 100;
      return {
        topeMoi: TOPE_MOI_AUTO_COMBUSTION,
        topeRentaDiaria: TOPE_RENTA_DIARIA_AUTO_COMBUSTION,
        topeRentaMensual,
        tasaDepreciacionAnual: TASA_DEPRECIACION_ANUAL_AUTO,
        etiquetaActivo: 'Automóvil Combustión (Gasolina/Diésel)',
      };
    }
    case 'auto_hibrido': {
      const topeRentaMensual =
        Math.round(TOPE_RENTA_DIARIA_AUTO_HIBRIDO * DIAS_PROMEDIO_MES * 100) / 100;
      return {
        topeMoi: TOPE_MOI_AUTO_HIBRIDO,
        topeRentaDiaria: TOPE_RENTA_DIARIA_AUTO_HIBRIDO,
        topeRentaMensual,
        tasaDepreciacionAnual: TASA_DEPRECIACION_ANUAL_AUTO,
        etiquetaActivo: 'Automóvil Híbrido o Eléctrico (EV)',
      };
    }
    case 'equipo_computo':
      return {
        topeMoi: null,
        topeRentaDiaria: null,
        topeRentaMensual: null,
        tasaDepreciacionAnual: TASA_DEPRECIACION_ANUAL_COMPUTO,
        etiquetaActivo: 'Equipo de Cómputo y Servidores TI',
      };
    case 'maquinaria':
      return {
        topeMoi: null,
        topeRentaDiaria: null,
        topeRentaMensual: null,
        tasaDepreciacionAnual: TASA_DEPRECIACION_ANUAL_MAQUINARIA,
        etiquetaActivo: 'Maquinaria y Equipo Industrial',
      };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Ejecuta la comparativa financiera y fiscal entre Contado, Crédito Bancario y Arrendamiento Puro.
 */
export function compararLeasingFiscal(
  params: ParametrosComparativaFiscal
): ResultadoComparativaFiscal {
  const valorActivo = Math.max(1, params.valorFacturaSinIva);
  const plazo = Math.max(12, Math.min(60, Math.round(params.plazoMeses)));
  const tasaIsr = Math.max(0, Math.min(45, params.tasaIsrPorcentaje)) / 100;
  const tasaPtu = params.incluirPtu ? TASA_PTU_GENERAL : 0;
  const tasaFiscalCombinada = tasaIsr + tasaPtu;

  const reglas = obtenerReglasFiscalesActivo(params.tipoActivo);
  const { topeMoi, topeRentaDiaria, topeRentaMensual, tasaDepreciacionAnual } = reglas;

  // MOI deducible en adquisición (Contado o Crédito)
  const moiDeducible = topeMoi !== null ? Math.min(valorActivo, topeMoi) : valorActivo;
  const proporcionDeducibleCompra = Math.min(1, moiDeducible / valorActivo);

  // Depreciación mensual LISR
  const depreciacionMensual = (moiDeducible * tasaDepreciacionAnual) / 12;
  const mesesMaxDepreciacion = Math.round((1 / tasaDepreciacionAnual) * 12);
  const mesesEfectivosDepEnPlazo = Math.min(plazo, mesesMaxDepreciacion);
  const deduccionDepreciacionPlazo = round2(
    Math.min(moiDeducible, depreciacionMensual * mesesEfectivosDepEnPlazo)
  );

  // ─────────────────────────────────────────────────────────────────────
  // 1. COMPRA DE CONTADO
  // ─────────────────────────────────────────────────────────────────────
  const ivaContadoTotal = round2(valorActivo * TASA_IVA_GENERAL);
  const ivaContadoAcreditable = round2(ivaContadoTotal * proporcionDeducibleCompra);
  const ivaContadoNoAcreditable = round2(ivaContadoTotal - ivaContadoAcreditable);
  const totalErogadoContadoSinIva = round2(valorActivo + ivaContadoNoAcreditable);

  const ahorroIsrContado = round2(deduccionDepreciacionPlazo * tasaIsr);
  const ahorroPtuContado = round2(deduccionDepreciacionPlazo * tasaPtu);
  const ahorroFiscalContado = round2(ahorroIsrContado + ahorroPtuContado);
  const costoNetoContado = round2(totalErogadoContadoSinIva - ahorroFiscalContado);

  const contado: DetalleMetodoAdquisicion = {
    metodo: 'contado',
    etiqueta: 'Compra de Contado',
    desembolsoInicialSinIva: valorActivo,
    ivaInicialAcreditable: ivaContadoAcreditable,
    pagoMensualPromedioSinIva: 0,
    ivaMensualPromedio: 0,
    pagoTerminalSinIva: 0,
    totalErogadoSinIva: totalErogadoContadoSinIva,
    totalIvaAcreditable: ivaContadoAcreditable,
    totalDesembolsoConIva: round2(valorActivo + ivaContadoTotal),
    deduccionFiscalTotalPlazo: deduccionDepreciacionPlazo,
    proporcionDeduciblePorcentaje: round2(proporcionDeducibleCompra * 100),
    ahorroIsrPlazo: ahorroIsrContado,
    ahorroPtuPlazo: ahorroPtuContado,
    ahorroFiscalTotal: ahorroFiscalContado,
    costoNetoDespuesImpuestos: costoNetoContado,
    fundamentoLegal:
      topeMoi !== null
        ? 'LISR Art. 34 Fracc. VI y Art. 36 Fracc. II (Tope MOI Automóviles)'
        : 'LISR Art. 31 y Art. 34 (Deducción de Inversiones)',
    notasFiscales: [
      `MOI deducible: ${formatearMXN(moiDeducible)} (${round2(proporcionDeducibleCompra * 100)}% del valor factura).`,
      `Depreciación anual del ${round2(tasaDepreciacionAnual * 100)}% (${formatearMXN(depreciacionMensual * 12)}/año).`,
      ivaContadoNoAcreditable > 0
        ? `IVA no acreditable por tope LIVA Art. 5 Fracc. I: ${formatearMXN(ivaContadoNoAcreditable)}.`
        : 'IVA 100% acreditable en el mes de adquisición.',
    ],
  };

  // ─────────────────────────────────────────────────────────────────────
  // 2. CRÉDITO BANCARIO TRADICIONAL
  // ─────────────────────────────────────────────────────────────────────
  const pctEnganche = Math.max(0, Math.min(90, params.engancheCreditoPorcentaje)) / 100;
  const engancheSinIva = round2(valorActivo * pctEnganche);
  const montoFinanciado = round2(valorActivo - engancheSinIva);
  const tasaMensualCredito = Math.max(0, params.tasaInteresCreditoAnual) / 100 / 12;

  let pagoMensualCreditoSinIva = 0;
  if (montoFinanciado > 0) {
    if (tasaMensualCredito > 0) {
      const factor = Math.pow(1 + tasaMensualCredito, plazo);
      pagoMensualCreditoSinIva = round2(
        (montoFinanciado * (tasaMensualCredito * factor)) / (factor - 1)
      );
    } else {
      pagoMensualCreditoSinIva = round2(montoFinanciado / plazo);
    }
  }

  const totalPagosMensualesCredito = round2(pagoMensualCreditoSinIva * plazo);
  const interesesTotalesCredito = round2(Math.max(0, totalPagosMensualesCredito - montoFinanciado));
  const interesesDeduciblesCredito = round2(interesesTotalesCredito * proporcionDeducibleCompra);
  const deduccionTotalCredito = round2(deduccionDepreciacionPlazo + interesesDeduciblesCredito);

  const ivaCreditoTotal = round2((valorActivo + interesesTotalesCredito) * TASA_IVA_GENERAL);
  const ivaCreditoAcreditable = round2(ivaCreditoTotal * proporcionDeducibleCompra);
  const ivaCreditoNoAcreditable = round2(ivaCreditoTotal - ivaCreditoAcreditable);
  const totalErogadoCreditoSinIva = round2(
    valorActivo + interesesTotalesCredito + ivaCreditoNoAcreditable
  );

  const ahorroIsrCredito = round2(deduccionTotalCredito * tasaIsr);
  const ahorroPtuCredito = round2(deduccionTotalCredito * tasaPtu);
  const ahorroFiscalCredito = round2(ahorroIsrCredito + ahorroPtuCredito);
  const costoNetoCredito = round2(totalErogadoCreditoSinIva - ahorroFiscalCredito);

  const credito: DetalleMetodoAdquisicion = {
    metodo: 'credito',
    etiqueta: 'Crédito Bancario',
    desembolsoInicialSinIva: engancheSinIva,
    ivaInicialAcreditable: round2(engancheSinIva * TASA_IVA_GENERAL * proporcionDeducibleCompra),
    pagoMensualPromedioSinIva: pagoMensualCreditoSinIva,
    ivaMensualPromedio: round2(pagoMensualCreditoSinIva * TASA_IVA_GENERAL),
    pagoTerminalSinIva: 0,
    totalErogadoSinIva: totalErogadoCreditoSinIva,
    totalIvaAcreditable: ivaCreditoAcreditable,
    totalDesembolsoConIva: round2(valorActivo + interesesTotalesCredito + ivaCreditoTotal),
    deduccionFiscalTotalPlazo: deduccionTotalCredito,
    proporcionDeduciblePorcentaje: round2(proporcionDeducibleCompra * 100),
    ahorroIsrPlazo: ahorroIsrCredito,
    ahorroPtuPlazo: ahorroPtuCredito,
    ahorroFiscalTotal: ahorroFiscalCredito,
    costoNetoDespuesImpuestos: costoNetoCredito,
    fundamentoLegal:
      'LISR Art. 28 Fracc. II y Art. 36 Fracc. II (Depreciación + Intereses en proporción)',
    notasFiscales: [
      `Intereses totales devengados: ${formatearMXN(interesesTotalesCredito)} (${formatearMXN(interesesDeduciblesCredito)} deducibles).`,
      `Deducción combinada (Depreciación + Intereses): ${formatearMXN(deduccionTotalCredito)}.`,
      `Registra pasivo bancario en balance general afectando razones de apalancamiento.`,
    ],
  };

  // ─────────────────────────────────────────────────────────────────────
  // 3. ARRENDAMIENTO PURO (LEASING)
  // ─────────────────────────────────────────────────────────────────────
  const pctComisionLeasing =
    Math.max(0, Math.min(20, params.comisionAperturaLeasingPorcentaje)) / 100;
  const comisionAperturaSinIva = round2(valorActivo * pctComisionLeasing);
  const rentaMensualSinIva = Math.max(0, params.rentaMensualLeasingSinIva);

  const rentaMensualDeducible =
    topeRentaMensual !== null ? Math.min(rentaMensualSinIva, topeRentaMensual) : rentaMensualSinIva;
  const proporcionRentaDeducible =
    rentaMensualSinIva > 0 ? Math.min(1, rentaMensualDeducible / rentaMensualSinIva) : 1;

  const pagoTerminalLeasingSinIva =
    params.opcionTerminal === 'compra_residual'
      ? round2(valorActivo * (Math.max(0, Math.min(60, params.valorResidualPorcentaje)) / 100))
      : 0;

  // Deducción de rentas mensuales + comisión inicial + depreciación proporcional si compra residual
  const deduccionRentasPlazo = round2(rentaMensualDeducible * plazo);
  const deduccionComisionInicial = round2(comisionAperturaSinIva * proporcionRentaDeducible);
  const deduccionResidualCompra =
    pagoTerminalLeasingSinIva > 0
      ? round2(Math.min(pagoTerminalLeasingSinIva, moiDeducible) * tasaDepreciacionAnual)
      : 0;
  const deduccionTotalLeasing = round2(
    deduccionRentasPlazo + deduccionComisionInicial + deduccionResidualCompra
  );

  const subtotalRentasYComision = round2(rentaMensualSinIva * plazo + comisionAperturaSinIva);
  const ivaRentasTotal = round2(subtotalRentasYComision * TASA_IVA_GENERAL);
  const ivaRentasAcreditable = round2(ivaRentasTotal * proporcionRentaDeducible);

  const ivaTerminalTotal = round2(pagoTerminalLeasingSinIva * TASA_IVA_GENERAL);
  const ivaTerminalAcreditable = round2(ivaTerminalTotal * proporcionDeducibleCompra);

  const totalIvaLeasing = round2(ivaRentasTotal + ivaTerminalTotal);
  const totalIvaLeasingAcreditable = round2(ivaRentasAcreditable + ivaTerminalAcreditable);
  const ivaLeasingNoAcreditable = round2(totalIvaLeasing - totalIvaLeasingAcreditable);

  const totalErogadoLeasingSinIva = round2(
    subtotalRentasYComision + pagoTerminalLeasingSinIva + ivaLeasingNoAcreditable
  );

  const ahorroIsrLeasing = round2(deduccionTotalLeasing * tasaIsr);
  const ahorroPtuLeasing = round2(deduccionTotalLeasing * tasaPtu);
  const ahorroFiscalLeasing = round2(ahorroIsrLeasing + ahorroPtuLeasing);
  const costoNetoLeasing = round2(totalErogadoLeasingSinIva - ahorroFiscalLeasing);

  const leasing: DetalleMetodoAdquisicion = {
    metodo: 'leasing',
    etiqueta: 'Arrendamiento Puro (Leasing)',
    desembolsoInicialSinIva: comisionAperturaSinIva,
    ivaInicialAcreditable: round2(
      comisionAperturaSinIva * TASA_IVA_GENERAL * proporcionRentaDeducible
    ),
    pagoMensualPromedioSinIva: rentaMensualSinIva,
    ivaMensualPromedio: round2(rentaMensualSinIva * TASA_IVA_GENERAL),
    pagoTerminalSinIva: pagoTerminalLeasingSinIva,
    totalErogadoSinIva: totalErogadoLeasingSinIva,
    totalIvaAcreditable: totalIvaLeasingAcreditable,
    totalDesembolsoConIva: round2(
      subtotalRentasYComision + pagoTerminalLeasingSinIva + totalIvaLeasing
    ),
    deduccionFiscalTotalPlazo: deduccionTotalLeasing,
    proporcionDeduciblePorcentaje: round2(proporcionRentaDeducible * 100),
    ahorroIsrPlazo: ahorroIsrLeasing,
    ahorroPtuPlazo: ahorroPtuLeasing,
    ahorroFiscalTotal: ahorroFiscalLeasing,
    costoNetoDespuesImpuestos: costoNetoLeasing,
    fundamentoLegal:
      topeRentaDiaria !== null
        ? `LISR Art. 28 Fracc. XIII (Tope $${topeRentaDiaria}/día) y CFF Art. 15`
        : 'LISR Art. 27 Fracc. I (Gasto estricto 100% deducible) y NIF D-5',
    notasFiscales: [
      topeRentaDiaria !== null
        ? `Renta deducible hasta $${topeRentaDiaria} MXN/día (${formatearMXN(topeRentaMensual!)}/mes = ${formatearMXN(rentaMensualDeducible * 12)}/año).`
        : `100% de la renta mensual (${formatearMXN(rentaMensualSinIva)}/mes) es deducible como gasto operativo.`,
      `Desembolso inicial mínimo (${formatearMXN(comisionAperturaSinIva)}), preservando capital de trabajo.`,
      params.opcionTerminal === 'compra_residual'
        ? `Opción de compra terminal al mes ${plazo} por ${formatearMXN(pagoTerminalLeasingSinIva)} (${params.valorResidualPorcentaje}%).`
        : params.opcionTerminal === 'renovacion'
          ? 'Renovación tecnológica/flotilla al término del contrato sin carga de obsolescencia.'
          : 'Devolución pura del bien al finalizar el contrato.',
    ],
  };

  // ─────────────────────────────────────────────────────────────────────
  // 4. PROYECCIÓN DE FLUJOS ANUALES
  // ─────────────────────────────────────────────────────────────────────
  const numAnios = Math.ceil(plazo / 12);
  const flujoAnual: FlujoAnualComparativo[] = [];

  for (let a = 1; a <= numAnios; a++) {
    const mesInicio = (a - 1) * 12 + 1;
    const mesFin = Math.min(plazo, a * 12);
    const mesesEnAnio = mesFin - mesInicio + 1;

    // Contado en el año
    const contadoDesembolso = a === 1 ? totalErogadoContadoSinIva : 0;
    const mesesDepAnio = Math.max(
      0,
      Math.min(mesFin, mesesMaxDepreciacion) - Math.min(mesInicio - 1, mesesMaxDepreciacion)
    );
    const contadoDeduccion = round2(depreciacionMensual * mesesDepAnio);
    const contadoAhorroFiscal = round2(contadoDeduccion * tasaFiscalCombinada);
    const contadoFlujoNeto = round2(contadoDesembolso - contadoAhorroFiscal);

    // Crédito en el año
    const creditoDesembolsoBase =
      (a === 1 ? engancheSinIva : 0) + pagoMensualCreditoSinIva * mesesEnAnio;
    const creditoDesembolso = round2(
      creditoDesembolsoBase + (ivaCreditoNoAcreditable / plazo) * mesesEnAnio
    );
    const interesAnualPromedio = (interesesDeduciblesCredito / plazo) * mesesEnAnio;
    const creditoDeduccion = round2(contadoDeduccion + interesAnualPromedio);
    const creditoAhorroFiscal = round2(creditoDeduccion * tasaFiscalCombinada);
    const creditoFlujoNeto = round2(creditoDesembolso - creditoAhorroFiscal);

    // Leasing en el año
    const esUltimoAnio = a === numAnios;
    const leasingDesembolsoBase =
      (a === 1 ? comisionAperturaSinIva : 0) +
      rentaMensualSinIva * mesesEnAnio +
      (esUltimoAnio ? pagoTerminalLeasingSinIva : 0);
    const leasingDesembolso = round2(
      leasingDesembolsoBase + (ivaLeasingNoAcreditable / plazo) * mesesEnAnio
    );
    const leasingDeduccion = round2(
      (a === 1 ? deduccionComisionInicial : 0) +
        rentaMensualDeducible * mesesEnAnio +
        (esUltimoAnio ? deduccionResidualCompra : 0)
    );
    const leasingAhorroFiscal = round2(leasingDeduccion * tasaFiscalCombinada);
    const leasingFlujoNeto = round2(leasingDesembolso - leasingAhorroFiscal);

    flujoAnual.push({
      anio: a,
      mesesEnAnio,
      contadoDesembolso,
      contadoDeduccion,
      contadoAhorroFiscal,
      contadoFlujoNeto,
      creditoDesembolso,
      creditoDeduccion,
      creditoAhorroFiscal,
      creditoFlujoNeto,
      leasingDesembolso,
      leasingDeduccion,
      leasingAhorroFiscal,
      leasingFlujoNeto,
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // 5. EVALUACIÓN DE GANADORES Y DICTAMEN PERICIAL
  // ─────────────────────────────────────────────────────────────────────
  const metodos: DetalleMetodoAdquisicion[] = [contado, credito, leasing];

  const ordenadoPorCosto = [...metodos].sort(
    (a, b) => a.costoNetoDespuesImpuestos - b.costoNetoDespuesImpuestos
  );
  const ordenadoPorDeduccion = [...metodos].sort(
    (a, b) => b.deduccionFiscalTotalPlazo - a.deduccionFiscalTotalPlazo
  );
  const ordenadoPorLiquidez = [...metodos].sort(
    (a, b) => a.desembolsoInicialSinIva - b.desembolsoInicialSinIva
  );

  const mejorOpcionCostoNeto: MetodoAdquisicionId = ordenadoPorCosto[0]!.metodo;
  const mejorOpcionDeduccion: MetodoAdquisicionId = ordenadoPorDeduccion[0]!.metodo;
  const mejorOpcionLiquidezInicial: MetodoAdquisicionId = ordenadoPorLiquidez[0]!.metodo;

  const ventajaFiscalLeasingVsContado = round2(
    leasing.ahorroFiscalTotal - contado.ahorroFiscalTotal
  );
  const ahorroCostoNetoMejorVsPeor = round2(
    ordenadoPorCosto[ordenadoPorCosto.length - 1]!.costoNetoDespuesImpuestos -
      ordenadoPorCosto[0]!.costoNetoDespuesImpuestos
  );

  let dictamenPericial = '';
  if (ventajaFiscalLeasingVsContado > 0) {
    dictamenPericial = `El Arrendamiento Puro (Leasing) genera ${formatearMXN(ventajaFiscalLeasingVsContado)} adicionales en escudo fiscal (ISR${params.incluirPtu ? ' + PTU' : ''}) frente a la compra de contado durante los ${plazo} meses, deduciendo un total de ${formatearMXN(leasing.deduccionFiscalTotalPlazo)} frente a ${formatearMXN(contado.deduccionFiscalTotalPlazo)} por depreciación tradicional, además de preservar ${formatearMXN(contado.desembolsoInicialSinIva - leasing.desembolsoInicialSinIva)} de liquidez inmediata el día 1.`;
  } else {
    dictamenPericial = `Para este escenario, la ${ordenadoPorCosto[0]!.etiqueta} presenta el menor costo financiero neto después de impuestos (${formatearMXN(ordenadoPorCosto[0]!.costoNetoDespuesImpuestos)}), mientras que el Arrendamiento Puro conserva la ventaja de liquidez inicial requiriendo solo ${formatearMXN(leasing.desembolsoInicialSinIva)} de desembolso de apertura.`;
  }

  return {
    parametros: params,
    topeMoiAplicable: topeMoi,
    topeRentaDiariaAplicable: topeRentaDiaria,
    topeRentaMensualAplicable: topeRentaMensual,
    tasaDepreciacionAnual,
    contado,
    credito,
    leasing,
    flujoAnual,
    mejorOpcionCostoNeto,
    mejorOpcionDeduccion,
    mejorOpcionLiquidezInicial,
    ventajaFiscalLeasingVsContado,
    ahorroCostoNetoMejorVsPeor,
    dictamenPericial,
  };
}

/**
 * Formateador de moneda en pesos mexicanos
 */
export function formatearMXN(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

// ─── Compatibilidad hacia atrás para conectores internos (StayPuft) ──────
export const PARAMETROS_DEFAULT: ParametrosLeasing = {
  clientesIniciales: 5,
  clientesNuevosPorMes: 3,
  tasaChurnPorcentaje: 3,
  setupFee: 500,
  rentaMensual: 2500,
  costoDirectoPorCliente: 200,
  plazoMeses: 12,
};

export const PRESETS_MODELO = [
  {
    nombre: 'Despacho Inicial',
    descripcion: 'Punto de partida: 2 clientes, 2 nuevos/mes',
    parametros: {
      clientesIniciales: 2,
      clientesNuevosPorMes: 2,
      tasaChurnPorcentaje: 2,
      setupFee: 500,
      rentaMensual: 2500,
      costoDirectoPorCliente: 200,
      plazoMeses: 12,
    },
  },
  {
    nombre: 'Modelo Recomendado ($500 → $2,500)',
    descripcion: '5 iniciales, 3 nuevos/mes, setup accesible',
    parametros: { ...PARAMETROS_DEFAULT },
  },
];

export function proyectarMeses(parametros: ParametrosLeasing): ProyeccionMes[] {
  const meses: ProyeccionMes[] = [];
  let clientesActuales = Math.max(0, parametros.clientesIniciales);
  let ingresoAcumulado = 0;
  let utilidadAcumulada = 0;
  const plazo = Math.max(1, Math.min(36, parametros.plazoMeses));

  for (let m = 1; m <= plazo; m++) {
    const clientesInicio = clientesActuales;
    const clientesNuevos = Math.max(0, parametros.clientesNuevosPorMes);
    const baseAntesDeChurn = clientesInicio + clientesNuevos;
    const churnDecimal = Math.max(0, Math.min(100, parametros.tasaChurnPorcentaje)) / 100;
    const clientesPerdidos = Math.round(baseAntesDeChurn * churnDecimal);
    const clientesFin = Math.max(0, baseAntesDeChurn - clientesPerdidos);

    const ingresosSetup = clientesNuevos * Math.max(0, parametros.setupFee);
    const ingresosRentas = clientesFin * Math.max(0, parametros.rentaMensual);
    const ingresoTotalMes = ingresosSetup + ingresosRentas;
    const costosDirectos = clientesFin * Math.max(0, parametros.costoDirectoPorCliente);
    const utilidadMes = ingresoTotalMes - costosDirectos;

    ingresoAcumulado += ingresoTotalMes;
    utilidadAcumulada += utilidadMes;

    meses.push({
      mes: m,
      clientesInicio,
      clientesNuevos,
      clientesPerdidos,
      clientesFin,
      ingresosSetup,
      ingresosRentas,
      ingresoTotalMes,
      costosDirectos,
      utilidadMes,
      ingresoAcumulado,
      utilidadAcumulada,
    });
    clientesActuales = clientesFin;
  }

  return meses;
}

export function calcularResumenLeasing(
  parametros: ParametrosLeasing,
  proyeccion: ProyeccionMes[]
): ResumenLeasing {
  if (proyeccion.length === 0) {
    return {
      mrrFinal: 0,
      arrProyectado: 0,
      clientesFinales: 0,
      totalSetupAcumulado: 0,
      totalRentasAcumulado: 0,
      ingresoBrutoTotal: 0,
      utilidadTotalAcumulada: 0,
      margenPromedioPorcentaje: 0,
      ltvEstimado: 0,
      mesesRetencionPromedio: 0,
    };
  }

  const ultimoMes = proyeccion[proyeccion.length - 1];
  const clientesFinales = ultimoMes ? ultimoMes.clientesFin : 0;
  const mrrFinal = clientesFinales * parametros.rentaMensual;
  const arrProyectado = mrrFinal * 12;

  let totalSetup = 0;
  let totalRentas = 0;
  let ingresoTotal = 0;
  let utilidadTotal = 0;

  for (const m of proyeccion) {
    totalSetup += m.ingresosSetup;
    totalRentas += m.ingresosRentas;
    ingresoTotal += m.ingresoTotalMes;
    utilidadTotal += m.utilidadMes;
  }

  const margenPromedio = ingresoTotal > 0 ? (utilidadTotal / ingresoTotal) * 100 : 0;
  const churnDecimal = parametros.tasaChurnPorcentaje / 100;
  const mesesRetencion = churnDecimal > 0 ? Math.min(60, Math.round(1 / churnDecimal)) : 36;
  const margenUnitarioMensual = Math.max(
    0,
    parametros.rentaMensual - parametros.costoDirectoPorCliente
  );
  const ltvEstimado = Math.round(parametros.setupFee + margenUnitarioMensual * mesesRetencion);

  return {
    mrrFinal,
    arrProyectado,
    clientesFinales,
    totalSetupAcumulado: totalSetup,
    totalRentasAcumulado: totalRentas,
    ingresoBrutoTotal: ingresoTotal,
    utilidadTotalAcumulada: utilidadTotal,
    margenPromedioPorcentaje: Math.round(margenPromedio * 10) / 10,
    ltvEstimado,
    mesesRetencionPromedio: mesesRetencion,
  };
}
