/**
 * ARK TOOLS — Calculadora ISN 2026
 * Tipos TypeScript
 */

/**
 * Estado de la República Mexicana
 */
export interface Estado {
  /** ID corto (ej. "CDMX", "JAL") */
  id: string;
  /** Nombre completo (ej. "Ciudad de México") */
  nombre: string;
  /** Nombre corto (ej. "CDMX", "Jal") */
  corto: string;
  /** Tasa de ISN en porcentaje (ej. 3.0) */
  tasa: number;
  /** Vigencia (ej. "2026") */
  vigencia: string;
  /** Artículo del código fiscal estatal */
  articulo: string;
}

/**
 * Concepto de percepción (renglón de la tabla)
 */
export interface ConceptoPercepcion {
  /** ID único */
  id: number;
  /** Nombre del concepto (ej. "Sueldo base") */
  concepto: string;
  /** Monto gravado para ISN */
  gravado: number;
  /** Monto exento para ISN */
  exento: number;
}

/**
 * Resultado del cálculo de ISN
 */
export interface ResultadoISN {
  /** Base gravable (suma de conceptos gravados) */
  baseGravable: number;
  /** Total de exentos */
  totalExento: number;
  /** Total de percepciones (gravado + exento) */
  totalPercepciones: number;
  /** Tasa aplicable en porcentaje */
  tasa: number;
  /** ISN a pagar */
  isn: number;
}
