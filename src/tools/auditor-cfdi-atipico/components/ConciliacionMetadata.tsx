import React from 'react';
import { FileCheck, AlertTriangle, XCircle } from 'lucide-react';
import type { ResumenConciliacionMetadata, CFDIExtraido, SATMetadataItem } from '../types';

interface ConciliacionMetadataProps {
  conciliacion: ResumenConciliacionMetadata;
  cfdis: CFDIExtraido[];
  metadata: SATMetadataItem[];
}

export const ConciliacionMetadata: React.FC<ConciliacionMetadataProps> = ({
  conciliacion,
  cfdis,
}) => {
  const formatoMoneda = (val: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const canceladosEnSATList = cfdis.filter((c) => c.canceladoEnSAT);

  return (
    <div className="space-y-6">
      {/* Tarjetas de Indicadores */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="border-slate-800 bg-slate-900/60 rounded-xl border p-4">
          <div className="text-slate-400 mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider">Comprobantes XML</span>
            <FileCheck className="h-4 w-4 text-sky-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white">{conciliacion.totalXML}</div>
          <p className="text-slate-400 mt-1 text-xs">Archivos XML válidos procesados</p>
        </div>

        <div className="border-slate-800 bg-slate-900/60 rounded-xl border p-4">
          <div className="text-slate-400 mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Registros Metadata SAT
            </span>
            <FileCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white">
            {conciliacion.totalMetadata}
          </div>
          <p className="text-slate-400 mt-1 text-xs">Líneas extraídas del archivo .txt SAT</p>
        </div>

        <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4">
          <div className="mb-1 flex items-center justify-between text-rose-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Cancelados en SAT
            </span>
            <XCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-rose-400">
            {conciliacion.canceladosEnSAT}
          </div>
          <p className="text-slate-400 mt-1 text-xs">Estatus 0 en el portal del SAT</p>
        </div>

        <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4">
          <div className="mb-1 flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Cancelaciones 29-A CFF
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-amber-400">
            {conciliacion.cancelacionesExtemporaneas29A}
          </div>
          <p className="text-slate-400 mt-1 text-xs">Cancelados fuera del ejercicio fiscal</p>
        </div>
      </div>

      {/* Discrepancias Detectadas */}
      <div className="border-slate-800 bg-slate-900/80 rounded-xl border p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          Tablero de Conciliación Cruce XML vs. Metadata del SAT
        </h3>

        <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
          <div className="border-slate-800 bg-slate-950/60 rounded-lg border p-4">
            <div className="text-slate-300 mb-1 font-semibold">Faltantes en Repositorio Local</div>
            <div className="font-mono text-xl font-bold text-white">
              {conciliacion.faltantesEnXML}
            </div>
            <p className="text-slate-400 mt-1">
              Comprobantes vigentes ante el SAT de los cuales el contribuyente no tiene el archivo
              XML en su equipo.
            </p>
          </div>

          <div className="border-slate-800 bg-slate-950/60 rounded-lg border p-4">
            <div className="text-slate-300 mb-1 font-semibold">Archivos Huérfanos</div>
            <div className="font-mono text-xl font-bold text-white">
              {conciliacion.huerfanosEnMetadata}
            </div>
            <p className="text-slate-400 mt-1">
              XMLs cargados en el sistema que no figuran en la relación de metadata descargada del
              SAT.
            </p>
          </div>

          <div className="border-slate-800 bg-slate-950/60 rounded-lg border p-4">
            <div className="text-slate-300 mb-1 font-semibold">Diferencias de Importe Total</div>
            <div className="font-mono text-xl font-bold text-white">
              {conciliacion.diferenciasMonto}
            </div>
            <p className="text-slate-400 mt-1">
              Diferencia en centavos entre el valor del nodo Total del XML y el importe certificado
              por el SAT.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Comprobantes Cancelados en SAT */}
      <div className="border-slate-800 bg-slate-900/80 rounded-xl border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            <XCircle className="h-4 w-4 text-rose-400" />
            Comprobantes Cancelados ante el SAT ({canceladosEnSATList.length})
          </h3>
          <span className="text-slate-400 text-xs">Riesgo inminente de rechazo de deducciones</span>
        </div>

        {canceladosEnSATList.length === 0 ? (
          <div className="text-slate-400 p-6 text-center text-xs">
            No hay comprobantes cancelados en la metadata cruzada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-slate-800 bg-slate-950/80 text-slate-400 border-b font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2.5">UUID</th>
                  <th className="px-3 py-2.5">Tipo / Clasif.</th>
                  <th className="px-3 py-2.5">Emisión</th>
                  <th className="px-3 py-2.5">Contraparte</th>
                  <th className="px-3 py-2.5 text-right">Total MXN</th>
                  <th className="px-3 py-2.5">Fecha Cancelación</th>
                </tr>
              </thead>
              <tbody className="divide-slate-800/60 divide-y">
                {canceladosEnSATList.map((cfdi) => (
                  <tr key={cfdi.uuid} className="hover:bg-slate-800/30 font-mono transition-all">
                    <td className="px-3 py-2 font-medium text-sky-400">{cfdi.uuid}</td>
                    <td className="text-slate-300 px-3 py-2">
                      {cfdi.tipoComprobante} ({cfdi.clasificacion})
                    </td>
                    <td className="text-slate-400 px-3 py-2">{cfdi.fechaEmision.split('T')[0]}</td>
                    <td className="text-slate-300 px-3 py-2 font-sans">
                      {cfdi.clasificacion === 'EMITIDO' ? cfdi.nombreReceptor : cfdi.nombreEmisor}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-rose-400">
                      {formatoMoneda(cfdi.total)}
                    </td>
                    <td className="px-3 py-2 text-amber-400">
                      {cfdi.fechaCancelacionSAT
                        ? cfdi.fechaCancelacionSAT.split('T')[0]
                        : 'SAT no especifica'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
