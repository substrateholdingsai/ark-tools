/**
 * ARK LEDGER — Tabla Semáforo del Monitor LFPIORPI
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ArrowUpDown,
} from 'lucide-react';
import type { ResultadoCliente, NivelRiesgo } from '../types';

interface Props {
  clientes: ResultadoCliente[];
}

export const TablaMonitorLFPIORPI: React.FC<Props> = ({ clientes }) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroRiesgo, setFiltroRiesgo] = useState<NivelRiesgo | 'TODOS'>('TODOS');
  const [ordenAsc, setOrdenAsc] = useState(false);

  const clientesFiltrados = useMemo(() => {
    let res = [...clientes];

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      res = res.filter((c) => c.idCliente.toLowerCase().includes(q));
    }

    if (filtroRiesgo !== 'TODOS') {
      res = res.filter((c) => c.nivelRiesgo === filtroRiesgo);
    }

    res.sort((a, b) => {
      if (ordenAsc) {
        return a.totalAcumulado6Meses - b.totalAcumulado6Meses;
      }
      return b.totalAcumulado6Meses - a.totalAcumulado6Meses;
    });

    return res;
  }, [clientes, busqueda, filtroRiesgo, ordenAsc]);

  const badgeRiesgo = (nivel: NivelRiesgo) => {
    switch (nivel) {
      case 'ROJO':
        return (
          <span className="shadow-xs inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2.5 py-1 font-orbitron text-[10px] font-black uppercase tracking-wider text-rose-900">
            <ShieldAlert size={13} className="text-rose-600" />
            AVISO UIF
          </span>
        );
      case 'AMARILLO':
        return (
          <span className="shadow-xs inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 font-orbitron text-[10px] font-black uppercase tracking-wider text-amber-900">
            <AlertTriangle size={13} className="text-amber-700" />
            IDENTIFICACIÓN
          </span>
        );
      case 'VERDE':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-orbitron text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            <CheckCircle2 size={13} className="text-emerald-600" />
            POR DEBAJO
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm">
      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {/* Búsqueda por RFC / ID */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por RFC o ID..."
            className="w-full rounded-xl border border-line bg-surface-2 py-2 pl-9 pr-3 font-inter text-[13px] text-ink transition focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
          />
        </div>

        {/* Filtros de Riesgo */}
        <div className="flex flex-wrap items-center gap-2">
          {(['TODOS', 'ROJO', 'AMARILLO', 'VERDE'] as const).map((nivel) => (
            <button
              key={nivel}
              type="button"
              onClick={() => setFiltroRiesgo(nivel)}
              className={`rounded-lg px-3 py-1.5 font-orbitron text-[10px] font-bold uppercase transition ${
                filtroRiesgo === nivel
                  ? 'shadow-xs bg-navy text-white'
                  : 'border border-line bg-surface-2 text-muted hover:border-navy/30 hover:text-ink'
              }`}
            >
              {nivel === 'TODOS' ? 'Todos' : nivel}
            </button>
          ))}

          {/* Toggle de ordenamiento */}
          <button
            type="button"
            onClick={() => setOrdenAsc(!ordenAsc)}
            className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-3 py-1.5 font-inter text-[11px] font-semibold text-muted hover:text-ink"
            title="Ordenar por monto acumulado"
          >
            <ArrowUpDown size={13} />
            <span>{ordenAsc ? 'Monto ↑' : 'Monto ↓'}</span>
          </button>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-left font-inter text-[12px]">
          <thead>
            <tr className="border-b border-line bg-surface-2 font-orbitron text-[10px] font-bold uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Cliente / RFC</th>
              <th className="px-4 py-3">Ventana 6 Meses</th>
              <th className="px-4 py-3 text-right">Monto Acumulado (6M)</th>
              <th className="px-4 py-3">Semáforo LFPIORPI</th>
              <th className="px-4 py-3">Avance vs Umbrales</th>
              <th className="px-4 py-3">Acción Legal Inmediata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted">
                  No se encontraron clientes que coincidan con los filtros aplicados.
                </td>
              </tr>
            ) : (
              clientesFiltrados.map((cliente) => (
                <tr
                  key={cliente.idCliente}
                  className={`hover:bg-black/2 transition ${
                    cliente.nivelRiesgo === 'ROJO'
                      ? 'bg-rose-50/20'
                      : cliente.nivelRiesgo === 'AMARILLO'
                        ? 'bg-amber-50/20'
                        : ''
                  }`}
                >
                  {/* Cliente / RFC */}
                  <td className="px-4 py-3.5">
                    <div className="font-mono font-bold text-ink">{cliente.idCliente}</div>
                    <div className="text-[11px] text-muted">
                      {cliente.operacionesCount} operación(es) registrada(s)
                    </div>
                  </td>

                  {/* Fechas de la ventana */}
                  <td className="px-4 py-3.5 font-mono text-[11px] text-muted">
                    <div>{cliente.primeraOperacion || 'N/A'}</div>
                    <div className="text-[10px]">hasta {cliente.ultimaOperacion || 'N/A'}</div>
                  </td>

                  {/* Monto Acumulado */}
                  <td className="px-4 py-3.5 text-right font-mono text-[13px] font-bold text-ink">
                    $
                    {cliente.totalAcumulado6Meses.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-[10px] font-normal text-muted">MXN</span>
                  </td>

                  {/* Semáforo */}
                  <td className="px-4 py-3.5">{badgeRiesgo(cliente.nivelRiesgo)}</td>

                  {/* Barra de Avance */}
                  <td className="min-w-[180px] px-4 py-3.5">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted">Aviso (3,210 UMA):</span>
                        <span className="font-mono font-bold text-ink">
                          {cliente.porcentajeAviso}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                        <div
                          className={`h-full transition-all ${
                            cliente.porcentajeAviso >= 100
                              ? 'bg-rose-600'
                              : cliente.porcentajeIdentificacion >= 100
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, cliente.porcentajeAviso)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Acción Requerida */}
                  <td className="px-4 py-3.5">
                    {cliente.nivelRiesgo === 'ROJO' ? (
                      <div className="flex items-center gap-1.5 font-semibold text-rose-800">
                        <FileText size={14} className="shrink-0 text-rose-600" />
                        <span>Presentar Aviso SPPLD</span>
                      </div>
                    ) : cliente.nivelRiesgo === 'AMARILLO' ? (
                      <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                        <FileText size={14} className="shrink-0 text-amber-600" />
                        <span>Integrar Expediente de Cliente</span>
                      </div>
                    ) : (
                      <span className="text-muted">Operación ordinaria (sin aviso)</span>
                    )}
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
