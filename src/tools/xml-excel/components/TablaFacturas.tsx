/**
 * ARK TOOLS — Conversor XML a Excel
 * Componente: Tabla Interactiva de Facturas y Comprobantes CFDI
 */

import React, { useState, useMemo } from 'react';
import { Search, Copy, Check, Trash2, AlertCircle, FileText, Filter } from 'lucide-react';
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
          <span className="inline-flex items-center rounded border border-emerald-500/30 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
            Ingreso (I)
          </span>
        );
      case 'E':
        return (
          <span className="inline-flex items-center rounded border border-amber-500/30 bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-300">
            Egreso (E)
          </span>
        );
      case 'N':
        return (
          <span className="inline-flex items-center rounded border border-sky-500/30 bg-sky-950/60 px-2 py-0.5 text-[10px] font-bold text-sky-300">
            Nómina (N)
          </span>
        );
      case 'P':
        return (
          <span className="inline-flex items-center rounded border border-purple-500/30 bg-purple-950/60 px-2 py-0.5 text-[10px] font-bold text-purple-300">
            Pago (P)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded border border-white/10 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
            {tipo}
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        {/* Buscador */}
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por RFC, Razón Social, UUID o Folio..."
            className="bg-surface-raised w-full rounded-xl border border-white/10 py-2.5 pl-10 pr-4 text-xs text-ink transition-colors placeholder:text-muted/60 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs md:pb-0">
          <Filter className="mr-1 h-3.5 w-3.5 shrink-0 text-muted" />
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
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                filtroTipo === t.id
                  ? 'bg-gold font-bold text-navy shadow-sm'
                  : 'hover:bg-surface-raised border border-white/5 bg-surface text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="flex items-center justify-between px-1 text-xs text-muted">
        <span>
          Mostrando <strong className="text-ink">{facturasFiltradas.length}</strong> de{' '}
          <strong className="text-ink">{facturas.length}</strong> comprobantes cargados
        </span>
      </div>

      {/* Tabla Responsiva */}
      <div className="bg-surface-raised/40 overflow-x-auto rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-surface/80 text-[11px] font-bold uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">UUID / Folio</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Emisor</th>
              <th className="px-4 py-3">Receptor</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
              <th className="px-4 py-3 text-right">IVA 16%</th>
              <th className="px-4 py-3 text-right">Retenciones</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-3 py-3 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {facturasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-muted">
                  <FileText className="mx-auto mb-2 h-8 w-8 text-muted/40" />
                  <p className="font-medium">No se encontraron comprobantes con el filtro actual</p>
                  <p className="mt-1 text-[11px] text-muted/70">
                    Prueba cambiando el término de búsqueda o seleccionando &quot;Todos&quot;.
                  </p>
                </td>
              </tr>
            ) : (
              facturasFiltradas.map((f) => (
                <tr key={f.id} className="group transition-colors hover:bg-white/[0.02]">
                  {/* Estado */}
                  <td className="whitespace-nowrap px-4 py-3">
                    {f.estado === 'valido' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Válido
                      </span>
                    ) : f.estado === 'advertencia' ? (
                      <span
                        title={f.mensajeError}
                        className="inline-flex cursor-help items-center gap-1 text-[10px] font-semibold text-amber-400"
                      >
                        <AlertCircle className="h-3 w-3" />
                        Alerta
                      </span>
                    ) : (
                      <span
                        title={f.mensajeError}
                        className="inline-flex cursor-help items-center gap-1 text-[10px] font-semibold text-red-400"
                      >
                        <AlertCircle className="h-3 w-3" />
                        Error
                      </span>
                    )}
                  </td>

                  {/* UUID y Folio */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="cursor-pointer select-all font-mono text-[11px] text-gold hover:underline"
                        title={f.uuid}
                        onClick={() => handleCopiarUUID(f.uuid, f.id)}
                      >
                        {f.uuid.length > 14
                          ? `${f.uuid.slice(0, 8)}...${f.uuid.slice(-4)}`
                          : f.uuid}
                      </span>
                      <button
                        onClick={() => handleCopiarUUID(f.uuid, f.id)}
                        className="rounded p-0.5 text-muted transition-colors hover:text-gold"
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
                      <span className="mt-0.5 block text-[10px] text-muted">
                        {f.serie ? `${f.serie}-` : ''}
                        {f.folio}
                      </span>
                    )}
                  </td>

                  {/* Fecha */}
                  <td className="whitespace-nowrap px-4 py-3 text-[11px] text-muted">
                    {f.fecha ? f.fecha.slice(0, 10) : '—'}
                  </td>

                  {/* Tipo */}
                  <td className="whitespace-nowrap px-4 py-3">{getTipoBadge(f.tipoComprobante)}</td>

                  {/* Emisor */}
                  <td className="max-w-[160px] px-4 py-3">
                    <span className="block font-mono text-[11px] font-semibold text-ink">
                      {f.rfcEmisor || '—'}
                    </span>
                    <span className="block truncate text-[10px] text-muted" title={f.nombreEmisor}>
                      {f.nombreEmisor || '—'}
                    </span>
                  </td>

                  {/* Receptor */}
                  <td className="max-w-[160px] px-4 py-3">
                    <span className="block font-mono text-[11px] font-semibold text-ink">
                      {f.rfcReceptor || '—'}
                    </span>
                    <span
                      className="block truncate text-[10px] text-muted"
                      title={f.nombreReceptor}
                    >
                      {f.nombreReceptor || '—'}
                    </span>
                  </td>

                  {/* Subtotal */}
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-muted">
                    {formatearMXN(f.subtotal)}
                  </td>

                  {/* IVA 16% */}
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-muted">
                    {f.iva16 > 0 ? formatearMXN(f.iva16) : '—'}
                  </td>

                  {/* Retenciones */}
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-red-300">
                    {f.totalImpuestosRetenidos > 0
                      ? `-${formatearMXN(f.totalImpuestosRetenidos)}`
                      : '—'}
                  </td>

                  {/* Total */}
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-gold">
                    {formatearMXN(f.total)}
                  </td>

                  {/* Acción Eliminar */}
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => onEliminarFactura(f.id)}
                      className="rounded p-1 text-muted/60 transition-colors hover:text-red-400"
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
