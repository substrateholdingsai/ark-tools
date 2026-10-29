/**
 * ARK LEDGER — Cierre de Nómina Masivo & Cédula Concentradora (Sprint 11)
 * Tipos TypeScript
 *
 * Fundamento legal:
 * - LISR Art. 96: Retención mensual/quincenal de ISR
 * - DOF 2026: Subsidio para el empleo
 * - LSS Art. 27 y 28: Integración del SBC y Topes (25 UMA)
 * - LFT Art. 76: Vacaciones dignas por antigüedad
 * - Códigos Financieros y Fiscales Estatales: Impuesto Sobre Nóminas (ISN)
 * - CFF Art. 28: Integridad del papel de trabajo contable
 */

import type { Periodo } from '../nomina/types';

/**
 * Fila de entrada de trabajador importada desde CSV / Excel o cargada manualmente.
 */
export interface TrabajadorFilaInput {
  id?: string;
  nombre: string;
  rfc?: string;
  curp?: string;
  nss?: string;
  salarioDiario: number;
  fechaIngreso?: string; // YYYY-MM-DD
  diasTrabajados?: number;
  horasExtras?: number;
  bonos?: number;
  otrasPercepciones?: number;
  otrasDeducciones?: number;
}

/**
 * Parámetros globales de la corrida de cierre de nómina.
 */
export interface ParametrosCierreNomina {
  periodo: Periodo;
  diasPeriodo: number; // 7, 15, 30.4
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string; // YYYY-MM-DD
  fechaCorte: string; // Fecha de cálculo de antigüedad
  empresaNombre: string;
  empresaRfc?: string;
  estadoIsnId: string; // e.g. 'cdmx', 'nl', 'jal'
  estadoIsnNombre: string;
  tasaIsn: number;
  diasAguinaldo?: number; // default 15
  primaVacacionalPct?: number; // default 25
}

/**
 * Resultado individual calculado para un trabajador en el lote.
 */
export interface ResultadoTrabajadorNomina {
  id: string;
  numeroLista: number;
  nombre: string;
  rfc: string;
  curp: string;
  nss: string;
  fechaIngreso: string;
  antiguedadAnios: number;
  diasVacacionesLey: number;
  factorIntegracion: number;
  salarioDiario: number;
  sbcDiario: number;
  diasTrabajados: number;

  // Percepciones
  sueldoOrdinario: number;
  percepcionesAdicionales: number;
  totalPercepciones: number;

  // Deducciones
  baseGravableISR: number;
  isrAntesSubsidio: number;
  subsidioEmpleo: number;
  isrRetenido: number;
  imssObrero: number;
  otrasDeducciones: number;
  totalDeducciones: number;

  // Neto y Cargas
  sueldoNeto: number;
  isnEstatal: number;
}

/**
 * Totales acumulados y resumen ejecutivo del lote completo.
 */
export interface ResumenCierreNomina {
  totalTrabajadores: number;
  totalPercepcionesBrutas: number;
  totalISRRetenido: number;
  totalSubsidioEntregado: number;
  totalIMSSObrero: number;
  totalOtrasDeducciones: number;
  totalDeducciones: number;
  totalNetoDispersar: number;
  totalISNEstatal: number;
  importeNetoEnLetras: string;
  fechaEmision: string;
  catalogVersion: string;
  hashLote: string;
}

/**
 * Paquete completo del Cierre de Nómina (para expediente y visualización).
 */
export interface CierreNominaCompleto {
  parametros: ParametrosCierreNomina;
  trabajadores: ResultadoTrabajadorNomina[];
  resumen: ResumenCierreNomina;
}

/**
 * Estado de validación al importar archivo.
 */
export interface ValidacionImportacion {
  esValido: boolean;
  totalLeidos: number;
  trabajadoresValidos: TrabajadorFilaInput[];
  advertencias: string[];
  errores: string[];
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * CRUCE LABORAL-FISCAL (CFDI NÓMINA VS. RELOJ CHECADOR / ASISTENCIA)
 * Fundamento: Art. 132 Fracc. VIII Bis LFT, Arts. 66-68 LFT, Art. 27 LISR, Art. 28 CFF.
 * ════════════════════════════════════════════════════════════════════════════
 */

export type TipoDiscrepanciaJornada =
  | 'SIN_DISCREPANCIA'
  | 'HORAS_EXTRAS_NO_PAGADAS'
  | 'HORAS_EXTRAS_SIN_REGISTRO'
  | 'SIN_REGISTRO_CHECADOR'
  | 'EMPLEADO_SIN_CFDI'
  | 'EXCESO_JORNADA_LEGAL_TRIPLE';

export type NivelRiesgoCruce = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export interface EmpleadoCfdiNomina {
  uuid?: string;
  rfc: string;
  nombre: string;
  curp?: string;
  numSeguridadSocial?: string;
  fechaInicioPago?: string;
  fechaFinPago?: string;
  numDiasPagados: number;
  horasOrdinariasPagadas: number;
  horasExtrasPagadas: number;
  horasDoblesPagadas: number;
  horasTriplesPagadas: number;
  importeHorasExtrasPagado: number;
  totalPercepciones: number;
}

export interface EmpleadoChecadorConsolidado {
  rfc: string;
  nombre: string;
  totalHorasTrabajadas: number;
  totalHorasOrdinarias: number;
  totalHorasExtras: number;
  diasConRegistro: number;
  fechas: string[];
}

export interface DiscrepanciaColaborador {
  rfc: string;
  nombre: string;
  curp?: string;
  horasChecadorTotal: number;
  horasChecadorExtras: number;
  horasCfdiOrdinarias: number;
  horasCfdiExtras: number;
  diferenciaHorasExtras: number;
  tipoDiscrepancia: TipoDiscrepanciaJornada;
  nivelRiesgo: NivelRiesgoCruce;
  detalles: string;
  fundamentoLegal: string;
  impactoFiscalLaboral: string;
}

export interface DictamenCruceJornada {
  id: string;
  fechaEmision: string;
  empresaNombre: string;
  empresaRfc?: string;
  periodoAnalizado: {
    fechaInicio?: string;
    fechaFin?: string;
  };
  totalColaboradoresCfdi: number;
  totalColaboradoresChecador: number;
  totalColaboradoresAuditados: number;
  colaboradoresConDiscrepancia: number;
  totalHorasExtrasChecador: number;
  totalHorasExtrasPagadasCfdi: number;
  diferenciaNetaHorasExtras: number;

  scoreConsistencia: number;
  nivelRiesgoGlobal: NivelRiesgoCruce;

  alertasPrincipales: string[];
  discrepancias: DiscrepanciaColaborador[];
  selloSha256: string;
}
