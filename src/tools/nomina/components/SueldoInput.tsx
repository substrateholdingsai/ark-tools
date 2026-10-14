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
    <div className="rounded-[20px] bg-surface border border-line overflow-hidden">
      {/* Barra decorativa superior */}
      <div className="h-1 w-full bg-gradient-to-r from-navy via-navy to-gold" />

      <div className="p-5 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
            2. Percepciones del período
          </h2>
          <span className="text-[10px] font-mono text-muted uppercase">
            {parametros.periodo}
          </span>
        </div>

        {/* Input Sueldo Bruto */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="sueldo-bruto"
              className="text-[11px] font-bold tracking-[0.16em] text-navy uppercase"
            >
              Sueldo Bruto ({infoPeriodo.label})
            </label>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-surface-2 text-muted font-orbitron">
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
              className="
                w-full pl-8 pr-4 py-3 rounded-[14px]
                bg-surface-2 border border-line
                font-orbitron font-bold text-navy text-[18px]
                focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20
                transition-all
              "
              placeholder="0.00"
            />
          </div>

          {/* Presets rápidos */}
          <div className="mt-3 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-medium text-muted mr-1">Presets:</span>
            {PRESETS_SUELDO.map((preset) => {
              const valorAdaptado = calcularPresetPeriodo(preset.valor);
              const activo = Math.abs(parametros.sueldoBruto - valorAdaptado) < 1;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetClick(preset.valor)}
                  className={`
                    px-2.5 py-1 rounded-[8px] text-[10px] font-orbitron font-semibold transition-all
                    ${
                      activo
                        ? 'bg-gold text-navy shadow-sm'
                        : 'bg-surface-2 border border-line text-muted hover:border-gold hover:text-navy'
                    }
                  `}
                >
                  {preset.label} (${valorAdaptado.toLocaleString('es-MX')})
                </button>
              );
            })}
          </div>
        </div>

        {/* Días trabajados y SBC estimado en 2 columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-line">
          {/* Días trabajados */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="dias-trabajados"
                className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase"
              >
                Días Trabajados
              </label>
              <span className="text-[10px] font-mono text-muted">
                de {parametros.diasPeriodo}d
              </span>
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
              className="
                w-full px-3 py-2 rounded-[12px]
                bg-surface-2 border border-line
                font-orbitron font-bold text-navy text-[14px]
                focus:border-gold focus:outline-none
              "
            />
          </div>

          {/* Salario Base de Cotización (SBC) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="sbc-diario"
                className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase"
              >
                SBC Diario (IMSS)
              </label>
              <span className="text-[10px] font-mono text-muted">
                Factor ~1.05
              </span>
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
                onChange={(e) =>
                  onChange('sbcDiario', parseFloat(e.target.value) || 0)
                }
                className="
                  w-full pl-7 pr-3 py-2 rounded-[12px]
                  bg-surface-2 border border-line
                  font-orbitron font-bold text-navy text-[14px]
                  focus:border-gold focus:outline-none
                "
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
