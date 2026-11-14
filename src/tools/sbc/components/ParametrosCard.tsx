import { AlertTriangle } from 'lucide-react';
import { formatearFactor } from '../lib/calcularSBC';
import {
  PRESETS_SALARIO,
  TABLA_VACACIONES_LFT,
  diasVacacionesPorAntiguedad,
  CONSTANTES_IMSS,
} from '../data/uma';
import type { ParametrosSBC, ResultadoSBC, ZonaSalarial } from '../types';

interface ParametrosCardProps {
  parametros: ParametrosSBC;
  onChange: (campo: keyof ParametrosSBC, valor: number | string | boolean) => void;
  resultado: ResultadoSBC;
}

export function ParametrosCard({ parametros, onChange, resultado }: ParametrosCardProps) {
  const anios = parametros.aniosAntiguedad ?? 1;
  const menorDeUnAnio = parametros.menorDeUnAnio ?? anios < 1;
  const diasTabla = !menorDeUnAnio && anios >= 1 ? diasVacacionesPorAntiguedad(anios) : null;
  const diasNoCoinciden = diasTabla !== null && parametros.diasVacaciones !== diasTabla;
  const sliderMin = menorDeUnAnio ? 0 : 12;
  const presetAnios = [1, 2, 3, 4, 5, 6, 10, 11, 15, 20, 25, 30, 31];

  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
      <div className="h-1 w-full bg-gradient-to-r from-navy via-navy to-gold" />
      <div className="space-y-6 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
            Parámetros del colaborador
          </h3>
          <span className="font-mono text-[10px] text-muted">Ajusta y ve el impacto</span>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-navy">
            Zona salarial (límite inferior, LSS Art. 28)
          </label>
          <div className="flex gap-2">
            {[
              {
                v: 'general' as ZonaSalarial,
                label: `General ($${CONSTANTES_IMSS.salarioMinimoGeneral})`,
              },
              {
                v: 'frontera' as ZonaSalarial,
                label: `ZLFN ($${CONSTANTES_IMSS.salarioMinimoFrontera})`,
              },
            ].map((opt) => (
              <button
                key={opt.v}
                type="button"
                data-testid={`zona-${opt.v}`}
                onClick={() => onChange('zona', opt.v)}
                className={`flex-1 rounded-[12px] border px-3 py-2.5 font-orbitron text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                  (parametros.zona ?? 'general') === opt.v
                    ? 'border-navy bg-navy text-white'
                    : 'border-line bg-surface text-muted hover:border-gold hover:text-navy'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="mt-2 font-mono text-[10px] text-muted">
            Default: General (resto del país). ZLFN solo si aplica zona fronteriza norte.
          </div>
        </div>

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
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS_SALARIO.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange('salarioDiario', preset.valor)}
                className={`rounded-full border px-3.5 py-1.5 font-orbitron text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                  parametros.salarioDiario === preset.valor
                    ? 'border-navy bg-navy text-white'
                    : 'border-line bg-surface text-muted hover:border-gold hover:text-navy'
                }`}
                title={preset.label}
              >
                ${preset.valor}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-[14px] border border-line bg-surface-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="anios-antiguedad"
              className="text-[11px] font-bold uppercase tracking-[0.16em] text-navy"
            >
              Antigüedad (años)
            </label>
            <span className="font-mono text-[10px] text-muted">LFT Art. 76 (DOF 27/12/2022)</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-[12px] text-ink">
              <input
                type="checkbox"
                data-testid="menor-un-anio"
                checked={menorDeUnAnio}
                onChange={(e) => onChange('menorDeUnAnio', e.target.checked)}
              />
              &lt; 1 año (proporcional)
            </label>
            {!menorDeUnAnio && (
              <input
                id="anios-antiguedad"
                type="number"
                min={1}
                max={35}
                data-testid="anios-antiguedad"
                value={anios}
                onChange={(e) =>
                  onChange(
                    'aniosAntiguedad',
                    Math.max(1, Math.min(35, Number(e.target.value) || 1))
                  )
                }
                className="h-10 w-24 rounded-[10px] border border-line bg-surface px-3 font-orbitron text-[14px] font-bold tabular-nums text-navy"
              />
            )}
            {diasTabla !== null && (
              <span className="text-[11px] text-muted">
                Días por tabla:{' '}
                <strong className="text-navy" data-testid="dias-tabla">
                  {diasTabla}
                </strong>
              </span>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="dias-vacaciones"
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-navy"
              >
                Días de vacaciones
              </label>
              <span className="grid h-[28px] min-w-[40px] place-items-center rounded-full border border-parchment bg-cream px-2 font-orbitron text-[13px] font-black tabular-nums text-gold-dark">
                {parametros.diasVacaciones}
              </span>
            </div>
            <input
              id="dias-vacaciones"
              type="range"
              min={sliderMin}
              max={32}
              step={1}
              data-testid="slider-vacaciones"
              value={parametros.diasVacaciones}
              onChange={(e) => onChange('diasVacaciones', Number(e.target.value))}
              className="h-1.5 w-full appearance-none rounded-full"
              style={{
                background: `linear-gradient(to right, var(--navy) 0%, var(--navy) ${((parametros.diasVacaciones - sliderMin) / Math.max(1, 32 - sliderMin)) * 100}%, var(--line) ${((parametros.diasVacaciones - sliderMin) / Math.max(1, 32 - sliderMin)) * 100}%, var(--line) 100%)`,
              }}
            />
            <div className="mt-1 font-mono text-[10px] text-muted">
              {menorDeUnAnio
                ? 'Menor de 1 año: captura días proporcionales (0-32).'
                : 'Mínimo 12 días para ≥1 año (Art. 76 LFT).'}
            </div>
          </div>

          {diasNoCoinciden && (
            <div
              className="flex gap-2 rounded-[10px] border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800"
              data-testid="warning-vacaciones"
            >
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                Los días capturados ({parametros.diasVacaciones}) no coinciden con la tabla Art. 76
                LFT para {anios} año(s): {diasTabla} días.
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {TABLA_VACACIONES_LFT.filter((p) => presetAnios.includes(p.anios)).map((preset) => (
              <button
                key={preset.label}
                type="button"
                data-testid={`preset-vac-${preset.anios}`}
                onClick={() => onChange('aniosAntiguedad', preset.anios)}
                className={`rounded-full border px-3 py-1 font-orbitron text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                  !menorDeUnAnio && anios === preset.anios
                    ? 'border-navy bg-navy text-white'
                    : 'border-line bg-surface text-muted hover:border-gold hover:text-navy'
                }`}
              >
                {preset.label}: {preset.dias}d
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
            <div className="mt-2 font-mono text-[10px] text-muted">Mínimo LFT Art. 80: 25%</div>
          </div>
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
            <div className="mt-2 font-mono text-[10px] text-muted">Mínimo LFT Art. 87: 15 días</div>
          </div>
        </div>

        <div className="flex gap-3 rounded-[14px] border border-line bg-surface-2 p-4">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy text-[12px] font-black text-white">
            ƒ
          </div>
          <div className="text-[11px] leading-[1.5] text-muted">
            <span className="font-orbitron font-bold text-navy">FÓRMULA:</span> Factor = 1 +
            (Vacaciones × Prima% + Aguinaldo) ÷ 365.
            <br />
            <span className="font-mono text-[10px] text-muted">
              1 + ({parametros.diasVacaciones} × {parametros.primaVacacional}% +{' '}
              {parametros.diasAguinaldo}) ÷ 365 = {formatearFactor(resultado.factor)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
