/**
 * ARK LEDGER — Retención 2% Clínicas y Hospitales (Yucatán)
 * Constantes fiscales locales de la herramienta (Fase 1: unificación de fuente).
 *
 * Estos valores NO pertenecen al catálogo canónico central
 * (`src/data/valores-vigentes/catalogo.ts`) porque son tasas estatales de Yucatán
 * que aún no se han incorporado al catálogo federal. Se mantienen aquí como única
 * fuente de la herramienta; ningún cálculo usa literales sueltos.
 *
 * Fuente: Ley General de Hacienda del Estado de Yucatán (LGHY),
 * Diario Oficial 26-dic-2025.
 * - Art. 20-Bis: retención del 2% sobre honorarios médicos al momento del pago.
 * - Arts. 16 al 20: Impuesto sobre el Ejercicio Profesional (3%, referencia).
 */

export const TASA_RETENCION_CLINICAS_PCT = 2.0; // Art. 20-Bis LGHY (retención 2%)
export const TASA_IMPUESTO_EJERCICIO_PROFESIONAL_PCT = 3.0; // Arts. 16-20 LGHY (3%, ref.)
