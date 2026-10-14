/**
 * ARK TOOLS — Calculadora Nómina Rápida 2026
 * Barrel export principal del módulo
 */

export * from './types';
export * from './data/defaults';
export * from './data/periodos';
export * from './data/tablasISR';
export * from './data/cuotasIMSS';
export * from './lib/calcularISR';
export * from './lib/calcularIMSS';
export * from './lib/calcularNomina';
export {
  PeriodoSelector,
  SueldoInput,
  DesgloseDeducciones,
  ResultadoNomina as ResultadoNominaCard,
} from './components';
export * from './CalculadoraNomina';
export { default } from './CalculadoraNomina';
