/**
 * ARK TOOLS — Panel de Filtros y Configuración de Actividades Vulnerables LFPIORPI
 */

import React from 'react';
import { Scale, Info, ShieldAlert } from 'lucide-react';
import type { FraccionLFPIORPI, ActividadVulnerable } from '../types';
import { CATALOGO_ACTIVIDADES_VULNERABLES } from '../lib/evaluadorActividadesVulnerables';

interface Props {
  fraccionSeleccionada: FraccionLFPIORPI;
  onCambiarFraccion: (fraccion: FraccionLFPIORPI) => void;
  umaDiaria: number;
}

export const PanelFiltrosVulnerables: React.FC<Props> = ({
  fraccionSeleccionada,
  onCambiarFraccion,
  umaDiaria,
}) => {
  const actividadActual: ActividadVulnerable =
    CATALOGO_ACTIVIDADES_VULNERABLES.find((a) => a.fraccion === fraccionSeleccionada) ??
    CATALOGO_ACTIVIDADES_VULNERABLES[0]!;

  const umbralIdMXN = actividadActual.umbralIdentificacionUMA * umaDiaria;
  const umbralAvMXN = actividadActual.umbralAvisoUMA * umaDiaria;

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Selector de Giro / Fracción */}
        <div className="flex-1 space-y-3">
          <label className="flex items-center gap-2 font-orbitron text-[11px] font-bold uppercase tracking-wider text-navy">
            <Scale size={16} className="text-gold-dark" />
            <span>Tipo de Actividad Vulnerable (Art. 17 LFPIORPI)</span>
          </label>
          <select
            value={fraccionSeleccionada}
            onChange={(e) => onCambiarFraccion(e.target.value as FraccionLFPIORPI)}
            className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 font-inter text-[14px] font-semibold text-ink transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          >
            {CATALOGO_ACTIVIDADES_VULNERABLES.map((act) => (
              <option key={act.fraccion} value={act.fraccion}>
                {act.nombre} — {act.descripcionCorta}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <Info size={14} className="shrink-0 text-navy" />
            <span>
              Fundamento: <strong className="text-ink">{actividadActual.fundamentoLegal}</strong>.
              Regla de acumulación obligatoria: <strong>6 meses continuos</strong>.
            </span>
          </div>
        </div>

        {/* Cajas de Umbrales Legales */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[460px]">
          {/* Umbral Identificación */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-amber-800">
                1. Identificación
              </span>
              <span className="rounded-full bg-amber-200/80 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-900">
                {actividadActual.umbralIdentificacionUMA.toLocaleString('es-MX')} UMA
              </span>
            </div>
            <div className="mt-2 font-mono text-xl font-black text-amber-950">
              $
              {umbralIdMXN.toLocaleString('es-MX', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              <span className="text-xs font-semibold text-amber-700">MXN</span>
            </div>
            <p className="mt-1 text-[11px] leading-tight text-amber-800">
              Obligación: Integrar expediente único de identificación del cliente.
            </p>
          </div>

          {/* Umbral Aviso UIF */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 font-orbitron text-[10px] font-bold uppercase tracking-wider text-rose-800">
                <ShieldAlert size={12} className="text-rose-600" />
                <span>2. Aviso SAT / UIF</span>
              </div>
              <span className="rounded-full bg-rose-200/80 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-900">
                {actividadActual.umbralAvisoUMA.toLocaleString('es-MX')} UMA
              </span>
            </div>
            <div className="mt-2 font-mono text-xl font-black text-rose-950">
              $
              {umbralAvMXN.toLocaleString('es-MX', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              <span className="text-xs font-semibold text-rose-700">MXN</span>
            </div>
            <p className="mt-1 text-[11px] leading-tight text-rose-800">
              Obligación: Presentar reporte en el Portal Antilavado (SPPLD).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
