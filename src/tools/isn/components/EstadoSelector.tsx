/**
 * ARK TOOLS — Calculadora ISN 2026
 * EstadoSelector
 *
 * Dropdown de selección de entidad federativa.
 * Muestra la tasa ISN 2026 y el artículo aplicable.
 */

import { ChevronDown } from 'lucide-react';
import { ESTADOS } from '../data/estados';
import type { Estado } from '../types';

interface EstadoSelectorProps {
  /** Estado actualmente seleccionado */
  value: Estado;
  /** Callback al cambiar de estado */
  onChange: (estado: Estado) => void;
}

export function EstadoSelector({ value, onChange }: EstadoSelectorProps) {
  return (
    <div className="rounded-[20px] bg-surface border border-line overflow-hidden">
      {/* Barra decorativa superior: gradiente navy → gold */}
      <div className="h-1 w-full bg-gradient-to-r from-navy via-navy to-gold" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
            1. Entidad Federativa
          </h2>
          <span className="text-[10px] font-mono text-muted">
            {ESTADOS.length} opciones
          </span>
        </div>

        {/* Select nativo estilizado */}
        <div className="relative">
          <select
            value={value.id}
            onChange={(e) => {
              const nuevoEstado = ESTADOS.find((s) => s.id === e.target.value);
              if (nuevoEstado) onChange(nuevoEstado);
            }}
            className="
              w-full appearance-none rounded-[12px]
              border border-line bg-surface-2
              px-4 py-3 pr-12
              font-inter text-[15px] font-semibold text-navy
              transition
              focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold
              cursor-pointer
            "
          >
            {ESTADOS.map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.nombre} — {estado.tasa.toFixed(1)}%
              </option>
            ))}
          </select>

          {/* Icono de chevron custom */}
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-navy flex items-center justify-center">
            <ChevronDown size={14} className="text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Meta: tasa, vigencia, artículo */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {/* Card de tasa (navy, destacada) */}
          <div className="rounded-[12px] bg-navy text-white p-3">
            <div className="text-[9px] tracking-[0.16em] opacity-70 font-bold">
              TASA 2026
            </div>
            <div className="font-orbitron font-black text-[22px] leading-none mt-1 tabular-nums">
              {value.tasa.toFixed(1)}%
            </div>
            <div className="text-[9px] mt-1 opacity-60 font-mono truncate">
              {value.articulo}
            </div>
          </div>

          {/* Card de vigencia + fuente (col-span-2) */}
          <div className="col-span-2 rounded-[12px] bg-surface-2 border border-line p-3">
            <div className="text-[9px] tracking-[0.16em] text-muted font-bold">
              VIGENCIA · FUENTE
            </div>
            <div className="text-[12px] font-semibold text-ink mt-1">
              {value.vigencia} · Código Fiscal {value.nombre}
            </div>
            <div className="text-[10px] text-muted mt-1 leading-tight">
              Base: total de erogaciones por trabajo personal subordinado.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
