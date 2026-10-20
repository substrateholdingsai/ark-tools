export { ValidadorXML } from './ValidadorXML';
export type {
  DictamenCFDI,
  ReglaAuditoria,
  EstatusDictamen,
  ResumenAuditoriaLote,
  TipoSeveridad,
  CategoriaRegla,
} from './types';
export { validarCFDI, validarArchivosXML, calcularResumenAuditoria } from './lib/validadorCFDI';
export { generarCSVDictamenes, descargarCSVDictamenes } from './lib/exportarDictamen';
