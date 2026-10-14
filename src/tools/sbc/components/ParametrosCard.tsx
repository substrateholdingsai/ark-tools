/**
 * ARK TOOLS — Calculadora SBC 2026
 * ParametrosCard
 *
 * Card de entrada de parámetros.
 * Incluye: salario diario (input + presets), vacaciones (slider + presets),
 * prima vacacional (input), aguinaldo (input).
 */

import { formatearFactor } from '../lib/calcularSBC';
import { PRESETS_SALARIO, PRESETS_VACACIONES } from '../data/uma';
import type { ParametrosSBC, ResultadoSBC } from '../types';

interface ParametrosCardProps {
  parametros: ParametrosSBC;
  onChange: (campo: keyof ParametrosSBC, valor: number) => void;
  resultado: ResultadoSBC;
}

export function ParametrosCard({
  parametros,
  onChange,
  resultado,
}: ParametrosCardProps) {
  return (
    <div className="rounded-[20px] bg-surface border border-line overflow-hidden">
      {/* Barra decorativa superior */}
      <div className="h-1 w-full bg-gradient-to-r from-navy via-navy to-gold" />

      <div className="p-5 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
            Parámetros del colaborador
          </h3>
          <span className="text-[10px] text-muted font-mono">
            Ajusta y ve el impacto
          </span>
        </div>

        {/* Campo 1: Salario diario */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="salario-diario"
              className="text-[11px] font-bold tracking-[0.16em] text-navy uppercase"
            >
              Salario diario
            </label>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-surface-2 text-muted font-orbitron">
              BASE COTIZACIÓN
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] font-bold text-muted">
              $
            </span>
            <input
              id="salario-diario"
              type="number"
              inputMode="decimal"
              value={parametros.salarioDiario}
              onChange={(e) =>
                onChange('salarioDiario', Math.max(0, Number(e.target.value) || 0))
              }
              className="
                w-full h-14 pl-8 pr-20 rounded-[14px]
                border border-line bg-surface
                font-orbitron font-bold text-[19px] text-navy
                tabular-nums
                focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy
                transition
              "
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold tracking-[0.16em] text-muted font-orbitron">
              MXN / DÍA
            </span>
          </div>

          {/* Presets de salario */}
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS_SALARIO.map((preset) => (
              <button
                key={preset.valor}
                type="button"
                onClick={() => onChange('salarioDiario', preset.valor)}
                className={`
                  px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.14em]
                  border transition uppercase font-orbitron
                  ${
                    parametros.salarioDiario === preset.valor
                      ? 'bg-navy text-white border-navy'
                      : 'bg-surface text-muted border-line hover:border-gold hover:text-navy'
                  }
                `}
                title={preset.label}
              >
                ${preset.valor}
              </button>
            ))}
          </div>
        </div>

        {/* Campo 2: Días de vacaciones (slider) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label
              htmlFor="dias-vacaciones"
              className="text-[11px] font-bold tracking-[0.16em] text-navy uppercase"
            >
              Días de vacaciones
            </label>
            <div className="flex items-center gap-2">
              <span className="min-w-[40px] h-[28px] px-2 rounded-full bg-cream border border-parchment text-[13px] font-black text-gold-dark grid place-items-center font-orbitron tabular-nums">
                {parametros.diasVacaciones}
              </span>
              <span className="text-[10px] text-muted font-mono">
                LFT 6-32
              </span>
            </div>
          </div>

          <input
            id="dias-vacaciones"
            type="range"
            min={6}
            max={32}
            step={1}
            value={parametros.diasVacaciones}
            onChange={(e) => onChange('diasVacaciones', Number(e.target.value))}
            className="
              w-full appearance-none h-1.5 rounded-full
              bg-gradient-to-r from-navy from-0% via-navy to-surface-2 to-100%
            "
            style={{
              background: `linear-gradient(to right, var(--navy) 0%, var(--navy) ${
                ((parametros.diasVacaciones - 6) / 26) * 100
              }%, var(--line) ${((parametros.diasVacaciones - 6) / 26) * 100}%, var(--line) 100%)`,
            }}
          />

          <div className="flex justify-between mt-2 text-[10px] font-bold tracking-[0.14em] text-muted font-orbitron">
            <span>6 DÍAS</span>
            <span>19 DÍAS</span>
            <span>32 DÍAS</span>
          </div>

          {/* Presets de vacaciones */}
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS_VACACIONES.map((preset) => (
              <button
                key={preset.valor}
                type="button"
                onClick={() => onChange('diasVacaciones', preset.valor)}
                className={`
                  px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.12em]
                  border transition uppercase font-orbitron
                  ${
                    parametros.diasVacaciones === preset.valor
                      ? 'bg-navy text-white border-navy'
                      : 'bg-surface text-muted border-line hover:border-gold hover:text-navy'
                  }
                `}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid 2 columnas: Prima + Aguinaldo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Prima vacacional */}
          <div>
            <label
              htmlFor="prima-vacacional"
              className="block text-[11px] font-bold tracking-[0.16em] text-navy uppercase mb-2"
            >
              Prima vacacional
            </label>
            <div className="relative">
              <input
                id="prima-vacacional"
                type="number"
                inputMode="decimal"
                value={parametros.primaVacacional}
                onChange={(e) =>
                  onChange(
                    'primaVacacional',
                    Math.max(0, Math.min(100, Number(e.target.value) || 0))
                  )
                }
                className="
                  w-full h-[52px] pl-4 pr-12 rounded-[14px]
                  border border-line bg-surface
                  font-orbitron font-bold text-[18px] text-navy
                  tabular-nums
                  focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy
                "
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[16px] font-bold text-muted font-orbitron">
                %
              </span>
            </div>
            <div className="mt-2 text-[10px] text-muted font-mono">
              Por defecto LFT: 25%
            </div>
          </div>

          {/* Aguinaldo */}
          <div>
            <label
              htmlFor="dias-aguinaldo"
              className="block text-[11px] font-bold tracking-[0.16em] text-navy uppercase mb-2"
            >
              Aguinaldo
            </label>
            <div className="relative">
              <input
                id="dias-aguinaldo"
                type="number"
                inputMode="decimal"
                value={parametros.diasAguinaldo}
                onChange={(e) =>
                  onChange(
                    'diasAguinaldo',
                    Math.max(0, Number(e.target.value) || 0)
                  )
                }
                className="
                  w-full h-[52px] pl-4 pr-12 rounded-[14px]
                  border border-line bg-surface
                  font-orbitron font-bold text-[18px] text-navy
                  tabular-nums
                  focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy
                "
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold tracking-[0.14em] text-muted font-orbitron">
                DÍAS
              </span>
            </div>
            <div className="mt-2 text-[10px] text-muted font-mono">
              Mínimo legal: 15 días
            </div>
          </div>
        </div>

        {/* Info contextual: fórmula aplicada */}
        <div className="rounded-[14px] bg-surface-2 border border-line p-4 flex gap-3">
          <div className="w-7 h-7 rounded-full bg-navy text-white grid place-items-center text-[12px] font-black shrink-0">
            ƒ
          </div>
          <div className="text-[11px] leading-[1.5] text-muted">
            <span className="font-bold text-navy font-orbitron">
              FÓRMULA IMSS:
            </span>{' '}
            Factor = 1 + (Vacaciones × Prima% + Aguinaldo) ÷ 365.
            <br />
            <span className="text-muted font-mono text-[10px]">
              Ej: 1 + ({parametros.diasVacaciones} × {parametros.primaVacacional}% +{' '}
              {parametros.diasAguinaldo}) ÷ 365 = {formatearFactor(resultado.factor)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
