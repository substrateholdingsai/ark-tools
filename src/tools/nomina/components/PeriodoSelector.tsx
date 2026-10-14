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
    <div className="rounded-[20px] bg-surface border border-line overflow-hidden">
      {/* Barra decorativa superior */}
      <div className="h-1 w-full bg-gradient-to-r from-navy via-navy to-gold" />

      <div className="p-5 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
            1. Período de pago
          </h2>
          <span className="text-[10px] font-mono text-muted">
            {LISTA_PERIODOS.length} opciones
          </span>
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
                className={`
                  flex flex-col items-center gap-1
                  px-2 py-3 rounded-[14px]
                  transition-all
                  font-orbitron font-bold tracking-[0.12em]
                  ${
                    activo
                      ? 'bg-navy text-white shadow-[0_4px_12px_rgba(0,43,127,0.25)]'
                      : 'bg-surface-2 border border-line text-muted hover:border-gold hover:text-navy'
                  }
                `}
                aria-pressed={activo}
              >
                <span className="text-[12px] uppercase">{periodo.label}</span>
                <span
                  className={`text-[9px] font-mono tracking-normal ${
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
        <div className="mt-4 rounded-[12px] bg-surface-2 border border-line px-4 py-3 flex items-center justify-between">
          <div className="text-[11px] text-muted">
            <span className="font-bold text-navy font-orbitron uppercase">
              {value}
            </span>
            {' · '}
            {LISTA_PERIODOS.find((p) => p.id === value)?.vecesAlAnio} pagos/año
          </div>
          <div className="text-[10px] font-mono text-muted">
            Tabla ISR mensual adaptada
          </div>
        </div>
      </div>
    </div>
  );
}
