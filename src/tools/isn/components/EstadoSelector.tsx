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
    <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
      {/* Barra decorativa superior: gradiente navy → gold */}
      <div className="h-1 w-full bg-gradient-to-r from-navy via-navy to-gold" />

      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
            1. Entidad Federativa
          </h2>
          <span className="font-mono text-[10px] text-muted">{ESTADOS.length} opciones</span>
        </div>

        {/* Select nativo estilizado */}
        <div className="relative">
          <select
            value={value.id}
            onChange={(e) => {
              const nuevoEstado = ESTADOS.find((s) => s.id === e.target.value);
              if (nuevoEstado) onChange(nuevoEstado);
            }}
            className="w-full cursor-pointer appearance-none rounded-[12px] border border-line bg-surface-2 px-4 py-3 pr-12 font-inter text-[15px] font-semibold text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            {ESTADOS.map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.nombre} — {estado.tasa.toFixed(1)}%
              </option>
            ))}
          </select>

          {/* Icono de chevron custom */}
          <div className="pointer-events-none absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-navy">
            <ChevronDown size={14} className="text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Meta: tasa, vigencia, artículo */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {/* Card de tasa (navy, destacada) */}
          <div className="rounded-[12px] bg-navy p-3 text-white">
            <div className="text-[9px] font-bold tracking-[0.16em] opacity-70">TASA 2026</div>
            <div className="mt-1 font-orbitron text-[22px] font-black tabular-nums leading-none">
              {value.tasa.toFixed(1)}%
            </div>
            <div className="mt-1 truncate font-mono text-[9px] opacity-60">{value.articulo}</div>
          </div>

          {/* Card de vigencia + fuente (col-span-2) */}
          <div className="col-span-2 rounded-[12px] border border-line bg-surface-2 p-3">
            <div className="text-[9px] font-bold tracking-[0.16em] text-muted">
              VIGENCIA · FUENTE
            </div>
            <div className="mt-1 text-[12px] font-semibold text-ink">
              {value.vigencia} · Código Fiscal {value.nombre}
            </div>
            <div className="mt-1 text-[10px] leading-tight text-muted">
              Base: total de erogaciones por trabajo personal subordinado.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
