/**
 * ARK LEDGER — Calculadora ISN 2026
 * Tipos TypeScript
 */

/**
 * Ejercicio fiscal soportado por la calculadora ISN
 */
export type EjercicioISN = 2025 | 2026;

/**
 * Régimen aplicable para determinación de tasa y estímulos ISN
 */
export type RegimenISN = 'general' | 'micro_pequena' | 'gobierno_estatal';

/**
 * Configuración versionada de tasa ISN por ejercicio y régimen
 */
export interface TasaISNVersionada {
  ejercicio: EjercicioISN;
  tasaBruta: number;
  estimuloTasa: number;
  tasaNeta: number;
  articulo: string;
  decreto?: string;
  estimuloConfirmado?: boolean;
}

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
  /** Tasa general vigente de ISN en porcentaje (ej. 3.75 para YUC 2026) */
  tasa: number;
  /** Vigencia (ej. "2026") */
  vigencia: string;
  /** Artículo del código fiscal estatal */
  articulo: string;
  /** Configuración versionada por ejercicio fiscal y régimen (cuando aplica) */
  tasasPorEjercicio?: Partial<
    Record<
      EjercicioISN,
      {
        general: TasaISNVersionada;
        microPequena?: TasaISNVersionada;
        gobiernoEstatal?: TasaISNVersionada;
      }
    >
  >;
}

/**
 * Opciones adicionales para cálculo versionado y estímulos ISN
 */
export interface OpcionesISN {
  /** Ejercicio fiscal (default 2026) */
  ejercicio?: EjercicioISN;
  /** Número de trabajadores (1-10 micro, 11-50 pequeña, >50 mediana/grande) */
  numEmpleados?: number;
  /** Si aplica estímulo Decreto 147/2025 para micro/pequeña empresa 2026 (1-50 empleados) */
  esMicroPequena2026?: boolean;
  /** Si se trata de trabajadores del gobierno estatal (+1% Art. 24 párrafo 2 LGHY) */
  esGobiernoEstatal?: boolean;
  /** Si aplica exención de primer año Art. 27-A LGHY (no acumulable con Decreto 147/2025) */
  aplica27A?: boolean;
  /** Si aplica estímulo por nuevos empleos Art. 27-C LGHY */
  aplica27C?: boolean;
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
  /** Tasa bruta aplicable en porcentaje */
  tasa: number;
  /** Tasa bruta aplicable en porcentaje */
  tasaBruta: number;
  /** Tasa efectiva neta en porcentaje después de estímulos */
  tasaEfectiva: number;
  /** ISN bruto antes de estímulos */
  isnBruto: number;
  /** Monto del estímulo fiscal aplicado */
  estimulo: number;
  /** ISN neto a pagar (alias de isnNeto) */
  isn: number;
  /** ISN neto a pagar */
  isnNeto: number;
  /** Ejercicio fiscal aplicado */
  ejercicio: EjercicioISN;
  /** Régimen aplicado */
  regimen: RegimenISN;
  /** Indica si el estímulo está confirmado para el régimen seleccionado */
  estimuloConfirmado: boolean;
  /** Decreto aplicado al estímulo (si aplica) */
  decretoAplicado?: string;
  /** Fundamento legal específico aplicado */
  articuloAplicado: string;
}
