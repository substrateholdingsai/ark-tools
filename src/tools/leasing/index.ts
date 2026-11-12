export { CalculadoraLeasing } from './CalculadoraLeasing';
export type {
  TipoActivoFiscal,
  OpcionTerminalCFF,
  MetodoAdquisicionId,
  ParametrosComparativaFiscal,
  DetalleMetodoAdquisicion,
  FlujoAnualComparativo,
  ResultadoComparativaFiscal,
  PresetActivoFiscal,
  ParametrosLeasing,
  ProyeccionMes,
  ResumenLeasing,
} from './types';
export {
  PARAMETROS_FISCAL_DEFAULT,
  PRESETS_ACTIVOS_FISCALES,
  obtenerReglasFiscalesActivo,
  compararLeasingFiscal,
  estimarRentaLeasingSugerida,
  PARAMETROS_DEFAULT,
  PRESETS_MODELO,
  proyectarMeses,
  calcularResumenLeasing,
  formatearMXN,
} from './lib/calcularLeasing';
export {
  generarCSVComparativaFiscal,
  descargarCSVComparativaFiscal,
  generarCSVProyeccion,
  descargarCSVProyeccion,
} from './lib/exportarProyeccion';
