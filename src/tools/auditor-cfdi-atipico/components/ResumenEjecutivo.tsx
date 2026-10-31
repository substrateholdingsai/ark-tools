import React, { useState } from 'react';
import { FileText, Printer, Download, AlertTriangle } from 'lucide-react';
import type {
  Contribuyente,
  HallazgoRiesgo,
  ResumenConciliacionMetadata,
  CeldaMallaMes,
  CFDIExtraido,
} from '../types';
import { exportarAuditoriaExcel } from '../lib/exportarAuditoriaExcel';

interface ResumenEjecutivoProps {
  contribuyente: Contribuyente;
  ejercicio: number;
  hallazgos: HallazgoRiesgo[];
  conciliacion: ResumenConciliacionMetadata;
  malla: CeldaMallaMes[];
  cfdis: CFDIExtraido[];
}

export const ResumenEjecutivo: React.FC<ResumenEjecutivoProps> = ({
  contribuyente,
  ejercicio,
  hallazgos,
  conciliacion,
  malla,
  cfdis,
}) => {
  const criticosOAltos = hallazgos.filter(
    (h) => h.nivelRiesgo === 'Crítico' || h.nivelRiesgo === 'Alto'
  );
  const totalRiesgo = hallazgos.reduce((acc, h) => acc + h.importeInvolucrado, 0);

  const formatoMoneda = (val: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  // Redacción profesional académica en tercera persona
  const textoInicial = `DICTAMEN PRELIMINAR DE AUDITORÍA FORENSE Y COMPLIANCE TRIBUTARIO
EJERCICIO FISCAL ${ejercicio}

I. ALCANCE Y ANTECEDENTES METODOLÓGICOS
Con base en la información contenida en el repositorio digital de Comprobantes Fiscales Digitales por Internet (CFDI versión 4.0 y 3.3) y la conciliación contra la Metadata Oficial emitida por el Servicio de Administración Tributaria (SAT), se procedió a efectuar el análisis algorítmico, estadístico y forense de las operaciones del contribuyente ${contribuyente.razonSocial} (RFC: ${contribuyente.rfc}).

El procedimiento comprendió la verificación de integridad conforme a los artículos 29, 29-A y 69-B del Código Fiscal de la Federación (CFF), así como las disposiciones del artículo 27 de la Ley del Impuesto sobre la Renta (LISR) relativas a la estricta deducibilidad de las erogaciones e imputación bancaria.

II. INDICADORES CLAVE Y CONCILIACIÓN CON METADATA SAT
Se procesaron un total de ${conciliacion.totalXML} archivos XML correspondientes al ejercicio ${ejercicio}, correlacionados contra ${conciliacion.totalMetadata} registros oficiales en metadata. Del cruce practicado, se advierte que existen ${conciliacion.canceladosEnSAT} comprobante(s) con estatus de CANCELADO ante la autoridad fiscal. Asimismo, se determinaron ${conciliacion.cancelacionesExtemporaneas29A} cancelaciones realizadas fuera del plazo legal previsto en el artículo 29-A del CFF.

III. PRINCIPALES HALLAZGOS Y EVALUACIÓN DE RIESGO
Se identificaron ${hallazgos.length} hallazgo(s) que ameritan atención pericial, de los cuales ${criticosOAltos.length} representan un nivel de riesgo Crítico o Alto. El importe total sujeto a contingencia fiscal asciende a ${formatoMoneda(totalRiesgo)} MXN.

Cabe advertir con especial énfasis las siguientes inconsistencias:
${hallazgos.map((h, i) => `${i + 1}. [${h.nivelRiesgo.toUpperCase()}] ${h.criterioNombre}: ${h.descripcion} (Consecuencia: ${h.posibleConsecuenciaFiscal})`).join('\n')}

IV. CONCLUSIONES Y RECOMENDACIONES PERICIALES
Se recomienda proceder con la inmediata integración de los expedientes de materialidad de operaciones, la sustitución de comprobantes pagados en efectivo que superen los umbrales de ley y la regularización en declaraciones complementarias de aquellos comprobantes cancelados ante el SAT pero conservados indebidamente en registros contables.`;

  const [textoDictamen, setTextoDictamen] = useState(textoInicial);

  const imprimirReporte = () => {
    window.print();
  };

  const descargarExcel = () => {
    exportarAuditoriaExcel({
      contribuyente,
      malla,
      hallazgos,
      conciliacion,
      cfdis,
      ejercicio,
    });
  };

  return (
    <div className="space-y-6">
      {/* Barra de Acciones */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            <FileText className="h-5 w-5 text-sky-400" />
            Resumen Ejecutivo & Dictamen Pericial
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Documento redactado en estilo formal con valor probatorio para defensa fiscal y
            auditoría interna.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={imprimirReporte}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white shadow transition-all hover:bg-slate-700"
          >
            <Printer className="h-4 w-4 text-sky-400" /> Imprimir / PDF
          </button>
          <button
            onClick={descargarExcel}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow transition-all hover:bg-emerald-500"
          >
            <Download className="h-4 w-4" /> Exportar Cédula Excel
          </button>
        </div>
      </div>

      {/* Tarjeta de Resumen Estadístico */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400">
            Contribuyente Auditado
          </span>
          <div className="mt-1 truncate text-sm font-bold text-white">
            {contribuyente.razonSocial}
          </div>
          <div className="mt-0.5 font-mono text-xs text-sky-400">{contribuyente.rfc}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400">
            Severidad del Dictamen
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-rose-400">
            <AlertTriangle className="h-4 w-4" />
            {criticosOAltos.length > 0
              ? 'OBSERVACIONES CRÍTICAS DETECTADAS'
              : 'FAVORABLE / SIN CONTINGENCIAS'}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">
            {criticosOAltos.length} hallazgo(s) prioritarios
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs font-semibold uppercase text-slate-400">
            Monto Acumulado en Observación
          </span>
          <div className="mt-1 font-mono text-lg font-bold text-amber-400">
            {formatoMoneda(totalRiesgo)}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">Sujeto a solventación preventiva</div>
        </div>
      </div>

      {/* Editor y Vista de Texto Formal */}
      <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/90 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Cuerpo del Dictamen (Editable antes de imprimir):
          </span>
          <span className="text-[11px] text-slate-400">
            Puede agregar consideraciones específicas de la empresa
          </span>
        </div>

        <textarea
          rows={18}
          value={textoDictamen}
          onChange={(e) => setTextoDictamen(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200 shadow-inner focus:border-sky-500 focus:outline-none"
        />
      </div>
    </div>
  );
};
