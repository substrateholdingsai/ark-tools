/**
 * ARK LEDGER — Calculadora y Papel de Trabajo RESICO 2026
 * Tipos de datos para Personas Físicas (Art. 113-E a 113-J LISR) y Morales (Art. 206 a 215 LISR).
 */

export type TipoPersonaResico = 'fisica' | 'moral';

export type MesFiscal = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface RangoTarifaResicoPF {
  limiteInferior: number;
  limiteSuperior: number;
  tasa: number; // Porcentaje decimal (ej. 0.01 para 1.00%)
  tasaPct: number; // Porcentaje legible (ej. 1.0)
}

export interface EntradaResicoPF {
  /** Ingresos del mes efectivamente cobrados amparados por CFDI (sin IVA) */
  ingresosCobradosMes: number;

  /** Ingresos acumulados del ejercicio previos al mes actual (para control de tope 3.5M) */
  ingresosAcumuladosPrevios: number;

  /** Retención de ISR 1.25% efectuada por Personas Morales (Art. 113-J LISR) */
  retencionISREfectuadaPM: number;

  /** Si true, calcula automáticamente la retención 1.25% sobre la porción a PM */
  autoCalcularRetencionPM?: boolean;

  /** Porción de ingresos facturados a personas morales (sujeta a 1.25% retención) */
  ingresosFacturadosPM?: number;

  /** IVA trasladado efectivamente cobrado (tasa 16%) */
  ivaCobrado: number;

  /** IVA acreditable efectivamente pagado en gastos e inversiones estrictamente indispensables */
  ivaAcreditablePagado: number;

  /** Retención de IVA efectuada por Personas Morales */
  retencionIVAEfectuadaPM: number;

  /** Mes a declarar (1 a 12) */
  mes: MesFiscal;

  /** Ejercicio fiscal (ej. 2026) */
  ejercicio: number;
}

export interface EntradaResicoPM {
  /** Ingresos acumulados del ejercicio efectivamente cobrados hasta el mes de pago */
  ingresosCobradosAcumulados: number;

  /** Deducciones autorizadas acumuladas efectivamente pagadas */
  deduccionesAutorizadasAcumuladas: number;

  /** PTU pagada en el ejercicio efectivamente amortizable */
  ptuPagada: number;

  /** Pérdidas fiscales de ejercicios anteriores pendientes de amortizar */
  perdidasFiscalesPendientes: number;

  /** Pagos provisionales de ISR realizados con anterioridad en el mismo ejercicio */
  pagosProvisionalesPrevios: number;

  /** Retenciones de ISR que le hubieran efectuado (bancos, etc.) */
  retencionesISRAcumuladas: number;

  /** IVA trasladado efectivamente cobrado del mes */
  ivaCobrado: number;

  /** IVA acreditable efectivamente pagado del mes */
  ivaAcreditablePagado: number;

  /** Retenciones de IVA del mes */
  retencionIVAMes: number;

  /** Mes a declarar */
  mes: MesFiscal;

  /** Ejercicio fiscal */
  ejercicio: number;
}

export interface DesgloseImpuesto {
  concepto: string;
  base: number;
  tasaPct: number;
  importe: number;
  fundamento: string;
  naturaleza: 'a_cargo' | 'a_favor' | 'informativo' | 'deduccion';
}

export interface ResultadoResicoPF {
  tipoPersona: 'fisica';
  mes: MesFiscal;
  ejercicio: number;

  // ISR
  ingresosCobradosMes: number;
  ingresosAcumuladosTotal: number;
  tasaISRPct: number;
  isrCausado: number;
  retencionISRAcreditada: number;
  isrNetoPagar: number;

  // IVA
  ivaCobrado: number;
  ivaAcreditable: number;
  retencionIVAAcreditada: number;
  ivaNetoPagar: number; // >0 a cargo, <0 saldo a favor

  // Totales
  totalImpuestosPagar: number;
  totalEnLetras: string;

  // Control de tope 3.5M
  topeAnualLISR: number; // 3,500,000
  porcentajeConsumoTope: number; // % del tope consumido
  rebasoTope: boolean;
  alertaTope: 'seguro' | 'preventivo' | 'critico' | 'excedido';

  // Desglose para Cédula y Papel de Trabajo
  desglose: DesgloseImpuesto[];
  fundamentoLegal: string;
  advertencias: string[];
}

export interface ResultadoResicoPM {
  tipoPersona: 'moral';
  mes: MesFiscal;
  ejercicio: number;

  // ISR
  ingresosCobradosAcumulados: number;
  deduccionesAutorizadasAcumuladas: number;
  ptuPagada: number;
  perdidasFiscalesPendientes: number;
  utilidadFiscalBase: number;
  tasaISRPct: number; // 30%
  isrCausadoAcumulado: number;
  pagosProvisionalesPrevios: number;
  retencionesISRAcumuladas: number;
  isrNetoPagar: number;

  // IVA
  ivaCobrado: number;
  ivaAcreditable: number;
  retencionIVAAcreditada: number;
  ivaNetoPagar: number;

  // Totales
  totalImpuestosPagar: number;
  totalEnLetras: string;

  // Control de tope PM 35M
  topeAnualPM: number; // 35,000,000
  rebasoTope: boolean;

  // Desglose
  desglose: DesgloseImpuesto[];
  fundamentoLegal: string;
  advertencias: string[];
}

export type ResultadoResico = ResultadoResicoPF | ResultadoResicoPM;
