/**
 * ARK TOOLS — Calculadora Nómina Rápida 2026
 * PeriodoSelector
 *
 * Selector de período de pago: Diario, Semanal, Quincenal, Mensual.
 * Usa pills con estado activo (navy) e inactivo (surface).
 */

import { LISTA_PERIODOS } from '../data/periodos';
import type { Periodo } from '../types';

interface PeriodoSelectorProps {
  /** Período actualmente seleccionado */
  value: Periodo;
  /** Callback al cambiar de período */
  onChange: (periodo: Periodo) => void;
}

export function PeriodoSelector({ value, onChange }: PeriodoSelectorProps) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
      {/* Barra decorativa superior */}
      <div className="h-1 w-full bg-gradient-to-r from-navy via-navy to-gold" />

      <div className="p-5 md:p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
            1. Período de pago
          </h2>
          <span className="font-mono text-[10px] text-muted">{LISTA_PERIODOS.length} opciones</span>
        </div>

        {/* Grid de 4 botones */}
        <div className="grid grid-cols-4 gap-2">
          {LISTA_PERIODOS.map((periodo) => {
            const activo = value === periodo.id;
            return (
              <button
                key={periodo.id}
                type="button"
                onClick={() => onChange(periodo.id)}
                className={`flex flex-col items-center gap-1 rounded-[14px] px-2 py-3 font-orbitron font-bold tracking-[0.12em] transition-all ${
                  activo
                    ? 'bg-navy text-white shadow-[0_4px_12px_rgba(0,43,127,0.25)]'
                    : 'border border-line bg-surface-2 text-muted hover:border-gold hover:text-navy'
                } `}
                aria-pressed={activo}
              >
                <span className="text-[12px] uppercase">{periodo.label}</span>
                <span
                  className={`font-mono text-[9px] tracking-normal ${
                    activo ? 'text-white/70' : 'text-muted'
                  }`}
                >
                  {periodo.dias}d
                </span>
              </button>
            );
          })}
        </div>

        {/* Info del período activo */}
        <div className="mt-4 flex items-center justify-between rounded-[12px] border border-line bg-surface-2 px-4 py-3">
          <div className="text-[11px] text-muted">
            <span className="font-orbitron font-bold uppercase text-navy">{value}</span>
            {' · '}
            {LISTA_PERIODOS.find((p) => p.id === value)?.vecesAlAnio} pagos/año
          </div>
          <div className="font-mono text-[10px] text-muted">Tabla ISR mensual adaptada</div>
        </div>
      </div>
    </div>
  );
}
