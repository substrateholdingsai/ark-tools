/**
 * ARK TOOLS — Calculadora de Leasing
 * Componente: Formulario de Parámetros y Presets del Modelo
 */

import React from 'react';
import { Users, DollarSign, TrendingUp, Percent, Sliders, Sparkles } from 'lucide-react';
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

  const aplicarPreset = (preset: (typeof PRESETS_MODELO)[0]) => {
    onChange(preset.parametros);
  };

  return (
    <div className="w-full space-y-6">
      {/* Presets Rápidos */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          Escenarios Predeterminados
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
                className={`rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-gold bg-gold/20 text-ink shadow-md shadow-gold/10'
                    : 'hover:bg-surface-raised border-white/5 bg-surface text-muted hover:text-ink'
                }`}
              >
                <span className="block text-xs font-semibold text-ink">{p.nombre}</span>
                <span className="mt-0.5 block text-[10px] leading-tight text-muted">
                  {p.descripcion}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Variables Principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Setup Fee */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <DollarSign className="h-3.5 w-3.5 text-gold" />
            Costo de Setup Inicial ($ MXN)
          </label>
          <input
            type="number"
            min="0"
            step="50"
            value={parametros.setupFee}
            onChange={(e) => handleInputChange('setupFee', Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-surface px-4 py-2.5 font-mono text-base font-bold text-ink focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
          />
          <span className="block text-[10px] text-muted">
            Cobro único de incorporación y alta contable
          </span>
        </div>

        {/* Renta Mensual */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            Renta Mensual por Cliente ($ MXN)
          </label>
          <input
            type="number"
            min="100"
            step="100"
            value={parametros.rentaMensual}
            onChange={(e) => handleInputChange('rentaMensual', Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-surface px-4 py-2.5 font-mono text-base font-bold text-gold focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
          />
          <span className="block text-[10px] text-muted">
            Iguala o suscripción mensual recurrente
          </span>
        </div>

        {/* Clientes Iniciales */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <Users className="h-3.5 w-3.5 text-gold" />
            Clientes Iniciales
          </label>
          <input
            type="number"
            min="0"
            max="500"
            value={parametros.clientesIniciales}
            onChange={(e) => handleInputChange('clientesIniciales', Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-surface px-4 py-2.5 font-mono text-base font-bold text-ink focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
          />
          <span className="block text-[10px] text-muted">Cartera actual con la que inicias</span>
        </div>

        {/* Nuevos Clientes / Mes */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            Nuevos Clientes por Mes
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={parametros.clientesNuevosPorMes}
            onChange={(e) => handleInputChange('clientesNuevosPorMes', Number(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-surface px-4 py-2.5 font-mono text-base font-bold text-ink focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
          />
          <span className="block text-[10px] text-muted">Ritmo promedio de captación mensual</span>
        </div>

        {/* Tasa Churn */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
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
            <span className="w-12 text-right font-mono text-sm font-bold text-ink">
              {parametros.tasaChurnPorcentaje}%
            </span>
          </div>
          <span className="block text-[10px] text-muted">
            Porcentaje de bajas mensuales estimadas
          </span>
        </div>

        {/* Plazo de Proyección */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <Sliders className="h-3.5 w-3.5 text-gold" />
            Horizonte de Proyección
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[12, 24, 36].map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => handleInputChange('plazoMeses', p)}
                className={`rounded-xl border py-2 text-center font-mono text-xs font-bold transition-colors ${
                  parametros.plazoMeses === p
                    ? 'border-gold bg-gold text-navy'
                    : 'hover:bg-surface-raised border-white/10 bg-surface text-muted'
                }`}
              >
                {p} Meses
              </button>
            ))}
          </div>
          <span className="block text-[10px] text-muted">
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
