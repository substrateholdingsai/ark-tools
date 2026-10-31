import React, { useState } from 'react';
import { X, Search, Copy, Check, FileText } from 'lucide-react';
import type { CFDIExtraido } from '../types';

interface DetalleComprobantesModalProps {
  abierto: boolean;
  onCerrar: () => void;
  cfdis: CFDIExtraido[];
  titulo: string;
}

export const DetalleComprobantesModal: React.FC<DetalleComprobantesModalProps> = ({
  abierto,
  onCerrar,
  cfdis,
  titulo,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  if (!abierto) return null;

  const formatoMoneda = (val: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const copiarUUID = (uuid: string) => {
    navigator.clipboard.writeText(uuid);
    setCopiadoId(uuid);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const filtrados = cfdis.filter((c) => {
    const q = busqueda.toLowerCase();
    return (
      c.uuid.toLowerCase().includes(q) ||
      c.nombreEmisor.toLowerCase().includes(q) ||
      c.nombreReceptor.toLowerCase().includes(q) ||
      c.rfcEmisor.toLowerCase().includes(q) ||
      c.rfcReceptor.toLowerCase().includes(q) ||
      c.conceptos.some(
        (cp) => cp.descripcion.toLowerCase().includes(q) || cp.claveProdServ.includes(q)
      )
    );
  });

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-white">
              <FileText className="h-5 w-5 text-sky-400" />
              {titulo} ({cfdis.length} comprobantes)
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Inspección analítica del Anexo 20 y conciliación con metadata del SAT.
            </p>
          </div>

          <button
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className="border-b border-slate-800 bg-slate-950/40 p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por UUID, RFC, Razón Social, ClaveProdServ o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-10 pr-4 font-sans text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Tabla de Resultados */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtrados.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No se encontraron comprobantes que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="space-y-3">
              {filtrados.map((c) => (
                <div
                  key={c.uuid}
                  className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/70 p-4 text-xs transition-all hover:border-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-400">{c.uuid}</span>
                      <button
                        onClick={() => copiarUUID(c.uuid)}
                        className="rounded p-1 text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
                        title="Copiar UUID"
                      >
                        {copiadoId === c.uuid ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                        {c.tipoComprobante} ({c.clasificacion})
                      </span>

                      {c.canceladoEnSAT ? (
                        <span className="rounded border border-rose-800 bg-rose-950/80 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                          CANCELADO SAT
                        </span>
                      ) : (
                        <span className="rounded border border-emerald-800 bg-emerald-950/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                          VIGENTE
                        </span>
                      )}
                    </div>

                    <div className="font-mono text-sm font-bold text-white">
                      {formatoMoneda(c.total)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-[11px] text-slate-400 md:grid-cols-2">
                    <div>
                      <strong className="text-slate-300">Emisor:</strong> {c.nombreEmisor} (
                      {c.rfcEmisor})
                    </div>
                    <div>
                      <strong className="text-slate-300">Receptor:</strong> {c.nombreReceptor} (
                      {c.rfcReceptor})
                    </div>
                    <div>
                      <strong className="text-slate-300">Emisión:</strong> {c.fechaEmision}
                    </div>
                    <div>
                      <strong className="text-slate-300">Método / Forma:</strong>{' '}
                      {c.metodoPago || 'PUE'} - Forma {c.formaPago || '03'}
                    </div>
                  </div>

                  {c.conceptos.length > 0 && c.conceptos[0] && (
                    <div className="rounded-lg border border-slate-800/60 bg-slate-900/60 p-2 text-[11px] text-slate-300">
                      <div className="mb-1 text-[10px] font-semibold text-slate-400">
                        Concepto Principal:
                      </div>
                      <div className="flex justify-between">
                        <span>
                          <strong className="font-mono text-sky-400">
                            [{c.conceptos[0].claveProdServ}]
                          </strong>{' '}
                          {c.conceptos[0].descripcion}
                        </span>
                        <span className="font-mono font-medium">
                          {formatoMoneda(c.conceptos[0].importe)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie de modal */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-400">
          <span>
            Mostrando {filtrados.length} de {cfdis.length} registros
          </span>
          <button
            onClick={onCerrar}
            className="rounded-lg bg-slate-800 px-4 py-1.5 font-medium text-white transition-all hover:bg-slate-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
