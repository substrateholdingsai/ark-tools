/**
 * Exportador oficial a Excel de la Cédula de Auditoría de CFDI Atípicos y Riesgos SAT.
 * Utiliza SheetJS (xlsx) para generar libros multicapa con formato contable.
 */

import * as XLSX from 'xlsx';
import type {
  Contribuyente,
  CeldaMallaMes,
  HallazgoRiesgo,
  ResumenConciliacionMetadata,
  CFDIExtraido,
} from '../types';

export function exportarAuditoriaExcel(params: {
  contribuyente: Contribuyente;
  malla: CeldaMallaMes[];
  hallazgos: HallazgoRiesgo[];
  conciliacion: ResumenConciliacionMetadata;
  cfdis: CFDIExtraido[];
  ejercicio: number;
}): void {
  const { contribuyente, malla, hallazgos, conciliacion, cfdis, ejercicio } = params;

  const wb = XLSX.utils.book_new();

  // 1. Hoja: Malla Mensual
  const filasMalla = malla.map((m) => ({
    Mes: m.nombreMes,
    'Emitidos (Comprobantes)': m.emitidos.count,
    'Emitidos (Monto MXN)': m.emitidos.importe,
    'Emitidos Cancelados (SAT)': m.emitidos.canceladosCount,
    'Recibidos (Comprobantes)': m.recibidos.count,
    'Recibidos (Monto MXN)': m.recibidos.importe,
    'Recibidos Cancelados (SAT)': m.recibidos.canceladosCount,
    'Flujo Neto (Emitido - Recibido)': m.totalNeto,
    'Puntaje Z (Volatilidad)': Number(m.zScoreImporte.toFixed(2)),
    '¿Mes Atípico?': m.esAtipico ? 'SÍ (REVISIÓN PRIORITARIA)' : 'NORMAL',
  }));
  const wsMalla = XLSX.utils.json_to_sheet(filasMalla);
  XLSX.utils.book_append_sheet(wb, wsMalla, 'Malla Mensual');

  // 2. Hoja: Matriz de Riesgo y Hallazgos
  const filasHallazgos = hallazgos.map((h, i) => ({
    No: i + 1,
    Criterio: h.criterioNombre,
    Periodo: h.periodo,
    'Nivel de Riesgo': h.nivelRiesgo.toUpperCase(),
    'Probabilidad (1-5)': h.probabilidad,
    'Impacto (1-5)': h.impacto,
    'Importe Involucrado (MXN)': h.importeInvolucrado,
    'Comprobantes Detectados': h.comprobantesUUIDs.length,
    'Descripción del Hallazgo': h.descripcion,
    'Consecuencia Fiscal SAT': h.posibleConsecuenciaFiscal,
    'Recomendación Preventiva': h.recomendacion,
    Estatus: h.estatusSeguimiento.toUpperCase(),
  }));
  const wsHallazgos = XLSX.utils.json_to_sheet(filasHallazgos);
  XLSX.utils.book_append_sheet(wb, wsHallazgos, 'Matriz de Riesgo');

  // 3. Hoja: Conciliación Metadata
  const filasConciliacion = [
    { Indicador: 'Total Comprobantes XML Cargados', Valor: conciliacion.totalXML },
    { Indicador: 'Total Registros en Metadata SAT (.txt)', Valor: conciliacion.totalMetadata },
    { Indicador: 'Comprobantes Vigentes en Ambos Repositorios', Valor: conciliacion.vigentesAmbos },
    { Indicador: 'Comprobantes CANCELADOS ante el SAT', Valor: conciliacion.canceladosEnSAT },
    {
      Indicador: 'Faltantes en XML (Vigentes en SAT sin archivo)',
      Valor: conciliacion.faltantesEnXML,
    },
    {
      Indicador: 'Huérfanos (XML cargado que no figura en SAT)',
      Valor: conciliacion.huerfanosEnMetadata,
    },
    { Indicador: 'Discrepancias de Monto (XML vs SAT)', Valor: conciliacion.diferenciasMonto },
    {
      Indicador: 'Cancelaciones Extemporáneas (Art. 29-A CFF)',
      Valor: conciliacion.cancelacionesExtemporaneas29A,
    },
    {
      Indicador: 'Cancelados con Pagos o Documentos Relacionados',
      Valor: conciliacion.canceladosConPagoRelacionado,
    },
  ];
  const wsConcil = XLSX.utils.json_to_sheet(filasConciliacion);
  XLSX.utils.book_append_sheet(wb, wsConcil, 'Conciliación SAT');

  // 4. Hoja: Inventario de Comprobantes
  const filasCFDI = cfdis.map((c) => ({
    UUID: c.uuid,
    Clasificación: c.clasificacion,
    Tipo: c.tipoComprobante,
    'Fecha Emisión': c.fechaEmision,
    'Fecha Timbrado PAC': c.fechaTimbrado || '',
    'RFC Emisor': c.rfcEmisor,
    'Nombre Emisor': c.nombreEmisor,
    'RFC Receptor': c.rfcReceptor,
    'Nombre Receptor': c.nombreReceptor,
    'Forma Pago': c.formaPago || 'No especificada',
    'Método Pago': c.metodoPago || 'No especificado',
    'Subtotal MXN': c.subtotal,
    'IVA Trasladado': c.impuestosTrasladados,
    'Total MXN': c.total,
    'Estatus SAT (Metadata)': c.canceladoEnSAT ? 'CANCELADO' : 'VIGENTE',
    'Fecha Cancelación SAT': c.fechaCancelacionSAT || 'N/A',
  }));
  const wsCFDI = XLSX.utils.json_to_sheet(filasCFDI);
  XLSX.utils.book_append_sheet(wb, wsCFDI, 'Detalle CFDI');

  // Descarga automática en navegador
  const fileName = `Auditoria_CFDI_Atipicos_${contribuyente.rfc}_${ejercicio}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
