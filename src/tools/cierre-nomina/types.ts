/**
 * ARK TOOLS — Cierre de Nómina Masivo & Cédula Concentradora (Sprint 11)
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
