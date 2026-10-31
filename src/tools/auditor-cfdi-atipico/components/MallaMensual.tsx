import React, { useState } from 'react';
import { Calendar, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { CeldaMallaMes, CFDIExtraido } from '../types';

interface MallaMensualProps {
  malla: CeldaMallaMes[];
  promedioMensual: number;
  desviacionEstandar: number;
  cfdis: CFDIExtraido[];
  onSeleccionarMes: (mes: number, tipo: 'EMITIDO' | 'RECIBIDO' | 'TODOS') => void;
}

export const MallaMensual: React.FC<MallaMensualProps> = ({
  malla,
  promedioMensual,
  desviacionEstandar,
  onSeleccionarMes,
}) => {
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'EMITIDO' | 'RECIBIDO'>('TODOS');

  const formatoMoneda = (val: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-6">
      {/* Encabezado y Métricas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Promedio Mensual Emitido
          </div>
          <div className="font-mono text-2xl font-bold text-white">
            {formatoMoneda(promedioMensual)}
          </div>
          <p className="mt-1 text-xs text-slate-400">Línea base para cálculo de Z-Score</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Desviación Estándar (σ)
          </div>
          <div className="font-mono text-2xl font-bold text-amber-400">
            {formatoMoneda(desviacionEstandar)}
          </div>
          <p className="mt-1 text-xs text-slate-400">Umbral atípico: |Z| &gt; 2.0 (2σ)</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Meses con Desviación Atípica
          </div>
          <div className="font-mono text-2xl font-bold text-rose-400">
            {malla.filter((m) => m.esAtipico).length}{' '}
            <span className="text-xs font-normal text-slate-400">/ 12 meses</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Volatilidad atípica de ingresos o cancelaciones
          </p>
        </div>
      </div>

      {/* Selector de visualización */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-sky-400" />
          <h3 className="text-lg font-bold text-white">
            Malla Mensual Consolidada (Enero – Diciembre)
          </h3>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 p-1 text-xs">
          <button
            onClick={() => setFiltroTipo('TODOS')}
            className={`rounded-md px-3 py-1.5 font-medium transition-all ${
              filtroTipo === 'TODOS'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Vista Completa
          </button>
          <button
            onClick={() => setFiltroTipo('EMITIDO')}
            className={`rounded-md px-3 py-1.5 font-medium transition-all ${
              filtroTipo === 'EMITIDO'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Solo Emitidos
          </button>
          <button
            onClick={() => setFiltroTipo('RECIBIDO')}
            className={`rounded-md px-3 py-1.5 font-medium transition-all ${
              filtroTipo === 'RECIBIDO'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Solo Recibidos
          </button>
        </div>
      </div>

      {/* Grid de Meses (Heatmap) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {malla.map((celda) => {
          const tasaCancelacion =
            celda.emitidos.count + celda.emitidos.canceladosCount > 0
              ? (celda.emitidos.canceladosCount /
                  (celda.emitidos.count + celda.emitidos.canceladosCount)) *
                100
              : 0;

          const esAlerta = celda.esAtipico || tasaCancelacion > 15;

          return (
            <div
              key={celda.mes}
              onClick={() => onSeleccionarMes(celda.mes, filtroTipo)}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:scale-[1.02] hover:shadow-lg ${
                esAlerta
                  ? 'border-rose-800/60 bg-rose-950/20 hover:border-rose-500'
                  : 'border-slate-800 bg-slate-900/80 hover:border-sky-500'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-base font-bold text-white">{celda.nombreMes}</span>
                {celda.esAtipico ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-700 bg-rose-900/80 px-2 py-0.5 text-[11px] font-bold text-rose-300">
                    <AlertTriangle className="h-3 w-3" /> Z={celda.zScoreImporte.toFixed(1)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-800/50 bg-emerald-950/60 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                    <CheckCircle className="h-3 w-3" /> Normal
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs">
                {(filtroTipo === 'TODOS' || filtroTipo === 'EMITIDO') && (
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>Emitidos ({celda.emitidos.count}):</span>
                      <span className="font-mono font-semibold text-sky-300">
                        {formatoMoneda(celda.emitidos.importe)}
                      </span>
                    </div>
                    {celda.emitidos.canceladosCount > 0 && (
                      <div className="flex justify-between text-[11px] text-rose-400">
                        <span>Cancelados SAT:</span>
                        <span className="font-mono">
                          {celda.emitidos.canceladosCount} (
                          {formatoMoneda(celda.emitidos.canceladosImporte)})
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {(filtroTipo === 'TODOS' || filtroTipo === 'RECIBIDO') && (
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>Recibidos ({celda.recibidos.count}):</span>
                      <span className="font-mono font-semibold text-emerald-300">
                        {formatoMoneda(celda.recibidos.importe)}
                      </span>
                    </div>
                  </div>
                )}

                {filtroTipo === 'TODOS' && (
                  <div className="flex justify-between border-t border-slate-800/80 pt-2 font-medium">
                    <span className="text-slate-300">Flujo Neto:</span>
                    <span
                      className={`font-mono ${celda.totalNeto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      {formatoMoneda(celda.totalNeto)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-800/40 pt-2 text-[11px] text-sky-400/80">
                <span>Ver comprobantes</span>
                <span>→</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-sky-900/40 bg-sky-950/20 p-3 text-xs text-sky-300/80">
        <Info className="h-4 w-4 shrink-0 text-sky-400" />
        <span>
          Haz clic en cualquier tarjeta mensual para inspeccionar individualmente los CFDIs de ese
          periodo, filtrar por clave de producto o revisar facturas canceladas en la metadata del
          SAT.
        </span>
      </div>
    </div>
  );
};
