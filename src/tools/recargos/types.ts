/**
 * ARK LEDGER — Tipos para la Calculadora de Actualización y Recargos Fiscales
 *
 * Fundamentos legales:
 * - Art. 17-A del Código Fiscal de la Federación (Actualización por Inflación)
 * - Art. 21 del Código Fiscal de la Federación (Recargos por Indemnización)
 * - Art. 8 de la Ley de Ingresos de la Federación (Tasa de prórroga + 50% = 2.07% mensual en 2026)
 */

export type TipoRecargo = 'federal' | 'estatal_yucatan';

export interface EntradaRecargos {
  /** Importe histórico del impuesto omitido en MXN (> 0) */
  importeHistorico: number;
  /** Fecha límite en que debió cubrirse la contribución (ISO YYYY-MM-DD) */
  fechaVencimiento: string;
  /** Fecha efectiva en que se realiza el pago (ISO YYYY-MM-DD) */
  fechaPago: string;
  /** Tasa mensual de recargos (opcional, por defecto 2.07% conforme a la LIF vigente) */
  tasaRecargosMensual?: number;
  /** Ámbito legal del recargo; el default federal preserva el contrato histórico */
  tipoRecargo?: TipoRecargo;
}

export interface FactorActualizacionDetalle {
  /** INPC del mes anterior al más reciente del periodo de pago */
  inpcReciente: number;
  /** Periodo legible del INPC reciente (ej. "Junio 2024") */
  periodoInpcReciente: string;
  /** Clave YYYY-MM del INPC reciente */
  claveInpcReciente: string;
  /** INPC del mes anterior al más antiguo del periodo de vencimiento */
  inpcAntiguo: number;
  /** Periodo legible del INPC antiguo (ej. "Abril 2024") */
  periodoInpcAntiguo: string;
  /** Clave YYYY-MM del INPC antiguo */
  claveInpcAntiguo: string;
  /** Cociente exacto de la división inpcReciente / inpcAntiguo */
  cociente: number;
  /** Factor truncado al diezmilésimo (4 decimales) sin redondeo (Art. 17-A CFF) */
  factorTruncado: number;
  /** Indica si el cociente resultó menor a 1 (deflación) */
  esDeflacion: boolean;
  /** Factor aplicado final (mínimo 1.0000 según Art. 17-A sexto párrafo) */
  factorFinal: number;
  /** Nota explicativa si se usó el último INPC disponible por falta de publicación (mes reciente) */
  notaPublicacion?: string;
  /** Nota explicativa si se usó un INPC de respaldo por falta de publicación (mes antiguo/denominador) */
  notaPublicacionAntiguo?: string;
}

export interface DesgloseMesRecargo {
  /** Número consecutivo del mes transcurrido (1, 2, ...) */
  numero: number;
  /** Etiqueta del mes o periodo de cómputo (ej. "Mayo 2024") */
  periodo: string;
  /** Tasa mensual aplicada (1.47% para 2025, 2.07% para 2026) */
  tasaMensual: number;
  /** Tasa acumulada hasta este mes */
  tasaAcumulada: number;
  /** Base gravable actualizada sobre la cual se calculan los recargos */
  baseCalculo: number;
  /** Monto de recargo generado en este mes */
  recargoMes: number;
  /** Monto de recargos acumulados hasta este mes */
  recargoAcumulado: number;
  /** Año cuya tasa se aplicó a este mes (para trazabilidad) */
  anioTasa: number;
  /** Artículo LIF citado para la tasa de este mes (ej. "Artículo 8, fracción I" o "Artículo 11, fracción I") */
  articuloLIF: string;
}

export interface ResultadoRecargos {
  /** Ámbito legal usado para resolver la tasa de recargos */
  tipoRecargo: TipoRecargo;
  /** Importe histórico del impuesto omitido */
  importeHistorico: number;
  /** Fecha en que debió pagarse */
  fechaVencimiento: string;
  /** Fecha real de pago */
  fechaPago: string;
  /** Detalle legal del cálculo del factor de actualización */
  factorDetalle: FactorActualizacionDetalle;
  /** Factor de actualización aplicado (4 decimales, ej. 1.0315) */
  factorActualizacion: number;
  /** Impuesto actualizado (Importe histórico × factor) */
  impuestoActualizado: number;
  /** Efecto inflacionario (Impuesto actualizado - Histórico) */
  montoActualizacion: number;
  /** Número total de meses o fracción de mes de mora (bruto, antes del tope) */
  mesesMora: number;
  /** Tasa mensual de recargos aplicada (valor de referencia, no necesariamente la usada mes a mes) */
  tasaRecargosMensual: number;
  /** Tasa total acumulada de recargos (suma de tasas mensuales por año, tope 124.2% a 60 meses) */
  tasaRecargosTotal: number;
  /** Mesese efectivamente cobrados tras aplicar el tope de 60 meses (Art. 21 CFF) */
  mesesCobrados: number;
  /** Indica si el tope de 60 meses / 124.2% se aplicó */
  recargosCapped: boolean;
  /** Monto total de recargos por mora */
  montoRecargos: number;
  /** Total de la deuda tributaria a liquidar (Impuesto actualizado + Recargos) */
  totalPagar: number;
  /** Total a pagar expresado en letra formal (ej. "CINCO MIL TRESCIENTOS...") */
  totalEnLetras: string;
  /** Token determinista de integridad derivado del payload (Folio de Integridad, no sellado fiscal) */
  folioDeIntegridad: string;
  /** Advertencias del cálculo (tope de recargos, fallbacks de INPC, etc.) */
  advertencias: string[];
  /** Tabla analítica mes a mes de los recargos causados */
  desgloseMeses: DesgloseMesRecargo[];
  /** Convención de frontera de año usada: 'A' (tasa del año en que termina el mes) o 'B' (tasa del año en que empieza) */
  convencionFronteraAnio: 'A' | 'B';
}
