import { useState } from 'react';
import { Calendar, DollarSign, Clock, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';
import type { EntradaRecargos } from '../types';

interface Props {
  entrada: EntradaRecargos;
  onChange: (entrada: EntradaRecargos) => void;
}

export function ParametrosRecargosCard({ entrada, onChange }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  const errorFechas = entrada.fechaPago < entrada.fechaVencimiento;

  const aplicarPreset = (mesesAtraso: number, importePreset?: number) => {
    const hoy = new Date();
    const fPago = hoy.toISOString().split('T')[0]!;

    const fVencDate = new Date(hoy);
    fVencDate.setMonth(fVencDate.getMonth() - mesesAtraso);
    // Asegurar día 17 (día legal estándar de pago de impuestos en México)
    fVencDate.setDate(17);
    const fVenc = fVencDate.toISOString().split('T')[0]!;

    onChange({
      ...entrada,
      fechaVencimiento: fVenc,
      fechaPago: fPago,
      importeHistorico: importePreset ?? entrada.importeHistorico,
    });
  };

  return (
    <div className="space-y-6 rounded-[24px] border border-line bg-surface p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <span className="block font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
            PARÁMETROS DE FISCALIZACIÓN
          </span>
          <h2 className="mt-0.5 font-playfair text-xl font-black text-navy">
            Adeudo y Fechas de Cómputo
          </h2>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTooltip(!showTooltip)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition hover:border-navy hover:text-navy"
            title="Fundamento Legal"
          >
            <HelpCircle size={16} />
          </button>
          {showTooltip && (
            <div className="absolute right-0 top-10 z-20 w-72 rounded-xl border border-line bg-surface p-4 text-[11px] leading-relaxed text-muted shadow-xl">
              <strong className="block font-bold text-navy">CFF Art. 17-A y 21:</strong>
              El factor de actualización se obtiene dividiendo el INPC del mes anterior al más
              reciente del periodo de pago entre el del mes anterior al más antiguo de vencimiento,
              truncado a 4 decimales. Los recargos se causan a razón del 1.47% mensual por cada mes
              o fracción transcurrido.
            </div>
          )}
        </div>
      </div>

      {/* Importe del Impuesto Omitido */}
      <div className="space-y-1.5">
        <label
          htmlFor="importeHistorico"
          className="flex items-center gap-1.5 font-inter text-xs font-bold uppercase tracking-wider text-navy"
        >
          <DollarSign size={14} className="text-gold-dark" />
          <span>Impuesto Omitido / Adeudo Histórico (MXN)</span>
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 font-mono text-base font-bold text-muted">
            $
          </span>
          <input
            id="importeHistorico"
            type="number"
            min="0"
            step="0.01"
            value={entrada.importeHistorico || ''}
            onChange={(e) =>
              onChange({
                ...entrada,
                importeHistorico: Math.max(0, parseFloat(e.target.value) || 0),
              })
            }
            placeholder="0.00"
            className="w-full rounded-xl border border-line bg-white py-3.5 pl-9 pr-4 font-mono text-lg font-bold text-ink transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/10"
          />
        </div>
        <span className="block text-[11px] text-muted">
          Importe nominal de la contribución omitida (ISR, IVA, IEPS, retenciones, etc.).
        </span>
      </div>

      {/* Selectores de Fechas: Vencimiento vs Pago */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="fechaVencimiento"
            className="flex items-center gap-1.5 font-inter text-xs font-bold uppercase tracking-wider text-navy"
          >
            <Calendar size={14} className="text-navy" />
            <span>Fecha en que debió pagarse</span>
          </label>
          <input
            id="fechaVencimiento"
            type="date"
            value={entrada.fechaVencimiento}
            onChange={(e) => onChange({ ...entrada, fechaVencimiento: e.target.value })}
            className="w-full rounded-xl border border-line bg-white px-3.5 py-3 font-mono text-sm font-medium text-ink transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/10"
          />
          <span className="block text-[10.5px] text-muted">
            Fecha límite legal de exigibilidad (ej. día 17 del mes).
          </span>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="fechaPago"
            className="flex items-center gap-1.5 font-inter text-xs font-bold uppercase tracking-wider text-navy"
          >
            <Clock size={14} className="text-gold-dark" />
            <span>Fecha efectiva de pago</span>
          </label>
          <input
            id="fechaPago"
            type="date"
            value={entrada.fechaPago}
            onChange={(e) => onChange({ ...entrada, fechaPago: e.target.value })}
            className={`w-full rounded-xl border px-3.5 py-3 font-mono text-sm font-medium text-ink transition focus:outline-none focus:ring-2 ${
              errorFechas
                ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-200'
                : 'border-line bg-white focus:border-navy focus:ring-navy/10'
            }`}
          />
          <span className="block text-[10.5px] text-muted">
            Día en que se liquida o liquidará el adeudo tributario.
          </span>
        </div>
      </div>

      {/* Alerta de validación de fechas */}
      {errorFechas && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
          <span>
            <strong>Inconsistencia temporal:</strong> La fecha de pago no puede ser anterior a la
            fecha de vencimiento del adeudo.
          </span>
        </div>
      )}

      {/* Presets de demostración con 1-click */}
      <div className="space-y-2 border-t border-line/80 pt-4">
        <span className="block font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
          Escenarios Típicos de Auditoría (1-Click)
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => aplicarPreset(3, 25000)}
            className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-navy hover:bg-white"
          >
            <Sparkles size={12} className="text-gold-dark" /> 3 Meses ($25,000)
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset(6, 60000)}
            className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-navy hover:bg-white"
          >
            <Sparkles size={12} className="text-gold-dark" /> 6 Meses ($60,000)
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset(12, 120000)}
            className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-navy hover:bg-white"
          >
            <Sparkles size={12} className="text-gold-dark" /> 1 Año ($120,000)
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset(24, 250000)}
            className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-navy hover:bg-white"
          >
            <Sparkles size={12} className="text-gold-dark" /> 2 Años ($250,000)
          </button>
        </div>
      </div>

      {/* Tarjeta de Tasa Legal Vigente */}
      <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2 p-3.5">
        <div className="space-y-0.5">
          <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-muted">
            Tasa Mensual de Recargos por Mora
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-black text-navy">1.47% mensual</span>
            <span className="rounded bg-navy/10 px-1.5 py-0.5 text-[9.5px] font-bold text-navy">
              LIF Art. 8 / CFF Art. 21
            </span>
          </div>
        </div>
        <span className="text-right font-mono text-[11px] text-muted">
          Base: 0.98% prórroga + 50%
        </span>
      </div>
    </div>
  );
}
