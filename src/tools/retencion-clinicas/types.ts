/**
 * ARK LEDGER — Tool 21: Retención 2% Clínicas y Hospitales (Yucatán)
 * Art. 20-Bis a 20-Quinquies LGHY (D.O. 26-dic-2025)
 */

export type TipoPersonaRetencion = 'fisica' | 'moral';

export interface DatosRetenedor {
  nombre: string;
  rfc: string;
  /** Registro Estatal de Contribuyentes ante AAFY (clients.metadata.registro_estatal_aafy) */
  rec?: string;
  /** Clave de Identificación Electrónica Estatal (clients.metadata.ciee) */
  ciee?: string;
}

export interface DatosPrestador {
  nombre: string;
  rfc: string;
  rec?: string;
  /** Requerido en AAFY-30 cuando el prestador no cuenta con REC */
  domicilioFiscal?: string;
  tipoPersona: TipoPersonaRetencion;
}

export interface RetencionClinicasInput {
  /** Entidad federativa (Tool 21 es exclusivo para 'YUC') */
  estadoId: string;
  montoHonorarios: number;
  fechaPago: string; // YYYY-MM-DD
  folioConstancia?: string;
  retenedor: DatosRetenedor;
  prestador: DatosPrestador;
}

export interface RetencionClinicasResultado {
  base: number;
  tasaRetencion: number; // 2.0
  retencion2Pct: number;
  netoPagar: number;
  /** Impuesto sobre el Ejercicio Profesional (3% Art. 16-20 LGHY), solo informativo */
  impuestoEjercicioProfesional3Pct: number;
  fechaLimiteEntero: string; // YYYY-MM-DD
  fechaLimitePagoImpuesto: string; // YYYY-MM-DD
  fechaLimiteConstancia: string; // YYYY-MM-DD
  notaAcuerdoAafy2026: string;
  trimestreInformativo: string;
}
