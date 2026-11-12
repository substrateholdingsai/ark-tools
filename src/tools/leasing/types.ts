/**
 * ARK LEDGER — Simulador Fiscal: Arrendamiento Puro (Leasing) vs Crédito vs Contado
 * Fundamento: LISR Arts. 27, 28 Fracc. XIII, 34, 36 Fracc. II | CFF Arts. 15 y 15-A | NIF D-5
 */

export type TipoActivoFiscal = 'auto_combustion' | 'auto_hibrido' | 'equipo_computo' | 'maquinaria';

export type OpcionTerminalCFF = 'compra_residual' | 'renovacion' | 'devolucion';

export type MetodoAdquisicionId = 'contado' | 'credito' | 'leasing';

export interface ParametrosComparativaFiscal {
  /** Clasificación fiscal del bien conforme a LISR Arts. 34 y 36 */
  tipoActivo: TipoActivoFiscal;
  /** Valor de factura del activo sin IVA (MOI base en MXN) */
  valorFacturaSinIva: number;
  /** Plazo del contrato o financiamiento en meses (12, 24, 36, 48, 60) */
  plazoMeses: number;
  /** Porcentaje de enganche en crédito bancario tradicional (0 - 90%) */
  engancheCreditoPorcentaje: number;
  /** Tasa de interés nominal anual del crédito bancario (%) */
  tasaInteresCreditoAnual: number;
  /** Comisión de apertura o pago inicial del arrendamiento puro (%) */
  comisionAperturaLeasingPorcentaje: number;
  /** Renta mensual de arrendamiento puro antes de IVA (MXN) */
  rentaMensualLeasingSinIva: number;
  /** Valor residual como porcentaje del valor factura para opción de compra (Art. 15 CFF) */
  valorResidualPorcentaje: number;
  /** Destino del bien al finalizar el contrato de leasing */
  opcionTerminal: OpcionTerminalCFF;
  /** Tasa efectiva de ISR del contribuyente (30% PM, hasta 35% PF) */
  tasaIsrPorcentaje: number;
  /** Incluir efecto de ahorro en PTU (10% LFT Art. 117) */
  incluirPtu: boolean;
}

export interface DetalleMetodoAdquisicion {
  metodo: MetodoAdquisicionId;
  etiqueta: string;
  desembolsoInicialSinIva: number;
  ivaInicialAcreditable: number;
  pagoMensualPromedioSinIva: number;
  ivaMensualPromedio: number;
  pagoTerminalSinIva: number;
  totalErogadoSinIva: number;
  totalIvaAcreditable: number;
  totalDesembolsoConIva: number;
  deduccionFiscalTotalPlazo: number;
  proporcionDeduciblePorcentaje: number;
  ahorroIsrPlazo: number;
  ahorroPtuPlazo: number;
  ahorroFiscalTotal: number;
  costoNetoDespuesImpuestos: number;
  fundamentoLegal: string;
  notasFiscales: string[];
}

export interface FlujoAnualComparativo {
  anio: number;
  mesesEnAnio: number;
  contadoDesembolso: number;
  contadoDeduccion: number;
  contadoAhorroFiscal: number;
  contadoFlujoNeto: number;
  creditoDesembolso: number;
  creditoDeduccion: number;
  creditoAhorroFiscal: number;
  creditoFlujoNeto: number;
  leasingDesembolso: number;
  leasingDeduccion: number;
  leasingAhorroFiscal: number;
  leasingFlujoNeto: number;
}

export interface ResultadoComparativaFiscal {
  parametros: ParametrosComparativaFiscal;
  topeMoiAplicable: number | null;
  topeRentaDiariaAplicable: number | null;
  topeRentaMensualAplicable: number | null;
  tasaDepreciacionAnual: number;
  contado: DetalleMetodoAdquisicion;
  credito: DetalleMetodoAdquisicion;
  leasing: DetalleMetodoAdquisicion;
  flujoAnual: FlujoAnualComparativo[];
  mejorOpcionCostoNeto: MetodoAdquisicionId;
  mejorOpcionDeduccion: MetodoAdquisicionId;
  mejorOpcionLiquidezInicial: MetodoAdquisicionId;
  ventajaFiscalLeasingVsContado: number;
  ahorroCostoNetoMejorVsPeor: number;
  dictamenPericial: string;
}

export interface PresetActivoFiscal {
  id: string;
  nombre: string;
  subtitulo: string;
  badge: string;
  parametros: ParametrosComparativaFiscal;
}

// ─── Tipos de compatibilidad hacia atrás (StayPuft / conectores legacy) ─
export interface ParametrosLeasing {
  clientesIniciales: number;
  clientesNuevosPorMes: number;
  tasaChurnPorcentaje: number;
  setupFee: number;
  rentaMensual: number;
  costoDirectoPorCliente: number;
  plazoMeses: number;
}

export interface ProyeccionMes {
  mes: number;
  clientesInicio: number;
  clientesNuevos: number;
  clientesPerdidos: number;
  clientesFin: number;
  ingresosSetup: number;
  ingresosRentas: number;
  ingresoTotalMes: number;
  costosDirectos: number;
  utilidadMes: number;
  ingresoAcumulado: number;
  utilidadAcumulada: number;
}

export interface ResumenLeasing {
  mrrFinal: number;
  arrProyectado: number;
  clientesFinales: number;
  totalSetupAcumulado: number;
  totalRentasAcumulado: number;
  ingresoBrutoTotal: number;
  utilidadTotalAcumulada: number;
  margenPromedioPorcentaje: number;
  ltvEstimado: number;
  mesesRetencionPromedio: number;
}
