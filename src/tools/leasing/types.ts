/**
 * ARK LEDGER — Calculadora de Leasing y MRR para Despachos Contables
 * Modelo de negocio: $500 Setup → $2,500 Renta Recurrente Mensual
 */

export interface ParametrosLeasing {
  /** Clientes activos al inicio de la proyección */
  clientesIniciales: number;
  /** Nuevos clientes captados cada mes */
  clientesNuevosPorMes: number;
  /** Porcentaje de cancelación o rotación mensual (Churn Rate %) */
  tasaChurnPorcentaje: number;
  /** Cobro único de activación / onboarding por cliente ($ MXN) */
  setupFee: number;
  /** Renta mensual recurrente por cliente ($ MXN) */
  rentaMensual: number;
  /** Costo directo de servidores o licenciamiento por cliente ($ MXN) */
  costoDirectoPorCliente: number;
  /** Horizonte de proyección en meses (ej. 12, 24, 36) */
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
  /** MRR (Monthly Recurring Revenue) al final del período */
  mrrFinal: number;
  /** ARR (Annual Recurring Revenue) proyectado con el MRR final */
  arrProyectado: number;
  /** Total de clientes activos al final del período */
  clientesFinales: number;
  /** Suma acumulada de ingresos por concepto de Setup */
  totalSetupAcumulado: number;
  /** Suma acumulada de ingresos por concepto de Rentas mensuales */
  totalRentasAcumulado: number;
  /** Ingreso bruto total en el período */
  ingresoBrutoTotal: number;
  /** Utilidad neta acumulada en el período */
  utilidadTotalAcumulada: number;
  /** Margen promedio de utilidad bruta % */
  margenPromedioPorcentaje: number;
  /** LTV (Lifetime Value estimado por cliente en MXN) */
  ltvEstimado: number;
  /** Meses promedio de vida del cliente */
  mesesRetencionPromedio: number;
}
