/**
 * ARK TOOLS — Conversor XML a Excel
 * Componente: Tabla Interactiva de Facturas y Comprobantes CFDI
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  FileText,
  Filter,
} from 'lucide-react';
import { formatearMXN } from '../lib/parserCFDI';
import type { FacturaCFDI, FiltroTipo } from '../types';

interface TablaFacturasProps {
  facturas: FacturaCFDI[];
  onEliminarFactura: (id: string) => void;
  onCopiarTexto?: (texto: string) => void;
}

export const TablaFacturas: React.FC<TablaFacturasProps> = ({
  facturas,
  onEliminarFactura,
  onCopiarTexto,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('TODOS');
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Filtrado reactivo en cliente
  const facturasFiltradas = useMemo(() => {
    return facturas.filter((f) => {
      // Filtro por tipo
      if (filtroTipo !== 'TODOS') {
        if (filtroTipo === 'OTROS') {
          if (['I', 'E', 'N', 'P'].includes(f.tipoComprobante)) return false;
        } else if (f.tipoComprobante !== filtroTipo) {
          return false;
        }
      }

      // Filtro por búsqueda
      if (!busqueda.trim()) return true;
      const term = busqueda.toLowerCase().trim();
      return (
        f.uuid.toLowerCase().includes(term) ||
        f.rfcEmisor.toLowerCase().includes(term) ||
        f.nombreEmisor.toLowerCase().includes(term) ||
        f.rfcReceptor.toLowerCase().includes(term) ||
        f.nombreReceptor.toLowerCase().includes(term) ||
        f.folio.toLowerCase().includes(term) ||
        f.serie.toLowerCase().includes(term) ||
        f.fileName.toLowerCase().includes(term)
      );
    });
  }, [facturas, filtroTipo, busqueda]);

  const handleCopiarUUID = (uuid: string, id: string) => {
    navigator.clipboard?.writeText(uuid);
    setCopiadoId(id);
    if (onCopiarTexto) onCopiarTexto('UUID copiado al portapapeles');
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'I':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
            Ingreso (I)
          </span>
        );
      case 'E':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30">
            Egreso (E)
          </span>
        );
      case 'N':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950/60 text-sky-300 border border-sky-500/30">
            Nómina (N)
          </span>
        );
      case 'P':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/60 text-purple-300 border border-purple-500/30">
            Pago (P)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-white/10">
            {tipo}
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por RFC, Razón Social, UUID o Folio..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-white/10 text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/40 transition-colors"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ink"
            >
              ×
            </button>
          )}
        </div>

        {/* Píldoras de Filtro por Tipo */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <Filter className="h-3.5 w-3.5 text-muted mr-1 shrink-0" />
          {(
            [
              { id: 'TODOS', label: 'Todos' },
              { id: 'I', label: 'Ingresos' },
              { id: 'E', label: 'Egresos' },
              { id: 'N', label: 'Nómina' },
              { id: 'P', label: 'Pagos' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setFiltroTipo(t.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filtroTipo === t.id
                  ? 'bg-gold text-navy font-bold shadow-sm'
                  : 'bg-surface hover:bg-surface-raised text-muted hover:text-ink border border-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="flex items-center justify-between text-xs text-muted px-1">
        <span>
          Mostrando <strong className="text-ink">{facturasFiltradas.length}</strong> de{' '}
          <strong className="text-ink">{facturas.length}</strong> comprobantes cargados
        </span>
      </div>

      {/* Tabla Responsiva */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface-raised/40 backdrop-blur-sm shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-surface/80 text-[11px] font-bold uppercase tracking-wider text-muted">
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">UUID / Folio</th>
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Emisor</th>
              <th className="py-3 px-4">Receptor</th>
              <th className="py-3 px-4 text-right">Subtotal</th>
              <th className="py-3 px-4 text-right">IVA 16%</th>
              <th className="py-3 px-4 text-right">Retenciones</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-3 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {facturasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-muted">
                  <FileText className="mx-auto h-8 w-8 text-muted/40 mb-2" />
                  <p className="font-medium">No se encontraron comprobantes con el filtro actual</p>
                  <p className="text-[11px] mt-1 text-muted/70">
                    Prueba cambiando el término de búsqueda o seleccionando &quot;Todos&quot;.
                  </p>
                </td>
              </tr>
            ) : (
              facturasFiltradas.map((f) => (
                <tr
                  key={f.id}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Estado */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {f.estado === 'valido' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Válido
                      </span>
                    ) : f.estado === 'advertencia' ? (
                      <span
                        title={f.mensajeError}
                        className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold cursor-help"
                      >
                        <AlertCircle className="h-3 w-3" />
                        Alerta
                      </span>
                    ) : (
                      <span
                        title={f.mensajeError}
                        className="inline-flex items-center gap-1 text-[10px] text-red-400 font-semibold cursor-help"
                      >
                        <AlertCircle className="h-3 w-3" />
                        Error
                      </span>
                    )}
                  </td>

                  {/* UUID y Folio */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="font-mono text-[11px] text-gold select-all cursor-pointer hover:underline"
                        title={f.uuid}
                        onClick={() => handleCopiarUUID(f.uuid, f.id)}
                      >
                        {f.uuid.length > 14 ? `${f.uuid.slice(0, 8)}...${f.uuid.slice(-4)}` : f.uuid}
                      </span>
                      <button
                        onClick={() => handleCopiarUUID(f.uuid, f.id)}
                        className="text-muted hover:text-gold transition-colors p-0.5 rounded"
                        title="Copiar UUID completo"
                      >
                        {copiadoId === f.id ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    {(f.serie || f.folio) && (
                      <span className="text-[10px] text-muted block mt-0.5">
                        {f.serie ? `${f.serie}-` : ''}
                        {f.folio}
                      </span>
                    )}
                  </td>

                  {/* Fecha */}
                  <td className="py-3 px-4 whitespace-nowrap text-muted text-[11px]">
                    {f.fecha ? f.fecha.slice(0, 10) : '—'}
                  </td>

                  {/* Tipo */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getTipoBadge(f.tipoComprobante)}
                  </td>

                  {/* Emisor */}
                  <td className="py-3 px-4 max-w-[160px]">
                    <span className="font-mono font-semibold text-ink block text-[11px]">
                      {f.rfcEmisor || '—'}
                    </span>
                    <span
                      className="text-[10px] text-muted truncate block"
                      title={f.nombreEmisor}
                    >
                      {f.nombreEmisor || '—'}
                    </span>
                  </td>

                  {/* Receptor */}
                  <td className="py-3 px-4 max-w-[160px]">
                    <span className="font-mono font-semibold text-ink block text-[11px]">
                      {f.rfcReceptor || '—'}
                    </span>
                    <span
                      className="text-[10px] text-muted truncate block"
                      title={f.nombreReceptor}
                    >
                      {f.nombreReceptor || '—'}
                    </span>
                  </td>

                  {/* Subtotal */}
                  <td className="py-3 px-4 text-right font-mono whitespace-nowrap text-muted">
                    {formatearMXN(f.subtotal)}
                  </td>

                  {/* IVA 16% */}
                  <td className="py-3 px-4 text-right font-mono whitespace-nowrap text-muted">
                    {f.iva16 > 0 ? formatearMXN(f.iva16) : '—'}
                  </td>

                  {/* Retenciones */}
                  <td className="py-3 px-4 text-right font-mono whitespace-nowrap text-red-300">
                    {f.totalImpuestosRetenidos > 0
                      ? `-${formatearMXN(f.totalImpuestosRetenidos)}`
                      : '—'}
                  </td>

                  {/* Total */}
                  <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap text-gold">
                    {formatearMXN(f.total)}
                  </td>

                  {/* Acción Eliminar */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onEliminarFactura(f.id)}
                      className="text-muted/60 hover:text-red-400 p-1 rounded transition-colors"
                      title="Eliminar de la lista"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
