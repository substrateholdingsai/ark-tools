/**
 * ARK TOOLS — Calculadora Nómina Rápida 2026
 * SueldoInput
 *
 * Entrada de sueldo bruto del período, días trabajados y SBC estimado.
 * Incluye presets rápidos según el período seleccionado.
 */

import React from 'react';
import { PRESETS_SUELDO } from '../data/defaults';
import { PERIODOS } from '../data/periodos';
import type { ParametrosNomina } from '../types';

interface SueldoInputProps {
  parametros: ParametrosNomina;
  onChange: <K extends keyof ParametrosNomina>(campo: K, valor: ParametrosNomina[K]) => void;
}

export function SueldoInput({ parametros, onChange }: SueldoInputProps) {
  const infoPeriodo = PERIODOS[parametros.periodo];

  // Presets adaptados al período actual
  const calcularPresetPeriodo = (valorMensual: number) => {
    switch (parametros.periodo) {
      case 'diario':
        return Math.round((valorMensual / 30) * 100) / 100;
      case 'semanal':
        return Math.round(((valorMensual * 12) / 52) * 100) / 100;
      case 'quincenal':
        return Math.round((valorMensual / 2) * 100) / 100;
      case 'mensual':
      default:
        return valorMensual;
    }
  };

  const handlePresetClick = (valorMensual: number) => {
    const nuevoSueldo = calcularPresetPeriodo(valorMensual);
    onChange('sueldoBruto', nuevoSueldo);

    // Ajustar SBC estimado correspondiente:
    // Salario diario = nuevoSueldo / diasPeriodo * factor integración 1.0493
    const salarioDiario = nuevoSueldo / infoPeriodo.dias;
    const nuevoSBC = Math.round(salarioDiario * 1.0493 * 100) / 100;
    onChange('sbcDiario', nuevoSBC);
  };

  const handleSueldoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    onChange('sueldoBruto', val);

    // Auto-actualizar SBC estimado proporcional
    const salarioDiario = val / infoPeriodo.dias;
    const nuevoSBC = Math.round(salarioDiario * 1.0493 * 100) / 100;
    onChange('sbcDiario', nuevoSBC);
  };

  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
      {/* Barra decorativa superior */}
      <div className="h-1 w-full bg-gradient-to-r from-navy via-navy to-gold" />

      <div className="space-y-6 p-5 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
            2. Percepciones del período
          </h2>
          <span className="font-mono text-[10px] uppercase text-muted">{parametros.periodo}</span>
        </div>

        {/* Input Sueldo Bruto */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="sueldo-bruto"
              className="text-[11px] font-bold uppercase tracking-[0.16em] text-navy"
            >
              Sueldo Bruto ({infoPeriodo.label})
            </label>
            <span className="rounded-full bg-surface-2 px-2 py-0.5 font-orbitron text-[9px] text-muted">
              BASE GRAVABLE
            </span>
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] font-bold text-muted">
              $
            </span>
            <input
              id="sueldo-bruto"
              type="number"
              min="0"
              step="100"
              value={parametros.sueldoBruto || ''}
              onChange={handleSueldoChange}
              className="w-full rounded-[14px] border border-line bg-surface-2 py-3 pl-8 pr-4 font-orbitron text-[18px] font-bold text-navy transition-all focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
              placeholder="0.00"
            />
          </div>

          {/* Presets rápidos */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] font-medium text-muted">Presets:</span>
            {PRESETS_SUELDO.map((preset) => {
              const valorAdaptado = calcularPresetPeriodo(preset.valor);
              const activo = Math.abs(parametros.sueldoBruto - valorAdaptado) < 1;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetClick(preset.valor)}
                  className={`rounded-[8px] px-2.5 py-1 font-orbitron text-[10px] font-semibold transition-all ${
                    activo
                      ? 'bg-gold text-navy shadow-sm'
                      : 'border border-line bg-surface-2 text-muted hover:border-gold hover:text-navy'
                  } `}
                >
                  {preset.label} (${valorAdaptado.toLocaleString('es-MX')})
                </button>
              );
            })}
          </div>
        </div>

        {/* Días trabajados y SBC estimado en 2 columnas */}
        <div className="grid grid-cols-1 gap-4 border-t border-line pt-2 sm:grid-cols-2">
          {/* Días trabajados */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="dias-trabajados"
                className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted"
              >
                Días Trabajados
              </label>
              <span className="font-mono text-[10px] text-muted">de {parametros.diasPeriodo}d</span>
            </div>
            <input
              id="dias-trabajados"
              type="number"
              min="0"
              max={parametros.diasPeriodo}
              value={parametros.diasTrabajados}
              onChange={(e) =>
                onChange(
                  'diasTrabajados',
                  Math.min(parametros.diasPeriodo, Math.max(0, parseFloat(e.target.value) || 0))
                )
              }
              className="w-full rounded-[12px] border border-line bg-surface-2 px-3 py-2 font-orbitron text-[14px] font-bold text-navy focus:border-gold focus:outline-none"
            />
          </div>

          {/* Salario Base de Cotización (SBC) */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="sbc-diario"
                className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted"
              >
                SBC Diario (IMSS)
              </label>
              <span className="font-mono text-[10px] text-muted">Factor ~1.05</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-muted">
                $
              </span>
              <input
                id="sbc-diario"
                type="number"
                min="0"
                step="10"
                value={parametros.sbcDiario || ''}
                onChange={(e) => onChange('sbcDiario', parseFloat(e.target.value) || 0)}
                className="w-full rounded-[12px] border border-line bg-surface-2 py-2 pl-7 pr-3 font-orbitron text-[14px] font-bold text-navy focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
