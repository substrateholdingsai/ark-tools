/**
 * ARK TOOLS — Calculadora de Leasing
 * Componente: Formulario de Parámetros y Presets del Modelo
 */

import React from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Percent,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { PRESETS_MODELO } from '../lib/calcularLeasing';
import type { ParametrosLeasing } from '../types';

interface ParametrosLeasingCardProps {
  parametros: ParametrosLeasing;
  onChange: (nuevos: ParametrosLeasing) => void;
}

export const ParametrosLeasingCard: React.FC<ParametrosLeasingCardProps> = ({
  parametros,
  onChange,
}) => {
  const handleInputChange = (campo: keyof ParametrosLeasing, valor: number) => {
    onChange({
      ...parametros,
      [campo]: valor,
    });
  };

  const aplicarPreset = (preset: typeof PRESETS_MODELO[0]) => {
    onChange(preset.parametros);
  };

  return (
    <div className="w-full space-y-6">
      {/* Presets Rápidos */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          Escenarios Predeterminados
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESETS_MODELO.map((p) => {
            const isSelected =
              parametros.setupFee === p.parametros.setupFee &&
              parametros.rentaMensual === p.parametros.rentaMensual &&
              parametros.clientesIniciales === p.parametros.clientesIniciales;

            return (
              <button
                type="button"
                key={p.nombre}
                onClick={() => aplicarPreset(p)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-gold/20 border-gold text-ink shadow-md shadow-gold/10'
                    : 'bg-surface hover:bg-surface-raised border-white/5 text-muted hover:text-ink'
                }`}
              >
                <span className="font-semibold text-xs block text-ink">{p.nombre}</span>
                <span className="text-[10px] text-muted block mt-0.5 leading-tight">
                  {p.descripcion}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Variables Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Setup Fee */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-gold" />
            Costo de Setup Inicial ($ MXN)
          </label>
          <input
            type="number"
            min="0"
            step="50"
            value={parametros.setupFee}
            onChange={(e) => handleInputChange('setupFee', Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-base font-bold font-mono text-ink focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/40"
          />
          <span className="text-[10px] text-muted block">
            Cobro único de incorporación y alta contable
          </span>
        </div>

        {/* Renta Mensual */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            Renta Mensual por Cliente ($ MXN)
          </label>
          <input
            type="number"
            min="100"
            step="100"
            value={parametros.rentaMensual}
            onChange={(e) => handleInputChange('rentaMensual', Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-base font-bold font-mono text-gold focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/40"
          />
          <span className="text-[10px] text-muted block">
            Iguala o suscripción mensual recurrente
          </span>
        </div>

        {/* Clientes Iniciales */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gold" />
            Clientes Iniciales
          </label>
          <input
            type="number"
            min="0"
            max="500"
            value={parametros.clientesIniciales}
            onChange={(e) => handleInputChange('clientesIniciales', Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-base font-bold font-mono text-ink focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/40"
          />
          <span className="text-[10px] text-muted block">
            Cartera actual con la que inicias
          </span>
        </div>

        {/* Nuevos Clientes / Mes */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            Nuevos Clientes por Mes
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={parametros.clientesNuevosPorMes}
            onChange={(e) => handleInputChange('clientesNuevosPorMes', Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-base font-bold font-mono text-ink focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/40"
          />
          <span className="text-[10px] text-muted block">
            Ritmo promedio de captación mensual
          </span>
        </div>

        {/* Tasa Churn */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5 text-amber-400" />
            Tasa de Cancelación (Churn Mensual %)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={parametros.tasaChurnPorcentaje}
              onChange={(e) => handleInputChange('tasaChurnPorcentaje', Number(e.target.value))}
              className="flex-1 accent-amber-400"
            />
            <span className="w-12 text-right font-mono font-bold text-sm text-ink">
              {parametros.tasaChurnPorcentaje}%
            </span>
          </div>
          <span className="text-[10px] text-muted block">
            Porcentaje de bajas mensuales estimadas
          </span>
        </div>

        {/* Plazo de Proyección */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-gold" />
            Horizonte de Proyección
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[12, 24, 36].map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => handleInputChange('plazoMeses', p)}
                className={`py-2 text-center rounded-xl text-xs font-bold font-mono border transition-colors ${
                  parametros.plazoMeses === p
                    ? 'bg-gold text-navy border-gold'
                    : 'bg-surface hover:bg-surface-raised border-white/10 text-muted'
                }`}
              >
                {p} Meses
              </button>
            ))}
          </div>
          <span className="text-[10px] text-muted block">
            {parametros.plazoMeses === 12
              ? 'Proyección a 1 año'
              : parametros.plazoMeses === 24
              ? 'Proyección a 2 años'
              : 'Proyección a 3 años'}
          </span>
        </div>
      </div>
    </div>
  );
};
