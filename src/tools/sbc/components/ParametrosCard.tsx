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

export function ParametrosCard({ parametros, onChange, resultado }: ParametrosCardProps) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
      {/* Barra decorativa superior */}
      <div className="h-1 w-full bg-gradient-to-r from-navy via-navy to-gold" />

      <div className="space-y-6 p-5 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
            Parámetros del colaborador
          </h3>
          <span className="font-mono text-[10px] text-muted">Ajusta y ve el impacto</span>
        </div>

        {/* Campo 1: Salario diario */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="salario-diario"
              className="text-[11px] font-bold uppercase tracking-[0.16em] text-navy"
            >
              Salario diario
            </label>
            <span className="rounded-full bg-surface-2 px-2 py-0.5 font-orbitron text-[9px] text-muted">
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
              onChange={(e) => onChange('salarioDiario', Math.max(0, Number(e.target.value) || 0))}
              className="h-14 w-full rounded-[14px] border border-line bg-surface pl-8 pr-20 font-orbitron text-[19px] font-bold tabular-nums text-navy transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-orbitron text-[10px] font-bold tracking-[0.16em] text-muted">
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
                className={`rounded-full border px-3.5 py-1.5 font-orbitron text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                  parametros.salarioDiario === preset.valor
                    ? 'border-navy bg-navy text-white'
                    : 'border-line bg-surface text-muted hover:border-gold hover:text-navy'
                } `}
                title={preset.label}
              >
                ${preset.valor}
              </button>
            ))}
          </div>
        </div>

        {/* Campo 2: Días de vacaciones (slider) */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label
              htmlFor="dias-vacaciones"
              className="text-[11px] font-bold uppercase tracking-[0.16em] text-navy"
            >
              Días de vacaciones
            </label>
            <div className="flex items-center gap-2">
              <span className="grid h-[28px] min-w-[40px] place-items-center rounded-full border border-parchment bg-cream px-2 font-orbitron text-[13px] font-black tabular-nums text-gold-dark">
                {parametros.diasVacaciones}
              </span>
              <span className="font-mono text-[10px] text-muted">LFT 6-32</span>
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
            className="h-1.5 w-full appearance-none rounded-full bg-gradient-to-r from-navy from-0% via-navy to-surface-2 to-100%"
            style={{
              background: `linear-gradient(to right, var(--navy) 0%, var(--navy) ${
                ((parametros.diasVacaciones - 6) / 26) * 100
              }%, var(--line) ${((parametros.diasVacaciones - 6) / 26) * 100}%, var(--line) 100%)`,
            }}
          />

          <div className="mt-2 flex justify-between font-orbitron text-[10px] font-bold tracking-[0.14em] text-muted">
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
                className={`rounded-full border px-3 py-1 font-orbitron text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                  parametros.diasVacaciones === preset.valor
                    ? 'border-navy bg-navy text-white'
                    : 'border-line bg-surface text-muted hover:border-gold hover:text-navy'
                } `}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid 2 columnas: Prima + Aguinaldo */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Prima vacacional */}
          <div>
            <label
              htmlFor="prima-vacacional"
              className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-navy"
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
                className="h-[52px] w-full rounded-[14px] border border-line bg-surface pl-4 pr-12 font-orbitron text-[18px] font-bold tabular-nums text-navy focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-orbitron text-[16px] font-bold text-muted">
                %
              </span>
            </div>
            <div className="mt-2 font-mono text-[10px] text-muted">Por defecto LFT: 25%</div>
          </div>

          {/* Aguinaldo */}
          <div>
            <label
              htmlFor="dias-aguinaldo"
              className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-navy"
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
                  onChange('diasAguinaldo', Math.max(0, Number(e.target.value) || 0))
                }
                className="h-[52px] w-full rounded-[14px] border border-line bg-surface pl-4 pr-12 font-orbitron text-[18px] font-bold tabular-nums text-navy focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-orbitron text-[10px] font-bold tracking-[0.14em] text-muted">
                DÍAS
              </span>
            </div>
            <div className="mt-2 font-mono text-[10px] text-muted">Mínimo legal: 15 días</div>
          </div>
        </div>

        {/* Info contextual: fórmula aplicada */}
        <div className="flex gap-3 rounded-[14px] border border-line bg-surface-2 p-4">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy text-[12px] font-black text-white">
            ƒ
          </div>
          <div className="text-[11px] leading-[1.5] text-muted">
            <span className="font-orbitron font-bold text-navy">FÓRMULA IMSS:</span> Factor = 1 +
            (Vacaciones × Prima% + Aguinaldo) ÷ 365.
            <br />
            <span className="font-mono text-[10px] text-muted">
              Ej: 1 + ({parametros.diasVacaciones} × {parametros.primaVacacional}% +{' '}
              {parametros.diasAguinaldo}) ÷ 365 = {formatearFactor(resultado.factor)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
