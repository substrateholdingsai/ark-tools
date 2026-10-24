/**
 * ARK LEDGER — Monitor de Actividades Vulnerables LFPIORPI (Herramienta #17)
 * Tipos TypeScript
 *
 * Fundamento legal:
 * - LFPIORPI Art. 17: Catálogo de Actividades Vulnerables
 * - RLFPIORPI Arts. 1–7: Umbrales de Identificación y Aviso
 * - Resolución General UIF: Obligaciones de reporte al SAT/UIF
 * - CFF Art. 28: Integridad del papel de trabajo contable
 */

// ─── Catálogo de Fracciones del Art. 17 LFPIORPI ─────────────────

/** Identificador del tipo de Actividad Vulnerable conforme al Art. 17 LFPIORPI. */
export type FraccionLFPIORPI =
  | 'FRACCION_I'
  | 'FRACCION_IV'
  | 'FRACCION_V'
  | 'FRACCION_VI'
  | 'FRACCION_VIII'
  | 'FRACCION_XI'
  | 'FRACCION_XII'
  | 'FRACCION_XIII'
  | 'FRACCION_XV';

/** Nivel de riesgo antilavado del cliente en el semáforo LFPIORPI. */
export type NivelRiesgo = 'VERDE' | 'AMARILLO' | 'ROJO';

// ─── Definición de Actividad Vulnerable ──────────────────────────

/** Definición estática de una Actividad Vulnerable con sus umbrales en UMAs. */
export interface ActividadVulnerable {
  readonly fraccion: FraccionLFPIORPI;
  readonly nombre: string;
  readonly descripcionCorta: string;
  readonly fundamentoLegal: string;
  /** Umbral de Identificación en UMAs (integrar expediente del cliente). */
  readonly umbralIdentificacionUMA: number;
  /** Umbral de Aviso en UMAs (obligación de reporte al SAT/UIF vía SPPLD). */
  readonly umbralAvisoUMA: number;
}

// ─── Datos de Entrada (Ingesta CSV) ──────────────────────────────

/** Fila de operación individual importada desde CSV/Excel (sábana de cobranza). */
export interface OperacionCobranza {
  /** RFC o clave interna del cliente/arrendatario. */
  idCliente: string;
  /** Fecha de pago en formato YYYY-MM-DD. */
  fechaPago: string;
  /** Monto cobrado en MXN. */
  montoCobrado: number;
  /** Concepto del pago (ej. "Renta Mensual Octubre 2026"). */
  concepto: string;
}

// ─── Resultado por Cliente ───────────────────────────────────────

/** Resultado de la evaluación acumulada de 6 meses para un cliente individual. */
export interface ResultadoCliente {
  idCliente: string;
  /** Suma de montos cobrados en la ventana móvil de 6 meses. */
  totalAcumulado6Meses: number;
  /** Cantidad de operaciones dentro de la ventana. */
  operacionesCount: number;
  /** Fecha de la primera operación registrada (histórica). */
  primeraOperacion: string;
  /** Fecha de la última operación registrada (histórica). */
  ultimaOperacion: string;
  /** Umbral de Identificación convertido a MXN para esta actividad. */
  umbralIdentificacionMXN: number;
  /** Umbral de Aviso convertido a MXN para esta actividad. */
  umbralAvisoMXN: number;
  /** Porcentaje de avance hacia el umbral de Identificación. */
  porcentajeIdentificacion: number;
  /** Porcentaje de avance hacia el umbral de Aviso. */
  porcentajeAviso: number;
  /** Semáforo de riesgo: VERDE < Identificación, AMARILLO ≥ Identificación, ROJO ≥ Aviso. */
  nivelRiesgo: NivelRiesgo;
  /** Indica si el cliente requiere integrar expediente (AMARILLO o ROJO). */
  requiereExpediente: boolean;
  /** Indica si el cliente requiere reporte al SAT/UIF vía SPPLD (ROJO). */
  requiereAviso: boolean;
}

// ─── Resumen Ejecutivo ───────────────────────────────────────────

/** Resumen ejecutivo del análisis completo del lote de operaciones. */
export interface ResumenMonitorLFPIORPI {
  totalClientes: number;
  totalOperaciones: number;
  montoTotalEvaluado: number;
  clientesVerde: number;
  clientesAmarillo: number;
  clientesRojo: number;
  actividadVulnerable: string;
  fraccion: FraccionLFPIORPI;
  umaDiaria: number;
  umbralIdentificacionUMA: number;
  umbralAvisoUMA: number;
  umbralIdentificacionMXN: number;
  umbralAvisoMXN: number;
  fechaEvaluacion: string;
  /** SHA-256 del dictamen para inmutabilidad y auditoría. */
  hashAuditoria: string;
}

// ─── Paquete Completo ────────────────────────────────────────────

/** Paquete completo de la evaluación LFPIORPI (para expediente y visualización). */
export interface EvaluacionLFPIORPI {
  clientes: ResultadoCliente[];
  resumen: ResumenMonitorLFPIORPI;
}

// ─── Validación de Importación ───────────────────────────────────

/** Estado de validación al importar archivo de cobranza. */
export interface ValidacionImportacionCobranza {
  esValido: boolean;
  totalLeidos: number;
  operacionesValidas: OperacionCobranza[];
  advertencias: string[];
  errores: string[];
}
